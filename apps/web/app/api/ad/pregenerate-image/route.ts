import { z } from "zod";

import { generateCompleteAdImage } from "@/lib/ads/ad-image-pipeline";

export const maxDuration = 30;

const inputSchema = z.object({
  brandName: z.string(),
  brandColor: z.string(),
  brandAccent: z.string().optional(),
  industry: z.string(),
});

/**
 * POST /api/ad/pregenerate-image
 *
 * Fires early (after brand analysis) to pre-generate the ad background
 * image with GPT-4o while the user browses brand card → audience →
 * platform steps. By the time they click "Skapa annonser", the image
 * is cached on the client and ad generation only needs copy (~3-4s).
 */
export async function POST(req: Request) {
  const body = await req.json();
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  const { brandName, brandColor, brandAccent, industry } = parsed.data;

  const result = await generateCompleteAdImage({
    brandName,
    brandColor,
    brandAccent,
    industry,
    headline: "",
    bodyCopy: "",
    cta: "",
    format: "meta-feed",
  });

  return Response.json({
    imageUrl: result?.imageUrl ?? null,
    method: result?.method ?? null,
  });
}
