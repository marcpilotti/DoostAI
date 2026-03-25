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

WORKFLOW:
1. If the user's message contains ANYTHING that looks like a domain name or URL, IMMEDIATELY call analyze_brand. Do NOT ask for confirmation.

2. After brand analysis completes, check the results and ask follow-up questions ONLY about what's MISSING. Use this checklist format:

   a) If NO logo was found (logos.primary is null/undefined): "Jag hittade ingen logotyp. Kan du ladda upp en? (Du kan också skippa — då använder vi ert företagsnamn i VERSALER.)"
   b) If industry is vague or missing: "Vilken bransch är ni i? Jag vill säkerställa att annonserna riktas rätt."
   c) If fonts are generic (e.g. both "Inter"): "Vill du ladda upp en specifik font? (Skippa = vi väljer en som passar.)"
   d) ALWAYS ask: "Vill du koppla Meta eller Google-konto direkt? (Det går att skapa annonser utan — du kan koppla senare.)"

   Format the questions as a SHORT numbered list. If everything looks good (logo found, clear industry), skip the questions and go directly to step 3.

   If user says "skippa" or similar → proceed without the missing items. Use company name in UPPERCASE as fallback logo text.

3. After questions are answered (or skipped), call show_channel_picker. Say: "Perfekt! Välj kanaler:"

4. User picks platforms → call generate_ad_copy. This shows full ad previews with brand colors immediately.

5. After ad previews show, say: "Vilken variant föredrar du? Välj den du gillar bäst." The UI shows side-by-side comparison. Make it VERY CLEAR the user should click "Välj denna" on their preferred variant.

6. User approves → ask budget: "Vilken daglig budget? (t.ex. 500 kr/dag)"

7. User provides budget → call check_plan, then deploy_campaign.

CRITICAL RULES:
- After analyze_brand, do NOT repeat all the data. The card shows it. ONLY ask about missing items.
- The follow-up questions should be MAX 3-4 items in a numbered list.
- Keep ALL responses short. Let the UI components speak.
- If user picks LinkedIn, call connect_linkedin first.
- When showing ad previews, emphasize the user should PICK one variant.
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

      show_channel_picker: tool({
        description:
          "Show channel selection buttons to the user. Call this immediately after brand analysis completes. Do NOT summarize brand data — just call this tool.",
        inputSchema: z.object({}),
        execute: async () => {
          return {
            channels: [
              { id: "meta", label: "Meta", description: "Facebook & Instagram" },
              { id: "google", label: "Google", description: "Sök & Display" },
              { id: "linkedin", label: "LinkedIn", description: "B2B-fokus" },
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
