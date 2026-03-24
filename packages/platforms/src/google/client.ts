import { GOOGLE_ERROR_MESSAGES } from "./types";

const GOOGLE_ADS_API_BASE = "https://googleads.googleapis.com/v18";

export class GoogleAdsClient {
  private developerToken: string;
  private mccCustomerId: string;
  private accessToken: string;

  constructor(opts: {
    developerToken: string;
    mccCustomerId: string;
    accessToken: string;
  }) {
    this.developerToken = opts.developerToken;
    this.mccCustomerId = opts.mccCustomerId.replace(/-/g, "");
    this.accessToken = opts.accessToken;
  }

  static fromEnv(accessToken: string): GoogleAdsClient {
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    const mccCustomerId = process.env.GOOGLE_ADS_MCC_ID;
    if (!developerToken || !mccCustomerId) {
      throw new Error(
        "GOOGLE_ADS_DEVELOPER_TOKEN and GOOGLE_ADS_MCC_ID must be set",
      );
    }
    return new GoogleAdsClient({ developerToken, mccCustomerId, accessToken });
  }

  private async request<T>(
    path: string,
    options: {
      method?: "GET" | "POST" | "DELETE";
      customerId?: string;
      body?: unknown;
    } = {},
  ): Promise<T> {
    const url = `${GOOGLE_ADS_API_BASE}${path}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.accessToken}`,
      "developer-token": this.developerToken,
      "Content-Type": "application/json",
    };

    // For operations on client accounts, set login-customer-id to MCC
    if (options.customerId) {
      headers["login-customer-id"] = this.mccCustomerId;
    }

    const res = await fetch(url, {
      method: options.method ?? (options.body ? "POST" : "GET"),
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = (await res.json()) as T & {
      error?: {
        code: number;
        message: string;
        errors?: Array<{ errorCode?: Record<string, string> }>;
      };
    };

    if (!res.ok || data.error) {
      const errorCode =
        data.error?.errors?.[0]?.errorCode
          ? Object.values(data.error.errors[0].errorCode)[0]
          : undefined;
      const friendly =
        (errorCode ? GOOGLE_ERROR_MESSAGES[errorCode] : undefined) ??
        data.error?.message ??
        "Unknown Google Ads error";
      throw new GoogleAdsError(
        data.error?.code ?? res.status,
        friendly,
        errorCode,
      );
    }

    return data;
  }

  // --- Account management ---

  async createCustomerClient(
    companyName: string,
    currencyCode: string = "SEK",
    timeZone: string = "Europe/Stockholm",
  ): Promise<{ customerId: string }> {
    const result = await this.request<{
      resourceName: string;
    }>(
      `/customers/${this.mccCustomerId}:createCustomerClient`,
      {
        body: {
          customerId: this.mccCustomerId,
          customerClient: {
            descriptiveName: companyName,
            currencyCode,
            timeZone,
          },
        },
      },
    );

    // resourceName format: customers/{mccId}/customerClients/{newId}
    const newId = result.resourceName.split("/").pop()!;
    return { customerId: newId };
  }

  // --- Campaign operations ---

  async mutate(
    customerId: string,
    operations: Array<{
      entity: string;
      operation: "create" | "update" | "remove";
      resource: Record<string, unknown>;
    }>,
  ): Promise<Array<{ resourceName: string }>> {
    // Google Ads uses googleads:mutate for batch operations
    const mutateOps = operations.map((op) => ({
      [`${op.entity}Operation`]: {
        [op.operation]: op.resource,
      },
    }));

    const result = await this.request<{
      mutateOperationResponses: Array<{
        [key: string]: { resourceName: string };
      }>;
    }>(`/customers/${customerId}/googleAds:mutate`, {
      customerId,
      body: { mutateOperations: mutateOps },
    });

    return result.mutateOperationResponses.map((r) => {
      const response = Object.values(r)[0]!;
      return { resourceName: response.resourceName };
    });
  }

  // --- Search (GAQL) ---

  async search(
    customerId: string,
    query: string,
  ): Promise<Array<Record<string, unknown>>> {
    const result = await this.request<{
      results?: Array<Record<string, unknown>>;
    }>(`/customers/${customerId}/googleAds:searchStream`, {
      customerId,
      body: { query },
    });

    return result.results ?? [];
  }

  // --- Convenience methods ---

  async getCampaignMetrics(
    customerId: string,
    campaignId: string,
    startDate: string,
    endDate: string,
  ): Promise<Array<Record<string, unknown>>> {
    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr,
        metrics.average_cpc
      FROM campaign
      WHERE campaign.id = ${campaignId}
        AND segments.date BETWEEN '${startDate}' AND '${endDate}'
    `;

    return this.search(customerId, query);
  }

  async updateCampaignStatus(
    customerId: string,
    campaignResourceName: string,
    status: "ENABLED" | "PAUSED" | "REMOVED",
  ): Promise<void> {
    await this.mutate(customerId, [
      {
        entity: "campaign",
        operation: "update",
        resource: {
          resourceName: campaignResourceName,
          status,
        },
      },
    ]);
  }
}

export class GoogleAdsError extends Error {
  code: number;
  errorCode?: string;

  constructor(code: number, message: string, errorCode?: string) {
    super(message);
    this.name = "GoogleAdsError";
    this.code = code;
    this.errorCode = errorCode;
  }
}
