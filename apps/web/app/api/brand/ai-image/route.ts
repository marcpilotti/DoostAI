/**
 * Serves AI-generated ad background images from cache.
 * Supports both:
 * - ai-img: keys (from packages/templates pipeline)
 * - ad-img: keys (from app/actions/generate-ad-image server action)
 */

import { getAiImageFromCache } from "@doost/templates/ai-image";
import { getImageFromCache as getServerActionImage } from "@/app/actions/generate-ad-image";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (!key) {
    return new Response("Missing key", { status: 400 });
  }

  // Try server action cache first (ad-img: keys), then templates cache (ai-img: keys)
  const dataUrl = key.startsWith("ad-img:")
    ? await getServerActionImage(key)
    : await getAiImageFromCache(key);
  if (!dataUrl) {
    return new Response("Image not found", { status: 404 });
  }

  // Parse data URL: "data:image/png;base64,iVBOR..."
  const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) {
    return new Response("Invalid cached image format", { status: 500 });
  }

  const contentType = match[1]!;
  const base64Data = match[2]!;
  const buffer = Buffer.from(base64Data, "base64");

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, s-maxage=604800",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
