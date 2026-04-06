/**
 * Weekly profile refresh — Monday midnight.
 * 10-step cycle per LIVING-PROFILE.md spec.
 */

import { brandProfiles, db, eq } from "@doost/db";
import { updatePerformanceProfile } from "@doost/intelligence";

import { inngest } from "../client";

export const profileWeeklyRefresh = inngest.createFunction(
  {
    id: "profile-weekly-refresh",
    retries: 1,
    triggers: [{ cron: "0 0 * * 1" }],
  },
  async ({ step }) => {
    // Get all active organizations (have a brand profile)
    const activeOrgs = await step.run("get-active-orgs", async () => {
      const rows = await db
        .select({
          orgId: brandProfiles.orgId,
          profileId: brandProfiles.id,
        })
        .from(brandProfiles)
        .limit(500);
      return rows;
    });

    for (const { orgId, profileId } of activeOrgs) {
      // Step 4: Update performance profile with latest data
      await step.run(`perf-${orgId}`, async () => {
        await updatePerformanceProfile(orgId);
      });

      // Step 9: Recalculate profile completeness
      await step.run(`completeness-${orgId}`, async () => {
        const [profile] = await db
          .select()
          .from(brandProfiles)
          .where(eq(brandProfiles.id, profileId))
          .limit(1);

        if (!profile) return;

        const checks = [
          !!profile.name,
          !!profile.description,
          !!profile.industry,
          !!profile.colors?.primary,
          !!profile.fonts?.heading,
          !!profile.logos?.primary,
          !!profile.brandVoice,
          !!profile.targetAudience,
          (profile.valuePropositions?.length ?? 0) > 0,
          !!profile.orgNumber,
          !!profile.employeeCount,
          !!profile.location,
          !!profile.performanceProfile?.winningPatterns,
          !!profile.behaviorProfile?.controlLevel,
          !!profile.socialPresenceScore,
        ];
        const completeness = Math.round((checks.filter(Boolean).length / checks.length) * 100);

        await db
          .update(brandProfiles)
          .set({ profileCompleteness: completeness, updatedAt: new Date() })
          .where(eq(brandProfiles.id, profileId));
      });

      // Step 10: Run triggers (delegates to the 6-hourly trigger function)
      // Triggers run on their own schedule — no need to duplicate here
    }

    return { orgsRefreshed: activeOrgs.length };
  },
);
