"use client";

import { useState, useCallback } from "react";

type ImageCache = {
  url: string;
  timestamp: number;
};

/**
 * Manages background-image state for the ad preview with a small LRU-style
 * cache (last 3 images) and forward/back navigation.
 *
 * Extracted from the bgImages / upload logic in copy-preview-card.tsx so
 * image concerns are isolated from copy-editing and validation.
 *
 * @example
 * ```tsx
 * const img = useAdImageGeneration(initialUrl);
 * img.setImage(newUrl);          // push a new image
 * if (img.hasPrevious) img.previousImage();  // go back
 * ```
 */
export function useAdImageGeneration(initialUrl?: string | null) {
  const [currentImage, setCurrentImage] = useState<string | null>(
    initialUrl ?? null,
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageCache, setImageCache] = useState<ImageCache[]>(
    initialUrl ? [{ url: initialUrl, timestamp: Date.now() }] : [],
  );
  const [cacheIndex, setCacheIndex] = useState(0);

  /** Push a new image into the cache (keeps last 3) and make it current. */
  const setImage = useCallback((url: string) => {
    setCurrentImage(url);
    setImageCache((prev) => {
      const next = [...prev.slice(-2), { url, timestamp: Date.now() }];
      setCacheIndex(next.length - 1);
      return next;
    });
  }, []);

  /** Navigate to the previous cached image. */
  const previousImage = useCallback(() => {
    if (cacheIndex > 0) {
      const newIndex = cacheIndex - 1;
      setCacheIndex(newIndex);
      setCurrentImage(imageCache[newIndex]?.url ?? null);
    }
  }, [cacheIndex, imageCache]);

  /** Navigate to the next cached image. */
  const nextImage = useCallback(() => {
    if (cacheIndex < imageCache.length - 1) {
      const newIndex = cacheIndex + 1;
      setCacheIndex(newIndex);
      setCurrentImage(imageCache[newIndex]?.url ?? null);
    }
  }, [cacheIndex, imageCache]);

  return {
    currentImage,
    setImage,
    isGenerating,
    setIsGenerating,
    imageCache,
    cacheIndex,
    previousImage,
    nextImage,
    hasPrevious: cacheIndex > 0,
    hasNext: cacheIndex < imageCache.length - 1,
    cacheCount: imageCache.length,
  };
}
