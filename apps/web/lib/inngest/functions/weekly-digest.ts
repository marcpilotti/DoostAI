import { and, campaigns, creativePerformance, db, eq, gt,organizations } from "@doost/db";

import { sendEmail } from "@/lib/email/client";
import { buildWeeklyDigestHtml } from "@/lib/email/weekly-digest";

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

        // Send via Resend
        const email = org.metadata && typeof org.metadata === "object" && "ownerEmail" in org.metadata
          ? (org.metadata as { ownerEmail?: string }).ownerEmail
          : null;

        if (email) {
          const html = buildWeeklyDigestHtml({
            orgName: org.name ?? "ditt företag",
            totalImpressions,
            totalClicks,
            totalSpend,
            campaignCount: liveCampaigns.length,
          });

          const success = await sendEmail({
            to: email,
            subject: `Veckorapport: ${totalClicks.toLocaleString("sv-SE")} klick denna vecka`,
            html,
          });

          if (success) sent++;
        } else {
          console.log(`[weekly-digest] No email for org ${org.name} — skipping`);
        }
      });
    }

    return { orgCount: orgs.length, digestsSent: sent };
  },
);
