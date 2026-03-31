import { z } from "zod";
import { brandProfiles, db, eq } from "@doost/db";
import { invalidateBrandCopy } from "@doost/ai";
import { invalidateBrandCache } from "@/lib/cache/brand-cache";

const inputSchema = z.object({
  brandProfileId: z.string().uuid(),
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    background: z.string(),
    text: z.string(),
  }),
});

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return Response.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ success: false, error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { brandProfileId, colors } = parsed.data;

  const [updated] = await db
    .update(brandProfiles)
    .set({ colors, updatedAt: new Date() })
    .where(eq(brandProfiles.id, brandProfileId))
    .returning({ id: brandProfiles.id, orgId: brandProfiles.orgId });

  if (!updated) {
    return Response.json({ success: false, error: "Brand profile not found" }, { status: 404 });
  }

  invalidateBrandCache(updated.orgId);
  await invalidateBrandCopy(brandProfileId);

  return Response.json({ success: true, data: { brandProfileId: updated.id } });
}
