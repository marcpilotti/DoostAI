import { brandProfiles, db, eq } from "@doost/db";
import { invalidateBrandCopy } from "@doost/ai";
import { invalidateBrandCache } from "@/lib/cache/brand-cache";

export async function POST(req: Request) {
  const { brandProfileId, colors } = (await req.json()) as {
    brandProfileId: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
    };
  };

  if (!brandProfileId || !colors) {
    return Response.json({ error: "Missing brandProfileId or colors" }, { status: 400 });
  }

  // Update brand profile colors
  const [updated] = await db
    .update(brandProfiles)
    .set({ colors, updatedAt: new Date() })
    .where(eq(brandProfiles.id, brandProfileId))
    .returning({ id: brandProfiles.id, orgId: brandProfiles.orgId });

  if (!updated) {
    return Response.json({ error: "Brand profile not found" }, { status: 404 });
  }

  // Invalidate caches so new colors are picked up
  invalidateBrandCache(updated.orgId);
  await invalidateBrandCopy(brandProfileId);

  return Response.json({ success: true, brandProfileId: updated.id });
}
