"use server";

/**
 * Server Action: Generate a complete ad image with embedded text.
 *
 * Flow:
 * 1. Classify industry + mood from ad copy (cached per ad ID)
 * 2. Call the ad-image-pipeline (GPT-4o → verify → retry → Satori fallback)
 * 3. Return image URL
 *
 * Never exposes API keys to client.
 */

import type { AdData, AdFormat } from "@/components/ads/ad-preview/types";
import { type AdImageInput, generateCompleteAdImage } from "@/lib/ads/ad-image-pipeline";

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

// ── Step 1: Classify industry from ad copy ───────────────────────

async function classifyIndustry(
  adId: string,
  headline: string,
  primaryText: string,
): Promise<IndustryClassification> {
  const cached = classificationCache.get(adId);
  if (cached) return cached;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { industry: "business", mood: "professional", keywords: ["modern", "clean", "corporate"] };
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
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]) as IndustryClassification;
    const result: IndustryClassification = {
      industry: parsed.industry ?? "business",
      mood: parsed.mood ?? "professional",
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 5) : ["modern", "clean"],
    };

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

// ── Main export ──────────────────────────────────────────────────

export async function generateAdImage(
  adData: Pick<AdData, "id" | "headline" | "primaryText" | "brandName"> & {
    brandColor?: string;
    brandAccent?: string;
    logoUrl?: string | null;
  },
  format: AdFormat,
): Promise<GenerateResult> {
  if (format === "google-search") return null;

  // Classify industry from ad copy
  const classification = await classifyIndustry(
    adData.id,
    adData.headline,
    adData.primaryText,
  );

  // Build pipeline input
  const input: AdImageInput = {
    brandName: adData.brandName,
    brandColor: adData.brandColor ?? "#6366f1",
    brandAccent: adData.brandAccent,
    logoUrl: adData.logoUrl,
    industry: classification.industry,
    headline: adData.headline,
    bodyCopy: adData.primaryText,
    cta: "Läs mer",
    format,
    visualKeywords: classification.keywords,
  };

  const result = await generateCompleteAdImage(input);

  if (result) {
    console.log(`[generateAdImage] Success: ${adData.brandName} (${format}) via ${result.method}, ${result.attempts} attempt(s)`);
    return { imageUrl: result.imageUrl, prompt: result.prompt };
  }

  return null;
}
