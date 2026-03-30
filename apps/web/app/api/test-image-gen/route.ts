/**
 * Test route for ad image generation.
 * Usage: /api/test-image-gen?headline=Din+text&format=meta-feed
 */

import { generateAdImage } from "@/app/actions/generate-ad-image";
import type { AdFormat } from "@/components/ads/ad-preview/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const headline = searchParams.get("headline") ?? "Bästa burgaren i Stockholm";
  const primaryText = searchParams.get("text") ?? "Beställ nu och få 20% rabatt";
  const format = (searchParams.get("format") ?? "meta-feed") as AdFormat;

  const start = Date.now();

  const result = await generateAdImage(
    {
      id: `test-${Date.now()}`,
      headline,
      primaryText,
      brandName: "Test Brand",
    },
    format,
  );

  const duration = Date.now() - start;

  return Response.json({
    success: result !== null,
    duration: `${duration}ms`,
    format,
    headline,
    primaryText,
    imageUrl: result?.imageUrl ?? null,
    prompt: result?.prompt ?? null,
  });
}
