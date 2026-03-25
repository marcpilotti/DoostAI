import {
  LinkedInAdsClient,
  deploySponsoredContent,
  decryptToken,
} from "@doost/platforms";
import { adAccounts, campaigns, db, eq } from "@doost/db";

import { inngest } from "../client";

export const linkedinDeployCampaign = inngest.createFunction(
  {
    id: "linkedin-deploy-campaign",
    retries: 3,
    triggers: [{ event: "linkedin/deploy-campaign" }],
  },
  async ({ event, step }) => {
    const { campaignId, adAccountId } = event.data as {
      campaignId: string;
      adAccountId: string;
    };

    const { campaign, account } = await step.run("get-data", async () => {
      const [c] = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.id, campaignId))
        .limit(1);
      const [a] = await db
        .select()
        .from(adAccounts)
        .where(eq(adAccounts.id, adAccountId))
        .limit(1);
      if (!c) throw new Error(`Campaign ${campaignId} not found`);
      if (!a) throw new Error(`Ad account ${adAccountId} not found`);
      return { campaign: c, account: a };
    });

    const result = await step.run("deploy", async () => {
      if (!account.accessTokenEncrypted || !account.tokenIv) {
        throw new Error("No access token stored");
      }
      const token = decryptToken(
        account.accessTokenEncrypted,
        account.tokenIv,
      );
      const client = new LinkedInAdsClient(token);

      return deploySponsoredContent(client, {
        adAccountId: account.platformAccountId,
        name: campaign.name,
        objective: campaign.objective ?? "traffic",
        dailyBudget: campaign.budget?.daily ?? 100,
        targeting: {
          locations: campaign.targeting?.locations,
          jobTitles: campaign.targeting?.jobTitles,
          industries: campaign.targeting?.industries,
          companySizes: campaign.targeting?.companySize,
        },
        creative: {
          headline: campaign.name,
          bodyCopy: "",
          cta: "Läs mer",
          destinationUrl: "https://doost.tech", // TODO: use brand profile URL from campaign
        },
      });
    });

    await step.run("update-campaign", async () => {
      await db
        .update(campaigns)
        .set({
          status: "live",
          platformCampaignIds: {
            ...campaign.platformCampaignIds,
            linkedin: result.campaignId,
          },
          updatedAt: new Date(),
        })
        .where(eq(campaigns.id, campaignId));
    });

    return { linkedinCampaignId: result.campaignId };
  },
);
