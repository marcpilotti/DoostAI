// Unified ad platform adapter interface
// Adding a new platform (e.g., TikTok) requires only implementing this interface

export type CampaignObjective = "awareness" | "traffic" | "conversions" | "leads";

export type TargetingParams = {
  locations?: string[];
  ageRange?: { min: number; max: number };
  interests?: string[];
  jobTitles?: string[];
  industries?: string[];
  companySize?: string[];
};

export type DateRange = {
  since: string; // YYYY-MM-DD
  until: string;
};

export type CreateCampaignParams = {
  name: string;
  objective: CampaignObjective;
  budget: { daily: number; currency: string };
  targeting: TargetingParams;
  adAccountId: string;
  startDate?: string;
  endDate?: string;
};

export type PlatformCampaignResult = {
  campaignId: string;
  platformName: string;
  status: string;
};

export type UploadCreativeParams = {
  imageUrl?: string;
  headline: string;
  bodyCopy: string;
  cta: string;
  destinationUrl: string;
};

export type PlatformCreativeResult = {
  creativeId: string;
  imageHash?: string;
};

export type CampaignInsights = {
  impressions: number;
  clicks: number;
  spend: number;
  ctr: number;
  cpc: number;
  conversions: number;
};

export type OAuthTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
};

export interface AdPlatformAdapter {
  readonly platform: "meta" | "google" | "linkedin";

  // Campaign lifecycle
  createCampaign(params: CreateCampaignParams): Promise<PlatformCampaignResult>;
  pauseCampaign(campaignId: string): Promise<void>;
  resumeCampaign(campaignId: string): Promise<void>;

  // Creative
  uploadCreative(params: UploadCreativeParams): Promise<PlatformCreativeResult>;

  // Insights
  getCampaignInsights(campaignId: string, dateRange: DateRange): Promise<CampaignInsights>;

  // Auth
  getOAuthUrl(redirectUri: string, state?: string): string;
  handleOAuthCallback(code: string, redirectUri: string): Promise<OAuthTokens>;
  refreshToken(refreshToken: string): Promise<OAuthTokens>;
}

