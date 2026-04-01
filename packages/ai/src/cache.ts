import { createHash } from "crypto";

import { Redis } from "@upstash/redis";

import type { AdCopyResult } from "./types";
import type { AdStrategySet } from "./agents/ad-strategist";

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (_redis) return _redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token || url.includes("...")) return null;

  _redis = new Redis({ url, token });
  return _redis;
}

/**
 * Build a deterministic cache key from copy generation parameters.
 * Includes an optional color fingerprint so that two brands with the same
 * name but different palettes (or industries) never collide.
 * Format: `copy:${sha256(normalized_params).slice(0, 16)}`
 */
export function buildCopyKey(
  brandProfileId: string,
  platform: string,
  objective: string,
  tone?: string,
  colors?: string,
): string {
  const colorSuffix = colors ? `:${colors.slice(0, 7)}` : "";
  const parts = [
    brandProfileId.trim().toLowerCase(),
    platform.trim().toLowerCase(),
    objective.trim().toLowerCase(),
    (tone ?? "default").trim().toLowerCase(),
    colorSuffix,
  ].join("|");

  const hash = createHash("sha256").update(parts).digest("hex").slice(0, 16);
  return `copy:${hash}`;
}

/**
 * Build a cache key for a full variant set (hero + variant_a + variant_b).
 * Includes variant count so requesting more variants gets a fresh generation.
 * Includes an optional color fingerprint to prevent cross-brand collisions.
 * Format: `copyset:${sha256(normalized_params).slice(0, 16)}`
 */
export function buildVariantSetKey(
  brandProfileId: string,
  platform: string,
  objective: string,
  variantCount: number,
  tone?: string,
  colors?: string,
): string {
  const colorSuffix = colors ? `:${colors.slice(0, 7)}` : "";
  const parts = [
    brandProfileId.trim().toLowerCase(),
    platform.trim().toLowerCase(),
    objective.trim().toLowerCase(),
    (tone ?? "default").trim().toLowerCase(),
    `variants:${variantCount}`,
    colorSuffix,
  ].join("|");

  const hash = createHash("sha256").update(parts).digest("hex").slice(0, 16);
  return `copyset:${hash}`;
}

/**
 * Build a wildcard-compatible prefix for a brand profile's copy keys.
 * Used for bulk invalidation when brand profile is updated.
 */
export function buildBrandCopyPrefix(brandProfileId: string): string {
  // We can't scan by hash, so we store a set of keys per brand
  return `copy-brand:${brandProfileId}`;
}

/**
 * Get cached hero copy result.
 * Returns null on cache miss or Redis unavailable.
 */
export async function getCachedCopy(
  cacheKey: string,
): Promise<AdCopyResult | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const cached = await redis.get<AdCopyResult>(cacheKey);
    return cached ?? null;
  } catch {
    return null;
  }
}

/**
 * Store hero copy in cache with TTL.
 * Also tracks the key in a brand-specific set for bulk invalidation.
 */
export async function setCachedCopy(
  cacheKey: string,
  result: AdCopyResult,
  ttlSeconds: number,
  brandProfileId?: string,
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.setex(cacheKey, ttlSeconds, result);

    // Track this key under the brand for bulk invalidation
    if (brandProfileId) {
      const setKey = buildBrandCopyPrefix(brandProfileId);
      await redis.sadd(setKey, cacheKey);
      await redis.expire(setKey, ttlSeconds + 3600); // slightly longer TTL
    }
  } catch (err) {
    console.warn("[cache] Write failure:", err instanceof Error ? err.message : err);
  }
}

/**
 * Get cached full variant set (hero + variant_a + variant_b).
 * Returns null on cache miss or Redis unavailable.
 */
export async function getCachedVariantSet(
  cacheKey: string,
): Promise<AdCopyResult[] | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const cached = await redis.get<AdCopyResult[]>(cacheKey);
    return cached ?? null;
  } catch {
    return null;
  }
}

/**
 * Store a full variant set in cache with TTL (24h default — variants are expensive).
 * Also tracks the key in a brand-specific set for bulk invalidation.
 */
export async function setCachedVariantSet(
  cacheKey: string,
  results: AdCopyResult[],
  ttlSeconds: number,
  brandProfileId?: string,
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.setex(cacheKey, ttlSeconds, results);

    // Track this key under the brand for bulk invalidation
    if (brandProfileId) {
      const setKey = buildBrandCopyPrefix(brandProfileId);
      await redis.sadd(setKey, cacheKey);
      await redis.expire(setKey, ttlSeconds + 3600);
    }
  } catch (err) {
    console.warn("[cache] Variant set write failure:", err instanceof Error ? err.message : err);
  }
}

// ── Strategy Cache ───────────────────────────────────────────────

export function buildStrategyKey(
  brandName: string,
  platform: string,
  goal: string,
  audience: string,
  language: string,
): string {
  const parts = [
    brandName.trim().toLowerCase(),
    platform.trim().toLowerCase(),
    goal.trim().toLowerCase(),
    audience.trim().toLowerCase().slice(0, 50),
    language.trim().toLowerCase(),
  ].join("|");
  const hash = createHash("sha256").update(parts).digest("hex").slice(0, 16);
  return `strategy:${hash}`;
}

export async function getCachedStrategy(cacheKey: string): Promise<AdStrategySet | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    return (await redis.get<AdStrategySet>(cacheKey)) ?? null;
  } catch {
    return null;
  }
}

export async function setCachedStrategy(
  cacheKey: string,
  result: AdStrategySet,
  ttlSeconds: number = 3600,
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.setex(cacheKey, ttlSeconds, result);
  } catch (err) {
    console.warn("[cache] Strategy write failure:", err instanceof Error ? err.message : err);
  }
}

/**
 * Invalidate all cached copy for a brand profile.
 * Called when brand profile is updated (colors, name, etc.).
 */
export async function invalidateBrandCopy(
  brandProfileId: string,
): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;

  try {
    const setKey = buildBrandCopyPrefix(brandProfileId);
    const keys = await redis.smembers(setKey);
    if (keys.length === 0) return 0;

    // Delete all cached copy keys + the tracking set
    await redis.del(...keys, setKey);
    return keys.length;
  } catch {
    return 0;
  }
}
