import { MetaAdsClient, deployCampaign, decryptToken } from "@doost/platforms";
import { adAccounts, campaigns, db, eq, and } from "@doost/db";

import { inngest } from "../client";

export const metaDeployCampaign = inngest.createFunction(
  {
    id: "meta-deploy-campaign",
    retries: 3,
    triggers: [{ event: "meta/deploy-campaign" }],
  },
  async ({ event, step }) => {
    const { campaignId, adAccountId, orgId } = event.data as {
      campaignId: string;
      adAccountId: string;
      orgId?: string;
    };

    // 1. Get campaign data from DB
    const campaign = await step.run("get-campaign", async () => {
      const [row] = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.id, campaignId))
        .limit(1);
      if (!row) throw new Error(`Campaign ${campaignId} not found`);
      return row;
    });

    // 2. Get ad account credentials from DB
    const account = await step.run("get-account", async () => {
      const [row] = await db
        .select()
        .from(adAccounts)
        .where(
          and(
            eq(adAccounts.platform, "meta"),
            orgId ? eq(adAccounts.orgId, orgId) : eq(adAccounts.id, adAccountId),
          ),
        )
        .limit(1);
      if (!row) throw new Error("No Meta ad account found");
      return row;
    });

    // 3. Decrypt token and deploy
    const result = await step.run("deploy-to-meta", async () => {
      if (!account.accessTokenEncrypted || !account.tokenIv) {
        throw new Error("No access token stored for Meta account");
      }
      const token = decryptToken(account.accessTokenEncrypted, account.tokenIv);
      const bmId = (account.metadata as { businessManagerId?: string })?.businessManagerId ?? "";
      const client = new MetaAdsClient(token, bmId);

      return deployCampaign(client, {
        adAccountId: account.platformAccountId,
        name: campaign.name,
        objective: campaign.objective ?? "traffic",
        dailyBudget: campaign.budget?.daily ?? 100,
        targeting: {
          countries: campaign.targeting?.locations ?? ["SE"],
          ageMin: campaign.targeting?.ageRange?.min,
          ageMax: campaign.targeting?.ageRange?.max,
        },
        creatives: [],
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
            meta: result.campaignId,
          },
          updatedAt: new Date(),
        })
        .where(eq(campaigns.id, campaignId));
    });

    return { metaCampaignId: result.campaignId };
  },
);
