/**
 * Pick the best image from scraped website images for ad backgrounds.
 * Filters by size, aspect ratio, and avoids icons/logos.
 */

export type ScrapedImage = {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
};

const ICON_PATTERNS = /favicon|icon|logo|sprite|avatar|badge|button|arrow|chevron/i;
const MIN_SIZE = 400;

export function pickBestImages(images: ScrapedImage[], count = 2): string[] {
  const scored = images
    .filter((img) => {
      if (!img.url) return false;
      if (ICON_PATTERNS.test(img.url)) return false;
      if (ICON_PATTERNS.test(img.alt || "")) return false;
      if (img.url.endsWith(".svg")) return false;
      if (img.url.includes("data:image/svg")) return false;
      // Require minimum dimensions if available
      if (img.width && img.width < MIN_SIZE) return false;
      if (img.height && img.height < MIN_SIZE) return false;
      return true;
    })
    .map((img) => {
      let score = 0;

      // Prefer larger images
      if (img.width && img.height) {
        const area = img.width * img.height;
        score += Math.min(area / 100000, 10);

        // Prefer square-ish or landscape (good for ads)
        const ratio = img.width / img.height;
        if (ratio >= 0.8 && ratio <= 1.2) score += 5; // Square
        if (ratio >= 1.2 && ratio <= 2.0) score += 3; // Landscape
      } else {
        score += 2; // Unknown size, give it a chance
      }

      // Prefer jpg/webp (photos) over png (often graphics)
      if (/\.(jpg|jpeg|webp)/i.test(img.url)) score += 2;

      // Prefer images with descriptive alt text
      if (img.alt && img.alt.length > 10) score += 1;

      // Penalize very long URLs (often tracking/CDN noise)
      if (img.url.length > 200) score -= 2;

      return { url: img.url, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, count).map((s) => s.url);
}
