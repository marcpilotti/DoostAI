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

// ── Industry visual direction ────────────────────────────────────
// Maps industry to specific visual subjects — prevents GPT from
// defaulting to generic portrait photography for every brand.

const INDUSTRY_VISUALS: Record<string, string> = {
  "Skönhet & Kosmetik": "Show luxury skincare products, bottles, serums, creams arranged beautifully on a marble or glass surface. Close-up product photography with soft reflections. NO people, NO faces, NO models.",
  "Mode & Skönhet": "Show luxury skincare products, bottles, serums arranged on an elegant surface. Close-up product photography. NO people, NO faces, NO models.",
  "IT & Tech": "Show a sleek workspace with modern devices, clean desk setup, subtle code on a screen, or abstract tech visualization. NO people.",
  "SaaS": "Show a clean modern workspace with laptop displaying a beautiful dashboard UI, or abstract data visualization with glowing nodes. NO people.",
  "SaaS & Molntjänster": "Show a clean modern workspace with laptop displaying a beautiful dashboard, or abstract cloud/data visualization. NO people.",
  "E-handel": "Show beautifully arranged product packaging, unboxing experience, or curated product flat-lay. NO people.",
  "Hotell & Restaurang": "Show a beautifully plated dish with steam, warm restaurant interior with candles, or an inviting hotel lobby. NO people.",
  "Bygg & Fastigheter": "Show stunning modern architecture, a sleek building facade at golden hour, or a premium interior design space. NO people.",
  "Hälsa & Sjukvård": "Show a clean, bright wellness environment — fresh herbs, medical devices in a modern setting, or a serene spa-like clinical space. NO people.",
  "Finans & Försäkring": "Show a premium office environment, abstract growth charts rendered in 3D, or a city skyline at golden hour. NO people.",
  "Träning & Fritid": "Show premium gym equipment, running shoes on a track, or an outdoor trail at sunrise. NO people.",
  "Utbildning": "Show an inspiring library, open books with warm lighting, or a modern classroom/campus. NO people.",
  "Fordon & Transport": "Show a sleek car on an open road, or a vehicle detail shot with dramatic lighting. NO people.",
  "Konsult & Rådgivning": "Show a premium conference room, whiteboard with strategy diagrams, or a modern glass office. NO people.",
  "Tillverkning & Industri": "Show precision machinery, a clean factory floor, or raw materials being crafted. NO people.",
  "Juridik & Redovisning": "Show law books, a gavel, or a prestigious office with dark wood and leather. NO people.",
  "Livsmedel & Dagligvaror": "Show fresh produce, beautifully arranged groceries, or artisan food products. NO people.",
  "Marknadsföring & Media": "Show a creative workspace with mood boards, color palettes, and design tools. NO people.",
  "Rekrytering & Bemanning": "Show a modern open-plan office space, or abstract connected nodes representing a network. NO people.",
  "Energi & Miljö": "Show wind turbines at sunset, solar panels in a green field, or a pristine natural landscape. NO people.",
  "Kultur & Nöje": "Show a dramatic stage with spotlights, a concert venue, or vibrant abstract art. NO people.",
  "Detaljhandel": "Show a beautiful storefront window display, or curated products on shelves with warm lighting. NO people.",
  "Flyg & Resebolag": "Show an airplane wing above clouds at sunset, or a stunning travel destination landscape. NO people.",
  "Elektronik & Imaging": "Show premium camera equipment, lenses on a dark surface with dramatic lighting, or tech product flat-lay. NO people.",
};

function getVisualDirection(industry: string): string {
  // Try exact match first, then partial match
  if (INDUSTRY_VISUALS[industry]) return INDUSTRY_VISUALS[industry];
  const lower = industry.toLowerCase();
  for (const [key, value] of Object.entries(INDUSTRY_VISUALS)) {
    const keyWord = key.toLowerCase().split(" ")[0] ?? "";
    const lowerWord = lower.split(" ")[0] ?? "";
    if (keyWord && lower.includes(keyWord) || lowerWord && key.toLowerCase().includes(lowerWord)) {
      return value;
    }
  }
  return "Show the products, workspace, or environment that represents this industry. Focus on objects and settings, NOT people. NO faces, NO models.";
}

// ── Prompt builder — uses real profile data ──────────────────────

function buildPrompt(input: AdImageInput): string {
  const industryVisual = getVisualDirection(input.industry);

  const parts: string[] = [
    `Create a stunning, scroll-stopping advertisement background image for "${input.brandName}".`,
  ];

  // Company context — this is the MOST important signal
  if (input.description) {
    parts.push(`About the brand: ${input.description}.`);
    // Use the description to guide the visual — it's more specific than the industry category
    parts.push(`VISUAL SUBJECT: Based on what this company does, show the tools, products, materials, or environment directly related to their work. For example, if they are painters — show paint brushes, paint cans, a freshly painted wall. If they sell coffee — show coffee beans, a latte, a cozy café. The image MUST visually represent what this specific company does, not just a generic industry photo.`);
    parts.push(`Additional industry reference: ${industryVisual}`);
  } else {
    // Fallback to industry-only visual direction
    if (input.industry) {
      parts.push(`Industry: ${input.industry}.`);
    }
    parts.push(`VISUAL SUBJECT: ${industryVisual}`);
  }

  // Color palette
  parts.push(`Brand colors: primary ${input.brandColor}${input.brandAccent && input.brandAccent !== input.brandColor ? `, accent ${input.brandAccent}` : ""}. Use these colors as inspiration for the overall color grading and mood.`);

  // Creative direction
  parts.push(
    "Style: Award-winning advertising campaign photography. Cinematic lighting, rich textures, dramatic depth of field.",
    "The image must feel premium and aspirational — like an Apple or Aesop ad.",
    "Leave the bottom 30% slightly darker or with negative space for text overlay.",
    "CRITICAL: Do NOT include any people, faces, hands, or human body parts in the image.",
    "Do NOT include any text, words, letters, numbers, logos, or watermarks.",
  );

  return parts.join("\n");
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
          setTimeout(() => reject(new Error("GPT-4o timed out")), 45_000),
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
