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

const INDUSTRY_SCENES: Record<string, string> = {
  "Skönhet & Kosmetik": "luxury skincare products on marble surface, serums and creams beautifully arranged",
  "Frisör & Salong": "modern hair salon interior, styling tools, mirrors with warm lighting",
  "Restaurang & Café": "beautifully plated food on rustic table, warm restaurant ambiance",
  "E-handel": "premium product packaging, clean minimalist product display",
  "SaaS & Tech": "modern workspace with sleek technology, clean desk setup with screens",
  "Hälsa & Wellness": "spa environment, natural ingredients, calm zen atmosphere",
  "Fastigheter": "beautiful modern home interior, sunlit living space",
  "Bygg & Renovering": "freshly renovated room, construction craftsmanship, modern tools",
  "Träning & Gym": "modern gym equipment, athletic environment, energetic atmosphere",
  "Mode & Kläder": "fashion items on display, fabric textures, stylish accessories",
  "Fotografi": "professional camera equipment, studio lighting setup",
  "Tandvård": "modern dental clinic, clean bright medical environment",
  "Juridik & Redovisning": "elegant office, leather-bound books, professional desk",
  "Marknadsföring & Reklam": "creative workspace, screens with analytics, modern office",
  "Resor & Turism": "stunning travel destination, scenic landscape, adventure",
  "Inredning & Design": "beautifully designed interior space, designer furniture",
  "Livsmedel & Dagligvaror": "fresh produce display, artisan food arrangement",
  "Finans & Försäkring": "modern financial district, glass buildings, professional",
  "Bilverkstad & Motor": "premium car detail, automotive workshop, polished vehicles",
};

function buildPrompt(industry: string, description: string, brandName: string): string {
  const scene = INDUSTRY_SCENES[industry] || (industry ? `${industry} business environment, relevant products and setting` : "modern business environment");
  return `Professional advertising photograph: ${scene}. ${description ? description.slice(0, 80) + "." : ""} Sharp focus throughout, well-lit, vibrant colors, premium commercial photography. NO TEXT, NO WORDS, NO LETTERS, NO LOGOS, NO WATERMARKS, NO PEOPLE. Clean background suitable for text overlay. 4K resolution.`;
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
