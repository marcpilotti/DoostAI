import { MetaAdsClient } from "./client";
import type { MetaInsight, MetaTargeting } from "./types";
import { OBJECTIVE_MAP } from "./types";

export type DeployCampaignInput = {
  adAccountId: string;
  name: string;
  objective: string;
  dailyBudget: number; // in SEK
  targeting: {
    countries?: string[];
    ageMin?: number;
    ageMax?: number;
    interests?: Array<{ id: string; name: string }>;
  };
  creatives: Array<{
    name: string;
    headline: string;
    bodyCopy: string;
    cta: string;
    imageUrl?: string;
    pageId: string;
    linkUrl: string;
  }>;
  startTime?: string;
  endTime?: string;
};

export type DeployCampaignResult = {
  campaignId: string;
  adSetId: string;
  adIds: string[];
};

export async function deployCampaign(
  client: MetaAdsClient,
  input: DeployCampaignInput,
): Promise<DeployCampaignResult> {
  const objective = OBJECTIVE_MAP[input.objective.toLowerCase()] ?? "OUTCOME_TRAFFIC";

  // 1. Create campaign
  const campaign = await client.createCampaign(input.adAccountId, {
    name: input.name,
    objective,
    status: "PAUSED",
  });

  // 2. Build targeting spec
  const targeting: MetaTargeting = {};
  if (input.targeting.countries?.length) {
    targeting.geo_locations = { countries: input.targeting.countries };
  }
  if (input.targeting.ageMin) targeting.age_min = input.targeting.ageMin;
  if (input.targeting.ageMax) targeting.age_max = input.targeting.ageMax;
  if (input.targeting.interests?.length) {
    targeting.interests = input.targeting.interests;
  }

  // 3. Create ad set
  const adSet = await client.createAdSet(input.adAccountId, {
    name: `${input.name} - Ad Set`,
    campaign_id: campaign.id,
    daily_budget: input.dailyBudget * 100, // SEK to öre
    billing_event: "IMPRESSIONS",
    optimization_goal: objective === "OUTCOME_LEADS" ? "LEAD_GENERATION" : "LINK_CLICKS",
    targeting: targeting as Record<string, unknown>,
    start_time: input.startTime,
    end_time: input.endTime,
    status: "PAUSED",
  });

  // 4. Create ads from creatives
  const adIds: string[] = [];
  for (const creative of input.creatives) {
    // Upload image if provided
    let imageHash: string | undefined;
    if (creative.imageUrl) {
      const image = await client.uploadImage(
        input.adAccountId,
        creative.imageUrl,
      );
      imageHash = image.hash;
    }

    // Create ad creative
    const ctaType = mapCtaType(creative.cta);
    const adCreative = await client.createAdCreative(input.adAccountId, {
      name: creative.name,
      object_story_spec: {
        page_id: creative.pageId,
        link_data: {
          link: creative.linkUrl,
          message: creative.bodyCopy,
          name: creative.headline,
          call_to_action: {
            type: ctaType,
            value: { link: creative.linkUrl },
          },
          ...(imageHash ? { image_hash: imageHash } : {}),
        },
      },
    });

    // Create ad
    const ad = await client.createAd(input.adAccountId, {
      name: creative.name,
      adset_id: adSet.id,
      creative: { creative_id: adCreative.id },
      status: "PAUSED",
    });

    adIds.push(ad.id);
  }

  return {
    campaignId: campaign.id,
    adSetId: adSet.id,
    adIds,
  };
}

export async function pauseCampaign(
  client: MetaAdsClient,
  campaignId: string,
): Promise<void> {
  await client.updateCampaignStatus(campaignId, "PAUSED");
}

export async function resumeCampaign(
  client: MetaAdsClient,
  campaignId: string,
): Promise<void> {
  await client.updateCampaignStatus(campaignId, "ACTIVE");
}

export async function deleteCampaign(
  client: MetaAdsClient,
  campaignId: string,
): Promise<void> {
  await client.updateCampaignStatus(campaignId, "DELETED");
}

export async function getCampaignInsights(
  client: MetaAdsClient,
  campaignId: string,
  dateRange?: { since: string; until: string },
): Promise<MetaInsight[]> {
  const result = await client.getInsights(campaignId, {
    fields: "impressions,clicks,spend,ctr,cpc,actions",
    time_range: dateRange,
  });

  return result.data.map((row) => ({
    impressions: Number(row.impressions ?? 0),
    clicks: Number(row.clicks ?? 0),
    spend: String(row.spend ?? "0"),
    ctr: String(row.ctr ?? "0"),
    cpc: String(row.cpc ?? "0"),
    conversions: extractConversions(row.actions),
    date_start: String(row.date_start ?? ""),
    date_stop: String(row.date_stop ?? ""),
  }));
}

function extractConversions(
  actions: unknown,
): number {
  if (!Array.isArray(actions)) return 0;
  const conversion = actions.find(
    (a: Record<string, unknown>) =>
      a.action_type === "offsite_conversion" ||
      a.action_type === "lead",
  ) as { value?: string } | undefined;
  return Number(conversion?.value ?? 0);
}

function mapCtaType(cta: string): string {
  const lower = cta.toLowerCase();
  if (lower.includes("köp") || lower.includes("buy")) return "SHOP_NOW";
  if (lower.includes("boka") || lower.includes("book")) return "BOOK_NOW";
  if (lower.includes("registrera") || lower.includes("sign")) return "SIGN_UP";
  if (lower.includes("kontakt") || lower.includes("contact")) return "CONTACT_US";
  if (lower.includes("ladda") || lower.includes("download")) return "DOWNLOAD";
  return "LEARN_MORE";
}
