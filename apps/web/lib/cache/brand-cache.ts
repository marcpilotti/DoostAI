import { brandProfiles, db, eq } from "@doost/db";
import { revalidateTag,unstable_cache } from "next/cache";

type CachedBrandProfile = {
  id: string;
  orgId: string;
  url: string;
  name: string;
  description: string | null;
  industry: string | null;
  employeeCount: number | null;
  revenue: string | null;
  location: string | null;
  ceo: string | null;
  orgNumber: string | null;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  } | null;
  fonts: { heading: string; body: string } | null;
  logos: { primary?: string; icon?: string; dark?: string } | null;
  brandVoice: string | null;
  targetAudience: string | null;
  valuePropositions: string[] | null;
  competitors: string[] | null;
};

/**
 * Fetch a brand profile by ID with 24h edge cache.
 * Invalidate with `invalidateBrandCache(orgId)`.
 */
export const getCachedBrandProfile = unstable_cache(
  async (profileId: string): Promise<CachedBrandProfile | null> => {
    const [row] = await db
      .select({
        id: brandProfiles.id,
        orgId: brandProfiles.orgId,
        url: brandProfiles.url,
        name: brandProfiles.name,
        description: brandProfiles.description,
        industry: brandProfiles.industry,
        employeeCount: brandProfiles.employeeCount,
        revenue: brandProfiles.revenue,
        location: brandProfiles.location,
        ceo: brandProfiles.ceo,
        orgNumber: brandProfiles.orgNumber,
        colors: brandProfiles.colors,
        fonts: brandProfiles.fonts,
        logos: brandProfiles.logos,
        brandVoice: brandProfiles.brandVoice,
        targetAudience: brandProfiles.targetAudience,
        valuePropositions: brandProfiles.valuePropositions,
        competitors: brandProfiles.competitors,
      })
      .from(brandProfiles)
      .where(eq(brandProfiles.id, profileId))
      .limit(1);

    return row ?? null;
  },
  ["brand-profile"],
  {
    revalidate: 86400, // 24 hours
    tags: ["brand-profiles"],
  },
);

/**
 * Fetch the latest brand profile for an org with 24h edge cache.
 */
export const getCachedBrandProfileByOrg = unstable_cache(
  async (orgId: string): Promise<CachedBrandProfile | null> => {
    const [row] = await db
      .select({
        id: brandProfiles.id,
        orgId: brandProfiles.orgId,
        url: brandProfiles.url,
        name: brandProfiles.name,
        description: brandProfiles.description,
        industry: brandProfiles.industry,
        employeeCount: brandProfiles.employeeCount,
        revenue: brandProfiles.revenue,
        location: brandProfiles.location,
        ceo: brandProfiles.ceo,
        orgNumber: brandProfiles.orgNumber,
        colors: brandProfiles.colors,
        fonts: brandProfiles.fonts,
        logos: brandProfiles.logos,
        brandVoice: brandProfiles.brandVoice,
        targetAudience: brandProfiles.targetAudience,
        valuePropositions: brandProfiles.valuePropositions,
        competitors: brandProfiles.competitors,
      })
      .from(brandProfiles)
      .where(eq(brandProfiles.orgId, orgId))
      .limit(1);

    return row ?? null;
  },
  ["brand-profile-by-org"],
  {
    revalidate: 86400,
    tags: ["brand-profiles"],
  },
);

/**
 * Invalidate all brand profile caches for an org.
 * Call after brand profile create/update/delete.
 */
export function invalidateBrandCache(orgId: string) {
  revalidateTag("brand-profiles");
  revalidateTag(`brand-${orgId}`);
}
