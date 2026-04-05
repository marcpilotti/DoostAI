/**
 * Ad Image Pipeline — GPT-4o background generation via gpt-image-1.
 *
 * Generates clean background images with NO TEXT. All text is rendered
 * by the frontend CSS overlay.
 *
 * Flow: GPT-4o (8-12s, quality "low") → SVG gradient fallback (instant)
 * Both variants run in parallel via generateAdImagePair.
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
  headline: string;
  bodyCopy: string;
  cta: string;
  format: AdFormat;
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

// ── Industry → scene matching (fuzzy keyword-based) ──────────────

const SCENE_RULES: Array<{ keywords: string[]; scene: string }> = [
  { keywords: ["måleri", "målare", "måla", "painter", "painting company"],
    scene: "freshly painted bright room, paint rollers and brushes, color swatches on wall, professional painting work" },
  { keywords: ["bygg", "renovering", "construction", "snickare", "carpentry", "entreprenad"],
    scene: "freshly renovated room, modern construction craftsmanship, quality materials" },
  { keywords: ["restaurang", "café", "cafe", "restaurant", "mat", "food", "kök", "kitchen", "bageri", "bakery"],
    scene: "beautifully plated food on wooden table, warm restaurant ambiance, inviting dining" },
  { keywords: ["frisör", "salong", "salon", "hår", "hair", "barber"],
    scene: "modern hair salon interior, styling tools and mirrors, warm ambient lighting" },
  { keywords: ["skönhet", "kosmetik", "beauty", "hudvård", "skincare", "spa"],
    scene: "luxury skincare products on marble surface, serums and creams, soft golden lighting" },
  { keywords: ["hälsa", "wellness", "terapi", "therapy", "massage"],
    scene: "spa environment, natural ingredients, calm zen atmosphere, warm tones" },
  { keywords: ["e-handel", "webshop", "ecommerce", "butik", "shop", "retail"],
    scene: "premium product packaging, minimalist display, clean studio lighting" },
  { keywords: ["saas", "tech", "it", "software", "digital", "app", "startup"],
    scene: "sleek modern workspace, laptop and coffee on clean desk, natural light" },
  { keywords: ["fastighet", "mäklare", "real estate", "bostad", "hem", "house"],
    scene: "modern home interior, sunlit living space, beautiful architectural detail" },
  { keywords: ["träning", "gym", "fitness", "sport", "idrott"],
    scene: "modern gym equipment, energetic atmosphere, dynamic lighting" },
  { keywords: ["mode", "kläder", "fashion", "clothing", "textil"],
    scene: "fashion items on display, fabric textures, editorial studio lighting" },
  { keywords: ["foto", "photograph", "video", "media", "film"],
    scene: "professional camera equipment, studio lighting setup, creative workspace" },
  { keywords: ["tand", "dental", "tandläkare"],
    scene: "modern dental clinic, clean bright medical environment" },
  { keywords: ["juridik", "advokat", "lawyer", "legal", "redovisning", "accounting", "revision"],
    scene: "elegant professional office, leather-bound books, warm desk lighting" },
  { keywords: ["marknadsfö", "reklam", "marketing", "advertising", "kommunikation", "pr"],
    scene: "creative workspace with large screens showing data, modern agency office" },
  { keywords: ["resa", "resor", "turism", "travel", "tourism", "hotell", "hotel"],
    scene: "stunning travel destination, scenic landscape, golden hour lighting" },
  { keywords: ["inredning", "design", "interior", "möbel", "furniture"],
    scene: "beautifully designed interior space, designer furniture, styled room" },
  { keywords: ["livsmedel", "dagligvaror", "grocery", "food production"],
    scene: "fresh produce display, artisan food arrangement, warm natural tones" },
  { keywords: ["finans", "försäkring", "bank", "insurance", "finance", "invest"],
    scene: "modern financial office, glass and steel, professional corporate setting" },
  { keywords: ["bil", "motor", "fordon", "vehicle", "auto", "verkstad", "garage"],
    scene: "premium car detail shot, clean automotive workshop, polished surfaces" },
  { keywords: ["el", "elektriker", "electrician", "installation"],
    scene: "modern electrical installation, clean wiring, professional tools on workbench" },
  { keywords: ["vvs", "plumber", "rör", "vatten", "heating"],
    scene: "modern bathroom renovation, sleek plumbing fixtures, clean tile work" },
  { keywords: ["trädgård", "garden", "landscap", "grön", "plantering"],
    scene: "beautiful landscaped garden, lush green plants, professional garden design" },
  { keywords: ["städ", "cleaning", "rengöring", "facility"],
    scene: "spotlessly clean modern office space, gleaming surfaces, bright lighting" },
  { keywords: ["transport", "logistik", "logistics", "frakt", "shipping", "flytt", "moving"],
    scene: "organized warehouse, delivery fleet, professional logistics operation" },
  { keywords: ["konsult", "consult", "rådgivning", "advisory"],
    scene: "modern meeting room, glass walls, collaborative professional environment" },
  { keywords: ["utbildning", "education", "skola", "school", "kurs", "course"],
    scene: "bright modern learning space, books and laptops, inspiring educational environment" },
  { keywords: ["veterinär", "djur", "animal", "pet"],
    scene: "modern veterinary clinic, caring professional environment, warm lighting" },
];

function findScene(industry: string): string {
  if (!industry) return "modern business environment, professional commercial setting";
  const lower = industry.toLowerCase();
  for (const rule of SCENE_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) return rule.scene;
  }
  return `${industry} business environment, professional commercial setting, premium workspace`;
}

// ── Prompt builder ───────────────────────────────────────────────

function buildPrompt(input: AdImageInput): string {
  const scene = findScene(input.industry);
  return `Professional advertising photograph. ${scene}. Dominant color: ${input.brandColor}. Sharp focus, premium commercial photography, cinematic lighting. Clean background for text overlay. No text, no logos, no people.`;
}

// ── Core pipeline ────────────────────────────────────────────────

export async function generateCompleteAdImage(
  input: AdImageInput,
): Promise<AdImageResult | null> {
  if (input.format === "google-search") return null;

  const prompt = buildPrompt(input);
  const size = FORMAT_SIZES[input.format] ?? "1024x1024";

  // GPT-4o via gpt-image-1 (quality "low" for speed, ~8-12s)
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && !apiKey.startsWith("sk-proj-placeholder")) {
    try {
      console.log(`[ad-pipeline] GPT-4o for ${input.brandName} (${input.industry})`);
      const generated = await Promise.race([
        generateEmbeddedAdImage({ prompt, size, quality: "low" }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("GPT-4o timed out")), 15_000),
        ),
      ]);
      console.log(`[ad-pipeline] GPT-4o done for ${input.brandName}`);
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
