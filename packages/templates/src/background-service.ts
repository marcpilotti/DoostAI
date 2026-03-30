/**
 * Background Service — Industry-Driven Dynamic Background Injection
 *
 * Fetches industry-specific stock photos from the Unsplash API and
 * caches the resulting URL in Upstash Redis (7-day TTL) to stay
 * well within the free-tier limit of 50 requests/hour.
 *
 * Flow:
 *   1. Check Redis cache for `bg:{industry}` key
 *   2. On cache miss, pick a random search term from INDUSTRY_BACKGROUNDS
 *   3. Call Unsplash /photos/random API
 *   4. Extract the `urls.regular` URL (1080px wide)
 *   5. Cache the URL in Redis with 7-day TTL
 *   6. Return the URL (or null on any failure — fallback to gradient)
 *
 * If UNSPLASH_ACCESS_KEY is not set, returns null immediately.
 * All errors are caught and logged — this is a non-critical enhancement.
 */

import { Redis } from "@upstash/redis";
import { getBackgroundTerms } from "./industry-backgrounds";

// ── Constants ─────────────────────────────────────────────────────

const BG_CACHE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const CACHE_KEY_PREFIX = "bg:";
const UNSPLASH_API_BASE = "https://api.unsplash.com";
const FETCH_TIMEOUT_MS = 5_000;

// ── Redis singleton (lazy, tolerates missing env vars) ────────────

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

// ── Unsplash API types ────────────────────────────────────────────

type UnsplashPhotoResponse = {
  urls: {
    raw: string;
    full: string;
    regular: string; // 1080px wide
    small: string;
    thumb: string;
  };
  user: {
    name: string;
    links: {
      html: string;
    };
  };
  links: {
    download_location: string;
  };
};

// ── Helpers ───────────────────────────────────────────────────────

function getUnsplashAccessKey(): string | null {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key || key === "..." || key.startsWith("your_")) return null;
  return key;
}

/**
 * Pick a random element from an array.
 */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/**
 * Normalize the industry string into a stable cache key.
 * Lowercases, trims, and replaces spaces/special chars with hyphens.
 */
function toCacheKey(industry: string): string {
  return `${CACHE_KEY_PREFIX}${industry.toLowerCase().trim().replace(/[^a-z0-9åäö]+/gi, "-")}`;
}

// ── Main export ───────────────────────────────────────────────────

/**
 * Get an industry-relevant background image URL from Unsplash.
 *
 * Returns the URL string (e.g. "https://images.unsplash.com/photo-...?w=1080")
 * or null if:
 *   - UNSPLASH_ACCESS_KEY is not configured
 *   - The API call fails or times out
 *   - The industry has no matching terms (should not happen — defaults exist)
 *
 * Cached in Redis for 7 days per industry to avoid hitting Unsplash rate limits.
 */
export async function getIndustryBackground(
  industry: string,
): Promise<string | null> {
  if (!industry) return null;

  const accessKey = getUnsplashAccessKey();
  if (!accessKey) {
    console.log("[BackgroundService] No UNSPLASH_ACCESS_KEY configured, skipping");
    return null;
  }

  const cacheKey = toCacheKey(industry);
  const redis = getRedis();

  // 1. Check Redis cache
  if (redis) {
    try {
      const cached = await redis.get<string>(cacheKey);
      if (cached) {
        console.log(`[BackgroundService] Cache HIT for "${industry}"`);
        return cached;
      }
    } catch (err) {
      console.warn(
        "[BackgroundService] Redis read error:",
        err instanceof Error ? err.message : err,
      );
      // Continue to API call
    }
  }

  // 2. Pick a random search term for this industry
  const terms = getBackgroundTerms(industry);
  const searchTerm = pickRandom(terms);

  console.log(
    `[BackgroundService] Cache MISS for "${industry}" — fetching Unsplash with query="${searchTerm}"`,
  );

  // 3. Call Unsplash API
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const params = new URLSearchParams({
      query: searchTerm,
      orientation: "landscape",
      w: "1200",
    });

    const res = await fetch(
      `${UNSPLASH_API_BASE}/photos/random?${params.toString()}`,
      {
        signal: controller.signal,
        headers: {
          Authorization: `Client-ID ${accessKey}`,
          "Accept-Version": "v1",
        },
      },
    );

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(
        `[BackgroundService] Unsplash API error: HTTP ${res.status} ${res.statusText}`,
      );
      return null;
    }

    const data = (await res.json()) as UnsplashPhotoResponse;

    // 4. Extract the regular URL (1080px wide)
    const imageUrl = data.urls?.regular;
    if (!imageUrl) {
      console.warn("[BackgroundService] No regular URL in Unsplash response");
      return null;
    }

    // Trigger Unsplash download tracking (required by API guidelines)
    // Fire-and-forget — don't await
    if (data.links?.download_location) {
      fetch(data.links.download_location, {
        headers: { Authorization: `Client-ID ${accessKey}` },
      }).catch(() => {
        // Silently ignore tracking failures
      });
    }

    // 5. Cache the URL in Redis
    if (redis) {
      try {
        await redis.setex(cacheKey, BG_CACHE_TTL_SECONDS, imageUrl);
        console.log(
          `[BackgroundService] Cached "${industry}" background (TTL ${BG_CACHE_TTL_SECONDS}s)`,
        );
      } catch (err) {
        console.warn(
          "[BackgroundService] Redis write error:",
          err instanceof Error ? err.message : err,
        );
        // Non-fatal — we still have the URL
      }
    }

    // 6. Return the URL
    return imageUrl;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      console.warn(
        `[BackgroundService] Unsplash fetch timed out after ${FETCH_TIMEOUT_MS}ms`,
      );
    } else {
      console.warn(
        "[BackgroundService] Unsplash fetch error:",
        err instanceof Error ? err.message : err,
      );
    }
    return null;
  }
}

/**
 * Pre-warm backgrounds for multiple industries in parallel.
 * Useful during brand analysis to pre-populate the cache.
 */
export async function prewarmBackgrounds(
  industries: string[],
): Promise<void> {
  const unique = [...new Set(industries.filter(Boolean))];
  await Promise.allSettled(unique.map((i) => getIndustryBackground(i)));
}
