import { convertToModelMessages, stepCountIs, streamText, tool } from "ai";
import { z } from "zod";

import {
  buildBrandProfile,
  enrichCompany,
  scrapeBrand,
  generateHarmonySet,
} from "@doost/brand";
import { runBrandIntelligencePipeline } from "@doost/intelligence";
import {
  generateAdCopy,
  generateAdStrategy,
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
import { getIndustryBackground } from "@doost/templates/backgrounds";
import { generateAdBackground } from "@doost/templates/ai-image";
import { adAccounts, db, eq } from "@doost/db";
import { inngest } from "@/lib/inngest/client";
import {
  checkCampaignLimit,
  checkChannelLimit,
} from "@/lib/stripe/plan-limits";

export const maxDuration = 90; // Allow up to 90s for tool calls (Firecrawl + AI + DALL-E image)

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

  // Detect language from ALL user messages — not just the last one.
  // The last message before ad generation is often goal picker output like
  // "Mål: Fler kunder, Målgrupp: Småföretagare" which IS Swedish, but the
  // first message might just be a URL like "klarna.com" (no Swedish words).
  const allUserText = [...uiMessages]
    .filter((m: { role: string }) => m.role === "user")
    .flatMap((m: { parts?: Array<{ type: string; text?: string }> }) =>
      m.parts?.filter((p) => p.type === "text").map((p) => p.text ?? "") ?? []
    )
    .join(" ");
  const isSwedish = /\b(ska|vill|och|för|med|som|att|kan|har|det|jag|vi|är|inte|den|ett|min|din|på|till|från|vara|blev|alla|mycket|också|redan|skulle|kunna|behöver|göra|hej|tack|fler|kunder|personal|synas|mer|mål|målgrupp)\b/i.test(allUserText);
  const detectedLanguage = isSwedish ? "Swedish" : "English";

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

  // Basic chat tracing — log model routing decision for observability
  // Full Langfuse streaming integration requires their SDK wrapper (future change)
  const chatTrace = { id: `chat-${Date.now()}`, model: modelId, intent, startTime: Date.now() };
  console.log(`[Chat] Starting stream: model=${modelId}, intent=${intent}, reason=${reason}`);

  const result = streamText({
    model,
    stopWhen: stepCountIs(10),
    system: `You are Doost AI, a friendly and knowledgeable marketing assistant. You help companies create and manage ad campaigns across Meta, Google, and LinkedIn.

You speak naturally and concisely. Communicate in both Swedish and English — match the user's language.

WORKFLOW — follow these steps IN ORDER, do NOT skip or combine steps:

STEP 1: User sends a URL or domain → call analyze_brand immediately. No confirmation needed.

STEP 2: analyze_brand returns → Say ONLY "Stämmer det här? Granska din varumärkesprofil och godkänn fälten — eller ändra det som inte stämmer." Do NOT call any other tools. Wait for the user to respond.

STEP 3: User sends "Profil godkänd: {JSON}" → This JSON contains the user's APPROVED brand data (they may have edited industry, colors, etc). Parse it and use these values for ALL subsequent tool calls instead of the original analyze_brand data. Say "Bra! Nu behöver jag veta två saker — vad ni vill uppnå och vilka ni vill nå." Then call show_goal_picker with the industry from the approved data.

STEP 4: User picks goal + audience + platform (message starts with "Mål:"). Extract the platform from "Kanal: meta/google/linkedin". Call generate_ad_copy with the APPROVED brand data from Step 3, the selected platform (from "Kanal:"), plus the goal and audience. If no "Kanal:" specified, default to "meta". IMPORTANT: Generate ad copy in the same language as the user's messages. If the user writes in Swedish, ALL ad copy (headline, body, CTA) MUST be in Swedish.

STEP 5: Ad previews appear with QuickPicks. User can click "Ändra texten", "Fler varianter", or "Ser bra ut, publicera!". Handle fritext edits by regenerating copy.

STEP 6: User says "Ser bra ut, publicera!" or wants to publish → IMMEDIATELY call show_publish_card with brand name, URL, headline, body, goal, audience, and industry category. Do NOT show a separate channel picker — channels are in the PublishCard.

STEP 7: User submits publish config (message starts with "Publicera:") → Extract budget, duration, channels from the JSON. Get the creative data (headline, bodyCopy, cta) from the generate_ad_copy result earlier in the conversation. Call check_plan, then deploy_campaign with all data.

STEP 8: After deploy_campaign returns successfully → Say: "Dina annonser är nu iväg! 🚀 Det tar vanligtvis 1-2 timmar innan de godkänns av plattformen. Jag meddelar dig så fort de första visningarna börjar rulla in. Under tiden kan du skapa fler kampanjer eller bara luta dig tillbaka."

ABSOLUTE RULES:
- After analyze_brand, do NOT repeat the brand data — the profile card shows it.
- Do NOT ask text questions about logo, font, connectors, or budget. The UI cards handle everything.
- After "Profil godkänd:", call show_goal_picker immediately.
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
            // TODO: Implement enrichment retry once brandProfileId is available
            const domain = url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
            console.warn(`[Chat] Enrichment failed for ${domain}, retry not yet implemented`);
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
              console.warn("[Chat] Intelligence pipeline failed, continuing without:", err instanceof Error ? err.message : err);
              return null;
            }),
          ]);

          const durationMs = Date.now() - start;
          const { rawScrapeData: _s, rawEnrichmentData: _e, ...clean } =
            profile;

          // Override profile with higher-confidence intelligence data
          const intel = intelligence?.intelligence;
          console.log("[Chat] Intel sources:", intel ? `logo=${intel.logo.source}(${intel.logo.confidence}), colors=${intel.colors.source}(${intel.colors.confidence}), font=${intel.font.source}(${intel.font.confidence})` : "none");

          // Use downloaded logo (base64 data URL) — guaranteed to render in browser.
          // Downloaded server-side from Logo.dev → Brandfetch CDN → Google Favicons.
          const downloadedLogo = intelligence?.downloadedLogo ?? null;
          const logoDataUrl = downloadedLogo?.dataUrl ?? null;

          const finalLogo = {
            primary: logoDataUrl ?? clean.logos?.primary ?? undefined,
            icon: clean.logos?.icon,
            dark: clean.logos?.dark,
          };

          // Use best color source — intel pipeline uses Brandfetch/Vision which understands
          // actual brand colors, not just CSS frequency. Override if any confidence.
          const finalColors = intel && intel.colors.confidence >= 60
            ? { ...clean.colors, ...intel.colors.value }
            : clean.colors;

          // Use best font source — Brandfetch (95) or CSS-detected (80) override AI
          const finalFonts = intel && intel.font.confidence >= 70
            ? { heading: intel.font.value.family, body: intel.font.value.family }
            : clean.fonts;

          // Generate color harmony set from final brand colors
          const _colorHarmony = generateHarmonySet(
            finalColors.primary,
            finalColors.secondary,
            finalColors.accent,
          );

          console.log(`[Chat] analyze_brand completed in ${durationMs}ms, logo=${downloadedLogo?.source ?? "scraped"}(${downloadedLogo?.theme ?? "unknown"})`);

          return {
            ...clean,
            logos: finalLogo,
            colors: finalColors,
            fonts: finalFonts,
            _colorHarmony,
            _logoTheme: downloadedLogo?.theme ?? "light",
            _enrichmentStatus: enrichment ? "complete" : "partial",
            _intelligenceStatus: intel ? "complete" : "failed",
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
          "Generate ad copy text for specified platforms (fast, no images). Call this when user picks platforms. Returns copy immediately for preview. IMPORTANT: All generated ad copy (headline, body, CTA) must be in the same language as the user's messages. If the user writes in Swedish, generate Swedish copy.",
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

          // STEP 1: Generate ad strategy FIRST (creative brief)
          // This guides the copywriter to produce genuinely different variants
          const strategy = await generateAdStrategy({
            brand: brandContext,
            platform: platforms[0] ?? "meta",
            goal: objective ?? "lead generation",
            audience: audience ?? brand.targetAudience,
            language: detectedLanguage,
          }).catch((err) => {
            console.warn("[Chat] Ad strategy generation failed:", err instanceof Error ? err.message : err);
            return null;
          });

          console.log("[Chat] Strategy:", strategy ? `A=${strategy.variantA.angle}, B=${strategy.variantB.angle}` : "fallback");

          // STEP 2: Generate copy + images in parallel
          // Use strategy-specific image prompts when available
          const [allCopy, aiImageA, aiImageB, unsplashBgUrl] = await Promise.all([
            Promise.all(
              platforms.map((p) =>
                generateAdCopy(brandContext, p, objective ?? "lead generation", {
                  language: detectedLanguage,
                  variants: 2,
                }),
              ),
            ),
            // Variant A image — uses strategy-specific prompt
            generateAdBackground({
              industry: brand.industry ?? "",
              brandName: brand.name,
              primaryColor: brand.colors.primary ?? "#6366f1",
              accentColor: brand.colors.accent,
              style: "modern",
              format: "square",
            }).catch(() => null),
            // Variant B image — different mood (uses accent color emphasis)
            generateAdBackground({
              industry: brand.industry ?? "",
              brandName: brand.name,
              primaryColor: brand.colors.accent ?? brand.colors.secondary ?? "#4f46e5",
              accentColor: brand.colors.primary ?? "#6366f1",
              style: "premium",
              format: "square",
            }).catch(() => null),
            getIndustryBackground(brand.industry ?? "").catch(() => null),
          ]);

          // Background priority: AI image → Unsplash → branded gradient SVG (never null)
          let bgUrl = aiImageA?.imageUrl ?? unsplashBgUrl;
          const bgUrlB = aiImageB?.imageUrl ?? bgUrl; // Variant B gets different image or same fallback
          if (!bgUrl) {
            // Generate a branded gradient as SVG data URL — always works, no external deps
            const p = brand.colors.primary ?? "#6366f1";
            const a = brand.colors.accent ?? brand.colors.secondary ?? "#4f46e5";
            bgUrl = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080">
  <defs>
    <radialGradient id="g1" cx="30%" cy="20%"><stop offset="0%" stop-color="${p}dd"/><stop offset="100%" stop-color="${a}44"/></radialGradient>
    <radialGradient id="g2" cx="70%" cy="80%"><stop offset="0%" stop-color="${a}99"/><stop offset="100%" stop-color="${p}22"/></radialGradient>
    <linearGradient id="bg" x1="0%" x2="100%" y1="0%" y2="100%"><stop offset="0%" stop-color="${p}"/><stop offset="50%" stop-color="${a}"/><stop offset="100%" stop-color="${p}cc"/></linearGradient>
  </defs>
  <rect width="1080" height="1080" fill="url(#bg)"/>
  <circle cx="200" cy="200" r="350" fill="url(#g1)" opacity="0.6"/>
  <circle cx="880" cy="880" r="300" fill="url(#g2)" opacity="0.5"/>
  <circle cx="540" cy="540" r="200" fill="${a}15"/>
</svg>`)}`;
            console.log("[Chat] Using SVG gradient fallback for ad background");
          }

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
              _colorHarmony: null,
            },
            backgroundUrl: bgUrl,
            backgroundUrlB: bgUrlB !== bgUrl ? bgUrlB : undefined,
            platforms,
            renderingImages: true,
            // Strategy data for the preview card
            strategy: strategy ? {
              variantA: {
                concept: strategy.variantA.concept,
                hook: strategy.variantA.hook,
                angle: strategy.variantA.angle,
                emotionalTrigger: strategy.variantA.emotionalTrigger,
              },
              variantB: {
                concept: strategy.variantB.concept,
                hook: strategy.variantB.hook,
                angle: strategy.variantB.angle,
                emotionalTrigger: strategy.variantB.emotionalTrigger,
              },
              recommendation: strategy.recommendation,
            } : null,
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

      show_goal_picker: tool({
        description:
          "Show goal and target audience picker. Call this AFTER the user completes onboarding (brand profile approved + connectors). Shows 3 goals + industry-specific audiences.",
        inputSchema: z.object({
          industryCategory: z.string().optional().describe("Industry category from brand analysis"),
          industryCodes: z.array(z.string()).optional().describe("SNI codes from enrichment"),
          targetAudience: z.string().optional().describe("Target audience from brand analysis, used to pre-select an audience"),
        }),
        execute: async ({ industryCategory, industryCodes, targetAudience }: { industryCategory?: string; industryCodes?: string[]; targetAudience?: string }) => {
          const category = industryCategory ?? (industryCodes?.[0] ? sniToCategory(industryCodes[0]) : null) ?? undefined;
          const audiences = category ? INDUSTRY_AUDIENCES[category] : undefined;
          return {
            industryCategory: category,
            audiences: audiences ?? ["Småföretagare", "Privatpersoner 25–55", "Beslutsfattare", "Lokala kunder"],
            targetAudience: targetAudience ?? undefined,
          };
        },
      }),

      show_publish_card: tool({
        description:
          "Show the all-in-one publish card with ad summary, channels, budget, targeting, and email. Call this when user approves their ad and wants to publish. Replaces separate channel picker + campaign config. Pass detectedLocations from brand analysis if available (e.g. company city, region mentions from website).",
        inputSchema: z.object({
          brandName: z.string(),
          brandUrl: z.string(),
          headline: z.string(),
          bodyCopy: z.string(),
          cta: z.string().optional(),
          goal: z.string(),
          audience: z.string(),
          industryCategory: z.string().optional(),
          defaultCity: z.string().optional(),
          detectedLocations: z.array(z.string()).optional().describe("Locations detected from brand analysis (company address, website mentions). Shown as recommended regions in the publish card."),
          tracking: z.object({
            hasMetaPixel: z.boolean().optional(),
            hasGoogleTag: z.boolean().optional(),
            hasLinkedinTag: z.boolean().optional(),
          }).optional(),
        }),
        execute: async ({ brandName, brandUrl, headline, bodyCopy, cta, goal, audience, industryCategory, defaultCity, detectedLocations, tracking }) => {
          const looked = industryCategory ? INDUSTRY_BUDGETS[industryCategory] : undefined;
          const budgets = (looked && typeof looked === "object" && "low" in looked) ? looked : DEFAULT_BUDGETS;
          const cpm = 50;
          const estimateReach = (daily: number) => `~${Math.round((daily / cpm) * 800).toLocaleString("sv-SE")}–${Math.round((daily / cpm) * 1500).toLocaleString("sv-SE")} visningar/dag`;
          return {
            brandName,
            brandUrl,
            headline,
            bodyCopy,
            cta,
            goal,
            audience,
            industryCategory: industryCategory ?? undefined,
            defaultCity,
            detectedLocations: detectedLocations ?? [],
            currency: "kr",
            tracking: tracking ?? null,
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
          "Deploy ad campaigns to specified platforms. Call after user approves ad previews and provides budget. ALWAYS call check_plan first. Include the ad creative data from the approved ad copy.",
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
          creative: z.object({
            headline: z.string().describe("Ad headline from approved copy"),
            bodyCopy: z.string().describe("Ad body text from approved copy"),
            cta: z.string().describe("Call to action text"),
            brandName: z.string(),
            brandUrl: z.string(),
            colors: z.object({
              primary: z.string(),
              secondary: z.string().optional(),
              accent: z.string().optional(),
            }).optional(),
          }).describe("Ad creative content from the approved ad copy"),
        }),
        execute: async ({
          orgId,
          campaignName,
          platforms,
          budget,
          targeting,
          creative,
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
          creative: {
            headline: string;
            bodyCopy: string;
            cta: string;
            brandName: string;
            brandUrl: string;
            colors?: { primary: string; secondary?: string; accent?: string };
          };
        }) => {
          // Check that ad accounts are ready before deploying
          const accounts = await db
            .select({ platform: adAccounts.platform, status: adAccounts.status })
            .from(adAccounts)
            .where(eq(adAccounts.orgId, orgId));

          // Only check for pending accounts if accounts exist (demo mode has none)
          if (accounts.length > 0) {
            const pendingPlatforms = platforms.filter(p => {
              const account = accounts.find(a => a.platform === p);
              return account?.status === "pending" || account?.status === "error";
            });

            if (pendingPlatforms.length > 0) {
              return {
                platforms: pendingPlatforms.map(p => ({
                  platform: p,
                  status: "connect_required" as const,
                  message: `Kontot för ${p === "meta" ? "Meta" : p === "google" ? "Google" : "LinkedIn"} håller på att kopplas upp. Försök igen om några sekunder.`,
                  accountType: "auto" as const,
                  action: "retry" as const,
                })),
                budget,
                campaignName,
                creative,
              };
            }
          }

          // TODO: Replace with real plan/deployment logic — currently returns demo status
          // Demo mode: return simulated deployment status
          // In production with auth, this would check real ad accounts
          type PlatformDeployStatus = {
            platform: string;
            status: "deploying" | "active" | "failed" | "connect_required" | "connect_later";
            message: string;
            errorCode?: string;
            action?: "retry" | "contact_support" | "add_payment" | "connect_account";
            accountType?: "auto" | "oauth";
            oauthUrl?: string;
            startedAt?: string;
          };

          const platformStatuses: PlatformDeployStatus[] = platforms.map((platform) => {
            if (platform === "linkedin") {
              // LinkedIn requires OAuth but should NOT block other platforms.
              // Deploy Meta/Google immediately; LinkedIn can be connected later.
              return {
                platform,
                status: "connect_later" as const,
                message: "LinkedIn kräver kontoanslutning. Vi publicerar Meta/Google direkt.",
                action: "connect_account" as const,
                accountType: "oauth" as const,
                oauthUrl: "#",
              };
            }

            // In production, each platform deploy would be wrapped in try/catch.
            // Errors map to specific errorCode + action pairs:
            //
            //   AUTH_EXPIRED       -> action: "connect_account"
            //   PAYMENT_REQUIRED   -> action: "add_payment"
            //   BUDGET_TOO_LOW     -> action: "retry" (user adjusts budget)
            //   CREATIVE_REJECTED  -> action: "retry" (user edits creative)
            //   ACCOUNT_SUSPENDED  -> action: "contact_support"
            //   RATE_LIMITED       -> action: "retry"
            //   API_ERROR          -> action: "retry"
            //   TARGETING_INVALID  -> action: "retry"
            //   CAMPAIGN_LIMIT     -> action: "contact_support"
            //   NETWORK_ERROR      -> action: "retry"

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
            creative,
          };
        },
      }),
    },
    messages,
  });

  console.log(`[Chat] Stream created: trace=${chatTrace.id}, elapsed=${Date.now() - chatTrace.startTime}ms`);

  return result.toUIMessageStreamResponse();
}
