import { z } from "zod";

import { generateCompleteAdImage } from "@/lib/ads/ad-image-pipeline";

export const maxDuration = 60;

const inputSchema = z.object({
  brandName: z.string(),
  brandColor: z.string(),
  brandAccent: z.string().optional(),
  industry: z.string(),
  description: z.string().optional(),
  brandVoice: z.string().optional(),
  targetAudience: z.string().optional(),
});

/**
 * POST /api/ad/pregenerate-image
 *
 * Fires early (after brand analysis) to pre-generate the ad background
 * with GPT-4o using full brand profile context. Runs while user browses
 * brand card → audience → platform steps (~15-30s).
 */
export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  const result = await generateCompleteAdImage({
    ...parsed.data,
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
