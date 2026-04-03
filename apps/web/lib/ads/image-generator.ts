/**
 * AI image generation via fal.ai Flux 1.1
 * Generates industry-relevant background images for ad templates.
 * Falls back gracefully if FAL_KEY is not set.
 */

import * as fal from "@fal-ai/serverless-client";

fal.config({
  credentials: process.env.FAL_KEY || "",
});

type GenerateImageResult = {
  url: string | null;
  error?: string;
};

function buildPrompt(industry: string, description: string, brandName: string): string {
  // Clean, professional advertising photography
  const base = `Professional advertising photography, modern and clean, high quality commercial photo`;

  // Industry-specific context
  const context = industry
    ? `for a ${industry} business called ${brandName}`
    : `for a business called ${brandName}`;

  // Product/service hint from description
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
  // Skip if no API key
  if (!process.env.FAL_KEY) {
    return { url: null, error: "FAL_KEY not configured" };
  }

  const prompt = buildPrompt(params.industry, params.description, params.brandName);

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
      return { url: null, error: "No image returned" };
    }

    return { url: imageUrl };
  } catch (err) {
    console.error("fal.ai image generation failed:", err);
    return { url: null, error: err instanceof Error ? err.message : "Generation failed" };
  }
}