// Factory
export function getPlatformAdapter(
  platform: "meta" | "google" | "linkedin",
  credentials: { accessToken: string; [key: string]: unknown },
): AdPlatformAdapter {
  switch (platform) {
    case "meta":
      return new MetaAdapterImpl(credentials);
    case "google":
      return new GoogleAdapterImpl(credentials);
    case "linkedin":
      return new LinkedInAdapterImpl(credentials);
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}

// Lightweight adapter implementations that delegate to existing clients

class MetaAdapterImpl implements AdPlatformAdapter {
  readonly platform = "meta" as const;
  private creds: Record<string, unknown>;

  constructor(creds: Record<string, unknown>) {
    this.creds = creds;
  }

  async createCampaign(params: CreateCampaignParams): Promise<PlatformCampaignResult> {
    const { MetaAdsClient, deployCampaign } = await import("./meta");
    const client = new MetaAdsClient(
      this.creds.accessToken as string,
      (this.creds.businessManagerId as string) ?? "",
    );
    const result = await deployCampaign(client, {
      adAccountId: params.adAccountId,
      name: params.name,
      objective: params.objective,
      dailyBudget: params.budget.daily,
      targeting: { countries: params.targeting.locations ?? ["SE"] },
      creatives: [],
    });
    return { campaignId: result.campaignId, platformName: "meta", status: "paused" };
  }

  async pauseCampaign(campaignId: string) {
    const { MetaAdsClient } = await import("./meta");
    const client = new MetaAdsClient(this.creds.accessToken as string, "");
    await client.updateCampaignStatus(campaignId, "PAUSED");
  }

  async resumeCampaign(campaignId: string) {
    const { MetaAdsClient } = await import("./meta");
    const client = new MetaAdsClient(this.creds.accessToken as string, "");
    await client.updateCampaignStatus(campaignId, "ACTIVE");
  }

  async uploadCreative(_params: UploadCreativeParams): Promise<PlatformCreativeResult> {
    return { creativeId: "pending" };
  }

  async getCampaignInsights(campaignId: string, dateRange: DateRange): Promise<CampaignInsights> {
    const { MetaAdsClient, getCampaignInsights } = await import("./meta");
    const client = new MetaAdsClient(this.creds.accessToken as string, "");
    const insights = await getCampaignInsights(client, campaignId, dateRange);
    const i = insights[0];
    return {
      impressions: i?.impressions ?? 0,
      clicks: i?.clicks ?? 0,
      spend: Number(i?.spend ?? 0),
      ctr: Number(i?.ctr ?? 0),
      cpc: Number(i?.cpc ?? 0),
      conversions: i?.conversions ?? 0,
    };
  }

  getOAuthUrl(redirectUri: string, state?: string): string {
    const { getOAuthUrl } = require("./meta") as typeof import("./meta");
    return getOAuthUrl(redirectUri, state);
  }

  async handleOAuthCallback(code: string, redirectUri: string): Promise<OAuthTokens> {
    const { exchangeCode, extendToken } = await import("./meta");
    const { accessToken } = await exchangeCode(code, redirectUri);
    const { accessToken: longToken, expiresIn } = await extendToken(accessToken);
    return { accessToken: longToken, expiresIn };
  }

  async refreshToken(): Promise<OAuthTokens> {
    return { accessToken: "", expiresIn: 0 };
  }
}

class GoogleAdapterImpl implements AdPlatformAdapter {
  readonly platform = "google" as const;
  private creds: Record<string, unknown>;

  constructor(creds: Record<string, unknown>) {
    this.creds = creds;
  }

  async createCampaign(params: CreateCampaignParams): Promise<PlatformCampaignResult> {
    const { GoogleAdsClient, deploySearchCampaign } = await import("./google");
    const client = GoogleAdsClient.fromEnv(this.creds.accessToken as string);
    const result = await deploySearchCampaign(client, {
      customerId: params.adAccountId,
      name: params.name,
      dailyBudgetMicros: params.budget.daily * 1_000_000,
      headlines: [params.name.slice(0, 30)],
      descriptions: ["Kontakta oss idag."],
      finalUrl: "https://doost.tech",
    });
    return { campaignId: result.campaignId, platformName: "google", status: "paused" };
  }

  async pauseCampaign() {}
  async resumeCampaign() {}
  async uploadCreative(): Promise<PlatformCreativeResult> { return { creativeId: "pending" }; }
  async getCampaignInsights(): Promise<CampaignInsights> { return { impressions: 0, clicks: 0, spend: 0, ctr: 0, cpc: 0, conversions: 0 }; }

  getOAuthUrl(redirectUri: string, state?: string): string {
    const { googleGetOAuthUrl } = require("./google") as typeof import("./google");
    return googleGetOAuthUrl(redirectUri, state);
  }

  async handleOAuthCallback(code: string, redirectUri: string): Promise<OAuthTokens> {
    const { googleExchangeCode } = await import("./google");
    return googleExchangeCode(code, redirectUri);
  }

  async refreshToken(refreshToken: string): Promise<OAuthTokens> {
    const { googleRefreshAccessToken } = await import("./google");
    const result = await googleRefreshAccessToken(refreshToken);
    return { accessToken: result.accessToken, expiresIn: result.expiresIn };
  }
}

class LinkedInAdapterImpl implements AdPlatformAdapter {
  readonly platform = "linkedin" as const;
  private creds: Record<string, unknown>;

  constructor(creds: Record<string, unknown>) {
    this.creds = creds;
  }

  async createCampaign(params: CreateCampaignParams): Promise<PlatformCampaignResult> {
    const { LinkedInAdsClient, deploySponsoredContent } = await import("./linkedin");
    const client = new LinkedInAdsClient(this.creds.accessToken as string);
    const result = await deploySponsoredContent(client, {
      adAccountId: params.adAccountId,
      name: params.name,
      objective: params.objective,
      dailyBudget: params.budget.daily,
      targeting: { locations: params.targeting.locations },
      creative: { headline: params.name, bodyCopy: "", cta: "Läs mer", destinationUrl: "https://doost.tech" },
    });
    return { campaignId: result.campaignId, platformName: "linkedin", status: "paused" };
  }

  async pauseCampaign() {}
  async resumeCampaign() {}
  async uploadCreative(): Promise<PlatformCreativeResult> { return { creativeId: "pending" }; }
  async getCampaignInsights(): Promise<CampaignInsights> { return { impressions: 0, clicks: 0, spend: 0, ctr: 0, cpc: 0, conversions: 0 }; }

  getOAuthUrl(redirectUri: string, state?: string): string {
    const { linkedinGetOAuthUrl } = require("./linkedin") as typeof import("./linkedin");
    return linkedinGetOAuthUrl(redirectUri, state);
  }

  async handleOAuthCallback(code: string, redirectUri: string): Promise<OAuthTokens> {
    const { linkedinExchangeCode } = await import("./linkedin");
    const result = await linkedinExchangeCode(code, redirectUri);
    return { accessToken: result.accessToken, refreshToken: result.refreshToken, expiresIn: result.expiresIn };
  }

  async refreshToken(refreshToken: string): Promise<OAuthTokens> {
    const { linkedinRefreshToken } = await import("./linkedin");
    const result = await linkedinRefreshToken(refreshToken);
    return { accessToken: result.accessToken, refreshToken: result.refreshToken, expiresIn: result.expiresIn };
  }
}
