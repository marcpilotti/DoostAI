import {
  LinkedInAdsClient,
  getLinkedInCampaignAnalytics,
  decryptToken,
} from "@doost/platforms";
import { adAccounts, campaigns, db, and, eq, isNotNull } from "@doost/db";

import { inngest } from "../client";

export const linkedinPollAnalytics = inngest.createFunction(
  {
    id: "linkedin-poll-analytics",
    triggers: [{ cron: "0 */6 * * *" }], // every 6 hours
  },
  async ({ step }) => {
    const accounts = await step.run("get-accounts", async () => {
      return db
        .select()
        .from(adAccounts)
        .where(
          and(
            eq(adAccounts.platform, "linkedin"),
            eq(adAccounts.status, "active"),
          ),
        );
    });

    let polled = 0;

    for (const account of accounts) {
      if (!account.accessTokenEncrypted || !account.tokenIv) continue;

      await step.run(`poll-${account.id}`, async () => {
        const token = decryptToken(
          account.accessTokenEncrypted!,
          account.tokenIv!,
        );
        const client = new LinkedInAdsClient(token);

        const liveCampaigns = await db
          .select()
          .from(campaigns)
          .where(
            and(
              eq(campaigns.orgId, account.orgId),
              eq(campaigns.status, "live"),
              isNotNull(campaigns.platformCampaignIds),
            ),
          );

        const today = new Date().toISOString().split("T")[0]!;

        for (const campaign of liveCampaigns) {
          const linkedinId = (
            campaign.platformCampaignIds as { linkedin?: string }
          )?.linkedin;
          if (!linkedinId) continue;

          const analytics = await getLinkedInCampaignAnalytics(
            client,
            linkedinId,
            today,
            today,
          );

          if (analytics.length > 0) {
            const a = analytics[0]!;
            await db
              .update(campaigns)
              .set({
                performanceMetrics: {
                  impressions: a.impressions,
                  clicks: a.clicks,
                  spend: a.spend,
                  ctr: a.ctr,
                  cpc: a.cpc,
                  lastUpdated: new Date().toISOString(),
                },
                updatedAt: new Date(),
              })
              .where(eq(campaigns.id, campaign.id));
            polled++;
          }
        }
      });
    }

    return { accountsPolled: accounts.length, campaignsUpdated: polled };
  },
);
