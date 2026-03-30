/**
 * L4: Logo extraction via Brandfetch, Logo.dev, DuckDuckGo, Clearbit,
 * and Google Favicons — with Redis caching.
 *
 * KEY INSIGHT: Brandfetch CDN returns 403 for browser <img> tags (HEAD blocked,
 * GET works server-side only). Logo.dev returns 404 for many domains.
 * Google Favicons works universally but is lower quality.
 *
 * SOLUTION: Download the best logo server-side during the pipeline and embed
 * as a base64 data URL. This guarantees the logo renders in the browser.
 *
 * SOURCE PRIORITY (3 phases):
 *   Phase 1 (parallel): Logo.dev + Brandfetch icon  — highest quality
 *   Phase 2 (parallel): DuckDuckGo + Clearbit       — good fallbacks, no auth
 *   Phase 3 (fallback):  Google Favicon              — always works
 *
 * CACHING: Results are cached in Upstash Redis (key: logo:${domain}, TTL 30d).
 * On cache hit we skip all downloads entirely.
 */

import { Redis } from "@upstash/redis";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LOGO_CACHE_KEY_PREFIX = "logo:";
const LOGO_CACHE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BrandfetchResult = {
  logos: { url: string; type: string; theme: string }[];
  colors: { hex: string; type: string }[];
  fonts: { name: string; weight: number; type: string }[];
  confidence: number;
};

export type DownloadedLogo = {
  dataUrl: string;   // data:image/png;base64,... — ready for <img src>
  source: string;    // "logo.dev" | "brandfetch" | "duckduckgo" | "clearbit" | "google"
  theme: string;     // "light" | "dark"
  width: number;
  quality: "high" | "medium" | "low";
};

// ---------------------------------------------------------------------------
// Redis singleton (lazy, tolerates missing env vars)
// Same pattern as image-cache.ts
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Brandfetch API
// ---------------------------------------------------------------------------

/**
 * Brandfetch API — returns logo URLs, colors, and fonts.
 */
