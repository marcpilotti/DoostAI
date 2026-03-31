import { z } from "zod";

import {
  buildBrandProfile,
  enrichCompany,
  scrapeBrand,
  generateHarmonySet,
} from "@doost/brand";
import { runBrandIntelligencePipeline } from "@doost/intelligence";

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
export async function POST(req: Request) {
  const body = await req.json();
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

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        const domain = url.replace(/^https?:\/\//, "").replace(/\/$/, "");

        // ── Step 1: Scrape + Enrich ────────────────────────────
        send({ message: `Hämtar ${domain}...`, progress: 10 });

        const [scrapeSettled, enrichSettled] = await Promise.allSettled([
          scrapeBrand(url),
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

        // ── Step 2: AI Analysis + Intelligence ──────────────────
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
        const { rawScrapeData: _s, rawEnrichmentData: _e, ...clean } = profile;

        const intel = intelligence?.intelligence ?? null;

        const downloadedLogo = intelligence?.downloadedLogo ?? null;
        const logoDataUrl = downloadedLogo?.dataUrl ?? null;

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

        const _colorHarmony = generateHarmonySet(
          finalColors.primary,
          finalColors.secondary,
          finalColors.accent,
        );

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

        // ── Complete ────────────────────────────────────────────
        send({ event: "complete", profile: result, progress: 100 });
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
