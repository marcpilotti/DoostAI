import {
  buildBrandProfile,
  enrichCompany,
  generateHarmonySet,
  INDUSTRY_COLORS,
  INDUSTRY_FONTS,
  scrapeWithFallback,
} from "@doost/brand";
import { runBrandIntelligencePipeline } from "@doost/intelligence";
import { z } from "zod";

import { getCachedAnalysis, setCachedAnalysis } from "@/lib/cache/domain-cache";


export const maxDuration = 90;

const inputSchema = z.object({
  url: z.string().min(3),
});

/**
 * POST /api/brand/analyze/stream
 *
 * SSE endpoint that streams progress events during brand analysis.
 * Each event is `data: { message?, progress?, event?, profile? }\n\n`.
 *
 * Events:
 *   { message: "Hämtar er hemsida...", progress: 10 }
 *   { message: "IDA WARG Beauty — Stockholm", progress: 40 }
 *   { message: "Hittade logotyp och 6 färger", progress: 60 }
 *   { message: "Analyserar ert varumärke med AI...", progress: 80 }
 *   { event: "complete", profile: { ... }, progress: 100 }
 *   { event: "error", message: "..." }
 */
function isValidHex(c: unknown): c is string {
  return typeof c === "string" && /^#[0-9a-fA-F]{6}$/.test(c);
}

function findIndustryMatch<T>(map: Record<string, T>, industry: string): T | undefined {
  if (map[industry]) return map[industry];
  const lower = industry.toLowerCase();
  for (const [key, value] of Object.entries(map)) {
    const firstWord = key.toLowerCase().split(" ")[0] || "";
    if (firstWord && lower.includes(firstWord)) return value;
  }
  return undefined;
}

