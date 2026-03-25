import { META_ERROR_MESSAGES } from "./types";

const META_API_BASE = "https://graph.facebook.com/v21.0";

type RateLimitInfo = {
  callCount: number;
  totalCpuTime: number;
  totalTime: number;
};

export class MetaAdsClient {
  private token: string;
  private businessManagerId: string;
  private rateLimit: RateLimitInfo = {
    callCount: 0,
    totalCpuTime: 0,
    totalTime: 0,
  };

  constructor(token: string, businessManagerId: string) {
    this.token = token;
    this.businessManagerId = businessManagerId;
  }

  static fromEnv(): MetaAdsClient {
    const token = process.env.META_SYSTEM_USER_TOKEN;
    const bmId = process.env.META_BUSINESS_MANAGER_ID;
    if (!token || !bmId) {
      throw new Error(
        "META_SYSTEM_USER_TOKEN and META_BUSINESS_MANAGER_ID must be set",
      );
    }
    return new MetaAdsClient(token, bmId);
  }

  private async request<T>(
    path: string,
    options: {
      method?: "GET" | "POST" | "DELETE";
      params?: Record<string, string>;
      body?: Record<string, unknown>;
    } = {},
  ): Promise<T> {
    // Back off if nearing rate limit
    if (this.rateLimit.callCount > 80) {
      const backoffMs = Math.min(
        (this.rateLimit.callCount - 80) * 500,
        30_000,
      );
      await new Promise((r) => setTimeout(r, backoffMs));
    }

    const url = new URL(`${META_API_BASE}${path}`);
    if (options.params) {
      for (const [k, v] of Object.entries(options.params)) {
        url.searchParams.set(k, v);
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
    };

    const fetchOptions: RequestInit = {
      method: options.method ?? "GET",
      headers,
    };

    if (options.body) {
      fetchOptions.method = "POST";
      headers["Content-Type"] = "application/json";
      fetchOptions.body = JSON.stringify(options.body);
    }

    const res = await fetch(url.toString(), fetchOptions);

    // Track rate limits from response header
    const usageHeader = res.headers.get("x-business-use-case-usage");
    if (usageHeader) {
      try {
        const usage = JSON.parse(usageHeader);
        const firstEntry = Object.values(usage)[0] as
          | Array<{
              call_count: number;
              total_cputime: number;
              total_time: number;
            }>
          | undefined;
        if (firstEntry?.[0]) {
          this.rateLimit = {
            callCount: firstEntry[0].call_count,
            totalCpuTime: firstEntry[0].total_cputime,
            totalTime: firstEntry[0].total_time,
          };
        }
      } catch {
        // ignore parse errors
      }
    }

    const data = (await res.json()) as T & {
      error?: { code: number; message: string };
    };

    if (!res.ok || data.error) {
      const code = data.error?.code ?? res.status;
      const friendly =
        META_ERROR_MESSAGES[code] ?? data.error?.message ?? "Unknown error";
      throw new MetaApiError(code, friendly, data.error?.message);
    }

    return data;
  }

  // --- Account Management ---

  async createAdAccount(
    name: string,
    currency: string = "SEK",
    timezone: string = "Europe/Stockholm",
  ): Promise<{ id: string }> {
    return this.request<{ id: string }>(
      `/${this.businessManagerId}/adaccount`,
      {
        body: {
          name,
          currency,
          timezone_id: timezone === "Europe/Stockholm" ? 48 : 1,
          end_advertiser: this.businessManagerId,
          media_agency: "NONE",
          partner: "NONE",
        },
      },
    );
  }

  // --- Campaign CRUD ---

  async createCampaign(
    adAccountId: string,
    params: {
      name: string;
      objective: string;
      status?: string;
      special_ad_categories?: string[];
    },
  ): Promise<{ id: string }> {
    return this.request<{ id: string }>(`/act_${adAccountId}/campaigns`, {
      body: {
        ...params,
        status: params.status ?? "PAUSED",
        special_ad_categories: params.special_ad_categories ?? [],
      },
    });
  }

  async createAdSet(
    adAccountId: string,
    params: {
      name: string;
      campaign_id: string;
      daily_budget: number; // in smallest currency unit (öre for SEK)
      billing_event: string;
      optimization_goal: string;
      targeting: Record<string, unknown>;
      start_time?: string;
      end_time?: string;
      status?: string;
    },
  ): Promise<{ id: string }> {
    return this.request<{ id: string }>(`/act_${adAccountId}/adsets`, {
      body: { ...params, status: params.status ?? "PAUSED" },
    });
  }

  async createAd(
    adAccountId: string,
    params: {
      name: string;
      adset_id: string;
      creative: { creative_id: string };
      status?: string;
    },
  ): Promise<{ id: string }> {
    return this.request<{ id: string }>(`/act_${adAccountId}/ads`, {
      body: { ...params, status: params.status ?? "PAUSED" },
    });
  }

  // --- Creative ---

  async uploadImage(
    adAccountId: string,
    imageUrl: string,
  ): Promise<{ hash: string; url: string }> {
    const result = await this.request<{
      images: Record<string, { hash: string; url: string }>;
    }>(`/act_${adAccountId}/adimages`, {
      body: { url: imageUrl },
    });
    const firstImage = Object.values(result.images)[0];
    if (!firstImage) throw new Error("No image returned from upload");
    return firstImage;
  }

  async createAdCreative(
    adAccountId: string,
    spec: Record<string, unknown>,
  ): Promise<{ id: string }> {
    return this.request<{ id: string }>(`/act_${adAccountId}/adcreatives`, {
      body: spec,
    });
  }

  // --- Insights ---

  async getInsights(
    objectId: string,
    params: {
      fields: string;
      time_range?: { since: string; until: string };
      level?: string;
    },
  ): Promise<{ data: Record<string, unknown>[] }> {
    const queryParams: Record<string, string> = {
      fields: params.fields,
    };
    if (params.time_range) {
      queryParams.time_range = JSON.stringify(params.time_range);
    }
    if (params.level) {
      queryParams.level = params.level;
    }
    return this.request<{ data: Record<string, unknown>[] }>(
      `/${objectId}/insights`,
      { params: queryParams },
    );
  }

  // --- Status ---

  async updateCampaignStatus(
    campaignId: string,
    status: "ACTIVE" | "PAUSED" | "DELETED",
  ): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/${campaignId}`, {
      body: { status },
    });
  }

  getRateLimitInfo(): RateLimitInfo {
    return { ...this.rateLimit };
  }
}

export class MetaApiError extends Error {
  code: number;
  rawMessage?: string;

  constructor(code: number, message: string, rawMessage?: string) {
    super(message);
    this.name = "MetaApiError";
    this.code = code;
    this.rawMessage = rawMessage;
  }
}
