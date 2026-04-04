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

async function scrapeFallback(url: string): Promise<BrandScrapeResult> {
  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const res = await fetch(normalizedUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "DoostBot/1.0 (brand-analysis)" },
    });
    const html = await res.text();
    clearTimeout(timeout);

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i);
    const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i);
    const faviconMatch = html.match(/<link[^>]+rel=["'](?:icon|shortcut icon)["'][^>]+href=["']([^"']+)/i);

    const colors = extractColorsFromHtml(html);
    const fonts = extractFontsFromHtml(html);
    const logoUrls: string[] = [];
    if (ogImageMatch?.[1]) logoUrls.push(ogImageMatch[1]);
    if (faviconMatch?.[1]) {
      const fav = faviconMatch[1].startsWith("http") ? faviconMatch[1] : new URL(faviconMatch[1], normalizedUrl).href;
      logoUrls.push(fav);
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
  } finally {
    clearTimeout(timeout);
  }
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

  // Extract logos: prefer Firecrawl branding, then og:image
  // Strictly filter out favicons — they are NOT logos
  const logoUrls: string[] = [];
  if (branding?.logo) logoUrls.push(branding.logo);
  if (metadata.ogImage) logoUrls.push(metadata.ogImage);
  // Favicon is stored separately — never treated as a logo candidate
  // It may still be shown as the icon/avatar in the UI, but the real logo
  // comes from Logo APIs (Brandfetch, Logo.dev) in the intelligence pipeline

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

function extractColorsFromHtml(html: string): string[] {
  const matches = html.match(HEX_RE) ?? [];
  const unique = new Set<string>();

  // Common text/UI colors that are NEVER brand colors
  const BLACKLIST = new Set([
    "#fff", "#ffffff", "#fafafa", "#f5f5f5", "#f0f0f0", "#eee", "#eeeeee",
    "#e5e5e5", "#e0e0e0", "#ddd", "#dddddd", "#d5d5d5", "#ccc", "#cccccc",
    "#bbb", "#bbbbbb", "#aaa", "#aaaaaa", "#999", "#999999", "#888", "#888888",
    "#777", "#777777", "#666", "#666666", "#555", "#555555", "#444", "#444444",
    "#333", "#333333", "#222", "#222222", "#111", "#111111",
    "#000", "#000000", "#1a1a1a", "#231f20", "#2c2c2c", "#212121",
    "#f8f9fa", "#e9ecef", "#dee2e6", "#ced4da", "#adb5bd", "#6c757d",
    "#495057", "#343a40", "#212529", // Bootstrap grays
  ]);

  for (const c of matches) {
    const n = c.toLowerCase();
    if (BLACKLIST.has(n)) continue;

    if (n.length === 7) {
      const r = parseInt(n.slice(1, 3), 16);
      const g = parseInt(n.slice(3, 5), 16);
      const b = parseInt(n.slice(5, 7), 16);
      if (r < 0x35 && g < 0x35 && b < 0x35) continue; // near-black
      if (r > 0xd8 && g > 0xd8 && b > 0xd8) continue; // near-white
      // Filter grays (low saturation)
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (max - min < 25) continue; // gray — no saturation
    }

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
    if (first && !first.startsWith("-") && first.length < 60) {
      fonts.add(first);
    }
  }
  return [...fonts].slice(0, 5);
}
