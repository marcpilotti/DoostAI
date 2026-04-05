/**
 * Redis cache for brand analysis results by domain.
 * Avoids re-scraping + re-analyzing the same domain within 6 hours.
 */

import { Redis } from "@upstash/redis";

const TTL_SECONDS = 6 * 60 * 60; // 6 hours

let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

function cacheKey(domain: string): string {
  return `brand-analysis:${domain.toLowerCase().replace(/^www\./, "")}`;
}

export async function getCachedAnalysis(domain: string): Promise<Record<string, unknown> | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    return await r.get(cacheKey(domain)) as Record<string, unknown> | null;
  } catch {
    return null;
  }
}

export async function setCachedAnalysis(domain: string, data: Record<string, unknown>): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.set(cacheKey(domain), data, { ex: TTL_SECONDS });
  } catch {
    // Non-critical
  }
}
