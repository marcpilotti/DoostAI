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
1. If the user's message contains ANYTHING that looks like a domain name or URL (e.g. "planacy.com", "www.oneflow.com", "https://teamtailor.se/careers", "check out klarna.com"), IMMEDIATELY call analyze_brand with that URL. Do NOT ask for confirmation. Even if the URL is embedded in a sentence, extract it and analyze.
2. After brand analysis completes, DO NOT summarize the results or list findings. The UI card already shows everything. Just say ONE short sentence like "Klar! Välj kanaler:" and then call show_channel_picker immediately.
3. User picks platforms → call generate_ad_copy with brand data + platforms. This returns TEXT copy immediately (fast, ~2s).
4. After copy preview shows, say "Här är två varianter — vilken föredrar du?" The UI shows a comparison view where the user can pick Variant A or B per platform.
5. User approves → ask about budget: "Vilken daglig budget vill du sätta? (t.ex. 500 kr/dag)"
6. User provides budget → call check_plan first to verify limits. If upgrade needed, show the upgrade prompt. If OK, call deploy_campaign.
7. Show deployment status. Offer to set up performance monitoring.

CRITICAL RULES:
- After analyze_brand returns, NEVER repeat/summarize the brand data in text. The card shows it.
- After analyze_brand returns, ALWAYS call show_channel_picker immediately.
- Keep ALL text responses to 1-2 sentences max between tool calls.
- If user picks LinkedIn, call connect_linkedin first — LinkedIn requires individual OAuth.
If user wants to edit copy, call generate_ads again.

Keep responses short between tool calls — let the UI components speak.`,
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
