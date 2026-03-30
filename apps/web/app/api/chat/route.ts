import { convertToModelMessages, stepCountIs, streamText, tool } from "ai";
import { z } from "zod";

import {
  buildBrandProfile,
  enrichCompany,
  scrapeBrand,
} from "@doost/brand";
import { runBrandIntelligencePipeline } from "@doost/intelligence";
import {
  generateAdCopy,
  classifyIntent,
  estimateTokens,
  routeModel,
  trackCost,
  traceRouting,
  INDUSTRY_AUDIENCES,
  INDUSTRY_BUDGETS,
  DEFAULT_BUDGETS,
  sniToCategory,
} from "@doost/ai";
import type { BrandContext, Platform } from "@doost/ai";
import { linkedinGetOAuthUrl } from "@doost/platforms";
import { adAccounts, db, eq } from "@doost/db";
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
    stopWhen: stepCountIs(10),
    system: `You are Doost AI, a friendly and knowledgeable marketing assistant. You help companies create and manage ad campaigns across Meta, Google, and LinkedIn.

You speak naturally and concisely. Communicate in both Swedish and English — match the user's language.

WORKFLOW — follow these steps IN ORDER, do NOT skip or combine steps:

STEP 1: User sends a URL or domain → call analyze_brand immediately. No confirmation needed.

STEP 2: analyze_brand returns → Say "Stämmer det här? Granska din varumärkesprofil och godkänn fälten — eller ändra det som inte stämmer." Then call show_onboarding. Pass hasLogo, companyName, and logos. The profile card lets users approve each field. The onboarding cards handle platform connections and account creation.

STEP 3: User sends "Onboarding klar" → Say "Bra! Nu behöver jag veta två saker — vad ni vill uppnå och vilka ni vill nå." Then call show_goal_picker with the industry category from the brand analysis.

STEP 4: User picks goal + audience (message starts with "Mål:") → call generate_ad_copy with brand data and "meta" as default platform, plus the goal and audience.

STEP 5: Ad previews appear with QuickPicks. User can click "Ändra texten", "Fler varianter", or "Ser bra ut, publicera!". Handle fritext edits by regenerating copy.

STEP 6: User says "Ser bra ut, publicera!" or wants to publish → IMMEDIATELY call show_publish_card with brand name, URL, headline, body, goal, audience, and industry category. Do NOT show a separate channel picker — channels are in the PublishCard.

STEP 7: User submits publish config (message starts with "Publicera:") → call check_plan, then deploy_campaign.

STEP 8: After deploy_campaign returns successfully → Say: "Dina annonser är nu iväg! 🚀 Det tar vanligtvis 1-2 timmar innan de godkänns av plattformen. Jag meddelar dig så fort de första visningarna börjar rulla in. Under tiden kan du skapa fler kampanjer eller bara luta dig tillbaka."

ABSOLUTE RULES:
- After analyze_brand, do NOT repeat the brand data — the profile card shows it.
- Do NOT ask text questions about logo, font, connectors, or budget. The UI cards handle everything.
- After "Onboarding klar", call show_goal_picker immediately.
- Keep ALL text responses to 1-2 sentences max. Let the UI components do the talking.
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

          // Validate scrape result has the expected shape
          if (
            !scrapeResult ||
            typeof scrapeResult.url !== "string" ||
            !Array.isArray(scrapeResult.colors) ||
            !Array.isArray(scrapeResult.fonts) ||
            !Array.isArray(scrapeResult.logoUrls)
          ) {
            throw new Error(
              `Scrape returned malformed data: missing url, colors, fonts, or logoUrls for ${url}`,
            );
          }

          const enrichment =
            enrichSettled.status === "fulfilled"
              ? enrichSettled.value
              : null;

          if (enrichSettled.status === "rejected") {
            console.warn(
              `Enrichment failed for ${url}: ${enrichSettled.reason}`,
            );
            // TODO: Implement enrichment retry once brandProfileId is available
            // (profile has not been persisted to DB at this point, so we cannot
            // schedule a retry job — the job would need a real brandProfileId).
            console.warn(
              `[brand/retry-enrichment] Enrichment retry not yet implemented. ` +
              `Domain: ${url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]}`,
            );
          }

          // Run AI profile build + intelligence pipeline in parallel
          const [profile, intelligence] = await Promise.all([
            buildBrandProfile(scrapeResult, enrichment ?? undefined),
            runBrandIntelligencePipeline({
              url: scrapeResult.url,
              html: scrapeResult.rawHtml ?? "",
              links: scrapeResult.links,
              cssColors: scrapeResult.colors,
              cssFonts: scrapeResult.fonts,
              scrapedLogos: scrapeResult.logoUrls,
              ogImage: scrapeResult.ogImage,
              screenshot: scrapeResult.screenshot,
              companyName: enrichment?.name ?? url.split("/")[0] ?? "",
              enrichedIndustry: enrichment?.industry,
            }).catch((err) => {
              console.error("[Intelligence Pipeline] FAILED:", err instanceof Error ? err.message : err);
              return null;
            }),
          ]);

          const durationMs = Date.now() - start;
          const { rawScrapeData: _s, rawEnrichmentData: _e, ...clean } =
            profile;

          // Override profile with higher-confidence intelligence data
          const intel = intelligence?.intelligence;
          console.log("[Brand Analysis] Intel:", intel ? `logo=${intel.logo.source}(${intel.logo.confidence}) colors=${intel.colors.source}(${intel.colors.confidence}) font=${intel.font.source}(${intel.font.confidence})` : "NULL - pipeline failed or returned null");

          // Use downloaded logo (base64 data URL) — guaranteed to render in browser.
          // Downloaded server-side from Logo.dev → Brandfetch CDN → Google Favicons.
          const downloadedLogo = intelligence?.downloadedLogo ?? null;
          const logoDataUrl = downloadedLogo?.dataUrl ?? null;

          const finalLogo = {
            primary: logoDataUrl ?? clean.logos?.primary ?? undefined,
            icon: clean.logos?.icon,
            dark: clean.logos?.dark,
          };
          console.log("[Brand Analysis] Logo:", downloadedLogo
            ? `${downloadedLogo.source} (${downloadedLogo.theme}, ${downloadedLogo.dataUrl.length} chars)`
            : "no downloaded logo, using scraped");

          // Use best color source — intel pipeline uses Brandfetch/Vision which understands
          // actual brand colors, not just CSS frequency. Override if any confidence.
          const finalColors = intel && intel.colors.confidence >= 60
            ? { ...clean.colors, ...intel.colors.value }
            : clean.colors;

          // Use best font source — Brandfetch (95) or CSS-detected (80) override AI
          const finalFonts = intel && intel.font.confidence >= 70
            ? { heading: intel.font.value.family, body: intel.font.value.family }
            : clean.fonts;

          return {
            ...clean,
            logos: finalLogo,
            colors: finalColors,
            fonts: finalFonts,
            _logoSource: downloadedLogo?.source ?? "scraped",
            _logoTheme: downloadedLogo?.theme ?? "light",
            _analysisMs: durationMs,
            _enrichmentStatus: enrichment ? "complete" : "partial",
            _intelligence: intel ? {
              overallConfidence: intel.overallConfidence,
              logo: { source: intel.logo.source, confidence: intel.logo.confidence, status: intel.logo.status },
              colors: { source: intel.colors.source, confidence: intel.colors.confidence, status: intel.colors.status },
              font: { source: intel.font.source, confidence: intel.font.confidence, status: intel.font.status },
              industry: { source: intel.industry.source, confidence: intel.industry.confidence, status: intel.industry.status },
              socialProfiles: intel.social,
              visualStyle: intel.visualStyle,
              audit: intel.audit ? {
                readinessScore: intel.audit.readinessScore,
                hasMetaPixel: intel.audit.hasMetaPixel,
                hasGoogleTag: intel.audit.hasGoogleTag,
                hasLinkedinTag: intel.audit.hasLinkedinTag,
                techStack: intel.audit.techStack,
                issues: intel.audit.issues,
              } : null,
            } : null,
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
              background: z.string().optional(),
              text: z.string().optional(),
            }),
            fonts: z.object({ heading: z.string(), body: z.string() }),
          }),
          platforms: z.array(z.enum(["meta", "google", "linkedin"])),
          objective: z.string().optional(),
          audience: z.string().optional().describe("Target audience from GoalPicker"),
        }),
        execute: async ({
          brand,
          platforms,
          objective,
          audience,
        }: {
          brand: BrandContext & {
            colors: Record<string, string>;
            fonts: Record<string, string>;
          };
          platforms: Platform[];
          objective?: string;
          audience?: string;
        }) => {
          const brandContext: BrandContext = {
            name: brand.name,
            description: brand.description,
            industry: brand.industry,
            brandVoice: brand.brandVoice,
            targetAudience: audience ?? brand.targetAudience,
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
              colors: {
                ...brand.colors,
                background: brand.colors.background ?? "#ffffff",
                text: brand.colors.text ?? "#1a1a1a",
              },
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
          // TODO: Use cryptographically signed state (HMAC) to prevent tampering
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

      show_goal_picker: tool({
        description:
          "Show goal and target audience picker. Call this AFTER the user completes onboarding (brand profile approved + connectors). Shows 4 goals + industry-specific audiences.",
        inputSchema: z.object({
          industryCategory: z.string().optional().describe("Industry category from brand analysis"),
          industryCodes: z.array(z.string()).optional().describe("SNI codes from enrichment"),
        }),
        execute: async ({ industryCategory, industryCodes }: { industryCategory?: string; industryCodes?: string[] }) => {
          const category = industryCategory ?? (industryCodes?.[0] ? sniToCategory(industryCodes[0]) : null) ?? undefined;
          const audiences = category ? INDUSTRY_AUDIENCES[category] : undefined;
          return {
            industryCategory: category,
            audiences: audiences ?? ["Småföretagare", "Privatpersoner 25–55", "Beslutsfattare", "Lokala kunder"],
          };
        },
      }),

      show_publish_card: tool({
        description:
          "Show the all-in-one publish card with ad summary, channels, budget, targeting, and email. Call this when user approves their ad and wants to publish. Replaces separate channel picker + campaign config.",
        inputSchema: z.object({
          brandName: z.string(),
          brandUrl: z.string(),
          headline: z.string(),
          bodyCopy: z.string(),
          goal: z.string(),
          audience: z.string(),
          industryCategory: z.string().optional(),
          defaultCity: z.string().optional(),
        }),
        execute: async ({ brandName, brandUrl, headline, bodyCopy, goal, audience, industryCategory, defaultCity }) => {
          const looked = industryCategory ? INDUSTRY_BUDGETS[industryCategory] : undefined;
          const budgets = (looked && typeof looked === "object" && "low" in looked) ? looked : DEFAULT_BUDGETS;
          const cpm = 50;
          const estimateReach = (daily: number) => `~${Math.round((daily / cpm) * 800).toLocaleString("sv-SE")}–${Math.round((daily / cpm) * 1500).toLocaleString("sv-SE")} visningar/dag`;
          return {
            brandName,
            brandUrl,
            headline,
            bodyCopy,
            goal,
            audience,
            defaultCity,
            currency: "kr",
            suggestedBudgets: [
              { daily: Math.round(budgets.low / 30), label: "Sparsam", reach: estimateReach(Math.round(budgets.low / 30)) },
              { daily: Math.round(budgets.mid / 30), label: "Standard", reach: estimateReach(Math.round(budgets.mid / 30)), recommended: true },
              { daily: Math.round(budgets.high / 30), label: "Aggressiv", reach: estimateReach(Math.round(budgets.high / 30)) },
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
          // TODO: Replace with real plan/deployment logic — currently hardcoded to "pro"
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
          // TODO: Replace with real plan/deployment logic — currently returns demo status
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
