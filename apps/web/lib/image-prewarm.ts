/**
 * Image pre-warming — start generating ad backgrounds early.
 *
 * Called after brand analysis completes (before goal selection).
 * By the time the user picks a goal and ad copy is generated,
 * the background images are already cached and ready.
 *
 * Uses the same generateAdImage server action as AdPreview components.
 */

import { generateAdImage } from "@/app/actions/generate-ad-image";
import type { AdFormat } from "@/components/ads/ad-preview/types";

// Module-level cache — survives across renders but not page reloads
const prewarmedImages = new Map<string, string>();
const prewarmInProgress = new Set<string>();

function cacheKey(brandName: string, format: AdFormat): string {
  return `${brandName}:${format}`;
}

/**
 * Start pre-generating images for a brand.
 * Call this after brand analysis completes.
 * Non-blocking — runs in background.
 */
export function prewarmAdImages(brand: {
  name: string;
  industry?: string;
  primaryColor: string;
}) {
  const formats: AdFormat[] = ["meta-feed", "linkedin"];

  for (const format of formats) {
    const key = cacheKey(brand.name, format);
    if (prewarmedImages.has(key) || prewarmInProgress.has(key)) continue;

    prewarmInProgress.add(key);

    // Generate in background — don't await
    generateAdImage(
      {
        id: `prewarm-${brand.name}-${format}`,
        headline: `${brand.name} — ${brand.industry ?? "premium quality"}`,
        primaryText: brand.industry ?? "Professional services",
        brandName: brand.name,
      },
      format,
    ).then((result) => {
      if (result?.imageUrl) {
        prewarmedImages.set(key, result.imageUrl);
        console.log(`[Prewarm] ${brand.name} ${format} ready (${(result.imageUrl.length / 1024).toFixed(0)}KB)`);
      }
    }).catch(() => {
      // Non-critical — AdPreview will generate its own if prewarm fails
    }).finally(() => {
      prewarmInProgress.delete(key);
    });
  }
}

/**
 * Get a pre-warmed image if available.
 * Returns null if not yet ready or not pre-warmed.
 */
export function getPrewarmedImage(brandName: string, format: AdFormat): string | null {
  return prewarmedImages.get(cacheKey(brandName, format)) ?? null;
}

/**
 * Check if prewarm is still in progress for a format.
 */
export function isPrewarmInProgress(brandName: string, format: AdFormat): boolean {
  return prewarmInProgress.has(cacheKey(brandName, format));
}
