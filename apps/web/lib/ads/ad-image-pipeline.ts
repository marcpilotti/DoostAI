/**
 * Ad Image Pipeline — GPT-4o with embedded text + vision verification.
 *
 * Flow per variant:
 *   1. GPT-4o gpt-image-1 generates full ad image with all text embedded
 *   2. GPT-4o vision verifies brand name renders correctly (Swedish å/ä/ö)
 *   3. If verification fails, retry once
 *   4. If both attempts fail, fall back to Flux background + Satori text overlay
 *
 * Variant A and B run in parallel via generateAdImagePair.
 */

import type { AdFormat } from "@/components/ads/ad-preview/types";
import { generateBrandGradient } from "@/lib/ads/gradients";
import { generateAdImage as generateFluxBackground, INDUSTRY_SCENES } from "@/lib/ads/image-generator";
import { renderAdTemplate } from "@/lib/ads/renderer";
import { HeroTemplate } from "@/lib/ads/templates/hero";
import { generateEmbeddedAdImage, verifyImageText } from "@/lib/providers/openai-image";

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
  method: "gpt-image" | "satori-fallback";
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

// ── Prompt builder ───────────────────────────────────────────────

function buildEmbeddedTextPrompt(input: AdImageInput): string {
  const scene =
    INDUSTRY_SCENES[input.industry] ??
    (input.industry
      ? `${input.industry} business environment, relevant products and setting`
      : "modern business environment");
  const composition = FORMAT_COMPOSITION[input.format] ?? "square format";

  return `Create a professional advertising image for "${input.brandName}".

BACKGROUND: ${scene}. Premium commercial photography, cinematic lighting, vibrant colors. Dominant color: ${input.brandColor}${input.brandAccent ? `, accent: ${input.brandAccent}` : ""}.

TEXT LAYOUT (all text must be perfectly sharp and readable):
- Top-left: brand name "${input.brandName}" in a small rounded badge
- Center/lower area: large bold headline reading EXACTLY: "${input.headline}"
- Below headline: body text reading EXACTLY: "${input.bodyCopy}"
- Below body: a rounded pill-shaped CTA button in ${input.brandColor} with white text reading EXACTLY: "${input.cta}"

CRITICAL RULES:
- Render ALL text EXACTLY as specified, character for character
- Swedish characters å, ä, ö MUST be rendered correctly — do NOT substitute with a, a, o
- Headline text: large, bold, white with subtle shadow for contrast
- Body text: medium weight, white semi-transparent
- CTA button: bold white text on colored pill shape
- ${composition}
- No extra text, no watermarks beyond what is specified above`;
}

// ── Core pipeline ────────────────────────────────────────────────

const MAX_ATTEMPTS = 2;

export async function generateCompleteAdImage(
  input: AdImageInput,
): Promise<AdImageResult | null> {
  // Google Search has no background image
  if (input.format === "google-search") return null;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.startsWith("sk-proj-placeholder")) {
    console.warn("[ad-pipeline] OPENAI_API_KEY not configured, using fallback");
    return generateSatoriFallback(input);
  }

  const prompt = buildEmbeddedTextPrompt(input);
  const size = FORMAT_SIZES[input.format] ?? "1024x1024";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(`[ad-pipeline] GPT-4o attempt ${attempt}/${MAX_ATTEMPTS} for ${input.brandName}`);

      const generated = await generateEmbeddedAdImage({
        prompt,
        size,
        quality: "medium",
      });

      // Vision verification — check brand name renders correctly
      const verification = await verifyImageText(generated.b64, input.brandName)
        .catch((err) => {
          console.warn("[ad-pipeline] Vision check failed:", err instanceof Error ? err.message : err);
          // If vision check itself errors, accept the image (don't penalize for API issues)
          return { correct: true } as const;
        });

      if (verification.correct) {
        console.log(`[ad-pipeline] Verified on attempt ${attempt}: ${input.brandName}`);
        return {
          imageUrl: `data:image/png;base64,${generated.b64}`,
          method: "gpt-image",
          prompt,
          attempts: attempt,
        };
      }

      console.warn(
        `[ad-pipeline] Verification failed attempt ${attempt}: expected "${input.brandName}", found "${verification.foundText ?? "?"}" — ${verification.issues ?? "unknown"}`,
      );
    } catch (err) {
      console.error(`[ad-pipeline] Generation failed attempt ${attempt}:`, err instanceof Error ? err.message : err);
    }
  }

  // Both GPT-4o attempts failed — fall back to Flux + Satori
  console.log(`[ad-pipeline] Falling back to Satori for ${input.brandName}`);
  return generateSatoriFallback(input);
}

// ── Satori fallback ──────────────────────────────────────────────

async function generateSatoriFallback(
  input: AdImageInput,
): Promise<AdImageResult> {
  // Step 1: Generate background-only image via Flux (or use gradient)
  const fluxResult = await generateFluxBackground({
    industry: input.industry,
    description: input.bodyCopy.slice(0, 80),
    brandName: input.brandName,
  }).catch(() => ({ url: null }));

  const gradient = generateBrandGradient({
    primary: input.brandColor,
    secondary: input.brandAccent,
  });

  // Step 2: Render full ad via Satori with HeroTemplate
  const element = HeroTemplate({
    headline: input.headline,
    bodyCopy: input.bodyCopy,
    cta: input.cta,
    brandName: input.brandName,
    logoUrl: input.logoUrl ?? undefined,
    imageUrl: fluxResult.url ?? undefined,
    gradient,
    primaryColor: input.brandColor,
  });

  const png = await renderAdTemplate(element as React.ReactElement, {
    width: 1080,
    height: 1080,
  });

  const imageUrl = `data:image/png;base64,${png.toString("base64")}`;

  return {
    imageUrl,
    method: "satori-fallback",
    prompt: "Satori fallback with Flux background",
    attempts: MAX_ATTEMPTS,
  };
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
