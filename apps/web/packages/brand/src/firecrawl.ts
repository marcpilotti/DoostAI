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

  // Extract logos: prefer Firecrawl branding, then og:image (skip tiny favicons)
  const logoUrls: string[] = [];
  if (branding?.logo) logoUrls.push(branding.logo);
  if (metadata.favicon) {
    const fav = metadata.favicon.toLowerCase();
    // Only include favicon if it's not a tiny .ico file
    if (!fav.endsWith(".ico") && !fav.includes("/favicon")) {
      try {
        logoUrls.push(new URL(metadata.favicon, normalizedUrl).href);
      } catch {
        // skip invalid
      }
    }
  }
  if (metadata.ogImage) logoUrls.push(metadata.ogImage);

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
  const counts = new Map<string, number>();
  for (const c of matches) {
    const n = c.toLowerCase();
    // Filter out near-white, near-black, and gray colors
    if (["#fff", "#ffffff", "#000", "#000000", "#333", "#333333"].includes(n))
      continue;
    // Filter 6-digit hex that are near-black (all components < 0x30) or near-white (all > 0xE0)
    if (n.length === 7) {
      const r = parseInt(n.slice(1, 3), 16);
      const g = parseInt(n.slice(3, 5), 16);
      const b = parseInt(n.slice(5, 7), 16);
      if (r < 0x30 && g < 0x30 && b < 0x30) continue; // near-black
      if (r > 0xe0 && g > 0xe0 && b > 0xe0) continue; // near-white
      // Filter grays (low saturation: max-min < 30)
      if (Math.max(r, g, b) - Math.min(r, g, b) < 30 && r > 0x40 && r < 0xc0) continue;
    }
    counts.set(n, (counts.get(n) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([color]) => color);
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
