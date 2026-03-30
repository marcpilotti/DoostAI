/**
 * AI Image Generator — Generate custom ad backgrounds using OpenAI's image API.
 *
 * Creates brand-specific visuals based on industry, colors, and style.
 * Results are cached in Upstash Redis for 30 days to minimize cost
 * (DALL-E 3 costs ~$0.04/image at standard quality).
 *
 * Flow:
 *   1. Build a cache key from industry + color + format
 *   2. Check Redis cache (30-day TTL)
 *   3. On cache miss, call OpenAI Images API with a brand-tailored prompt
 *   4. Store the base64 data URL in Redis
 *   5. Return the data URL (or null on any failure — fallback to Unsplash/gradient)
 *
 * All errors are caught and logged — this is a non-critical enhancement.
 * If OPENAI_API_KEY is not set or is a placeholder, returns null immediately.
 */

import { Redis } from "@upstash/redis";

// ── Types ────────────────────────────────────────────────────────

export type GeneratedImage = {
  /** Cache key to fetch the image via /api/brand/ai-image?key=xxx */
  cacheKey: string;
  /** URL to fetch the image (relative to app origin) */
  imageUrl: string;
  /** The prompt that was actually used (may be revised by DALL-E 3) */
  prompt: string;
  /** Always "openai" for this generator */
  source: "openai";
  /** Whether this was served from cache */
  cached: boolean;
};

/**
 * Retrieve a cached AI image from Redis by its cache key.
 * Used by the /api/brand/ai-image route to serve images.
 */
export async function getAiImageFromCache(key: string): Promise<string | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const cached = await redis.get<string>(key);
    return cached ?? null;
  } catch {
    return null;
  }
}

export type GenerateAdBackgroundParams = {
  /** Industry category (e.g. "IT & Tech", "Hotell & Restaurang") */
  industry: string;
  /** Company name (for logging, not used in prompt to avoid text in image) */
  brandName: string;
  /** Primary brand color as hex (e.g. "#6366f1") */
  primaryColor: string;
  /** Optional accent color as hex */
  accentColor?: string;
  /** Visual style: "modern", "classic", "playful", "premium" */
  style?: string;
  /** Aspect ratio format */
  format?: "square" | "story" | "landscape";
};

// ── Constants ────────────────────────────────────────────────────

/** Cache TTL: 30 days — images are expensive, cache aggressively */
const AI_IMAGE_CACHE_TTL_SECONDS = 30 * 24 * 60 * 60;

const CACHE_KEY_PREFIX = "ai-img:";

const OPENAI_IMAGES_API = "https://api.openai.com/v1/images/generations";

/** Timeout for OpenAI image generation — DALL-E 3 can take 15-25s */
const GENERATION_TIMEOUT_MS = 60_000;

// ── Redis singleton (lazy, tolerates missing env vars) ───────────

let _redis: Redis | null = null;
let _redisChecked = false;

function getRedis(): Redis | null {
  if (_redisChecked) return _redis;
  _redisChecked = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token || url.includes("...")) return null;

  _redis = new Redis({ url, token });
  return _redis;
}

// ── Helpers ──────────────────────────────────────────────────────

function getOpenAIApiKey(): string | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === "..." || key.startsWith("sk-proj-placeholder") || key.startsWith("your_")) {
    return null;
  }
  return key;
}

/**
 * Build a stable cache key from the parameters that affect the image.
 * Normalize color to lowercase, strip # prefix for cleanliness.
 */
function toCacheKey(industry: string, primaryColor: string, format: string): string {
  const normIndustry = industry
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9åäö]+/gi, "-");
  const normColor = primaryColor.toLowerCase().replace("#", "");
  return `${CACHE_KEY_PREFIX}${normIndustry}:${normColor}:${format}`;
}

/**
 * Map industry categories to mood/atmosphere descriptions for the prompt.
 * These guide the visual feel without including any text.
 */
