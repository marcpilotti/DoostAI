/**
 * Ad Image Pipeline — Flux Schnell background generation.
 *
 * Generates clean background images with NO TEXT via FAL.ai Flux Schnell.
 * ~2-3 seconds per image at $0.003. All text is rendered by frontend CSS.
 *
 * Flow: Flux Schnell (2-3s) → SVG gradient fallback (instant)
 * Both variants run in parallel via generateAdImagePair.
 */

import * as fal from "@fal-ai/serverless-client";

import type { AdFormat } from "@/components/ads/ad-preview/types";

// ── Types ────────────────────────────────────────────────────────

export type AdImageInput = {
  brandName: string;
  brandColor: string;
  brandAccent?: string;
  logoUrl?: string | null;
  industry: string;
  headline: string;
  bodyCopy: string;
  cta: string;
  format: AdFormat;
};

export type AdImageResult = {
  imageUrl: string;
  method: "flux-schnell" | "gradient-fallback";
  prompt: string;
  attempts: number;
};

// ── FAL.ai config ────────────────────────────────────────────────

let _configured = false;
function ensureFal() {
  if (_configured) return;
  _configured = true;
  fal.config({ credentials: process.env.FAL_KEY || "" });
}

// ── Format → size mapping ────────────────────────────────────────

const FORMAT_SIZES: Record<string, string> = {
  "meta-feed": "square_hd",
  "meta-stories": "portrait_16_9",
  "google-search": "square_hd",
  "linkedin": "landscape_16_9",
};

// ── Industry scenes (short, direct — Schnell follows these best) ─

const INDUSTRY_SCENES: Record<string, string> = {
  "Skönhet & Kosmetik": "luxury skincare products on marble surface, soft golden lighting",
  "Frisör & Salong": "modern salon interior, styling tools, warm ambient lighting",
  "Restaurang & Café": "beautifully plated food on wooden table, warm restaurant light",
  "E-handel": "premium product packaging, minimalist display, clean studio lighting",
  "SaaS & Tech": "sleek modern workspace, laptop and coffee, natural light",
  "Hälsa & Wellness": "spa environment, natural ingredients, zen atmosphere",
  "Fastigheter": "modern home interior, sunlit living space, architectural detail",
  "Bygg & Renovering": "freshly renovated room, craftsmanship, modern materials",
  "Träning & Gym": "modern gym equipment, energetic atmosphere, dynamic lighting",
  "Mode & Kläder": "fashion items on display, fabric textures, editorial lighting",
  "Fotografi": "professional camera gear, studio lighting setup, creative workspace",
  "Tandvård": "modern dental clinic, clean bright environment",
  "Juridik & Redovisning": "elegant office, professional desk, warm ambient light",
  "Marknadsföring & Reklam": "creative workspace, screens with data, modern office",
  "Resor & Turism": "stunning travel destination, scenic landscape, golden hour",
  "Inredning & Design": "designer interior, beautiful furniture, styled space",
  "Livsmedel & Dagligvaror": "fresh produce, artisan food arrangement, warm tones",
  "Finans & Försäkring": "modern office, glass buildings, professional setting",
  "Bilverkstad & Motor": "premium car detail, clean workshop, polished surfaces",
};

// ── Prompt builder ───────────────────────────────────────────────

function buildPrompt(input: AdImageInput): string {
  const scene =
    INDUSTRY_SCENES[input.industry] ??
    (input.industry
      ? `${input.industry} business, professional setting`
      : "modern business environment, professional setting");

  return `Professional advertising photograph. ${scene}. Dominant color: ${input.brandColor}. Sharp focus, premium commercial photography, cinematic lighting. Clean background for text overlay. No text, no logos, no people.`;
}

// ── Core pipeline ────────────────────────────────────────────────

export async function generateCompleteAdImage(
  input: AdImageInput,
): Promise<AdImageResult | null> {
  if (input.format === "google-search") return null;

  const prompt = buildPrompt(input);
  const imageSize = FORMAT_SIZES[input.format] ?? "square_hd";

  // Flux Schnell via FAL.ai (~2-3s)
  if (process.env.FAL_KEY) {
    try {
      ensureFal();
      console.log(`[ad-pipeline] Flux Schnell for ${input.brandName} (${input.industry})`);

      const result = await Promise.race([
        fal.subscribe("fal-ai/flux/schnell", {
          input: {
            prompt,
            image_size: imageSize,
            num_images: 1,
            num_inference_steps: 4,
            enable_safety_checker: true,
          },
          pollInterval: 500,
        }) as Promise<{ images?: Array<{ url: string }> }>,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Flux Schnell timed out")), 10_000),
        ),
      ]);

      const url = result?.images?.[0]?.url;
      if (url) {
        console.log(`[ad-pipeline] Flux Schnell done: ${url.slice(0, 60)}`);
        return { imageUrl: url, method: "flux-schnell", prompt, attempts: 1 };
      }
    } catch (err) {
      console.warn("[ad-pipeline] Flux Schnell failed:", err instanceof Error ? err.message : err);
    }
  }

  // Gradient fallback (instant, always works)
  const p = input.brandColor;
  const a = input.brandAccent ?? input.brandColor;
  const svg = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080"><defs><radialGradient id="g1" cx="30%" cy="20%"><stop offset="0%" stop-color="${p}dd"/><stop offset="100%" stop-color="${a}44"/></radialGradient><radialGradient id="g2" cx="70%" cy="80%"><stop offset="0%" stop-color="${a}99"/><stop offset="100%" stop-color="${p}22"/></radialGradient><linearGradient id="bg" x1="0%" x2="100%" y1="0%" y2="100%"><stop offset="0%" stop-color="${p}"/><stop offset="50%" stop-color="${a}"/><stop offset="100%" stop-color="${p}cc"/></linearGradient></defs><rect width="1080" height="1080" fill="url(#bg)"/><circle cx="200" cy="200" r="350" fill="url(#g1)" opacity="0.6"/><circle cx="880" cy="880" r="300" fill="url(#g2)" opacity="0.5"/></svg>`)}`;

  return { imageUrl: svg, method: "gradient-fallback", prompt, attempts: 0 };
}

// ── Parallel variant generation ──────────────────────────────────

export async function generateAdImagePair(
  inputA: AdImageInput,
  inputB: AdImageInput,
): Promise<[AdImageResult | null, AdImageResult | null]> {
  const [resultA, resultB] = await Promise.allSettled([
    generateCompleteAdImage(inputA),
    generateCompleteAdImage(inputB),
  ]);

  return [
    resultA.status === "fulfilled" ? resultA.value : null,
    resultB.status === "fulfilled" ? resultB.value : null,
  ];
}
