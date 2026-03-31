import { z } from "zod";

import {
  generateAdCopy,
  generateAdStrategy,
} from "@doost/ai";
import type { BrandContext, Platform } from "@doost/ai";
import { generateAdBackground } from "@doost/templates/ai-image";
import { getIndustryBackground } from "@doost/templates/backgrounds";

export const maxDuration = 90;

const inputSchema = z.object({
  brand: z.object({
    name: z.string(),
    description: z.string().optional(),
    industry: z.string().optional(),
    brandVoice: z.string().optional(),
    targetAudience: z.string().optional(),
    valuePropositions: z.array(z.string()).optional(),
    url: z.string(),
    colors: z.object({
      primary: z.string(),
      secondary: z.string().optional(),
      accent: z.string().optional(),
      background: z.string().optional(),
      text: z.string().optional(),
    }),
    fonts: z.object({ heading: z.string(), body: z.string() }).optional(),
  }),
  platform: z.enum(["meta", "google", "linkedin"]),
  objective: z.string().optional(),
  audience: z.string().optional(),
  language: z.string().optional(),
});

/**
 * POST /api/ad/generate
 *
 * SSE endpoint that streams ad generation progress.
 * Steps: strategy → copy → images (all streamed as events).
 *
 * Events:
 *   { event: "strategy", strategy: {...} }
 *   { event: "copy", copies: [...] }
 *   { event: "image_a", imageUrl: "..." }
 *   { event: "image_b", imageUrl: "..." }
 *   { event: "complete", result: { copies, brand, backgroundUrl, ... } }
 *   { event: "error", message: "..." }
 *   { event: "progress", message: "...", progress: N }
 */
export async function POST(req: Request) {
  const body = await req.json();
  const parsed = inputSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Invalid input", details: parsed.error.flatten() }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const { brand, platform, objective, audience, language } = parsed.data;
  const detectedLanguage = language ?? "sv";

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        const brandContext: BrandContext = {
          name: brand.name,
          description: brand.description ?? `${brand.name} — ${brand.industry ?? "kvalitetsprodukter"}`,
          industry: brand.industry ?? "Allmänt",
          brandVoice: brand.brandVoice ?? "Professional, approachable and modern",
          targetAudience: audience ?? (brand.targetAudience || "Swedish consumers 25-55"),
          valuePropositions: brand.valuePropositions?.length
            ? brand.valuePropositions
            : ["Quality", "Reliability", "Great value"],
          url: brand.url,
        };

        // ── Step 1: Strategy ─────────────────────────────────────
        send({ event: "progress", message: "Bygger din annons...", progress: 10 });

        const strategy = await generateAdStrategy({
          brand: brandContext,
          platform,
          goal: objective ?? "lead generation",
          audience: audience ?? brand.targetAudience ?? "Swedish consumers 25-55",
          language: detectedLanguage,
        }).catch((err) => {
          console.warn("[AdGenerate] Strategy failed:", err instanceof Error ? err.message : err);
          return null;
        });

        if (strategy) {
          send({ event: "strategy", strategy });
        }

        // ── Step 2: Copy + Images in parallel ────────────────────
        send({ event: "progress", message: "Skriver rubrik och text...", progress: 30 });

        const [copySettled, aiImageA, aiImageB, unsplashBgUrl] = await Promise.allSettled([
          generateAdCopy(brandContext, platform as Platform, objective ?? "lead generation", {
            language: detectedLanguage,
            variants: 2,
          }),
          generateAdBackground({
            industry: brand.industry ?? "",
            brandName: brand.name,
            primaryColor: brand.colors.primary ?? "#6366f1",
            accentColor: brand.colors.accent,
            style: "modern",
            format: "square",
          }),
          generateAdBackground({
            industry: brand.industry ?? "",
            brandName: brand.name,
            primaryColor: brand.colors.accent ?? brand.colors.secondary ?? "#4f46e5",
            accentColor: brand.colors.primary ?? "#6366f1",
            style: "premium",
            format: "square",
          }),
          getIndustryBackground(brand.industry ?? ""),
        ]);

        // Handle copy generation failure
        if (copySettled.status === "rejected") {
          console.error("[AdGenerate] Copy generation failed:", copySettled.reason);
          send({
            event: "error",
            message: "Kunde inte generera annonstext. Försök igen.",
          });
          controller.close();
          return;
        }

        const copyResults = copySettled.value;

        // Send copy as soon as it's ready
        const copies = copyResults.map((c, i) => ({
          id: `${c.platform}-${c.variant}-${i}`,
          platform: c.platform,
          variant: c.variant,
          label: c.variant === "hero" ? "Variant A" : "Variant B",
          headline: c.headline,
          bodyCopy: c.bodyCopy,
          cta: c.cta,
          headlines: c.headlines,
          descriptions: c.descriptions,
        }));

        send({ event: "copy", copies, progress: 60 });

        // ── Step 3: Resolve images ───────────────────────────────
        send({ event: "progress", message: "Skapar AI-bakgrund i era färger...", progress: 70 });

        const imgA = aiImageA.status === "fulfilled" ? aiImageA.value : null;
        const imgB = aiImageB.status === "fulfilled" ? aiImageB.value : null;
        const unsplashBg = unsplashBgUrl.status === "fulfilled" ? unsplashBgUrl.value : null;

        let bgUrl = imgA?.imageUrl ?? unsplashBg;
        const bgUrlB = imgB?.imageUrl ?? bgUrl;

        if (!bgUrl) {
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
        }

        if (imgA?.imageUrl) {
          send({ event: "image_a", imageUrl: imgA.imageUrl, progress: 85 });
        }
        if (imgB?.imageUrl && imgB.imageUrl !== imgA?.imageUrl) {
          send({ event: "image_b", imageUrl: imgB.imageUrl, progress: 90 });
        }

        // ── Complete ─────────────────────────────────────────────
        send({
          event: "complete",
          progress: 100,
          result: {
            copies,
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
            backgroundUrl: bgUrl,
            backgroundUrlB: bgUrlB !== bgUrl ? bgUrlB : undefined,
            platform,
            strategy: strategy
              ? {
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
                }
              : null,
          },
        });
      } catch (err) {
        console.error("[AdGenerate] Unhandled error:", err);
        send({
          event: "error",
          message: "Kunde inte generera annons. Försök igen.",
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
