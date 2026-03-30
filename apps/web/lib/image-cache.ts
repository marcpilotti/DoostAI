/**
 * In-memory image cache shared between server action and API route.
 * NOT a server action file — just a plain module.
 */

const imageMemoryCache = new Map<string, { dataUrl: string; expires: number }>();

export function setImageInCache(key: string, dataUrl: string, ttlMs = 2 * 60 * 60 * 1000): void {
  if (imageMemoryCache.size > 50) {
    const now = Date.now();
    for (const [k, v] of imageMemoryCache) {
      if (v.expires < now) imageMemoryCache.delete(k);
    }
  }
  imageMemoryCache.set(key, { dataUrl, expires: Date.now() + ttlMs });
}

export function getImageFromCache(key: string): string | null {
  const entry = imageMemoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    imageMemoryCache.delete(key);
    return null;
  }
  return entry.dataUrl;
}
