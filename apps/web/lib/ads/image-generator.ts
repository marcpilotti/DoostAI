/**
 * AI image generation via fal.ai Flux 1.1
 * Generates industry-relevant background images for ad templates.
 * Falls back gracefully if FAL_KEY is not set.
 */

import * as fal from "@fal-ai/serverless-client";

type GenerateImageResult = {
  url: string | null;
  error?: string;
};

let _configured = false;
function ensureConfig() {
  if (_configured) return;
  _configured = true;
  fal.config({ credentials: process.env.FAL_KEY || "" });
}

function buildPrompt(industry: string, description: string, brandName: string): string {
  const base = `Professional advertising photography, modern and clean, high quality commercial photo`;
  const context = industry
    ? `for a ${industry} business called ${brandName}`
    : `for a business called ${brandName}`;
  const hint = description
    ? `, showing ${description.slice(0, 100)}`
    : "";
  return `${base} ${context}${hint}. Soft natural lighting, shallow depth of field, no text, no logos, no people's faces, editorial style, 4K quality`;
}

export async function generateAdImage(params: {
  industry: string;
  description: string;
  brandName: string;
}): Promise<GenerateImageResult> {
  if (!process.env.FAL_KEY) {
    console.error("[fal.ai] FAL_KEY not configured — skipping image generation");
    return { url: null, error: "FAL_KEY not configured" };
  }

  ensureConfig();

  const prompt = buildPrompt(params.industry, params.description, params.brandName);
  console.log("[fal.ai] Generating image for:", params.brandName, "industry:", params.industry);

  try {
    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt,
        image_size: "square_hd",
        num_images: 1,
        enable_safety_checker: true,
      },
      pollInterval: 1000,
    }) as { images?: Array<{ url: string }> };

    const imageUrl = result?.images?.[0]?.url;
    if (!imageUrl) {
      console.error("[fal.ai] No image URL in response");
      return { url: null, error: "No image returned" };
    }

    console.log("[fal.ai] Image generated:", imageUrl.substring(0, 80));
    return { url: imageUrl };
  } catch (err) {
    console.error("[fal.ai] Generation failed:", err);
    return { url: null, error: err instanceof Error ? err.message : "Generation failed" };
  }
}
