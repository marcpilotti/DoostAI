/**
 * Simple sliding-window rate limiter using Upstash Redis.
 * Falls back to in-memory Map if Redis is not configured.
 */

import { Redis } from "@upstash/redis";

let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

// In-memory fallback
const memoryMap = new Map<string, { count: number; resetAt: number }>();

export async function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const r = getRedis();

  if (r) {
    try {
      const redisKey = `rl:${key}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      const pipe = r.pipeline();
      pipe.zremrangebyscore(redisKey, 0, windowStart);
      pipe.zadd(redisKey, { score: now, member: `${now}:${Math.random()}` });
      pipe.zcard(redisKey);
      pipe.expire(redisKey, Math.ceil(windowMs / 1000));

      const results = await pipe.exec();
      const count = (results[2] as number) ?? 0;

      return { allowed: count <= maxRequests, remaining: Math.max(0, maxRequests - count) };
    } catch (err) {
      console.warn("[rate-limit] Redis failed, allowing request:", err instanceof Error ? err.message : err);
      // If Redis fails, allow the request (fail open)
    }
  }

  // In-memory fallback
  const now = Date.now();
  const entry = memoryMap.get(key);
  if (!entry || now > entry.resetAt) {
    memoryMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  entry.count++;
  if (memoryMap.size > 500) {
    const oldest = memoryMap.keys().next().value;
    if (oldest) memoryMap.delete(oldest);
  }
  return { allowed: entry.count <= maxRequests, remaining: Math.max(0, maxRequests - entry.count) };
}
