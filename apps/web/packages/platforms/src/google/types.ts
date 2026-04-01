export type GoogleCampaignStatus =
  | "ENABLED"
  | "PAUSED"
  | "REMOVED";

export type GoogleAdType = "RESPONSIVE_SEARCH_AD";

export type GoogleBudgetDelivery = "STANDARD" | "ACCELERATED";

export type GoogleBiddingStrategy =
  | "MAXIMIZE_CLICKS"
  | "MAXIMIZE_CONVERSIONS"
  | "TARGET_CPA"
  | "TARGET_ROAS"
  | "MANUAL_CPC";

export type GoogleCampaignObjective =
  | "SEARCH"
  | "DISPLAY"
  | "PERFORMANCE_MAX";

export type GoogleMetrics = {
  impressions: number;
  clicks: number;
  cost_micros: number; // in micros (1 SEK = 1_000_000 micros)
  conversions: number;
  ctr: number;
  average_cpc_micros: number;
  date: string;
};

export const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  AUTHENTICATION_ERROR: "Authentication failed — check credentials",
  AUTHORIZATION_ERROR: "Insufficient permissions",
  QUOTA_ERROR: "API quota exceeded — try again later",
  REQUEST_ERROR: "Invalid request — check parameters",
  RESOURCE_ALREADY_EXISTS: "Resource already exists",
  RESOURCE_NOT_FOUND: "Resource not found",
  DUPLICATE_CAMPAIGN_NAME: "A campaign with this name already exists",
  BUDGET_ERROR: "Budget configuration error",
};
