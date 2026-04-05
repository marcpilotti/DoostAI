import { auth } from "@clerk/nextjs/server";
import {
  buildBrandProfile,
  enrichCompany,
  generateHarmonySet,
  scrapeWithFallback,
} from "@doost/brand";
import { runBrandIntelligencePipeline } from "@doost/intelligence";
import { z } from "zod";

import { generateAdImage } from "@/lib/ads/image-generator";

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
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

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

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        const domain = url.replace(/^https?:\/\//, "").replace(/\/$/, "");

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
          fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/inngest`, {
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

        const [profile, intelligence, preImageResult] = await Promise.all([
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
          generateAdImage({
            industry: enrichment?.industry ?? "",
            description: enrichment?.name ?? domain,
            brandName: enrichment?.name ?? domain,
          }).catch(() => ({ url: null })),
        ]);

        send({ message: "Bygger din varumärkesprofil...", progress: 85 });

        // ── Step 3: Merge intelligence ──────────────────────────
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { rawScrapeData, rawEnrichmentData, ...clean } = profile;

        const intel = intelligence?.intelligence ?? null;

        const downloadedLogo = intelligence?.downloadedLogo ?? null;
        const logoDataUrl = downloadedLogo?.dataUrl ?? null;

        // Scraped logo from the actual website wins — Logo APIs are fallback
        // for Nordic companies where Logo.dev/Brandfetch often return wrong results
        const finalLogo = {
          primary: clean.logos?.primary ?? logoDataUrl ?? undefined,
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

        // ── Complete ────────────────────────────────────────────
        send({
          event: "complete",
          profile: result,
          preGeneratedImageUrl: preImageResult?.url ?? null,
          progress: 100,
        });
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
