/**
 * Serves AI-generated ad background images from Redis cache.
 * Usage: GET /api/brand/ai-image?key=ai-img:IT%20%26%20Tech:#6366f1:square
 */

import { getAiImageFromCache } from "@doost/templates/ai-image";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (!key || !key.startsWith("ai-img:")) {
    return new Response("Missing or invalid key", { status: 400 });
  }

  const dataUrl = await getAiImageFromCache(key);
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
