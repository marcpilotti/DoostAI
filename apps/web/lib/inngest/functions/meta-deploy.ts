import { MetaAdsClient, deployCampaign } from "@doost/platforms";
import { campaigns, db, eq } from "@doost/db";

import { inngest } from "../client";

export const metaDeployCampaign = inngest.createFunction(
  {
    id: "meta-deploy-campaign",
    retries: 3,
    triggers: [{ event: "meta/deploy-campaign" }],
  },
  async ({ event, step }) => {
    const {
      campaignId,
      adAccountId,
      accessToken,
      businessManagerId,
    } = event.data as {
      campaignId: string;
      adAccountId: string;
      accessToken: string;
      businessManagerId: string;
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

    // 2. Deploy to Meta
    const result = await step.run("deploy-to-meta", async () => {
      const client = new MetaAdsClient(accessToken, businessManagerId);

      return deployCampaign(client, {
        adAccountId,
        name: campaign.name,
        objective: campaign.objective ?? "traffic",
        dailyBudget: campaign.budget?.daily ?? 100,
        targeting: {
          countries: campaign.targeting?.locations ?? ["SE"],
          ageMin: campaign.targeting?.ageRange?.min,
          ageMax: campaign.targeting?.ageRange?.max,
        },
        creatives: [], // populated from ad_creatives in real flow
      });
    });

    // 3. Update campaign with platform IDs
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