function guaranteeMinimumProfile(result: Record<string, unknown>): void {
  const industry = (result.industry as string) || "";
  const name = (result.name as string) || "";

  // Logo: generate SVG initials if no logo at all
  const logos = (result.logos || {}) as Record<string, unknown>;
  if (!logos.primary || (typeof logos.primary === "string" && logos.primary.length < 10)) {
    const initials = name ? name.split(/\s+/).map(w => w[0]).filter(Boolean).join("").toUpperCase().slice(0, 2) : "?";
    const primaryColor = isValidHex((result.colors as Record<string, unknown>)?.primary)
      ? (result.colors as Record<string, unknown>).primary as string
      : "#6366F1";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" rx="28" fill="${primaryColor}"/><text x="50%" y="54%" font-family="Inter,system-ui,sans-serif" font-size="56" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="middle">${initials}</text></svg>`;
    logos.primary = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
    result.logos = logos;
  }

  // Colors: ensure all 5 slots are valid hex
  const colors = (result.colors || {}) as Record<string, unknown>;
  const fallbackPalette = findIndustryMatch(INDUSTRY_COLORS, industry)
    || { primary: "#6366F1", secondary: "#A5B4FC", accent: "#818CF8" };

  if (!isValidHex(colors.primary)) colors.primary = fallbackPalette.primary;
  if (!isValidHex(colors.secondary)) colors.secondary = fallbackPalette.secondary;
  if (!isValidHex(colors.accent)) colors.accent = fallbackPalette.accent;
  if (!isValidHex(colors.background)) colors.background = "#FFFFFF";
  if (!isValidHex(colors.text)) colors.text = "#1A1A1A";
  result.colors = colors;

  // Fonts: ensure heading + body are set
  const fonts = (result.fonts || {}) as Record<string, unknown>;
  const fallbackFonts = findIndustryMatch(INDUSTRY_FONTS, industry) || { heading: "Inter", body: "Inter" };

  const isBadFont = (f: unknown): boolean => !f || f === "undefined" || (typeof f === "string" && (f.startsWith("var(") || f.startsWith("--")));
  if (isBadFont(fonts.heading)) fonts.heading = fallbackFonts.heading;
  if (isBadFont(fonts.body)) fonts.body = fallbackFonts.body;
  result.fonts = fonts;
}

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const parsed = inputSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid URL" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let { url } = parsed.data;
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  // Server-side SSRF protection — block private, loopback, and link-local ranges
  const hostname = new URL(url).hostname.toLowerCase();
  const isPrivate =
    /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+|0\.0\.0\.0|::1|\[::1\]|fc[0-9a-f]{2}:|fd[0-9a-f]{2}:|fe80:)/.test(hostname)
    || hostname.endsWith(".internal")
    || hostname.endsWith(".local")
    || hostname.endsWith(".localhost")
    || hostname === "[::1]"
    || /^\d+$/.test(hostname); // bare numbers (e.g. http://0)
  if (isPrivate) {
    return new Response(JSON.stringify({ error: "URL not allowed" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const domain = url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  // Check Redis cache — avoid re-analyzing same domain within 6 hours
  const cached = await getCachedAnalysis(domain);
  if (cached) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ message: "Laddar från cache...", progress: 50 })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(cached)}\n\n`));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        // ── Step 1: Scrape + Enrich (parallel) ────────────────
        send({ message: `Hämtar ${domain}...`, progress: 10 });

        const [scrapeSettled, enrichSettled] = await Promise.allSettled([
          scrapeWithFallback(url),
          enrichCompany(url),
        ]);

        if (scrapeSettled.status === "rejected") {
          send({ event: "error", message: "Kunde inte hämta hemsidan. Kontrollera URL:en." });
          controller.close();
          return;
        }

        const scrapeResult = scrapeSettled.value;
        if (
          !scrapeResult ||
          typeof scrapeResult.url !== "string" ||
          !Array.isArray(scrapeResult.colors) ||
          !Array.isArray(scrapeResult.fonts) ||
          !Array.isArray(scrapeResult.logoUrls)
        ) {
          send({ event: "error", message: "Hemsidan gav oväntad data. Försök med en annan URL." });
          controller.close();
          return;
        }

        const enrichment =
          enrichSettled.status === "fulfilled" ? enrichSettled.value : null;

        // Schedule background retry if enrichment failed (non-blocking)
        if (!enrichment) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL;
          if (appUrl) fetch(`${appUrl}/api/inngest`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: "brand/retry-enrichment",
              data: { domain, attempt: 1 },
            }),
          }).catch(() => { /* non-blocking */ });
        }

        // Show company name if enrichment found it
        if (enrichment?.name) {
          const locationPart = enrichment.location ? ` — ${enrichment.location}` : "";
          send({ message: `${enrichment.name}${locationPart}`, progress: 30 });
        }

        // Show what we found from scraping
        const colorCount = scrapeResult.colors.length;
        const fontCount = scrapeResult.fonts.length;
        const hasLogo = scrapeResult.logoUrls.length > 0;
        const parts: string[] = [];
        if (hasLogo) parts.push("logotyp");
        if (colorCount > 0) parts.push(`${colorCount} färger`);
        if (fontCount > 0) parts.push(`${fontCount} typsnitt`);
        if (parts.length > 0) {
          send({ message: `Hittade ${parts.join(" och ")}`, progress: 50 });
        }

        // ── Step 2: AI Analysis + Intelligence + Pre-generate image ──
        send({ message: "Analyserar ert varumärke med AI...", progress: 65 });

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
            companyName: enrichment?.name ?? domain,
            enrichedIndustry: enrichment?.industry,
          }).catch(() => null),
        ]);

        send({ message: "Bygger din varumärkesprofil...", progress: 85 });


        // ── Step 3: Merge intelligence ──────────────────────────
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { rawScrapeData, rawEnrichmentData, ...clean } = profile;

        const intel = intelligence?.intelligence ?? null;

        const downloadedLogo = intelligence?.downloadedLogo ?? null;
        const logoDataUrl = downloadedLogo?.dataUrl ?? null;

        // Prefer downloaded base64 logo (always renders) over raw scraped URLs
        // which may be blocked by CORS / hotlink protection
        const finalLogo = {
          primary: logoDataUrl ?? clean.logos?.primary ?? undefined,
          icon: clean.logos?.icon,
          dark: clean.logos?.dark,
        };

        const finalColors =
          intel && intel.colors.confidence >= 60
            ? { ...clean.colors, ...intel.colors.value }
            : clean.colors;

        const finalFonts =
          intel && intel.font.confidence >= 70
            ? { heading: intel.font.value.family, body: intel.font.value.family }
            : clean.fonts;

        const foundParts: string[] = [];
        if (downloadedLogo?.dataUrl) foundParts.push("logotyp");
        if (intel?.colors?.confidence && intel.colors.confidence >= 60) foundParts.push("färger");
        else if (scrapeResult.colors.length > 0) foundParts.push("färger (CSS)");
        if (intel?.font?.confidence && intel.font.confidence >= 70) foundParts.push("typsnitt");
        else if (scrapeResult.fonts.length > 0) foundParts.push("typsnitt (CSS)");
        send({
          message: foundParts.length > 0
            ? `Hittade ${foundParts.join(", ")} från webbplatsen`
            : "Använder smarta standardvärden för din bransch",
          progress: 88
        });

        // Validate colors before harmony generation
        const isHex = (c: unknown): c is string => typeof c === "string" && /^#[0-9a-fA-F]{6}$/.test(c);
        const _colorHarmony =
          isHex(finalColors.primary) && isHex(finalColors.secondary) && isHex(finalColors.accent)
            ? generateHarmonySet(finalColors.primary, finalColors.secondary, finalColors.accent)
            : null;

        const result = {
          ...clean,
          logos: finalLogo,
          colors: finalColors,
          fonts: finalFonts,
          _colorHarmony,
          _logoTheme: downloadedLogo?.theme ?? "light",
          _enrichmentStatus: enrichment ? "complete" : "partial",
          _intelligenceStatus: intel ? "complete" : "failed",
          _intelligence: intel
            ? {
                overallConfidence: intel.overallConfidence,
                logo: { source: intel.logo.source, confidence: intel.logo.confidence, status: intel.logo.status },
                colors: { source: intel.colors.source, confidence: intel.colors.confidence, status: intel.colors.status },
                font: { source: intel.font.source, confidence: intel.font.confidence, status: intel.font.status },
                industry: { source: intel.industry.source, confidence: intel.industry.confidence, status: intel.industry.status },
                socialProfiles: intel.social,
                visualStyle: intel.visualStyle,
                audit: intel.audit
                  ? {
                      readinessScore: intel.audit.readinessScore,
                      hasMetaPixel: intel.audit.hasMetaPixel,
                      hasGoogleTag: intel.audit.hasGoogleTag,
                      hasLinkedinTag: intel.audit.hasLinkedinTag,
                      techStack: intel.audit.techStack,
                      issues: intel.audit.issues,
                    }
                  : null,
              }
            : null,
        };

        // Ensure every brand profile has minimum viable assets
        guaranteeMinimumProfile(result as Record<string, unknown>);

        const completeEvent = {
          event: "complete" as const,
          profile: result,
          preGeneratedImageUrl: null,
          progress: 100,
        };
        send(completeEvent);

        // Cache the complete event for 6 hours (domain-keyed) — strip raw data to save memory
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { rawScrapeData: _r, rawEnrichmentData: _e, ...cacheSafeProfile } = result as Record<string, unknown>;
        setCachedAnalysis(domain, { ...completeEvent, profile: cacheSafeProfile }).catch(() => {});
      } catch (err) {
        send({
          event: "error",
          message:
            err instanceof Error
              ? err.message
              : "Något gick fel under analysen.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
