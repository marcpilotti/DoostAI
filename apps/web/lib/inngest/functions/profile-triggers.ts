/**
 * Profile trigger evaluation — runs every 6 hours.
 * Evaluates all triggers for orgs with active campaigns.
 */

import { adCreatives,and, campaigns, creativePerformance, db, eq, gte } from "@doost/db";
import { evaluateTriggersForOrg, type TriggerConditionInput } from "@doost/triggers";

import { inngest } from "../client";

export const profileTriggerEval = inngest.createFunction(
  {
    id: "profile-trigger-eval",
    retries: 1,
    triggers: [{ cron: "30 */6 * * *" }],
  },
  async ({ step }) => {
    // Get all orgs with active campaigns
    const activeOrgs = await step.run("get-active-orgs", async () => {
      const rows = await db
        .select({ orgId: campaigns.orgId })
        .from(campaigns)
        .where(eq(campaigns.status, "live"))
        .groupBy(campaigns.orgId);
      return rows.map((r) => r.orgId);
    });

    let totalFired = 0;

    for (const orgId of activeOrgs) {
      const fired = await step.run(`triggers-${orgId}`, async () => {
        // Build trigger condition input from real data
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

        const recentPerf = await db
          .select({
            date: creativePerformance.date,
            ctr: creativePerformance.ctr,
            spend: creativePerformance.spend,
            roas: creativePerformance.roas,
          })
          .from(creativePerformance)
          .where(
            and(
              eq(creativePerformance.orgId, orgId),
              gte(creativePerformance.date, fourteenDaysAgo),
            ),
          )
          .limit(100);

        const activeCreativeRows = await db
          .select({
            id: adCreatives.id,
            createdAt: adCreatives.createdAt,
          })
          .from(adCreatives)
          .where(eq(adCreatives.orgId, orgId))
          .limit(50);

        // Calculate avg ROAS
        const roasValues = recentPerf
          .map((r) => Number(r.roas ?? 0))
          .filter((r) => r > 0);
        const avgROAS = roasValues.length > 0
          ? roasValues.reduce((a, b) => a + b, 0) / roasValues.length
          : 0;

        // Get active platforms
        const orgCampaigns = await db
          .select({ channels: campaigns.channels })
          .from(campaigns)
          .where(and(eq(campaigns.orgId, orgId), eq(campaigns.status, "live")));

        const activePlatforms = [...new Set(
          orgCampaigns.flatMap((c) => c.channels ?? []),
        )];

        // Days active (from first campaign)
        const [firstCampaign] = await db
          .select({ createdAt: campaigns.createdAt })
          .from(campaigns)
          .where(eq(campaigns.orgId, orgId))
          .orderBy(campaigns.createdAt)
          .limit(1);

        const daysActive = firstCampaign
          ? Math.floor((Date.now() - firstCampaign.createdAt.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        const input: TriggerConditionInput = {
          orgId,
          avgROAS,
          activePlatforms,
          daysActive,
          recentPerformance: recentPerf.map((r) => ({
            date: r.date.toISOString(),
            ctr: Number(r.ctr ?? 0),
            spend: Number(r.spend ?? 0),
            roas: Number(r.roas ?? 0),
          })),
          activeCreatives: activeCreativeRows.map((c) => ({
            id: c.id,
            startDate: c.createdAt.toISOString(),
            ctrTrend: "stable" as const,
          })),
          newGoogleReviews: [],
        };

        return evaluateTriggersForOrg(orgId, input);
      });

      totalFired += fired;
    }

    return { orgsEvaluated: activeOrgs.length, triggersFired: totalFired };
  },
);
