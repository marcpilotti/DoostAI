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

export type LogoLibrary = {
  primary: DownloadedLogo | null;      // best logo (highest quality, first valid)
  variants: DownloadedLogo[];          // all downloaded logos, including primary
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

type CachedLogoLibrary = {
  primary: CachedLogo | null;
  variants: CachedLogo[];
};

/**
 * Check Redis cache for a previously downloaded logo library.
 * Supports both old single-logo format and new library format.
 */
async function getCachedLogoLibrary(domain: string): Promise<LogoLibrary | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const raw = await redis.get<string | CachedLogo | CachedLogoLibrary>(`${LOGO_CACHE_KEY_PREFIX}${domain}`);
    if (!raw) return null;

    const parsed = typeof raw === "string" ? JSON.parse(raw) as CachedLogo | CachedLogoLibrary : raw;

    // New library format: has "variants" array
    if ("variants" in parsed && Array.isArray(parsed.variants)) {
      console.log(`[L4 Cache] HIT (library) for ${domain} — ${parsed.variants.length} variants`);
      return parsed as LogoLibrary;
    }

    // Old single-logo format: wrap in library for backward compatibility
    const single = parsed as CachedLogo;
    if (single.dataUrl) {
      console.log(`[L4 Cache] HIT (legacy single) for ${domain} (source: ${single.source})`);
      const logo = single as DownloadedLogo;
      return { primary: logo, variants: [logo] };
    }
  } catch (err) {
    console.warn("[L4 Cache] Redis read error:", err instanceof Error ? err.message : err);
  }
  return null;
}

/**
 * Store a logo library in Redis cache (TTL 30 days).
 */
async function setCachedLogoLibrary(domain: string, library: LogoLibrary): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    const value: CachedLogoLibrary = {
      primary: library.primary ? {
        dataUrl: library.primary.dataUrl,
        source: library.primary.source,
        theme: library.primary.theme,
        width: library.primary.width,
        quality: library.primary.quality,
      } : null,
      variants: library.variants.map((v) => ({
        dataUrl: v.dataUrl,
        source: v.source,
        theme: v.theme,
        width: v.width,
        quality: v.quality,
      })),
    };
    await redis.setex(`${LOGO_CACHE_KEY_PREFIX}${domain}`, LOGO_CACHE_TTL_SECONDS, JSON.stringify(value));
    console.log(`[L4 Cache] Stored library for ${domain} (${library.variants.length} variants, primary: ${library.primary?.source ?? "none"}, TTL: ${LOGO_CACHE_TTL_SECONDS}s)`);
  } catch (err) {
    // Cache write failure is non-fatal — the logos are still usable
    console.warn("[L4 Cache] Redis write error:", err instanceof Error ? err.message : err);
  }
}

// ---------------------------------------------------------------------------
// Multi-source logo download (3 phases)
// ---------------------------------------------------------------------------

/**
 * Download logos from ALL available sources and return a LogoLibrary.
 *
 * Phase 1 (parallel): Logo.dev + Brandfetch icon  — highest quality
 * Phase 2 (parallel): DuckDuckGo + Clearbit       — good fallbacks, no auth needed
 * Phase 3 (fallback):  Google Favicon              — always works
 *
 * All downloaded logos pass through validateLogoQuality() before acceptance.
 * The primary is the best logo (highest quality source in priority order).
 * Variants contain ALL valid downloads so the template system can pick
 * the best one per background contrast.
 *
 * The full library is cached in Redis for 30 days.
 */
