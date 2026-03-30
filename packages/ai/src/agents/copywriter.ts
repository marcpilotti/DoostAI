import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

import { buildCopyKey, buildVariantSetKey, getCachedCopy, getCachedVariantSet, setCachedCopy, setCachedVariantSet } from "../cache";
import { googleSearchCopy, linkedinCopy, metaAdCopy } from "../prompts/ad-copy";
import { createTrace, flushTraces, traceGeneration } from "../tracing";
import type {
  AdCopyResult,
  BrandContext,
  CopyOptions,
  CopyVariant,
  Platform,
} from "../types";
import { CHAR_LIMITS } from "../types";
import {
  META_CTAS,
  PLATFORM_LIMITS,
  isValidMetaCta,
  normaliseMetaCta,
  getRecommendedCtas,
} from "../platform-limits";

// --- Schemas per platform ---

const metaSchema = z.object({
  headline: z.string().max(40),
  bodyCopy: z.string().max(125),
  cta: z.string().max(20),
});

const googleSchema = z.object({
  headlines: z.array(z.string().max(30)).length(3),
  descriptions: z.array(z.string().max(90)).length(2),
});

const linkedinSchema = z.object({
  headline: z.string().max(70),
  bodyCopy: z.string().max(150),
  cta: z.string().max(20),
});

function getPrompt(
  platform: Platform,
  brand: BrandContext,
  options: CopyOptions,
): string {
  switch (platform) {
    case "meta":
      return metaAdCopy(brand, options);
    case "google":
      return googleSearchCopy(brand, options);
    case "linkedin":
      return linkedinCopy(brand, options);
  }
}

function getSchema(platform: Platform) {
  switch (platform) {
    case "meta":
      return metaSchema;
    case "google":
      return googleSchema;
    case "linkedin":
      return linkedinSchema;
  }
}

function validateLimits(
  platform: Platform,
  result: Record<string, unknown>,
): boolean {
  if (platform === "google") {
    const r = result as z.infer<typeof googleSchema>;
    const gl = CHAR_LIMITS.google;
    return (
      r.headlines.every((h) => h.length <= gl.headline) &&
      r.descriptions.every((d) => d.length <= gl.description)
    );
  }
  const r = result as { headline: string; bodyCopy: string; cta: string };
  const ml = CHAR_LIMITS[platform];
  return (
    r.headline.length <= ml.headline &&
    r.bodyCopy.length <= ml.bodyCopy &&
    r.cta.length <= ml.cta
  );
}

/**
 * For Meta ads, validate that the CTA is one of the accepted enum values.
 * Returns true if CTA is valid (or platform is not meta), false otherwise.
 */
function validateMetaCta(
  platform: Platform,
  result: Record<string, unknown>,
): boolean {
  if (platform !== "meta") return true;
  const r = result as { cta: string };
  return isValidMetaCta(r.cta);
}

/**
 * Try to fix a Meta CTA by normalising it. Returns the fixed CTA if possible,
 * or a default fallback ("LEARN_MORE").
 */
function fixMetaCta(
  cta: string,
  objective?: string,
): string {
  const normalised = normaliseMetaCta(cta);
  if (normalised) return normalised;

  // Pick the first recommended CTA for the campaign goal
  if (objective) {
    const recommended = getRecommendedCtas(objective);
    return recommended[0] ?? "LEARN_MORE";
  }

  return "LEARN_MORE";
}