async function fetchBrandfetch(domain: string): Promise<BrandfetchResult | null> {
  const apiKey = process.env.BRANDFETCH_API_KEY;
  if (!apiKey || apiKey === "your_brandfetch_api_key") return null;

  try {
    const res = await fetch(`https://api.brandfetch.io/v2/brands/${domain}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;

    let data: {
      logos?: Array<{ formats?: Array<{ src: string; format: string }>; type?: string; theme?: string }>;
      colors?: Array<{ hex: string; type?: string }>;
      fonts?: Array<{ name: string; weight?: number; type?: string }>;
    };
    try {
      data = await res.json() as typeof data;
    } catch {
      console.warn("[L4 Brandfetch] JSON parse failed for", domain);
      return null;
    }

    // Pick best format per logo: PNG > JPEG > SVG
    const logos = (data.logos ?? []).map((logo) => {
      const formats = logo.formats ?? [];
      const png = formats.find((f) => f.format === "png");
      const jpeg = formats.find((f) => f.format === "jpeg");
      const svg = formats.find((f) => f.format === "svg");
      const best = png ?? jpeg ?? svg;
      return best ? { url: best.src, type: logo.type ?? "logo", theme: logo.theme ?? "light" } : null;
    }).filter((l): l is NonNullable<typeof l> => l !== null && !!l.url);

    const colors = (data.colors ?? []).map((c) => ({ hex: c.hex, type: c.type ?? "brand" }));
    const fonts = (data.fonts ?? []).map((f) => ({ name: f.name, weight: f.weight ?? 400, type: f.type ?? "body" }));

    console.log(`[L4 Brandfetch] ${domain} → ${logos.length} logos, ${colors.length} colors, ${fonts.length} fonts`);
    return { logos, colors, fonts, confidence: 95 };
  } catch (err) {
    console.warn("[L4 Brandfetch] Failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Image download + validation
// ---------------------------------------------------------------------------

/**
 * Download an image and convert to base64 data URL.
 * Returns null if the URL doesn't return a valid image.
 */
async function downloadAsDataUrl(url: string, timeoutMs = 5000): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;

    const buf = await res.arrayBuffer();
    if (buf.byteLength === 0 || buf.byteLength > 500_000) return null; // skip empty or huge

    // Node.js runtime — Buffer is available (route.ts uses Node runtime, not Edge)
    const base64 = typeof Buffer !== "undefined"
      ? Buffer.from(buf).toString("base64")
      : btoa(String.fromCharCode(...new Uint8Array(buf)));
    return `data:${contentType.split(";")[0]};base64,${base64}`;
  } catch {
    return null;
  }
}

/**
 * Validate logo quality based on data size.
 * Rejects images that are too small (icons/placeholders) or too large (full photos).
 * No vision API call — pure size-based heuristic for speed.
 *
 * Applied to ALL sources before accepting a logo.
 */
function validateLogoQuality(dataUrl: string): { valid: boolean; reason?: string } {
  const base64Part = dataUrl.split(",")[1] ?? "";
  const sizeBytes = Math.ceil(base64Part.length * 3 / 4);

  // Reject if < 500 bytes (likely a 1x1 pixel, broken image, or placeholder)
  if (sizeBytes < 500) return { valid: false, reason: "too_small" };

  // Reject if > 200KB (probably not a logo — likely a full photo or banner)
  if (sizeBytes > 200_000) return { valid: false, reason: "too_large" };

  return { valid: true };
}

// ---------------------------------------------------------------------------
// Logo cache (Redis)
// ---------------------------------------------------------------------------

type CachedLogo = {
  dataUrl: string;
  source: string;
  theme: string;
  width: number;
  quality: "high" | "medium" | "low";
};

/**
 * Check Redis cache for a previously downloaded logo.
 */
async function getCachedLogo(domain: string): Promise<DownloadedLogo | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const raw = await redis.get<string | CachedLogo>(`${LOGO_CACHE_KEY_PREFIX}${domain}`);
    if (!raw) return null;

    // Handle both stringified JSON and native object (Upstash may auto-parse)
    const cached: CachedLogo = typeof raw === "string" ? JSON.parse(raw) as CachedLogo : raw;
    if (cached.dataUrl) {
      console.log(`[L4 Cache] HIT for ${domain} (source: ${cached.source})`);
      return cached as DownloadedLogo;
    }
  } catch (err) {
    console.warn("[L4 Cache] Redis read error:", err instanceof Error ? err.message : err);
  }
  return null;
}

/**
 * Store a downloaded logo in Redis cache (TTL 30 days).
 */
async function setCachedLogo(domain: string, logo: DownloadedLogo): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    const value: CachedLogo = {
      dataUrl: logo.dataUrl,
      source: logo.source,
      theme: logo.theme,
      width: logo.width,
      quality: logo.quality,
    };
    await redis.setex(`${LOGO_CACHE_KEY_PREFIX}${domain}`, LOGO_CACHE_TTL_SECONDS, JSON.stringify(value));
    console.log(`[L4 Cache] Stored logo for ${domain} (source: ${logo.source}, TTL: ${LOGO_CACHE_TTL_SECONDS}s)`);
  } catch (err) {
    // Cache write failure is non-fatal — the logo is still usable
    console.warn("[L4 Cache] Redis write error:", err instanceof Error ? err.message : err);
  }
}

// ---------------------------------------------------------------------------
// Multi-source logo download (3 phases)
// ---------------------------------------------------------------------------

/**
 * Download the best available logo for a domain.
 *
 * Phase 1 (parallel): Logo.dev + Brandfetch icon  — highest quality
 * Phase 2 (parallel): DuckDuckGo + Clearbit       — good fallbacks, no auth needed
 * Phase 3 (fallback):  Google Favicon              — always works
 *
 * All downloaded logos pass through validateLogoQuality() before acceptance.
 * The winning result is cached in Redis for 30 days.
 */
async function downloadBestLogo(
  domain: string,
  brandfetchLogos: { url: string; type: string; theme: string }[],
): Promise<DownloadedLogo | null> {

  // --- Check Redis cache first ---
  const cached = await getCachedLogo(domain);
  if (cached) return cached;

  console.log(`[L4 Cache] MISS for ${domain} — downloading from sources`);

  // -----------------------------------------------------------------------
  // Phase 1: Logo.dev + Brandfetch (parallel) — high quality
  // -----------------------------------------------------------------------
  const logoDevToken = process.env.LOGO_DEV_TOKEN;

  const bfIcon = brandfetchLogos.find((l) => l.type === "icon" && l.theme === "light")
    ?? brandfetchLogos.find((l) => l.type === "icon")
    ?? brandfetchLogos.find((l) => l.theme === "light")
    ?? brandfetchLogos[0];

  const logoDevPromise = logoDevToken && logoDevToken !== "your_logo_dev_token"
    ? downloadAsDataUrl(`https://img.logo.dev/${domain}?token=${logoDevToken}&format=png&size=128`)
    : Promise.resolve(null);

  const brandfetchPromise = bfIcon?.url
    ? downloadAsDataUrl(bfIcon.url)
    : Promise.resolve(null);

  const [logoDevResult, brandfetchResult] = await Promise.allSettled([logoDevPromise, brandfetchPromise]);

  const logoDevDataUrl = logoDevResult.status === "fulfilled" ? logoDevResult.value : null;
  const brandfetchDataUrl = brandfetchResult.status === "fulfilled" ? brandfetchResult.value : null;

  // Prefer Logo.dev (higher quality), then Brandfetch
  if (logoDevDataUrl) {
    const check = validateLogoQuality(logoDevDataUrl);
    if (check.valid) {
      console.log(`[L4 Download] ${domain} → Logo.dev OK (${logoDevDataUrl.length} chars)`);
      const logo: DownloadedLogo = { dataUrl: logoDevDataUrl, source: "logo.dev", theme: "light", width: 128, quality: "high" };
      await setCachedLogo(domain, logo);
      return logo;
    }
    console.log(`[L4 Download] ${domain} → Logo.dev rejected: ${check.reason} (${logoDevDataUrl.length} chars)`);
  } else {
    console.log(`[L4 Download] ${domain} → Logo.dev failed (404 or error)`);
  }

  if (brandfetchDataUrl && bfIcon) {
    const check = validateLogoQuality(brandfetchDataUrl);
    if (check.valid) {
      console.log(`[L4 Download] ${domain} → Brandfetch ${bfIcon.type}/${bfIcon.theme} OK (${brandfetchDataUrl.length} chars)`);
      const logo: DownloadedLogo = { dataUrl: brandfetchDataUrl, source: "brandfetch", theme: bfIcon.theme, width: 400, quality: "high" };
      await setCachedLogo(domain, logo);
      return logo;
    }
    console.log(`[L4 Download] ${domain} → Brandfetch rejected: ${check.reason} (${brandfetchDataUrl.length} chars)`);
  } else if (bfIcon?.url) {
    console.log(`[L4 Download] ${domain} → Brandfetch failed (CDN error)`);
  }

  // -----------------------------------------------------------------------
  // Phase 2: DuckDuckGo + Clearbit (parallel) — good fallbacks, no auth
  // -----------------------------------------------------------------------
  console.log(`[L4 Download] ${domain} → Phase 1 exhausted, trying DuckDuckGo + Clearbit`);

  // DuckDuckGo icons — good coverage, no auth needed
  const ddgUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;

  // Clearbit — might be deprecated but still works for many domains
  // Note: Clearbit was acquired by HubSpot, may stop working eventually
  const clearbitUrl = `https://logo.clearbit.com/${domain}`;

  const [ddgResult, clearbitResult] = await Promise.allSettled([
    downloadAsDataUrl(ddgUrl),
    downloadAsDataUrl(clearbitUrl),
  ]);

  const ddgDataUrl = ddgResult.status === "fulfilled" ? ddgResult.value : null;
  const clearbitDataUrl = clearbitResult.status === "fulfilled" ? clearbitResult.value : null;

  // Prefer Clearbit (full logo, higher res) over DuckDuckGo (favicon/icon)
  if (clearbitDataUrl) {
    const check = validateLogoQuality(clearbitDataUrl);
    if (check.valid) {
      console.log(`[L4 Download] ${domain} → Clearbit OK (${clearbitDataUrl.length} chars)`);
      const logo: DownloadedLogo = { dataUrl: clearbitDataUrl, source: "clearbit", theme: "light", width: 128, quality: "medium" };
      await setCachedLogo(domain, logo);
      return logo;
    }
    console.log(`[L4 Download] ${domain} → Clearbit rejected: ${check.reason} (${clearbitDataUrl.length} chars)`);
  } else {
    console.log(`[L4 Download] ${domain} → Clearbit failed`);
  }

  if (ddgDataUrl) {
    const check = validateLogoQuality(ddgDataUrl);
    if (check.valid) {
      console.log(`[L4 Download] ${domain} → DuckDuckGo OK (${ddgDataUrl.length} chars)`);
      const logo: DownloadedLogo = { dataUrl: ddgDataUrl, source: "duckduckgo", theme: "light", width: 64, quality: "medium" };
      await setCachedLogo(domain, logo);
      return logo;
    }
    console.log(`[L4 Download] ${domain} → DuckDuckGo rejected: ${check.reason} (${ddgDataUrl.length} chars)`);
  } else {
    console.log(`[L4 Download] ${domain} → DuckDuckGo failed`);
  }

  // -----------------------------------------------------------------------
  // Phase 3: Google Favicon — universal fallback, always works (128px)
  // -----------------------------------------------------------------------
  console.log(`[L4 Download] ${domain} → Phase 2 exhausted, trying Google Favicon fallback`);

  const googleUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  const googleDataUrl = await downloadAsDataUrl(googleUrl);

  if (googleDataUrl) {
    const check = validateLogoQuality(googleDataUrl);
    if (check.valid) {
      console.log(`[L4 Download] ${domain} → Google Favicon OK (${googleDataUrl.length} chars)`);
      const logo: DownloadedLogo = { dataUrl: googleDataUrl, source: "google", theme: "light", width: 128, quality: "low" };
      await setCachedLogo(domain, logo);
      return logo;
    }
    console.log(`[L4 Download] ${domain} → Google Favicon rejected: ${check.reason} (${googleDataUrl.length} chars)`);
  }

  console.log(`[L4 Download] ${domain} → All 5 sources failed`);
  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run all logo API sources: fetch Brandfetch data + download best logo.
 *
 * The download pipeline tries 5 sources across 3 phases:
 *   Phase 1: Logo.dev + Brandfetch (parallel)
 *   Phase 2: DuckDuckGo + Clearbit (parallel)
 *   Phase 3: Google Favicon (fallback)
 *
 * Results are cached in Redis for 30 days to avoid redundant downloads.
 */
export async function fetchLogoApis(domain: string): Promise<{
  brandfetch: BrandfetchResult | null;
  downloadedLogo: DownloadedLogo | null;
}> {
  // Fetch Brandfetch first (we need its logo URLs to download from)
  const brandfetch = await fetchBrandfetch(domain).catch(() => null);

  // Download the best logo from any source (with Redis cache)
  const downloadedLogo = await downloadBestLogo(domain, brandfetch?.logos ?? []);

  return { brandfetch, downloadedLogo };
}