async function downloadBestLogo(
  domain: string,
  brandfetchLogos: { url: string; type: string; theme: string }[],
): Promise<LogoLibrary> {

  // --- Check Redis cache first ---
  const cached = await getCachedLogoLibrary(domain);
  if (cached) return cached;

  console.log(`[L4 Cache] MISS for ${domain} — downloading from all sources`);

  // Collect all valid variants across all phases
  const variants: DownloadedLogo[] = [];
  let primary: DownloadedLogo | null = null;

  // -----------------------------------------------------------------------
  // Phase 1: Logo.dev + Brandfetch (parallel) — high quality
  // -----------------------------------------------------------------------
  const logoDevToken = process.env.LOGO_DEV_TOKEN;

  // Try to find multiple Brandfetch variants (light + dark themes)
  const bfIconLight = brandfetchLogos.find((l) => l.type === "icon" && l.theme === "light")
    ?? brandfetchLogos.find((l) => l.theme === "light");
  const bfIconDark = brandfetchLogos.find((l) => l.type === "icon" && l.theme === "dark")
    ?? brandfetchLogos.find((l) => l.theme === "dark");
  const bfIconFallback = brandfetchLogos.find((l) => l.type === "icon")
    ?? brandfetchLogos[0];

  // Deduplicate Brandfetch URLs — avoid downloading the same file twice
  const bfUrls = new Set<string>();
  const bfTargets: { url: string; theme: string; type: string }[] = [];
  for (const candidate of [bfIconLight, bfIconDark, bfIconFallback]) {
    if (candidate?.url && !bfUrls.has(candidate.url)) {
      bfUrls.add(candidate.url);
      bfTargets.push(candidate);
    }
  }

  const logoDevPromise = logoDevToken && logoDevToken !== "your_logo_dev_token"
    ? downloadAsDataUrl(`https://img.logo.dev/${domain}?token=${logoDevToken}&format=png&size=128`)
    : Promise.resolve(null);

  const brandfetchPromises = bfTargets.map((bf) => downloadAsDataUrl(bf.url));

  const [logoDevResult, ...brandfetchResults] = await Promise.allSettled([
    logoDevPromise,
    ...brandfetchPromises,
  ]);

  const logoDevDataUrl = logoDevResult.status === "fulfilled" ? logoDevResult.value : null;

  // Process Logo.dev result
  if (logoDevDataUrl) {
    const check = validateLogoQuality(logoDevDataUrl);
    if (check.valid) {
      console.log(`[L4 Download] ${domain} → Logo.dev OK (${logoDevDataUrl.length} chars)`);
      const logo: DownloadedLogo = { dataUrl: logoDevDataUrl, source: "logo.dev", theme: "light", width: 128, quality: "high" };
      variants.push(logo);
      if (!primary) primary = logo;
    } else {
      console.log(`[L4 Download] ${domain} → Logo.dev rejected: ${check.reason} (${logoDevDataUrl.length} chars)`);
    }
  } else {
    console.log(`[L4 Download] ${domain} → Logo.dev failed (404 or error)`);
  }

  // Process all Brandfetch results
  for (let i = 0; i < brandfetchResults.length; i++) {
    const result = brandfetchResults[i]!;
    const bf = bfTargets[i]!;
    const dataUrl = result.status === "fulfilled" ? result.value : null;

    if (dataUrl) {
      const check = validateLogoQuality(dataUrl);
      if (check.valid) {
        console.log(`[L4 Download] ${domain} → Brandfetch ${bf.type}/${bf.theme} OK (${dataUrl.length} chars)`);
        const logo: DownloadedLogo = { dataUrl, source: "brandfetch", theme: bf.theme, width: 400, quality: "high" };
        variants.push(logo);
        if (!primary) primary = logo;
      } else {
        console.log(`[L4 Download] ${domain} → Brandfetch ${bf.type}/${bf.theme} rejected: ${check.reason} (${dataUrl.length} chars)`);
      }
    } else {
      console.log(`[L4 Download] ${domain} → Brandfetch ${bf.type}/${bf.theme} failed (CDN error)`);
    }
  }

  // -----------------------------------------------------------------------
  // Phase 2: DuckDuckGo + Clearbit (parallel) — good fallbacks, no auth
  // -----------------------------------------------------------------------
  console.log(`[L4 Download] ${domain} → Phase 2: trying DuckDuckGo + Clearbit`);

  const ddgUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
  const clearbitUrl = `https://logo.clearbit.com/${domain}`;

  const [ddgResult, clearbitResult] = await Promise.allSettled([
    downloadAsDataUrl(ddgUrl),
    downloadAsDataUrl(clearbitUrl),
  ]);

  const clearbitDataUrl = clearbitResult.status === "fulfilled" ? clearbitResult.value : null;
  const ddgDataUrl = ddgResult.status === "fulfilled" ? ddgResult.value : null;

  if (clearbitDataUrl) {
    const check = validateLogoQuality(clearbitDataUrl);
    if (check.valid) {
      console.log(`[L4 Download] ${domain} → Clearbit OK (${clearbitDataUrl.length} chars)`);
      const logo: DownloadedLogo = { dataUrl: clearbitDataUrl, source: "clearbit", theme: "light", width: 128, quality: "medium" };
      variants.push(logo);
      if (!primary) primary = logo;
    } else {
      console.log(`[L4 Download] ${domain} → Clearbit rejected: ${check.reason} (${clearbitDataUrl.length} chars)`);
    }
  } else {
    console.log(`[L4 Download] ${domain} → Clearbit failed`);
  }

  if (ddgDataUrl) {
    const check = validateLogoQuality(ddgDataUrl);
    if (check.valid) {
      console.log(`[L4 Download] ${domain} → DuckDuckGo OK (${ddgDataUrl.length} chars)`);
      const logo: DownloadedLogo = { dataUrl: ddgDataUrl, source: "duckduckgo", theme: "light", width: 64, quality: "medium" };
      variants.push(logo);
      if (!primary) primary = logo;
    } else {
      console.log(`[L4 Download] ${domain} → DuckDuckGo rejected: ${check.reason} (${ddgDataUrl.length} chars)`);
    }
  } else {
    console.log(`[L4 Download] ${domain} → DuckDuckGo failed`);
  }

  // -----------------------------------------------------------------------
  // Phase 3: Google Favicon — universal fallback, always works (128px)
  // -----------------------------------------------------------------------
  console.log(`[L4 Download] ${domain} → Phase 3: trying Google Favicon fallback`);

  const googleUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  const googleDataUrl = await downloadAsDataUrl(googleUrl);

  if (googleDataUrl) {
    const check = validateLogoQuality(googleDataUrl);
    if (check.valid) {
      console.log(`[L4 Download] ${domain} → Google Favicon OK (${googleDataUrl.length} chars)`);
      const logo: DownloadedLogo = { dataUrl: googleDataUrl, source: "google", theme: "light", width: 128, quality: "low" };
      variants.push(logo);
      if (!primary) primary = logo;
    } else {
      console.log(`[L4 Download] ${domain} → Google Favicon rejected: ${check.reason} (${googleDataUrl.length} chars)`);
    }
  }

  console.log(`[L4 Download] ${domain} → Collected ${variants.length} valid variants (primary: ${primary?.source ?? "none"})`);

  const library: LogoLibrary = { primary, variants };

  // Cache the full library if we got at least one variant
  if (variants.length > 0) {
    await setCachedLogoLibrary(domain, library);
  }

  return library;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run all logo API sources: fetch Brandfetch data + download logo library.
 *
 * The download pipeline tries 5 sources across 3 phases:
 *   Phase 1: Logo.dev + Brandfetch (parallel)
 *   Phase 2: DuckDuckGo + Clearbit (parallel)
 *   Phase 3: Google Favicon (fallback)
 *
 * Returns a LogoLibrary with the best logo as `primary` and ALL valid
 * downloads as `variants`. Also exposes a backward-compatible
 * `downloadedLogo` (alias for `primary`) to avoid breaking callers.
 *
 * Results are cached in Redis for 30 days to avoid redundant downloads.
 */
export async function fetchLogoApis(domain: string): Promise<{
  brandfetch: BrandfetchResult | null;
  downloadedLogo: DownloadedLogo | null;
  logoLibrary: LogoLibrary;
}> {
  // Fetch Brandfetch first (we need its logo URLs to download from)
  const brandfetch = await fetchBrandfetch(domain).catch(() => null);

  // Download ALL logos from every source (with Redis cache)
  const logoLibrary = await downloadBestLogo(domain, brandfetch?.logos ?? []);

  return { brandfetch, downloadedLogo: logoLibrary.primary, logoLibrary };
}
