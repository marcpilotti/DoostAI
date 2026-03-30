"use server";

/**
 * Server Action: Generate AI background image for ad preview.
 *
 * Flow:
 * 1. Classify industry + mood from ad copy (cached per ad ID)
 * 2. Build format-specific image prompt
 * 3. Call gpt-image-1 → return image URL
 *
 * Never exposes OPENAI_API_KEY to client.
 */

import type { AdData, AdFormat } from "@/components/ads/ad-preview/types";

// ── Types ────────────────────────────────────────────────────────

type IndustryClassification = {
  industry: string;
  mood: string;
  keywords: string[];
};

type GenerateResult = {
  imageUrl: string;
  prompt: string;
} | null;

// ── In-memory cache for industry classification ──────────────────

const classificationCache = new Map<string, IndustryClassification>();

// ── Format-specific composition hints ────────────────────────────

const FORMAT_CONFIG: Record<string, { size: string; composition: string }> = {
  "meta-feed": { size: "1024x1024", composition: "square, centered subject" },
  "meta-stories": { size: "1024x1792", composition: "vertical, subject in upper third" },
  "google-search": { size: "1024x1024", composition: "square" }, // Not used, but defined
  "linkedin": { size: "1792x1024", composition: "horizontal, professional setting" },
};

// ── Step 1: Classify industry from ad copy ───────────────────────

async function classifyIndustry(
  adId: string,
  headline: string,
  primaryText: string,
): Promise<IndustryClassification> {
  // Check cache first
  const cached = classificationCache.get(adId);
  if (cached) return cached;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Fallback classification
    const fallback: IndustryClassification = {
      industry: "business",
      mood: "professional",
      keywords: ["modern", "clean", "corporate"],
    };
    return fallback;
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "content-type": "application/json",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: `Given this ad copy, return a JSON object with industry, mood, and keywords.

Headline: "${headline}"
Primary text: "${primaryText}"

Return ONLY valid JSON with:
- industry: string (e.g. "restaurant", "real estate", "fitness", "retail fashion", "tech saas", "automotive", "healthcare", "beauty", "legal services", "fintech")
- mood: string (e.g. "professional", "warm", "energetic", "luxurious", "minimal", "playful", "trustworthy")
- keywords: string[] (3-5 visual keywords for a background image, e.g. ["sleek office", "laptop", "growth charts"])

Return only valid JSON, no other text.`,
          },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API: ${response.status}`);
    }

    const data = await response.json() as {
      content: Array<{ type: string; text?: string }>;
    };

    const text = data.content.find((c) => c.type === "text")?.text ?? "";
    // Extract JSON from response (might have markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]) as IndustryClassification;
    const result: IndustryClassification = {
      industry: parsed.industry ?? "business",
      mood: parsed.mood ?? "professional",
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 5) : ["modern", "clean"],
    };

    // Cache it
    if (classificationCache.size > 200) {
      const oldest = classificationCache.keys().next().value;
      if (oldest) classificationCache.delete(oldest);
    }
    classificationCache.set(adId, result);

    return result;
  } catch (err) {
    console.warn("[generateAdImage] Classification failed:", err instanceof Error ? err.message : err);
    return { industry: "business", mood: "professional", keywords: ["modern", "clean", "corporate"] };
  }
}

// ── Step 2: Build image prompt ───────────────────────────────────

function buildImagePrompt(
  classification: IndustryClassification,
  format: AdFormat,
): string {
  const config = FORMAT_CONFIG[format] ?? FORMAT_CONFIG["meta-feed"]!;

  const prompt = [
    `${classification.industry} business, ${classification.mood} atmosphere,`,
    `${classification.keywords.join(", ")},`,
    `${config.composition},`,
    `cinematic lighting, ultra-sharp commercial photography,`,
    `editorial quality, 8K resolution,`,
    `no text, no logos, no watermarks, no people unless explicitly needed,`,
    `photorealistic, award-winning advertising photography`,
  ].join("\n");

  if (process.env.NODE_ENV === "development") {
    console.log("[generateAdImage] Prompt:", prompt);
  }

  return prompt;
}

// ── Step 3: Call gpt-image-1 ─────────────────────────────────────

async function callImageApi(
  prompt: string,
  format: AdFormat,
  retryCount = 0,
): Promise<GenerateResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.startsWith("sk-proj-placeholder")) {
    console.error("[generateAdImage] OPENAI_API_KEY not configured");
    return null;
  }

  const config = FORMAT_CONFIG[format] ?? FORMAT_CONFIG["meta-feed"]!;

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        size: config.size,
        quality: "low",
        n: 1,
        output_format: "jpeg",
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      const status = response.status;

      // Handle specific error types
      if (status === 401) {
        console.error("[generateAdImage] Invalid API key");
        return null;
      }
      if (status === 400 && errorBody.includes("content_policy")) {
        // Content policy violation — retry with milder prompt
        if (retryCount < 3) {
          console.warn(`[generateAdImage] Content policy violation, retry ${retryCount + 1}/3`);
          const milderPrompt = prompt.replace(/, [^,]+$/, "") + ", clean and minimal";
          return callImageApi(milderPrompt, format, retryCount + 1);
        }
        console.error("[generateAdImage] Content policy: max retries exceeded");
        return null;
      }
      if (status === 429) {
        console.warn("[generateAdImage] Rate limited");
        return null;
      }

      console.error(`[generateAdImage] API error ${status}:`, errorBody.slice(0, 200));
      return null;
    }

    const data = await response.json() as {
      data: Array<{ b64_json?: string }>;
    };

    const b64 = data.data[0]?.b64_json;
    if (!b64) {
      console.error("[generateAdImage] No b64_json in response");
      return null;
    }

    // Store in memory cache for the API route to serve
    const cacheKey = `ad-img:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    const dataUrl = `data:image/jpeg;base64,${b64}`;
    imageMemoryCache.set(cacheKey, { dataUrl, expires: Date.now() + 2 * 60 * 60 * 1000 });

    // Cleanup old entries
    if (imageMemoryCache.size > 50) {
      const now = Date.now();
      for (const [k, v] of imageMemoryCache) {
        if (v.expires < now) imageMemoryCache.delete(k);
      }
    }

    const imageUrl = `/api/brand/ai-image?key=${encodeURIComponent(cacheKey)}`;

    return { imageUrl, prompt };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      console.error("[generateAdImage] Timeout after 45s");
    } else {
      console.error("[generateAdImage] Failed:", err instanceof Error ? err.message : err);
    }
    return null;
  }
}

// ── Image memory cache (shared with /api/brand/ai-image route) ───

export const imageMemoryCache = new Map<string, { dataUrl: string; expires: number }>();

export function getImageFromCache(key: string): string | null {
  const entry = imageMemoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    imageMemoryCache.delete(key);
    return null;
  }
  return entry.dataUrl;
}

// ── Main export ──────────────────────────────────────────────────

export async function generateAdImage(
  adData: Pick<AdData, "id" | "headline" | "primaryText" | "brandName">,
  format: AdFormat,
): Promise<GenerateResult> {
  if (format === "google-search") {
    // Google Search has no background image
    return null;
  }

  // Step 1: Classify
  const classification = await classifyIndustry(
    adData.id,
    adData.headline,
    adData.primaryText,
  );

  // Step 2: Build prompt
  const prompt = buildImagePrompt(classification, format);

  // Step 3: Generate
  const result = await callImageApi(prompt, format);

  if (result) {
    console.log(`[generateAdImage] Success: ${adData.brandName} (${format})`);
  }

  return result;
}
