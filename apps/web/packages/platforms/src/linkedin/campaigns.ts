import { LinkedInAdsClient } from "./client";
import type { LinkedInTargeting } from "./types";
import { OBJECTIVE_MAP, GEO_SWEDEN } from "./types";

export type DeployLinkedInCampaignInput = {
  adAccountId: string;
  name: string;
  objective: string;
  dailyBudget: number; // in SEK
  targeting: LinkedInTargeting;
  creative: {
    headline: string;
    bodyCopy: string;
    cta: string;
    imageUrl?: string;
    destinationUrl: string;
  };
};

export type DeployLinkedInCampaignResult = {
  campaignGroupId: string;
  campaignId: string;
  creativeId: string;
};

function buildTargetingCriteria(targeting: LinkedInTargeting) {
  const include: Record<string, unknown> = {};

  if (targeting.locations?.length) {
    include.locations = targeting.locations;
  } else {
    include.locations = [GEO_SWEDEN];
  }

  if (targeting.jobTitles?.length) {
    include.jobTitles = targeting.jobTitles.map(
      (t) => `urn:li:title:${t}`,
    );
  }

  if (targeting.industries?.length) {
    include.industries = targeting.industries.map(
      (i) => `urn:li:industry:${i}`,
    );
  }

  if (targeting.companySizes?.length) {
    include.staffCountRanges = targeting.companySizes;
  }

  if (targeting.seniorities?.length) {
    include.seniorities = targeting.seniorities.map(
      (s) => `urn:li:seniority:${s}`,
    );
  }

  return { include: { and: [include] } };
}

export async function deploySponsoredContent(
  client: LinkedInAdsClient,
  input: DeployLinkedInCampaignInput,
): Promise<DeployLinkedInCampaignResult> {
  const objective =
    OBJECTIVE_MAP[input.objective.toLowerCase()] ?? "WEBSITE_VISITS";

  // 1. Create campaign group
  const group = await client.createCampaignGroup(input.adAccountId, {
    name: input.name,
    status: "ACTIVE",
  });

  // 2. Create campaign
  const campaign = await client.createCampaign(input.adAccountId, {
    name: `${input.name} - Sponsored Content`,
    campaignGroupId: group.id,
    objective,
    dailyBudget: input.dailyBudget,
    targeting: buildTargetingCriteria(input.targeting),
    status: "PAUSED",
  });

  // 3. Upload image if provided
  let assetUrn: string | undefined;
  if (input.creative.imageUrl) {
    const asset = await client.uploadImage(input.creative.imageUrl);
    assetUrn = asset.assetUrn;
  }

  // 4. Create creative
  const creative = await client.createCreative(input.adAccountId, {
    campaignId: campaign.id,
    headline: input.creative.headline,
    bodyCopy: input.creative.bodyCopy,
    cta: input.creative.cta,
    assetUrn,
    destinationUrl: input.creative.destinationUrl,
  });

  return {
    campaignGroupId: group.id,
    campaignId: campaign.id,
    creativeId: creative.id,
  };
}

export async function getCampaignAnalytics(
  client: LinkedInAdsClient,
  campaignId: string,
  startDate: string,
  endDate: string,
) {
  const result = await client.getAnalytics(campaignId, startDate, endDate);
  return result.elements.map((el) => ({
    impressions: el.impressions,
    clicks: el.clicks,
    spend: Number(el.costInLocalCurrency),
    ctr: el.impressions > 0 ? el.clicks / el.impressions : 0,
    cpc:
      el.clicks > 0
        ? Number(el.costInLocalCurrency) / el.clicks
        : 0,
  }));
}

export async function pauseCampaign(
  client: LinkedInAdsClient,
  campaignId: string,
): Promise<void> {
  await client.updateCampaignStatus(campaignId, "PAUSED");
}

export async function resumeCampaign(
  client: LinkedInAdsClient,
  campaignId: string,
): Promise<void> {
  await client.updateCampaignStatus(campaignId, "ACTIVE");
}
