import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, stepCountIs, streamText, tool } from "ai";
import { z } from "zod";

import {
  buildBrandProfile,
  enrichCompany,
  scrapeBrand,
} from "@doost/brand";
import { generateAdCopy } from "@doost/ai";
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

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    stopWhen: stepCountIs(5),
    system: `You are Doost AI, a friendly and knowledgeable marketing assistant. You help companies create and manage ad campaigns across Meta, Google, and LinkedIn.

You speak naturally and concisely. Communicate in both Swedish and English — match the user's language.

WORKFLOW:
1. User provides URL → call analyze_brand immediately.
2. After brand analysis completes, DO NOT summarize the results or list findings. The UI card already shows everything. Just say ONE short sentence like "Klar! Välj kanaler:" and then call show_channel_picker immediately.
3. User picks platforms → call generate_ads with brand data + platforms.
4. After ad previews → ask: "Hur ser det ut? Vill du ändra något?"
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
          const [scrapeResult, enrichment] = await Promise.all([
            scrapeBrand(url),
            enrichCompany(url),
          ]);
          const profile = await buildBrandProfile(
            scrapeResult,
            enrichment ?? undefined,
          );
          const { rawScrapeData: _s, rawEnrichmentData: _e, ...clean } =
            profile;
          return clean;
        },
      }),

      generate_ads: tool({
        description:
          "Generate ad creatives for specified platforms using the brand profile.",
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
                variants: 1,
              }),
            ),
          );
          return {
            ads: allCopy.flat().map((c) => ({
              platform: c.platform,
              variant: c.variant,
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
          orgId,
          requestedPlatforms,
        }: {
          orgId: string;
          requestedPlatforms: number;
        }) => {
          const [org] = await db
            .select()
            .from(organizations)
            .where(eq(organizations.id, orgId))
            .limit(1);

          const plan = (org?.plan ?? "free") as "free" | "starter" | "pro" | "agency";

          // Count active campaigns
          const activeCampaigns = await db
            .select()
            .from(campaigns)
            .where(
              and(
                eq(campaigns.orgId, orgId),
                eq(campaigns.status, "live"),
              ),
            );

          const campaignCheck = checkCampaignLimit(plan, activeCampaigns.length);
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
            activeCampaigns: activeCampaigns.length,
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
          // Check connected accounts
          const accounts = await db
            .select()
            .from(adAccounts)
            .where(eq(adAccounts.orgId, orgId));

          const accountMap = new Map(
            accounts.map((a) => [a.platform, a]),
          );

          const appUrl =
            process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

          const results = await Promise.all(
            platforms.map(async (platform) => {
              const account = accountMap.get(platform);

              // LinkedIn requires OAuth
              if (platform === "linkedin" && !account) {
                const redirectUri = `${appUrl}/api/platforms/linkedin/callback`;
                const state = btoa(JSON.stringify({ orgId }));
                let oauthUrl = "#";
                try {
                  oauthUrl = linkedinGetOAuthUrl(redirectUri, state);
                } catch {
                  // LinkedIn not configured
                }
                return {
                  platform,
                  status: "connect_required" as const,
                  message:
                    "Du behöver ansluta ditt LinkedIn-konto först.",
                  accountType: "oauth" as const,
                  oauthUrl,
                };
              }

              // Meta/Google auto-create or use existing
              if (!account) {
                // Queue account creation + deployment
                await inngest.send({
                  name:
                    platform === "meta"
                      ? "meta/deploy-campaign"
                      : "google/deploy-campaign",
                  data: {
                    campaignId: `pending-${platform}-${Date.now()}`,
                    adAccountId: `auto-${platform}`,
                    orgId,
                    campaignName,
                    budget,
                    targeting,
                  },
                });

                return {
                  platform,
                  status: "deploying" as const,
                  message: `Konto skapas automatiskt och kampanj publiceras.`,
                  accountType: "auto" as const,
                };
              }

              if (account.status !== "active") {
                return {
                  platform,
                  status: "failed" as const,
                  message: `Kontot har status "${account.status}". Kontrollera anslutningen.`,
                  accountType:
                    platform === "linkedin"
                      ? ("oauth" as const)
                      : ("auto" as const),
                };
              }

              // Queue deployment
              const eventName =
                platform === "meta"
                  ? "meta/deploy-campaign"
                  : platform === "google"
                    ? "google/deploy-campaign"
                    : "linkedin/deploy-campaign";

              await inngest.send({
                name: eventName,
                data: {
                  campaignId: `deploy-${platform}-${Date.now()}`,
                  adAccountId: account.id,
                  orgId,
                  campaignName,
                  budget,
                  targeting,
                },
              });

              return {
                platform,
                status: "deploying" as const,
                message: `Kampanjen publiceras till ${platform === "meta" ? "Meta" : platform === "google" ? "Google" : "LinkedIn"}.`,
                accountType:
                  platform === "linkedin"
                    ? ("oauth" as const)
                    : ("auto" as const),
              };
            }),
          );

          return {
            platforms: results,
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
