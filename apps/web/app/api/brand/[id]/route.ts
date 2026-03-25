import { getCachedBrandProfile } from "@/lib/cache/brand-cache";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const profile = await getCachedBrandProfile(id);

  if (!profile) {
    return Response.json({ error: "Brand profile not found" }, { status: 404 });
  }

  return Response.json(profile, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
    },
  });
}
