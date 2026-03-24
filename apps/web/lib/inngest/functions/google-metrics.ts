import {
  GoogleAdsClient,
  decryptToken,
  getGoogleCampaignMetrics,
  googleRefreshAccessToken,
} from "@doost/platforms";
import { adAccounts, campaigns, db, and, eq, isNotNull } from "@doost/db";

import { inngest } from "../client";

export const googlePollMetrics = inngest.createFunction(
  {
    id: "google-poll-metrics",
    triggers: [{ cron: "0 */6 * * *" }], // every 6 hours
  },
  async ({ step }) => {
    const accounts = await step.run("get-accounts", async () => {
      return db
        .select()
        .from(adAccounts)
        .where(
          and(
            eq(adAccounts.platform, "google"),
            eq(adAccounts.status, "active"),
          ),
        );
    });

    let polled = 0;

    for (const account of accounts) {
      if (!account.refreshTokenEncrypted || !account.tokenIv) continue;

      await step.run(`poll-${account.id}`, async () => {
        // Refresh access token
        const refreshToken = decryptToken(
          account.refreshTokenEncrypted!,
          account.tokenIv!,
        );
        const { accessToken } =
          await googleRefreshAccessToken(refreshToken);

        const client = GoogleAdsClient.fromEnv(accessToken);

        // Get live campaigns
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
          const googleId = (
            campaign.platformCampaignIds as { google?: string }
          )?.google;
          if (!googleId) continue;

          const results = await getGoogleCampaignMetrics(
            client,
            account.platformAccountId,
            googleId,
            today,
            today,
          );

          if (results.length > 0) {
            const row = results[0]!;
            const metrics = row.metrics as Record<string, unknown> | undefined;

            await db
              .update(campaigns)
              .set({
                performanceMetrics: {
                  impressions: Number(metrics?.impressions ?? 0),
                  clicks: Number(metrics?.clicks ?? 0),
                  spend: Number(metrics?.cost_micros ?? 0) / 1_000_000,
                  ctr: Number(metrics?.ctr ?? 0),
                  cpc: Number(metrics?.average_cpc ?? 0) / 1_000_000,
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
