import {
  GoogleAdsClient,
  deploySearchCampaign,
  decryptToken,
  googleRefreshAccessToken,
  encryptToken,
} from "@doost/platforms";
import { adAccounts, campaigns, db, eq } from "@doost/db";

import { inngest } from "../client";

export const googleDeployCampaign = inngest.createFunction(
  {
    id: "google-deploy-campaign",
    retries: 3,
    triggers: [{ event: "google/deploy-campaign" }],
  },
  async ({ event, step }) => {
    const { campaignId, adAccountId } = event.data as {
      campaignId: string;
      adAccountId: string;
    };

    // 1. Get campaign + account data
    const { campaign, account } = await step.run("get-data", async () => {
      const [campaignRow] = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.id, campaignId))
        .limit(1);
      const [accountRow] = await db
        .select()
        .from(adAccounts)
        .where(eq(adAccounts.id, adAccountId))
        .limit(1);
      if (!campaignRow) throw new Error(`Campaign ${campaignId} not found`);
      if (!accountRow) throw new Error(`Ad account ${adAccountId} not found`);
      return { campaign: campaignRow, account: accountRow };
    });

    // 2. Refresh access token
    const accessToken = await step.run("refresh-token", async () => {
      if (!account.refreshTokenEncrypted || !account.tokenIv) {
        throw new Error("No refresh token stored");
      }
      const refreshToken = decryptToken(
        account.refreshTokenEncrypted,
        account.tokenIv,
      );
      const { accessToken: newToken } =
        await googleRefreshAccessToken(refreshToken);

      const { encrypted, iv } = encryptToken(newToken);
      await db
        .update(adAccounts)
        .set({
          accessTokenEncrypted: encrypted,
          tokenIv: iv,
          tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
          updatedAt: new Date(),
        })
        .where(eq(adAccounts.id, adAccountId));

      return newToken;
    });

    // 3. Deploy to Google Ads
    const result = await step.run("deploy", async () => {
      const client = GoogleAdsClient.fromEnv(accessToken);

      const dailyBudget = campaign.budget?.daily ?? 100;

      return deploySearchCampaign(client, {
        customerId: account.platformAccountId,
        name: campaign.name,
        dailyBudgetMicros: dailyBudget * 1_000_000, // SEK to micros
        headlines: ["Headline 1", "Headline 2", "Headline 3"], // from ad_creatives in real flow
        descriptions: ["Description 1", "Description 2"],
        finalUrl: "https://doost.tech", // TODO: use brand profile URL from campaign
        locations: campaign.targeting?.locations?.includes("SE")
          ? ["2752"]
          : undefined,
      });
    });

    // 4. Update campaign with platform IDs
    await step.run("update-campaign", async () => {
      await db
        .update(campaigns)
        .set({
          status: "live",
          platformCampaignIds: {
            ...campaign.platformCampaignIds,
            google: result.campaignId,
          },
          updatedAt: new Date(),
        })
        .where(eq(campaigns.id, campaignId));
    });

    return { googleCampaignId: result.campaignId };
  },
);
