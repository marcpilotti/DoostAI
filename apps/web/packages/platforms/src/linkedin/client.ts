import { LINKEDIN_ERROR_MESSAGES } from "./types";

const LINKEDIN_API_BASE = "https://api.linkedin.com/rest";

function useMock(): boolean {
  return (
    process.env.LINKEDIN_MOCK === "true" ||
    !process.env.LINKEDIN_CLIENT_ID ||
    process.env.LINKEDIN_CLIENT_ID === "..."
  );
}

export class LinkedInAdsClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async request<T>(
    path: string,
    options: {
      method?: "GET" | "POST" | "PATCH" | "DELETE";
      body?: unknown;
      params?: Record<string, string>;
    } = {},
  ): Promise<T> {
    if (useMock()) {
      return this.mockRequest<T>(path, options);
    }

    const url = new URL(`${LINKEDIN_API_BASE}${path}`);
    if (options.params) {
      for (const [k, v] of Object.entries(options.params)) {
        url.searchParams.set(k, v);
      }
    }

    const res = await fetch(url.toString(), {
      method: options.method ?? (options.body ? "POST" : "GET"),
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        "LinkedIn-Version": "202401",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!res.ok) {
      const friendly =
        LINKEDIN_ERROR_MESSAGES[res.status] ?? `LinkedIn API error: ${res.status}`;
      const body = await res.text().catch(() => "");
      throw new LinkedInApiError(res.status, friendly, body);
    }

    if (res.status === 204) return {} as T;

    return res.json() as Promise<T>;
  }

  // --- Mock responses ---

  private async mockRequest<T>(
    path: string,
    _options: { method?: string; body?: unknown; params?: Record<string, string> },
  ): Promise<T> {
    const id = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    if (path.includes("/campaignGroups")) {
      return { id, name: "Mock Campaign Group" } as T;
    }
    if (path.includes("/campaigns") && !path.includes("/analytics")) {
      return { id, name: "Mock Campaign" } as T;
    }
    if (path.includes("/creatives")) {
      return { id } as T;
    }
    if (path.includes("/assets")) {
      return {
        id,
        downloadUrl: "https://via.placeholder.com/1200x627",
      } as T;
    }
    if (path.includes("/analytics")) {
      return {
        elements: [
          {
            impressions: 1250,
            clicks: 45,
            costInLocalCurrency: "350.00",
            dateRange: {
              start: { year: 2026, month: 3, day: 24 },
              end: { year: 2026, month: 3, day: 24 },
            },
          },
        ],
      } as T;
    }

    return { id } as T;
  }

  // --- Campaign Group ---

  async createCampaignGroup(
    adAccountId: string,
    params: { name: string; status?: string },
  ): Promise<{ id: string }> {
    return this.request<{ id: string }>("/campaignGroups", {
      body: {
        account: `urn:li:sponsoredAccount:${adAccountId}`,
        name: params.name,
        status: params.status ?? "DRAFT",
      },
    });
  }

  // --- Campaign ---

  async createCampaign(
    adAccountId: string,
    params: {
      name: string;
      campaignGroupId: string;
      objective: string;
      dailyBudget: number; // in currency units
      targeting: Record<string, unknown>;
      status?: string;
    },
  ): Promise<{ id: string }> {
    return this.request<{ id: string }>("/campaigns", {
      body: {
        account: `urn:li:sponsoredAccount:${adAccountId}`,
        campaignGroup: `urn:li:sponsoredCampaignGroup:${params.campaignGroupId}`,
        name: params.name,
        objectiveType: params.objective,
        type: "SPONSORED_UPDATES",
        costType: "CPM",
        dailyBudget: {
          currencyCode: "SEK",
          amount: String(params.dailyBudget),
        },
        targetingCriteria: params.targeting,
        status: params.status ?? "PAUSED",
      },
    });
  }

  // --- Creative ---

  async uploadImage(imageUrl: string): Promise<{ assetUrn: string }> {
    const result = await this.request<{
      id: string;
      downloadUrl?: string;
    }>("/assets?action=registerUpload", {
      body: {
        registerUploadRequest: {
          recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
          owner: "urn:li:organization:0", // replaced with actual org
          serviceRelationships: [
            {
              relationshipType: "OWNER",
              identifier: "urn:li:userGeneratedContent",
            },
          ],
        },
      },
    });
    return { assetUrn: `urn:li:digitalmediaAsset:${result.id}` };
  }

  async createCreative(
    adAccountId: string,
    params: {
      campaignId: string;
      headline: string;
      bodyCopy: string;
      cta: string;
      assetUrn?: string;
      destinationUrl: string;
    },
  ): Promise<{ id: string }> {
    return this.request<{ id: string }>("/creatives", {
      body: {
        campaign: `urn:li:sponsoredCampaign:${params.campaignId}`,
        content: {
          sponsoredContent: {
            share: {
              text: params.bodyCopy,
              media: params.assetUrn
                ? {
                    title: params.headline,
                    landingPage: params.destinationUrl,
                    id: params.assetUrn,
                  }
                : undefined,
            },
          },
        },
        callToAction: {
          action: mapLinkedInCta(params.cta),
          destinationUrl: params.destinationUrl,
        },
      },
    });
  }

  // --- Analytics ---

  async getAnalytics(
    campaignId: string,
    startDate: string,
    endDate: string,
  ): Promise<{
    elements: Array<{
      impressions: number;
      clicks: number;
      costInLocalCurrency: string;
      dateRange: unknown;
    }>;
  }> {
    const [startY, startM, startD] = startDate.split("-").map(Number);
    const [endY, endM, endD] = endDate.split("-").map(Number);

    return this.request("/adAnalytics", {
      params: {
        q: "analytics",
        pivot: "CAMPAIGN",
        campaigns: `urn:li:sponsoredCampaign:${campaignId}`,
        dateRange: JSON.stringify({
          start: { year: startY, month: startM, day: startD },
          end: { year: endY, month: endM, day: endD },
        }),
        fields:
          "impressions,clicks,costInLocalCurrency,externalWebsiteConversions",
      },
    });
  }

  // --- Status ---

  async updateCampaignStatus(
    campaignId: string,
    status: "ACTIVE" | "PAUSED" | "ARCHIVED",
  ): Promise<void> {
    await this.request(`/campaigns/${campaignId}`, {
      method: "PATCH",
      body: { patch: { $set: { status } } },
    });
  }
}

function mapLinkedInCta(cta: string): string {
  const lower = cta.toLowerCase();
  if (lower.includes("ladda") || lower.includes("download")) return "DOWNLOAD";
  if (lower.includes("registrera") || lower.includes("sign")) return "SIGN_UP";
  if (lower.includes("boka") || lower.includes("demo")) return "REQUEST_DEMO";
  if (lower.includes("kontakt")) return "CONTACT_US";
  return "LEARN_MORE";
}

export class LinkedInApiError extends Error {
  code: number;
  rawBody?: string;

  constructor(code: number, message: string, rawBody?: string) {
    super(message);
    this.name = "LinkedInApiError";
    this.code = code;
    this.rawBody = rawBody;
  }
}
