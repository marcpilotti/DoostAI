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
  const fallbackDomain = new URL(normalizedUrl).hostname.replace(/^www\./, "");
  function isSameDomain(logoUrl: string): boolean {
    try {
      const resolved = resolveUrl(normalizedUrl, logoUrl);
      const host = new URL(resolved).hostname.replace(/^www\./, "");
      return host === fallbackDomain || host.endsWith(`.${fallbackDomain}`);
    } catch {
      return !logoUrl.startsWith("http"); // relative URLs are same-domain
    }
  }

  const logoUrls: string[] = [];

  // Priority 1: Logo in <header> or <nav>
  const fallbackHeaderMatch = html.match(/<header[\s>][\s\S]*?<\/header>/i);
  const fallbackNavMatch = html.match(/<nav[\s>][\s\S]*?<\/nav>/i);
  const fallbackHeaderHtml = (fallbackHeaderMatch?.[0] ?? "") + (fallbackNavMatch?.[0] ?? "");
  if (fallbackHeaderHtml) {
    const headerImgRe = /<img[^>]+src=["']([^"']+)["']/gi;
    let hm;
    while ((hm = headerImgRe.exec(fallbackHeaderHtml)) !== null) {
      if (hm[1] && !hm[1].startsWith("data:")) {
        const resolved = resolveUrl(normalizedUrl, hm[1]);
        if (isSameDomain(resolved)) logoUrls.push(resolved);
      }
    }
  }

  // Priority 2: <img> with "logo" in attributes — ONLY same-domain
  const logoImgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*(?:alt|class|id)=["'][^"']*logo[^"']*["']/gi;
  let logoImgMatch;
  while ((logoImgMatch = logoImgRegex.exec(html)) !== null) {
    if (logoImgMatch[1]) {
      const resolved = resolveUrl(normalizedUrl, logoImgMatch[1]);
      if (isSameDomain(resolved)) logoUrls.push(resolved);
    }
  }
  const logoImgRegex2 = /<img[^>]*(?:alt|class|id)=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["']/gi;
  let logoImgMatch2;
  while ((logoImgMatch2 = logoImgRegex2.exec(html)) !== null) {
    if (logoImgMatch2[1]) {
      const resolved = resolveUrl(normalizedUrl, logoImgMatch2[1]);
      if (isSameDomain(resolved)) logoUrls.push(resolved);
    }
  }

  // OG image only if same-domain (avoid social preview images from CDNs that aren't logos)
  if (ogImageMatch?.[1] && isSameDomain(ogImageMatch[1])) {
    logoUrls.push(ogImageMatch[1]);
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

  // Extract the site's OWN logo — not client/partner logos.
  // Strategy: prioritize header/nav logos and favicons over random <img> tags.
  const logoUrls: string[] = [];
  const siteDomain = new URL(normalizedUrl).hostname.replace(/^www\./, "");

  function isSameSite(rawUrl: string): boolean {
    try {
      const resolved = resolveUrl(normalizedUrl, rawUrl);
      const host = new URL(resolved).hostname.replace(/^www\./, "");
      return host === siteDomain || host.endsWith(`.${siteDomain}`);
    } catch {
      return !rawUrl.startsWith("http");
    }
  }

  if (html) {
    const seen = new Set<string>();
    function tryAdd(rawUrl: string): boolean {
      if (!rawUrl || rawUrl.startsWith("data:")) return false;
      const resolved = resolveUrl(normalizedUrl, rawUrl);
      if (seen.has(resolved)) return false;
      seen.add(resolved);
      if (!isSameSite(resolved)) return false;
      logoUrls.push(resolved);
      return true;
    }

    // Priority 1: Logo inside <header> or <nav> — the site's main logo
    const headerMatch = html.match(/<header[\s>][\s\S]*?<\/header>/i);
    const navMatch = html.match(/<nav[\s>][\s\S]*?<\/nav>/i);
    const headerHtml = (headerMatch?.[0] ?? "") + (navMatch?.[0] ?? "");
    let m;
    if (headerHtml) {
      const headerImgRe = /<img[^>]+src=["']([^"']+)["']/gi;
      while ((m = headerImgRe.exec(headerHtml)) !== null) {
        if (m[1] && !m[1].startsWith("data:")) {
          tryAdd(m[1]);
        }
      }
      // Also SVGs with class containing "logo"
      const headerSvgRe = /<(?:img|svg)[^>]*class=["'][^"']*logo[^"']*["'][^>]*(?:src=["']([^"']+)["'])?/gi;
      while ((m = headerSvgRe.exec(headerHtml)) !== null) {
        if (m[1]) tryAdd(m[1]);
      }
    }

    // Priority 3: Any <img> with "logo" in class/id/alt within first 20% of HTML
    // (site logo is almost always near the top, client logos are further down)
    const topHtml = html.slice(0, Math.ceil(html.length * 0.2));
    const topLogoRe = /<img[^>]*(?:class|id|alt)=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/gi;
    while ((m = topLogoRe.exec(topHtml)) !== null) {
      if (m[1]) tryAdd(m[1]);
    }
    // Reverse attr order
    const topLogoRe2 = /<img[^>]+src=["']([^"']+)["'][^>]*(?:class|id|alt)=["'][^"']*logo[^"']*["']/gi;
    while ((m = topLogoRe2.exec(topHtml)) !== null) {
      if (m[1]) tryAdd(m[1]);
    }
  }

  // Firecrawl branding logo (high confidence)
  if (branding?.logo) {
    const resolved = resolveUrl(normalizedUrl, branding.logo);
    if (!logoUrls.includes(resolved) && isSameSite(resolved)) {
      logoUrls.unshift(resolved); // highest priority
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
