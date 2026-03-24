import {
  MetaAdsClient,
  decryptToken,
  getCampaignInsights,
} from "@doost/platforms";
import { adAccounts, campaigns, db, and, eq, isNotNull } from "@doost/db";

import { inngest } from "../client";

export const metaPollInsights = inngest.createFunction(
  {
    id: "meta-poll-insights",
    triggers: [{ cron: "0 */6 * * *" }], // every 6 hours
  },
  async ({ step }) => {
    // Get all active Meta accounts
    const accounts = await step.run("get-accounts", async () => {
      return db
        .select()
        .from(adAccounts)
        .where(
          and(
            eq(adAccounts.platform, "meta"),
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
        const client = new MetaAdsClient(
          token,
          (account.metadata as { businessManagerId?: string })
            ?.businessManagerId ?? "",
        );

        // Get live campaigns for this org
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

        for (const campaign of liveCampaigns) {
          const metaId = (
            campaign.platformCampaignIds as { meta?: string }
          )?.meta;
          if (!metaId) continue;

          const today = new Date().toISOString().split("T")[0]!;
          const insights = await getCampaignInsights(client, metaId, {
            since: today,
            until: today,
          });

          if (insights.length > 0) {
            const insight = insights[0]!;

            // Update campaign aggregate metrics
            await db
              .update(campaigns)
              .set({
                performanceMetrics: {
                  impressions: insight.impressions,
                  clicks: insight.clicks,
                  spend: Number(insight.spend),
                  ctr: Number(insight.ctr),
                  cpc: Number(insight.cpc),
                  conversions: insight.conversions,
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