async function generateSingleVariant(
  platform: Platform,
  brand: BrandContext,
  options: CopyOptions,
  variant: CopyVariant,
  useGpt: boolean,
): Promise<AdCopyResult> {
  // TODO: Route to GPT-4o when useGpt=true for speed
  const model = anthropic("claude-opus-4-6");
  const modelName = "claude-opus-4-6";
  const schema = getSchema(platform);
  const prompt = getPrompt(platform, brand, options);

  const trace = createTrace(`copywriter/${platform}/${variant}`, {
    platform,
    variant,
    model: modelName,
  });

  const start = Date.now();
  let result: z.infer<typeof schema>;
  let retried = false;

  // First attempt
  const response = await generateObject({
    model,
    schema,
    prompt,
  });

  result = response.object as z.infer<typeof schema>;

  // Retry with stricter prompt if limits violated
  if (!validateLimits(platform, result as Record<string, unknown>)) {
    retried = true;
    const retryPrompt = `${prompt}\n\nYOUR PREVIOUS RESPONSE EXCEEDED CHARACTER LIMITS. This time, count each character. Be shorter. This is a hard constraint — the ad platform will reject text that is too long.`;

    const retryResponse = await generateObject({
      model,
      schema,
      prompt: retryPrompt,
    });
    result = retryResponse.object as z.infer<typeof schema>;
  }

  // ── CTA validation (Meta only) ──────────────────────────────
  // Meta requires CTA to be one of a fixed set of enum values.
  // First try to normalise, then retry with explicit CTA list if needed.
  if (platform === "meta" && !validateMetaCta(platform, result as Record<string, unknown>)) {
    const r = result as { headline: string; bodyCopy: string; cta: string };
    const fixed = fixMetaCta(r.cta, options.objective);
    // If normalisation succeeded, patch in-place
    if (fixed !== r.cta) {
      (result as { cta: string }).cta = fixed;
    }
    // If still invalid after normalisation, retry with explicit CTA constraint
    if (!isValidMetaCta((result as { cta: string }).cta)) {
      retried = true;
      const ctaList = META_CTAS.join(", ");
      const ctaRetryPrompt = `${prompt}\n\nIMPORTANT: The CTA field MUST be one of these exact values: ${ctaList}\nDo NOT invent a custom CTA string. Pick the best match from this list.`;

      const ctaRetryResponse = await generateObject({
        model,
        schema,
        prompt: ctaRetryPrompt,
      });
      result = ctaRetryResponse.object as z.infer<typeof schema>;

      // Last-resort: force a valid CTA
      if (!isValidMetaCta((result as { cta: string }).cta)) {
        (result as { cta: string }).cta = fixMetaCta(
          (result as { cta: string }).cta,
          options.objective,
        );
      }
    }
  }

  // ── CTA length validation (ALL platforms) ──────────────────────
  // Truncate CTA if it exceeds the platform's character limit.
  // This covers Google and LinkedIn which lack the Meta enum check above.
  const ctaLimit = PLATFORM_LIMITS[platform]?.cta;
  if (ctaLimit && (result as { cta?: string }).cta && (result as { cta: string }).cta.length > ctaLimit) {
    (result as { cta: string }).cta = (result as { cta: string }).cta.slice(0, ctaLimit);
  }

  const latencyMs = Date.now() - start;

  traceGeneration(trace, {
    name: `${platform}-${variant}`,
    model: modelName,
    input: prompt.slice(0, 500),
    output: result,
    latencyMs,
  });

  if (retried) {
    traceGeneration(trace, {
      name: `${platform}-${variant}-retry`,
      model: modelName,
      input: "retry due to character limit violation",
      output: result,
      latencyMs,
    });
  }

  // Map to AdCopyResult
  if (platform === "google") {
    const g = result as z.infer<typeof googleSchema>;
    return {
      headline: g.headlines[0]!,
      bodyCopy: g.descriptions[0]!,
      cta: "Learn More",
      variant,
      platform,
      headlines: g.headlines,
      descriptions: g.descriptions,
    };
  }

  const r = result as { headline: string; bodyCopy: string; cta: string };
  return {
    headline: r.headline,
    bodyCopy: r.bodyCopy,
    cta: r.cta,
    variant,
    platform,
  };
}

export async function generateAdCopy(
  brand: BrandContext & { colors?: { primary?: string } },
  platform: Platform,
  objective: string,
  options: CopyOptions = {},
): Promise<AdCopyResult[]> {
  const numVariants = options.variants ?? 3;
  const opts: CopyOptions = { ...options, objective };
  const skipCache = options.skipCache ?? false;
  const brandProfileId = options.brandProfileId ?? brand.name;
  const primaryColor = brand.colors?.primary;

  const variants: CopyVariant[] = ["hero", "variant_a", "variant_b"].slice(
    0,
    numVariants,
  ) as CopyVariant[];

  // --- Check full variant set cache first (24h TTL) ---
  // This catches "Fler varianter" requests that re-request the same set
  const variantSetKey = buildVariantSetKey(brandProfileId, platform, objective, numVariants, opts.tone, primaryColor);

  if (!skipCache) {
    const cachedSet = await getCachedVariantSet(variantSetKey);
    if (cachedSet && cachedSet.length >= numVariants) {
      const trace = createTrace(`copywriter/${platform}/variantset-cached`, {
        platform,
        cacheHit: true,
        cacheKey: variantSetKey,
        variantCount: cachedSet.length,
      });
      traceGeneration(trace, {
        name: `${platform}-variantset-cached`,
        model: "cache",
        input: variantSetKey,
        output: cachedSet,
        latencyMs: 0,
      });
      await flushTraces();
      return cachedSet;
    }
  }

  const results: AdCopyResult[] = [];

  // --- Hero variant: check individual cache first ---
  const cacheKey = buildCopyKey(brandProfileId, platform, objective, opts.tone, primaryColor);
  let cacheHit = false;

  if (!skipCache) {
    const cached = await getCachedCopy(cacheKey);
    if (cached) {
      cacheHit = true;
      const trace = createTrace(`copywriter/${platform}/hero-cached`, {
        platform,
        cacheHit: true,
        cacheKey,
      });
      traceGeneration(trace, {
        name: `${platform}-hero-cached`,
        model: "cache",
        input: cacheKey,
        output: cached,
        latencyMs: 0,
      });
      results.push(cached);
    }
  }

  // Generate hero if not cached
  if (!cacheHit) {
    const hero = await generateSingleVariant(platform, brand, opts, "hero", false);
    results.push(hero);

    // Cache hero copy (1 hour TTL)
    await setCachedCopy(cacheKey, hero, 3600, brandProfileId);
  }

  // Additional variants: GPT-4o (speed)
  const additional = variants.slice(1);
  if (additional.length > 0) {
    const parallel = await Promise.all(
      additional.map((v) =>
        generateSingleVariant(platform, brand, opts, v, true),
      ),
    );
    results.push(...parallel);
  }

  // Cache the FULL variant set (hero + variant_a + variant_b) with 24h TTL.
  // This is longer than the hero-only 1h cache because variant generation is expensive.
  if (!skipCache) {
    await setCachedVariantSet(variantSetKey, results, 86400, brandProfileId);
  }

  await flushTraces();
  return results;
}