function getIndustryMood(industry: string): string {
  const moods: Record<string, string> = {
    "IT & Tech": "innovation, technology, digital connectivity",
    "E-handel": "shopping, packages, modern retail experience",
    "Hotell & Restaurang": "warmth, hospitality, culinary excellence",
    "Bygg & Fastigheter": "solid architecture, modern buildings, urban design",
    "Hälsa & Sjukvård": "wellness, care, clean medical environment",
    "Finans & Försäkring": "trust, stability, growth, professional environment",
    "Mode & Skönhet": "elegance, style, beauty, fashion forward",
    "Träning & Fritid": "energy, movement, vitality, outdoor fresh air",
    "Utbildning": "knowledge, growth, bright future, learning",
    "Fordon & Transport": "speed, reliability, journey, open road",
    "Konsult & Rådgivning": "expertise, collaboration, strategic thinking",
    "Tillverkning & Industri": "precision, craftsmanship, industrial strength",
    "Juridik & Redovisning": "authority, trust, structured professionalism",
    "Livsmedel & Dagligvaror": "freshness, quality, everyday convenience",
    "Marknadsföring & Media": "creativity, impact, visual storytelling",
    "Rekrytering & Bemanning": "people, connection, career growth",
    "Energi & Miljö": "sustainability, nature, clean energy, green future",
    "Kultur & Nöje": "entertainment, excitement, cultural richness",
    "SaaS & Molntjänster": "cloud, scalability, sleek dashboard interfaces",
    "Detaljhandel": "storefront, shopping experience, product display",
    "Flyg & Resebolag": "travel, adventure, open skies, destinations",
  };
  return moods[industry] ?? "professionalism, quality, trust";
}

/**
 * Map format to DALL-E 3 size parameter.
 * DALL-E 3 supports: 1024x1024, 1024x1792, 1792x1024
 */
function formatToSize(format: "square" | "story" | "landscape"): string {
  const sizeMap: Record<string, string> = {
    square: "1024x1024",
    story: "1024x1792",
    landscape: "1792x1024",
  };
  return sizeMap[format] ?? "1024x1024";
}

/**
 * Build the image generation prompt.
 * Carefully crafted to produce abstract, atmospheric backgrounds
 * with NO text, logos, or watermarks — suitable for text overlay.
 */
function buildPrompt(params: {
  industry: string;
  primaryColor: string;
  accentColor?: string;
  style: string;
}): string {
  const { industry, primaryColor, accentColor, style } = params;
  const mood = getIndustryMood(industry);

  return [
    `Professional advertisement background for a ${industry} company.`,
    `Color palette: ${primaryColor}${accentColor ? ` and ${accentColor}` : ""}.`,
    `Style: ${style}, clean, commercial quality.`,
    `Requirements: Abstract and atmospheric, suitable as background for text overlay.`,
    `DO NOT include any text, words, letters, numbers, logos, or watermarks.`,
    `The image should evoke ${mood}.`,
    `High quality, photorealistic, studio lighting.`,
  ].join("\n");
}

// ── Main export ──────────────────────────────────────────────────

/**
 * Generate an AI background image for an ad using OpenAI DALL-E 3.
 *
 * Returns a GeneratedImage with a base64 data URL, or null if:
 *   - OPENAI_API_KEY is not configured
 *   - The API call fails or times out
 *   - The response doesn't contain valid image data
 *
 * Cached in Redis for 30 days per industry+color+format combo.
 */
