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
  const context = industry
    ? `for a ${industry} business`
    : `for a business called ${brandName}`;
  return `Clean advertising background image ${context}. ${description ? description.slice(0, 80) + "." : ""} Abstract, atmospheric, premium feel. Soft gradients, bokeh lights, subtle textures. ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO LOGOS, NO WATERMARKS. No people. Just a beautiful abstract background suitable for overlaying text on top. 4K quality, shallow depth of field.`;
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
    const result = await fal.subscribe("fal-ai/flux/dev", {
      input: {
        prompt,
        image_size: "square_hd",
        num_images: 1,
        num_inference_steps: 28,
        guidance_scale: 3.5,
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
