/**
 * Ad Image Pipeline — GPT-4o background-only image generation.
 *
 * Generates clean background images with NO TEXT. All text (headline,
 * body, CTA) is rendered by the frontend CSS overlay — never baked
 * into the image.
 *
 * Flow per variant:
 *   1. GPT-4o gpt-image-1 generates a background image (no text/logos)
 *   2. If GPT-4o fails, fall back to Flux
 *   3. If Flux also fails, return a gradient
 *
 * Variant A and B run in parallel via generateAdImagePair.
 */

import type { AdFormat } from "@/components/ads/ad-preview/types";
import { generateAdImage as generateFluxBackground, INDUSTRY_SCENES } from "@/lib/ads/image-generator";
import { generateEmbeddedAdImage } from "@/lib/providers/openai-image";

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
  method: "gpt-image" | "flux-fallback" | "gradient-fallback";
  prompt: string;
  attempts: number;
};

// ── Format → size mapping ────────────────────────────────────────

const FORMAT_SIZES: Record<string, "1024x1024" | "1024x1536" | "1536x1024"> = {
  "meta-feed": "1024x1024",
  "meta-stories": "1024x1536",
  "google-search": "1024x1024",
  "linkedin": "1536x1024",
};

const FORMAT_COMPOSITION: Record<string, string> = {
  "meta-feed": "square format, centered composition",
  "meta-stories": "vertical 9:16 format, subject in upper third",
  "google-search": "square format",
  "linkedin": "horizontal 16:9 format, professional setting",
};

// ── Prompt builder (background only — NO TEXT) ───────────────────

function buildBackgroundPrompt(input: AdImageInput): string {
  const scene =
    INDUSTRY_SCENES[input.industry] ??
    (input.industry
      ? `${input.industry} business environment, relevant products and setting`
      : "modern business environment");
  const composition = FORMAT_COMPOSITION[input.format] ?? "square format";

  return `Professional advertising photograph: ${scene}. Premium commercial photography, cinematic lighting, vibrant colors. Dominant color palette: ${input.brandColor}${input.brandAccent ? ` and ${input.brandAccent}` : ""}. ${composition}. Sharp focus throughout, well-lit, 4K resolution. NO TEXT, NO WORDS, NO LETTERS, NO LOGOS, NO WATERMARKS, NO PEOPLE. Clean background suitable for text overlay.`;
}

// ── Core pipeline ────────────────────────────────────────────────

export async function generateCompleteAdImage(
  input: AdImageInput,
): Promise<AdImageResult | null> {
  if (input.format === "google-search") return null;

  const prompt = buildBackgroundPrompt(input);
  const size = FORMAT_SIZES[input.format] ?? "1024x1024";

  // Try GPT-4o first
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && !apiKey.startsWith("sk-proj-placeholder")) {
    try {
      console.log(`[ad-pipeline] GPT-4o background for ${input.brandName}`);
      const generated = await generateEmbeddedAdImage({ prompt, size, quality: "medium" });
      return {
        imageUrl: `data:image/png;base64,${generated.b64}`,
        method: "gpt-image",
        prompt,
        attempts: 1,
      };
    } catch (err) {
      console.warn("[ad-pipeline] GPT-4o failed, trying Flux:", err instanceof Error ? err.message : err);
    }
  }

  // Flux fallback
  try {
    const fluxResult = await generateFluxBackground({
      industry: input.industry,
      description: input.bodyCopy.slice(0, 80),
      brandName: input.brandName,
    });
    if (fluxResult.url) {
      return { imageUrl: fluxResult.url, method: "flux-fallback", prompt, attempts: 1 };
    }
  } catch {
    // fall through to gradient
  }

  // Gradient fallback
  const p = input.brandColor;
  const a = input.brandAccent ?? input.brandColor;
  const svgGradient = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080"><defs><radialGradient id="g1" cx="30%" cy="20%"><stop offset="0%" stop-color="${p}dd"/><stop offset="100%" stop-color="${a}44"/></radialGradient><radialGradient id="g2" cx="70%" cy="80%"><stop offset="0%" stop-color="${a}99"/><stop offset="100%" stop-color="${p}22"/></radialGradient><linearGradient id="bg" x1="0%" x2="100%" y1="0%" y2="100%"><stop offset="0%" stop-color="${p}"/><stop offset="50%" stop-color="${a}"/><stop offset="100%" stop-color="${p}cc"/></linearGradient></defs><rect width="1080" height="1080" fill="url(#bg)"/><circle cx="200" cy="200" r="350" fill="url(#g1)" opacity="0.6"/><circle cx="880" cy="880" r="300" fill="url(#g2)" opacity="0.5"/></svg>`)}`;

  return { imageUrl: svgGradient, method: "gradient-fallback", prompt, attempts: 0 };
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
