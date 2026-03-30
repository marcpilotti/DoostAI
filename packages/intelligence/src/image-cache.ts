/**
 * OG Image Pre-Cache
 *
 * Downloads OG images and caches them as base64 in Upstash Redis.
 * This ensures vision analysis never fails due to CDN timeouts or
 * transient network issues — the image is fetched once at pipeline
 * start and the cached base64 is passed directly to the LLM.
 *
 * If Upstash is not configured, the image is downloaded and returned
 * as base64 without caching (still avoids the LLM fetching it).
 */

import { Redis } from "@upstash/redis";

const OG_IMAGE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const DOWNLOAD_TIMEOUT_MS = 5_000;
const CACHE_KEY_PREFIX = "og-image:";

// --- Redis singleton (lazy, tolerates missing env vars) ----------------

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

// --- Helpers -----------------------------------------------------------

function isValidImageUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    return parsed.protocol.startsWith("http") && parsed.pathname.length > 1;
  } catch {
    return false;
  }
}

/**
 * Download an image and return it as a `data:` base64 string.
 * Uses a 5 s timeout via AbortController.
 */
async function downloadToBase64(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "DoostBot/1.0" },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[ImageCache] Download failed: HTTP ${res.status} for ${url}`);
      return null;
    }

    const contentType = res.headers.get("content-type") ?? "image/png";
    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // Sanity check — skip tiny/broken responses (< 500 bytes is likely an error page)
    if (base64.length < 700) {
      console.warn(`[ImageCache] Image too small (${base64.length} chars), skipping: ${url}`);
      return null;
    }

    return `data:${contentType};base64,${base64}`;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      console.warn(`[ImageCache] Download timed out after ${DOWNLOAD_TIMEOUT_MS}ms: ${url}`);
    } else {
      console.warn("[ImageCache] Download error:", err instanceof Error ? err.message : err);
    }
    return null;
  }
}

// --- Public API --------------------------------------------------------

/**
 * Pre-cache an OG image for use in vision analysis.
 *
 * 1. If Upstash is available, checks the cache first.
 * 2. On cache miss (or no Redis), downloads the image with a 5 s timeout.
 * 3. Stores the base64 result in Redis (if available) with a 7-day TTL.
 * 4. Returns the base64 data-URI string, or null if download failed.
 */
export async function cacheOgImage(ogImageUrl: string): Promise<string | null> {
  if (!isValidImageUrl(ogImageUrl)) return null;

  const redis = getRedis();
  const cacheKey = `${CACHE_KEY_PREFIX}${ogImageUrl}`;

  // 1. Check cache
  if (redis) {
    try {
      const cached = await redis.get<string>(cacheKey);
      if (cached) {
        console.log(`[ImageCache] Cache HIT for ${ogImageUrl}`);
        return cached;
      }
    } catch (err) {
      // Redis read failure — continue to download
      console.warn("[ImageCache] Redis read error:", err instanceof Error ? err.message : err);
    }
  }

  // 2. Download
  console.log(`[ImageCache] Cache MISS — downloading ${ogImageUrl}`);
  const base64 = await downloadToBase64(ogImageUrl);
  if (!base64) return null;

  // 3. Store in cache
  if (redis) {
    try {
      await redis.setex(cacheKey, OG_IMAGE_TTL_SECONDS, base64);
      console.log(`[ImageCache] Stored in cache (TTL ${OG_IMAGE_TTL_SECONDS}s)`);
    } catch (err) {
      // Cache write failure is non-fatal — the base64 is still usable
      console.warn("[ImageCache] Redis write error:", err instanceof Error ? err.message : err);
    }
  }

  return base64;
}
