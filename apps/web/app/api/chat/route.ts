import { convertToModelMessages, stepCountIs, streamText, tool } from "ai";
import { z } from "zod";

import {
  buildBrandProfile,
  enrichCompany,
  scrapeBrand,
} from "@doost/brand";
import {
  generateAdCopy,
  classifyIntent,
  estimateTokens,
  routeModel,
  trackCost,
  traceRouting,
} from "@doost/ai";
import type { BrandContext, Platform } from "@doost/ai";
import { linkedinGetOAuthUrl } from "@doost/platforms";
import { adAccounts, campaigns, organizations, db, and, eq } from "@doost/db";
import { inngest } from "@/lib/inngest/client";
import {
  checkCampaignLimit,
  checkChannelLimit,
} from "@/lib/stripe/plan-limits";

export const maxDuration = 60; // Allow up to 60s for tool calls (Firecrawl + AI)

export async function POST(req: Request) {

  const { messages: uiMessages } = await req.json();
  const messages = await convertToModelMessages(uiMessages);

  // Extract last user message for intent classification
  const lastUserMsg = [...uiMessages]
    .reverse()
    .find((m: { role: string }) => m.role === "user");
  const lastText =
    lastUserMsg?.parts
      ?.filter((p: { type: string }) => p.type === "text")
      .map((p: { text: string }) => p.text)
      .join("") ?? "";

  // Route to cheapest sufficient model
  const intent = classifyIntent(lastText, true);
  const routeStart = Date.now();
  const { model, modelId, reason } = routeModel({
    messageTokens: estimateTokens(lastText),
    intent,
    requiresTools: true, // chat route always has tools
    isRegeneration: intent === "copy_variant",
  });
  traceRouting({ provider: "anthropic", modelId, reason, model }, Date.now() - routeStart);

  const result = streamText({
    model,
    stopWhen: stepCountIs(5),
    system: `You are Doost AI, a friendly and knowledgeable marketing assistant. You help companies create and manage ad campaigns across Meta, Google, and LinkedIn.

You speak naturally and concisely. Communicate in both Swedish and English — match the user's language.

WORKFLOW — follow these steps IN ORDER, do NOT skip or combine steps:

STEP 1: User sends a URL or domain → call analyze_brand immediately. No confirmation needed.

STEP 2: analyze_brand returns → your ONLY action is to call show_onboarding. Pass hasLogo (check if logos.primary exists), companyName, and logos (the full logos object from the result: primary, icon, dark). Write a SHORT one-line intro like "Här är din profil! Fyll i det som saknas:" — then call the tool. NEVER ask text questions about logo, font, or platforms. NEVER call show_channel_picker here.

STEP 3: User sends "Onboarding klar" → call show_channel_picker. Say "Perfekt! Välj kanaler:"

STEP 4: User picks platforms → call generate_ad_copy with brand data and selected platforms.

STEP 5: Ad previews appear → say "Vilken variant föredrar du? Klicka 'Välj denna' på den du gillar bäst."

STEP 6: User clicks "Gå vidare" or says they want to proceed → IMMEDIATELY call show_campaign_config with the brand name and platform. Do NOT ask text questions about budget. The UI card handles budget, duration, and targeting.

STEP 7: User submits campaign config (message starts with "Publicera:") → call check_plan, then deploy_campaign with the budget and targeting from the message.

ABSOLUTE RULES:
- After analyze_brand, you MUST call show_onboarding. Do NOT write numbered questions. Do NOT ask about logo/font/connectors in text. The UI cards handle all of that.
- Do NOT call show_channel_picker until the user says "Onboarding klar".
- After analyze_brand, do NOT summarize or repeat the brand data — the profile card shows it.
- Keep ALL text responses to 1-2 sentences max. The UI components do the talking.
- If user picks LinkedIn, call connect_linkedin first.
- If user says "ändra" or wants edits, call generate_ad_copy again.`,
    tools: {
      analyze_brand: tool({
        description:
          "Analyze a company's brand identity by scraping their website and enriching with company data.",
        inputSchema: z.object({
          url: z.string().describe("The company website URL or domain name"),
        }),
        execute: async ({ url }: { url: string }) => {
          const start = Date.now();

          // Run scrape + enrich in parallel with allSettled for resilience
          const [scrapeSettled, enrichSettled] = await Promise.allSettled([
            scrapeBrand(url),
            enrichCompany(url),
          ]);

          if (scrapeSettled.status === "rejected") {
            throw new Error(`Failed to scrape website: ${scrapeSettled.reason}`);
          }

          const scrapeResult = scrapeSettled.value;
          const enrichment =
            enrichSettled.status === "fulfilled"
              ? enrichSettled.value
              : null;

          if (enrichSettled.status === "rejected") {
            console.warn(
              `Enrichment failed for ${url}: ${enrichSettled.reason}`,
            );
            // Schedule background retry
            inngest.send({
              name: "brand/retry-enrichment",
              data: {
                brandProfileId: "pending",
                domain: url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0],
              },
            }).catch(() => {}); // fire-and-forget
          }

          const profile = await buildBrandProfile(
            scrapeResult,
            enrichment ?? undefined,
          );

          const durationMs = Date.now() - start;
          const { rawScrapeData: _s, rawEnrichmentData: _e, ...clean } =
            profile;
          return {
            ...clean,
            _analysisMs: durationMs,
            _enrichmentStatus: enrichment ? "complete" : "partial",
          };
        },
      }),

      generate_ad_copy: tool({
        description:
          "Generate ad copy text for specified platforms (fast, no images). Call this when user picks platforms. Returns copy immediately for preview.",
        inputSchema: z.object({
          brand: z.object({
            name: z.string(),
            description: z.string().optional(),
            industry: z.string().optional(),
            brandVoice: z.string(),
            targetAudience: z.string(),
            valuePropositions: z.array(z.string()),
            url: z.string(),
            colors: z.object({
              primary: z.string(),
              secondary: z.string(),
              accent: z.string(),
              background: z.string(),
              text: z.string(),
            }),
            fonts: z.object({ heading: z.string(), body: z.string() }),
          }),
          platforms: z.array(z.enum(["meta", "google", "linkedin"])),
          objective: z.string().optional(),
        }),
        execute: async ({
          brand,
          platforms,
          objective,
        }: {
          brand: BrandContext & {
            colors: Record<string, string>;
            fonts: Record<string, string>;
          };
          platforms: Platform[];
          objective?: string;
        }) => {
          const brandContext: BrandContext = {
            name: brand.name,
            description: brand.description,
            industry: brand.industry,
            brandVoice: brand.brandVoice,
            targetAudience: brand.targetAudience,
            valuePropositions: brand.valuePropositions,
            url: brand.url,
          };
          const allCopy = await Promise.all(
            platforms.map((p) =>
              generateAdCopy(brandContext, p, objective ?? "lead generation", {
                language: "Swedish",
                variants: 2,
              }),
            ),
          );
          return {
            copies: allCopy.flat().map((c, i) => ({
              id: `${c.platform}-${c.variant}-${i}`,
              platform: c.platform,
              variant: c.variant,
              label: c.variant === "hero" ? "Variant A" : "Variant B",
              headline: c.headline,
              bodyCopy: c.bodyCopy,
              cta: c.cta,
              headlines: c.headlines,
              descriptions: c.descriptions,
            })),
            brand: {
              name: brand.name,
              url: brand.url,
              colors: brand.colors,
              fonts: brand.fonts,
              industry: brand.industry,
            },
            platforms,
            renderingImages: true,
          };
        },
      }),

      connect_linkedin: tool({
        description:
          "Generate a LinkedIn OAuth link. Call when user wants LinkedIn ads.",
        inputSchema: z.object({
          orgId: z.string().describe("The organization ID"),
        }),
        execute: async ({ orgId }: { orgId: string }) => {
          const appUrl =
            process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
          const redirectUri = `${appUrl}/api/platforms/linkedin/callback`;
          const state = btoa(JSON.stringify({ orgId }));
          try {
            const oauthUrl = linkedinGetOAuthUrl(redirectUri, state);
            return {
              oauthUrl,
              message:
                "Till skillnad från Meta och Google behöver du ansluta ditt LinkedIn-konto manuellt.",
            };
          } catch {
            return {
              oauthUrl: "#",
              message:
                "LinkedIn-integrationen är inte konfigurerad ännu.",
            };
          }
        },
      }),

      show_onboarding: tool({
        description:
          "Show sequential onboarding cards after brand analysis. Cards let user pick from scraped logos, upload font, and connect ad platforms — one step at a time. Call this RIGHT AFTER analyze_brand returns.",
        inputSchema: z.object({
          hasLogo: z.boolean().describe("Whether the brand analysis found a logo"),
          companyName: z.string().describe("The company name from brand analysis"),
          logos: z.object({
            primary: z.string().optional().describe("Primary logo URL from scrape"),
            icon: z.string().optional().describe("Icon/favicon URL from scrape"),
            dark: z.string().optional().describe("Dark/alternative logo URL from scrape"),
          }).describe("Logo URLs found during brand analysis"),
        }),
        execute: async ({ hasLogo, companyName, logos }: { hasLogo: boolean; companyName: string; logos: { primary?: string; icon?: string; dark?: string } }) => {
          return { hasLogo, companyName, logos };
        },
      }),

      show_campaign_config: tool({
        description:
          "Show campaign configuration card with budget, duration, and targeting options. Call this AFTER the user selects/approves an ad variant. Do NOT ask budget questions in text.",
        inputSchema: z.object({
          brandName: z.string().describe("Company name"),
          platform: z.string().describe("The selected ad platform (e.g. 'meta')"),
        }),
        execute: async ({ brandName, platform }: { brandName: string; platform: string }) => {
          return {
            brandName,
            platform,
            currency: "kr",
            suggestedBudgets: [
              { daily: 200, label: "Sparsam", reach: "~1 000–3 000 visningar/dag" },
              { daily: 500, label: "Standard", reach: "~3 000–8 000 visningar/dag", recommended: true },
              { daily: 1000, label: "Aggressiv", reach: "~8 000–20 000 visningar/dag" },
            ],
          };
        },
      }),

      show_channel_picker: tool({
        description:
          "Show channel selection buttons to the user. Call this AFTER onboarding cards are completed (user finishes or skips logo, font, connectors).",
        inputSchema: z.object({}),
        execute: async () => {
          return {
            channels: [
              { id: "meta", label: "Meta", description: "Facebook & Instagram" },
              { id: "google", label: "Google", description: "Sök & Display" },
              { id: "linkedin", label: "LinkedIn", description: "B2B-fokus" },
              { id: "tiktok", label: "TikTok", description: "Kortvideo & Gen Z" },
              { id: "snapchat", label: "Snapchat", description: "AR & Story Ads" },
              { id: "pinterest", label: "Pinterest", description: "Shopping & Inspiration" },
            ],
          };
        },
      }),

      check_platform_status: tool({
        description:
          "Check which ad platforms are connected for the current organization. Call before deploying to verify account status.",
        inputSchema: z.object({
          orgId: z.string().describe("The organization ID"),
        }),
        execute: async ({ orgId }: { orgId: string }) => {
          const accounts = await db
            .select({
              platform: adAccounts.platform,
              status: adAccounts.status,
              platformAccountId: adAccounts.platformAccountId,
            })
            .from(adAccounts)
            .where(eq(adAccounts.orgId, orgId));

          const platformMap: Record<
            string,
            { connected: boolean; status: string; accountId: string }
          > = {};
          for (const a of accounts) {
            platformMap[a.platform] = {
              connected: a.status === "active",
              status: a.status,
              accountId: a.platformAccountId,
            };
          }

          return {
            meta: platformMap["meta"] ?? {
              connected: false,
              status: "not_connected",
              accountId: "",
            },
            google: platformMap["google"] ?? {
              connected: false,
              status: "not_connected",
              accountId: "",
            },
            linkedin: platformMap["linkedin"] ?? {
              connected: false,
              status: "not_connected",
              accountId: "",
            },
          };
        },
      }),

      check_plan: tool({
        description:
          "Check the current plan limits for the organization. Call before deploying to verify the user has capacity for new campaigns.",
        inputSchema: z.object({
          orgId: z.string(),
          requestedPlatforms: z.number().describe("Number of platforms the user wants"),
        }),
        execute: async ({
          orgId: _orgId,
          requestedPlatforms,
        }: {
          orgId: string;
          requestedPlatforms: number;
        }) => {
          // Demo mode: skip DB queries, allow everything
          const plan = "pro" as const;
          const campaignCheck = checkCampaignLimit(plan, 0);
          const channelCheck = checkChannelLimit(plan, requestedPlatforms);

          if (!campaignCheck.allowed) {
            return {
              allowed: false,
              type: "upgrade_required" as const,
              reason: campaignCheck.reason,
              suggestedPlan: campaignCheck.suggestedPlan,
              currentPlan: plan,
            };
          }

          if (!channelCheck.allowed) {
            return {
              allowed: false,
              type: "upgrade_required" as const,
              reason: channelCheck.reason,
              suggestedPlan: channelCheck.suggestedPlan,
              currentPlan: plan,
            };
          }

          return {
            allowed: true,
            type: "ok" as const,
            currentPlan: plan,
            activeCampaigns: 0,
          };
        },
      }),

      deploy_campaign: tool({
        description:
          "Deploy ad campaigns to specified platforms. Call after user approves ad previews and provides budget. ALWAYS call check_plan first.",
        inputSchema: z.object({
          orgId: z.string().describe("The organization ID"),
          campaignName: z.string().describe("Campaign name"),
          platforms: z.array(z.enum(["meta", "google", "linkedin"])),
          budget: z.object({
            daily: z.number().describe("Daily budget in local currency"),
            currency: z.string().default("SEK"),
          }),
          targeting: z
            .object({
              locations: z.array(z.string()).optional(),
              ageMin: z.number().optional(),
              ageMax: z.number().optional(),
            })
            .optional(),
        }),
        execute: async ({
          orgId,
          campaignName,
          platforms,
          budget,
          targeting,
        }: {
          orgId: string;
          campaignName: string;
          platforms: Array<"meta" | "google" | "linkedin">;
          budget: { daily: number; currency: string };
          targeting?: {
            locations?: string[];
            ageMin?: number;
            ageMax?: number;
          };
        }) => {
          // Demo mode: return simulated deployment status
          // In production with auth, this would check real ad accounts
          const platformStatuses = platforms.map((platform) => {
            if (platform === "linkedin") {
              return {
                platform,
                status: "connect_required" as const,
                message: "Du behöver ansluta ditt LinkedIn-konto först.",
                accountType: "oauth" as const,
                oauthUrl: "#",
              };
            }

            // Demo: simulate deploying status for Meta/Google
            return {
              platform,
              status: "deploying" as const,
              message: `Publicerar till ${platform === "meta" ? "Meta" : "Google"}... (demo)`,
              accountType: "auto" as const,
              startedAt: new Date().toISOString(),
            };
          });

          // In production: would fan out to Inngest for real deployment
          // Demo mode: return status immediately
          void inngest; // referenced but not called in demo

          return {
            platforms: platformStatuses,
            budget,
            campaignName,
          };
        },
      }),
    },
    messages,
  });

  return result.toUIMessageStreamResponse();
}
