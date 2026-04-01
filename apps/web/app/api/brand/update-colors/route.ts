import { auth } from "@clerk/nextjs/server";
import { invalidateBrandCopy } from "@doost/ai";
import { and,brandProfiles, db, eq } from "@doost/db";
import { z } from "zod";

import { invalidateBrandCache } from "@/lib/cache/brand-cache";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

const inputSchema = z.object({
  brandProfileId: z.string().uuid(),
  colors: z.object({
    primary: z.string().regex(HEX_RE, "Invalid hex color"),
    secondary: z.string().regex(HEX_RE, "Invalid hex color"),
    accent: z.string().regex(HEX_RE, "Invalid hex color"),
    background: z.string().regex(HEX_RE, "Invalid hex color"),
    text: z.string().regex(HEX_RE, "Invalid hex color"),
  }),
});

export async function POST(req: Request) {
  const { userId, orgId } = await auth();
  if (!userId) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return Response.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ success: false, error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { brandProfileId, colors } = parsed.data;

  // Ensure the brand profile belongs to the user's organization
  const [updated] = await db
    .update(brandProfiles)
    .set({ colors, updatedAt: new Date() })
    .where(
      orgId
        ? and(eq(brandProfiles.id, brandProfileId), eq(brandProfiles.orgId, orgId))
        : eq(brandProfiles.id, brandProfileId),
    )
    .returning({ id: brandProfiles.id, orgId: brandProfiles.orgId });

  if (!updated) {
    return Response.json({ success: false, error: "Brand profile not found" }, { status: 404 });
  }

  invalidateBrandCache(updated.orgId);
  await invalidateBrandCopy(brandProfileId);

  return Response.json({ success: true, data: { brandProfileId: updated.id } });
}
