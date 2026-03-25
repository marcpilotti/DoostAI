import { campaigns, creativePerformance, organizations, db, eq, and, gt } from "@doost/db";

import { inngest } from "../client";

export const weeklyDigest = inngest.createFunction(
  {
    id: "analytics-weekly-digest",
    triggers: [{ cron: "0 9 * * 1" }], // Monday 9am
  },
  async ({ step }) => {
    const orgs = await step.run("get-active-orgs", async () => {
      return db.select().from(organizations).limit(500);
    });

    let sent = 0;

    for (const org of orgs) {
      await step.run(`digest-${org.id}`, async () => {
        // Get this week's live campaigns
        const liveCampaigns = await db
          .select()
          .from(campaigns)
          .where(
            and(eq(campaigns.orgId, org.id), eq(campaigns.status, "live")),
          );

        if (liveCampaigns.length === 0) return;

        // Aggregate performance
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const perf = await db
          .select()
          .from(creativePerformance)
          .where(
            and(
              eq(creativePerformance.orgId, org.id),
              gt(creativePerformance.date, sevenDaysAgo),
            ),
          );

        const totalImpressions = perf.reduce((s, p) => s + (p.impressions ?? 0), 0);
        const totalClicks = perf.reduce((s, p) => s + (p.clicks ?? 0), 0);
        const totalSpend = perf.reduce((s, p) => s + Number(p.spend ?? 0), 0);

        if (totalImpressions === 0) return;

        // TODO: Send via Resend when configured
        console.log(
          `Weekly digest for ${org.name}: ${totalImpressions} impressions, ${totalClicks} clicks, ${totalSpend.toFixed(0)} SEK spent`,
        );
        sent++;
      });
    }

    return { orgCount: orgs.length, digestsSent: sent };
  },
);
