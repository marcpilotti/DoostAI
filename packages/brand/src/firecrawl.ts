import FirecrawlApp from "@mendable/firecrawl-js";

import type { BrandScrapeResult } from "./types";

function getFirecrawlClient(): FirecrawlApp {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY is not set");
  return new FirecrawlApp({ apiKey });
}

/**
 * Scrape with retry + Apify fallback as specified in PIPELINE.md Stage 2.
 * 1. Attempt Firecrawl with 15s timeout
 * 2. Wait 3s, retry Firecrawl
 * 3. Fall back to basic fetch scraping
 */
export async function scrapeWithFallback(url: string): Promise<BrandScrapeResult> {
  // Attempt 1: Firecrawl
  try {
    return await scrapeBrand(url);
  } catch (e) {
    console.warn("[scrape] Firecrawl attempt 1 failed:", e instanceof Error ? e.message : e);
  }

  // Wait 3 seconds, then retry
  await new Promise((r) => setTimeout(r, 3000));

  // Attempt 2: Firecrawl retry
  try {
    return await scrapeBrand(url);
  } catch (e) {
    console.warn("[scrape] Firecrawl attempt 2 failed, falling back to basic fetch:", e instanceof Error ? e.message : e);
  }

  // Try with www. prefix before basic fetch
  if (!url.includes("www.")) {
    try {
      const wwwUrl = url.replace("://", "://www.");
      console.log(`[scrape] Trying with www prefix: ${wwwUrl}`);
      const wwwResult = await scrapeBrand(wwwUrl);
      if (wwwResult) return wwwResult;
    } catch (err) {
      console.warn(`[scrape] www prefix also failed:`, err instanceof Error ? err.message : err);
    }
  }

  // Attempt 3: Basic fetch fallback (no external dependency)
  try {
    return await scrapeFallback(url);
  } catch (e) {
    console.error("[scrape] All 3 attempts failed for:", url, e instanceof Error ? e.message : e);
    // Return minimal result so pipeline can continue with whatever we have
    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
    return {
      url: normalizedUrl,
      title: "",
      description: "",
      colors: [],
      fonts: [],
      logoUrls: [],
      links: [],
      rawHtml: "",
    };
  }
}

function resolveUrl(base: string, relative: string): string {
  try { return new URL(relative, base).href; } catch { return relative; }
}

function isPrivateHostname(hostname: string): boolean {
  return /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+|0\.0\.0\.0|::1|\[::1\]|fc[0-9a-f]{2}:|fd[0-9a-f]{2}:|fe80:)/.test(hostname)
    || hostname.endsWith(".internal")
    || hostname.endsWith(".local")
    || hostname.endsWith(".localhost")
    || hostname === "[::1]";
}