export async function generateAdBackground(
  params: GenerateAdBackgroundParams,
): Promise<GeneratedImage | null> {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    console.log("[AI Image] No OPENAI_API_KEY configured, skipping");
    return null;
  }

  const {
    industry,
    brandName,
    primaryColor,
    accentColor,
    style = "modern",
    format = "square",
  } = params;

  if (!industry || !primaryColor) {
    console.warn("[AI Image] Missing industry or primaryColor, skipping");
    return null;
  }

  const cacheKey = toCacheKey(industry, primaryColor, format);
  const redis = getRedis();

  // ── 1. Check Redis cache ────────────────────────────────────
  if (redis) {
    try {
      const cached = await redis.get<string>(cacheKey);
      if (cached) {
        console.log(`[AI Image] Cache HIT for "${industry}" (${primaryColor}, ${format})`);
        return {
          cacheKey,
          imageUrl: `/api/brand/ai-image?key=${encodeURIComponent(cacheKey)}`,
          prompt: "(cached)",
          source: "openai",
          cached: true,
        };
      }
    } catch (err) {
      console.warn(
        "[AI Image] Redis read error:",
        err instanceof Error ? err.message : err,
      );
      // Continue to API call
    }
  }

  console.log(
    `[AI Image] Cache MISS — generating for "${brandName}" (${industry}, ${primaryColor}, ${format})`,
  );

  // ── 2. Build prompt ─────────────────────────────────────────
  const prompt = buildPrompt({ industry, primaryColor, accentColor, style });

  // ── 3. Call OpenAI Images API (with 1 retry) ──────────────
  try {
    // Try generation with 1 retry
    let response: Response | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        response = await fetch(OPENAI_IMAGES_API, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt,
            n: 1,
            size: formatToSize(format),
            quality: "standard", // $0.04/image — "hd" is $0.08
            response_format: "b64_json",
          }),
          signal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
        });
        if (response.ok) break;
        console.warn(`[AI Image] Attempt ${attempt + 1} failed: ${response.status}`);
      } catch (err) {
        const isTimeout =
          (err instanceof DOMException && err.name === "AbortError") ||
          (err instanceof Error && err.name === "TimeoutError");
        console.warn(
          `[AI Image] Attempt ${attempt + 1} ${isTimeout ? "timed out" : "error"}: ${err instanceof Error ? err.message : err}`,
        );
        response = null;
      }
      if (attempt === 0) await new Promise(r => setTimeout(r, 3000));
    }
    if (!response?.ok) return null;

    const data = (await response.json()) as {
      data: Array<{ b64_json?: string; url?: string; revised_prompt?: string }>;
    };

    const imageData = data.data[0];
    if (!imageData?.b64_json) {
      console.warn("[AI Image] No b64_json in OpenAI response");
      return null;
    }

    const dataUrl = `data:image/png;base64,${imageData.b64_json}`;
    const usedPrompt = imageData.revised_prompt ?? prompt;

    console.log(
      `[AI Image] Generated for "${brandName}" (${industry}), ` +
        `data URL length: ${dataUrl.length} chars`,
    );

    // ── 4. Cache in Redis ───────────────────────────────────────
    if (redis) {
      try {
        await redis.setex(cacheKey, AI_IMAGE_CACHE_TTL_SECONDS, dataUrl);
        console.log(
          `[AI Image] Cached "${cacheKey}" (TTL ${AI_IMAGE_CACHE_TTL_SECONDS}s / 30 days)`,
        );
      } catch (err) {
        console.warn(
          "[AI Image] Redis write error:",
          err instanceof Error ? err.message : err,
        );
        // Non-fatal — we still have the data URL
      }
    }

    // ── 5. Return result (reference, not the actual image data) ─
    return {
      cacheKey,
      imageUrl: `/api/brand/ai-image?key=${encodeURIComponent(cacheKey)}`,
      prompt: usedPrompt,
      source: "openai",
      cached: false,
    };
  } catch (err) {
    console.warn(
      "[AI Image] Generation failed:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

/**
 * Invalidate the cache for a specific industry+color+format combo.
 * Useful for admin tools or if a user reports a bad image.
 */
export async function invalidateAiImageCache(
  industry: string,
  primaryColor: string,
  format: "square" | "story" | "landscape" = "square",
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  const cacheKey = toCacheKey(industry, primaryColor, format);
  try {
    await redis.del(cacheKey);
    console.log(`[AI Image] Cache invalidated: "${cacheKey}"`);
    return true;
  } catch (err) {
    console.warn(
      "[AI Image] Cache invalidation failed:",
      err instanceof Error ? err.message : err,
    );
    return false;
  }
}
