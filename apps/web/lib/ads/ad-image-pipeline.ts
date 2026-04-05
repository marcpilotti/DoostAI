/**
 * Ad Image Pipeline — GPT-4o background generation via gpt-image-1.
 *
 * Uses the full brand profile (description, industry, voice, audience)
 * to generate relevant background images. No hardcoded scene rules —
 * GPT-4o understands context natively.
 *
 * Flow: GPT-4o (8-12s) → SVG gradient fallback (instant)
 */

import type { AdFormat } from "@/components/ads/ad-preview/types";
import { generateEmbeddedAdImage } from "@/lib/providers/openai-image";

// ── Types ────────────────────────────────────────────────────────

export type AdImageInput = {
  brandName: string;
  brandColor: string;
  brandAccent?: string;
  logoUrl?: string | null;
  industry: string;
  description?: string;
  brandVoice?: string;
  targetAudience?: string;
  headline: string;
  bodyCopy: string;
  cta: string;
  format: AdFormat;
  visualKeywords?: string[];
};

export type AdImageResult = {
  imageUrl: string;
  method: "gpt-image" | "gradient-fallback";
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

// ── Prompt builder — uses real profile data ──────────────────────

function buildPrompt(input: AdImageInput): string {
  const parts: string[] = [
    "Professional advertising photograph.",
  ];

  // What the company does (most important context)
  if (input.description) {
    parts.push(`Company: ${input.description}.`);
  } else if (input.industry) {
    parts.push(`Industry: ${input.industry}.`);
  }

  // Mood from brand voice
  if (input.brandVoice) {
    parts.push(`Mood: ${input.brandVoice}.`);
  }

  // Style hint from target audience
  if (input.targetAudience) {
    parts.push(`Appeal to: ${input.targetAudience}.`);
  }

  // Visual keywords from classification
  if (input.visualKeywords?.length) {
    parts.push(`Visual elements: ${input.visualKeywords.join(", ")}.`);
  }

  // Color direction
  parts.push(`Dominant color: ${input.brandColor}.`);
  if (input.brandAccent && input.brandAccent !== input.brandColor) {
    parts.push(`Secondary color accent: ${input.brandAccent}.`);
  }

  // Technical requirements
  parts.push(
    "Premium commercial photography, cinematic lighting, sharp focus.",
    "Clean background suitable for text overlay.",
    "No text, no words, no logos, no watermarks, no people.",
  );

  return parts.join(" ");
}

// ── Core pipeline ────────────────────────────────────────────────

export async function generateCompleteAdImage(
  input: AdImageInput,
): Promise<AdImageResult | null> {
  if (input.format === "google-search") return null;

  const prompt = buildPrompt(input);
  const size = FORMAT_SIZES[input.format] ?? "1024x1024";

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && !apiKey.startsWith("sk-proj-placeholder")) {
    try {
      console.log(`[ad-pipeline] GPT-4o for ${input.brandName} (${input.industry})`);
      const generated = await Promise.race([
        generateEmbeddedAdImage({ prompt, size, quality: "medium" }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("GPT-4o timed out")), 15_000),
        ),
      ]);
      console.log(`[ad-pipeline] Done for ${input.brandName}`);
      return {
        imageUrl: `data:image/jpeg;base64,${generated.b64}`,
        method: "gpt-image",
        prompt,
        attempts: 1,
      };
    } catch (err) {
      console.warn("[ad-pipeline] GPT-4o failed:", err instanceof Error ? err.message : err);
    }
  }

  // Gradient fallback (instant, always works)
  const p = input.brandColor;
  const a = input.brandAccent ?? input.brandColor;
  const svg = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080"><defs><radialGradient id="g1" cx="30%" cy="20%"><stop offset="0%" stop-color="${p}dd"/><stop offset="100%" stop-color="${a}44"/></radialGradient><radialGradient id="g2" cx="70%" cy="80%"><stop offset="0%" stop-color="${a}99"/><stop offset="100%" stop-color="${p}22"/></radialGradient><linearGradient id="bg" x1="0%" x2="100%" y1="0%" y2="100%"><stop offset="0%" stop-color="${p}"/><stop offset="50%" stop-color="${a}"/><stop offset="100%" stop-color="${p}cc"/></linearGradient></defs><rect width="1080" height="1080" fill="url(#bg)"/><circle cx="200" cy="200" r="350" fill="url(#g1)" opacity="0.6"/><circle cx="880" cy="880" r="300" fill="url(#g2)" opacity="0.5"/></svg>`)}`;

  return { imageUrl: svg, method: "gradient-fallback", prompt, attempts: 0 };
}

// ── Parallel variant generation (kept for backwards compat) ──────

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
