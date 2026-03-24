import { GoogleAdsClient } from "./client";

export type DeploySearchCampaignInput = {
  customerId: string;
  name: string;
  dailyBudgetMicros: number; // 100 SEK = 100_000_000
  headlines: string[]; // 3-15 headlines, each ≤30 chars
  descriptions: string[]; // 2-4 descriptions, each ≤90 chars
  finalUrl: string;
  keywords?: string[];
  locations?: string[]; // geo target constants like "2752" for Sweden
};

export type DeploySearchCampaignResult = {
  campaignResourceName: string;
  adGroupResourceName: string;
  adResourceName: string;
  campaignId: string;
};

export async function createClientAccount(
  client: GoogleAdsClient,
  companyName: string,
  currency: string = "SEK",
  timezone: string = "Europe/Stockholm",
): Promise<{ customerId: string }> {
  return client.createCustomerClient(companyName, currency, timezone);
}

export async function deploySearchCampaign(
  client: GoogleAdsClient,
  input: DeploySearchCampaignInput,
): Promise<DeploySearchCampaignResult> {
  const customerId = input.customerId.replace(/-/g, "");

  // Step 1: Create campaign budget
  const [budgetResult] = await client.mutate(customerId, [
    {
      entity: "campaignBudget",
      operation: "create",
      resource: {
        name: `${input.name} Budget`,
        amountMicros: String(input.dailyBudgetMicros),
        deliveryMethod: "STANDARD",
      },
    },
  ]);

  // Step 2: Create campaign
  const [campaignResult] = await client.mutate(customerId, [
    {
      entity: "campaign",
      operation: "create",
      resource: {
        name: input.name,
        advertisingChannelType: "SEARCH",
        status: "PAUSED",
        campaignBudget: budgetResult!.resourceName,
        biddingStrategyType: "MAXIMIZE_CLICKS",
        networkSettings: {
          targetGoogleSearch: true,
          targetSearchNetwork: true,
          targetContentNetwork: false,
        },
        ...(input.locations?.length
          ? {
              geoTargetTypeSetting: {
                positiveGeoTargetType: "PRESENCE",
              },
            }
          : {}),
      },
    },
  ]);

  const campaignResourceName = campaignResult!.resourceName;
  const campaignId = campaignResourceName.split("/").pop()!;

  // Step 3: Add geo targets if specified
  if (input.locations?.length) {
    await client.mutate(
      customerId,
      input.locations.map((loc) => ({
        entity: "campaignCriterion",
        operation: "create" as const,
        resource: {
          campaign: campaignResourceName,
          location: {
            geoTargetConstant: `geoTargetConstants/${loc}`,
          },
        },
      })),
    );
  }

  // Step 4: Create ad group
  const [adGroupResult] = await client.mutate(customerId, [
    {
      entity: "adGroup",
      operation: "create",
      resource: {
        name: `${input.name} - Ad Group`,
        campaign: campaignResourceName,
        type: "SEARCH_STANDARD",
        status: "ENABLED",
        cpcBidMicros: String(5_000_000), // 5 SEK default CPC bid
      },
    },
  ]);

  const adGroupResourceName = adGroupResult!.resourceName;

  // Step 5: Add keywords if provided
  if (input.keywords?.length) {
    await client.mutate(
      customerId,
      input.keywords.slice(0, 20).map((kw) => ({
        entity: "adGroupCriterion",
        operation: "create" as const,
        resource: {
          adGroup: adGroupResourceName,
          keyword: {
            text: kw,
            matchType: "BROAD",
          },
          status: "ENABLED",
        },
      })),
    );
  }

  // Step 6: Create responsive search ad
  const headlineAssets = input.headlines.slice(0, 15).map((text, i) => ({
    text,
    pinnedField: i === 0 ? "HEADLINE_1" : undefined,
  }));

  const descriptionAssets = input.descriptions
    .slice(0, 4)
    .map((text) => ({ text }));

  const [adResult] = await client.mutate(customerId, [
    {
      entity: "adGroupAd",
      operation: "create",
      resource: {
        adGroup: adGroupResourceName,
        status: "ENABLED",
        ad: {
          responsiveSearchAd: {
            headlines: headlineAssets,
            descriptions: descriptionAssets,
          },
          finalUrls: [input.finalUrl],
        },
      },
    },
  ]);

  return {
    campaignResourceName,
    adGroupResourceName,
    adResourceName: adResult!.resourceName,
    campaignId,
  };
}

export async function pauseCampaign(
  client: GoogleAdsClient,
  customerId: string,
  campaignResourceName: string,
): Promise<void> {
  await client.updateCampaignStatus(
    customerId,
    campaignResourceName,
    "PAUSED",
  );
}

export async function resumeCampaign(
  client: GoogleAdsClient,
  customerId: string,
  campaignResourceName: string,
): Promise<void> {
  await client.updateCampaignStatus(
    customerId,
    campaignResourceName,
    "ENABLED",
  );
}

export async function getCampaignMetrics(
  client: GoogleAdsClient,
  customerId: string,
  campaignId: string,
  startDate: string,
  endDate: string,
) {
  return client.getCampaignMetrics(customerId, campaignId, startDate, endDate);
}