async function scrapeFallback(url: string): Promise<BrandScrapeResult> {
  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

  // Validate initial hostname
  if (isPrivateHostname(new URL(normalizedUrl).hostname.toLowerCase())) {
    throw new Error("URL resolves to private network");
  }

  const res = await fetch(normalizedUrl, {
    signal: AbortSignal.timeout(10_000),
    redirect: "follow",
    headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" },
  });

  // Validate final URL after redirects to prevent SSRF via redirect chains
  const finalUrl = res.url;
  if (finalUrl && isPrivateHostname(new URL(finalUrl).hostname.toLowerCase())) {
    throw new Error("URL redirected to private network");
  }

  const html = await res.text();

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i);
  const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i);
  const faviconMatch = html.match(/<link[^>]+rel=["'](?:icon|shortcut icon)["'][^>]+href=["']([^"']+)/i);

  const colors = extractColorsFromHtml(html);
  const fonts = extractFontsFromHtml(html);

  const logoUrls: string[] = [];
  const logoPattern = /logo|logga|logotyp|brand-?mark/i;

  // Collect all images with position
  const fallbackImgs: Array<{ src: string; pos: number; tag: string }> = [];
  const fallbackImgRe = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let fim;
  while ((fim = fallbackImgRe.exec(html)) !== null) {
    if (fim[1] && !fim[1].startsWith("data:")) {
      fallbackImgs.push({ src: fim[1], pos: fim.index, tag: fim[0] });
    }
  }
  fallbackImgs.sort((a, b) => a.pos - b.pos);

  // Priority 1: First img with logo/logga/brand in URL or attributes
  for (const img of fallbackImgs) {
    if (logoPattern.test(img.src.toLowerCase()) || logoPattern.test(img.tag.toLowerCase())) {
      logoUrls.push(resolveUrl(normalizedUrl, img.src));
      break;
    }
  }

  // Priority 2: First image on the page
  if (logoUrls.length === 0) {
    for (const img of fallbackImgs) {
      if (img.pos < 2000) {
        const srcLower = img.src.toLowerCase();
        if (srcLower.includes("pixel") || srcLower.includes("track") || srcLower.includes("spacer")) continue;
        logoUrls.push(resolveUrl(normalizedUrl, img.src));
        break;
      }
    }
  }

  return {
    url: normalizedUrl,
    title: titleMatch?.[1]?.trim() ?? "",
    description: descMatch?.[1]?.trim() ?? "",
    colors,
    fonts,
    logoUrls,
    links: [],
    rawHtml: html.slice(0, 50_000),
  };
}

export async function scrapeBrand(url: string): Promise<BrandScrapeResult> {
  const client = getFirecrawlClient();
  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

  const doc = await client.scrape(normalizedUrl, {
    formats: ["html", "markdown", "screenshot"],
    timeout: 30000,
  });

  const html = doc.html ?? doc.rawHtml ?? "";
  const metadata = doc.metadata ?? {};
  const branding = doc.branding;

  // Extract colors: prefer Firecrawl branding, fall back to HTML parsing
  let colors: string[] = [];
  if (branding?.colors) {
    colors = Object.values(branding.colors).filter(
      (c): c is string => typeof c === "string" && c.startsWith("#"),
    );
  }
  if (colors.length === 0) {
    colors = extractColorsFromHtml(html);
  }

  // Extract fonts: prefer Firecrawl branding
  let fonts: string[] = [];
  if (branding?.fonts?.length) {
    fonts = branding.fonts.map((f) => f.family).filter(Boolean);
  }
  if (fonts.length === 0) {
    fonts = extractFontsFromHtml(html);
  }

  // ── Logo extraction ─────────────────────────────────────────
  // The site's logo is almost always the first image on the page.
  // Semantic <header>/<nav> tags are unreliable (most sites use divs).
  // Strategy: first img with logo/logga/brand in URL or attributes,
  // then first img in top of page, then Firecrawl branding.
  const logoUrls: string[] = [];

  if (html) {
    const seen = new Set<string>();
    function tryAdd(rawUrl: string): boolean {
      if (!rawUrl || rawUrl.startsWith("data:")) return false;
      const resolved = resolveUrl(normalizedUrl, rawUrl);
      if (seen.has(resolved)) return false;
      seen.add(resolved);
      logoUrls.push(resolved);
      return true;
    }

    // Collect ALL images with their position in the HTML
    const allImgs: Array<{ src: string; pos: number; tag: string }> = [];
    const imgRe = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let m;
    while ((m = imgRe.exec(html)) !== null) {
      if (m[1] && !m[1].startsWith("data:")) {
        allImgs.push({ src: m[1], pos: m.index, tag: m[0] });
      }
    }
    // Also reverse order (src after other attrs)
    const imgRe2 = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
    while ((m = imgRe2.exec(html)) !== null) {
      if (m[1] && !m[1].startsWith("data:") && !allImgs.some((i) => i.src === m![1])) {
        allImgs.push({ src: m[1], pos: m.index, tag: m[0] });
      }
    }

    // Sort by position (top of page first)
    allImgs.sort((a, b) => a.pos - b.pos);

    // Priority 1: Images with logo/logga/logotyp/brand in src URL or tag attributes
    const logoPattern = /logo|logga|logotyp|brand-?mark/i;
    for (const img of allImgs) {
      const srcLower = img.src.toLowerCase();
      const tagLower = img.tag.toLowerCase();
      if (logoPattern.test(srcLower) || logoPattern.test(tagLower)) {
        if (tryAdd(img.src)) break; // take the FIRST match only (topmost on page)
      }
    }

    // Priority 2: First image on the page (top 2000 chars) — almost always the logo
    if (logoUrls.length === 0) {
      for (const img of allImgs) {
        if (img.pos < 2000) {
          // Skip tiny tracking pixels (src often contains "pixel", "track", "1x1")
          const srcLower = img.src.toLowerCase();
          if (srcLower.includes("pixel") || srcLower.includes("track") || srcLower.includes("1x1")) continue;
          if (srcLower.includes("spacer") || srcLower.includes("blank")) continue;
          tryAdd(img.src);
          break;
        }
      }
    }
  }

  // Firecrawl branding logo (high confidence — prepend if we have it)
  if (branding?.logo) {
    const resolved = resolveUrl(normalizedUrl, branding.logo);
    if (!logoUrls.includes(resolved)) {
      logoUrls.unshift(resolved);
    }
  }

  return {
    url: normalizedUrl,
    title: metadata.title ?? undefined,
    description: metadata.description ?? metadata.ogDescription ?? undefined,
    ogImage: metadata.ogImage ?? undefined,
    screenshot: (doc as { screenshot?: string }).screenshot ?? undefined,
    markdown: doc.markdown ?? undefined,
    colors,
    fonts,
    logoUrls: [...new Set(logoUrls)].slice(0, 5),
    links: (doc.links ?? []).slice(0, 20),
    rawHtml: html.slice(0, 50_000),
  };
}

// --- Fallback extraction from raw HTML ---

const HEX_RE = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/g;
const FONT_RE = /font-family\s*:\s*([^;}"]+)/gi;

function expandShortHex(hex: string): string {
  // #abc → #aabbcc, #abcd → #aabbccdd
  if (hex.length === 4) return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  if (hex.length === 5) return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}${hex[4]}${hex[4]}`;
  if (hex.length === 9) return hex.slice(0, 7); // strip alpha channel
  return hex;
}

function extractColorsFromHtml(html: string): string[] {
  const matches = html.match(HEX_RE) ?? [];
  const unique = new Set<string>();

  const BLACKLIST = new Set([
    "#ffffff", "#fafafa", "#f5f5f5", "#f0f0f0", "#eeeeee",
    "#e5e5e5", "#e0e0e0", "#dddddd", "#d5d5d5", "#cccccc",
    "#bbbbbb", "#aaaaaa", "#999999", "#888888",
    "#777777", "#666666", "#555555", "#444444",
    "#333333", "#222222", "#111111",
    "#000000", "#1a1a1a", "#231f20", "#2c2c2c", "#212121",
    "#f8f9fa", "#e9ecef", "#dee2e6", "#ced4da", "#adb5bd", "#6c757d",
    "#495057", "#343a40", "#212529",
  ]);

  for (const c of matches) {
    const n = expandShortHex(c.toLowerCase());
    if (n.length !== 7) continue; // only 6-digit hex after expansion
    if (BLACKLIST.has(n)) continue;

    const r = parseInt(n.slice(1, 3), 16);
    const g = parseInt(n.slice(3, 5), 16);
    const b = parseInt(n.slice(5, 7), 16);
    if (r < 0x35 && g < 0x35 && b < 0x35) continue; // near-black
    if (r > 0xd8 && g > 0xd8 && b > 0xd8) continue; // near-white
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max - min < 25) continue; // gray

    unique.add(n);
  }

  // Return unique colors sorted by saturation (most saturated first = most likely brand)
  return [...unique]
    .map((hex) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;
      return { hex, sat };
    })
    .sort((a, b) => b.sat - a.sat)
    .slice(0, 8)
    .map(({ hex }) => hex);
}

function extractFontsFromHtml(html: string): string[] {
  const fonts = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = FONT_RE.exec(html)) !== null) {
    const first = m[1]!.split(",")[0]!.trim().replace(/['"]/g, "");
    if (
      first &&
      first.length > 2 &&
      first.length < 60 &&
      !first.startsWith("-") &&
      !first.startsWith("var(") &&
      !first.startsWith("&")
    ) {
      fonts.add(first);
    }
  }
  return [...fonts].slice(0, 5);
}
