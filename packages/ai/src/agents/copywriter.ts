import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

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
  const limits = CHAR_LIMITS[platform];
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

async function generateSingleVariant(
  platform: Platform,
  brand: BrandContext,
  options: CopyOptions,
  variant: CopyVariant,
  useGpt: boolean,
): Promise<AdCopyResult> {
  const model = useGpt
    ? openai("gpt-4o")
    : anthropic("claude-sonnet-4-20250514");
  const modelName = useGpt ? "gpt-4o" : "claude-sonnet-4-20250514";
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
  brand: BrandContext,
  platform: Platform,
  objective: string,
  options: CopyOptions = {},
): Promise<AdCopyResult[]> {
  const numVariants = options.variants ?? 3;
  const opts: CopyOptions = { ...options, objective };

  const variants: CopyVariant[] = ["hero", "variant_a", "variant_b"].slice(
    0,
    numVariants,
  ) as CopyVariant[];

  const results: AdCopyResult[] = [];

  // Hero variant: Claude Sonnet (quality)
  results.push(
    await generateSingleVariant(platform, brand, opts, "hero", false),
  );

  // Additional variants: GPT-4o (speed) — run in parallel
  const additional = variants.slice(1);
  if (additional.length > 0) {
    const parallel = await Promise.all(
      additional.map((v) =>
        generateSingleVariant(platform, brand, opts, v, true),
      ),
    );
    results.push(...parallel);
  }

  await flushTraces();
  return results;
}
