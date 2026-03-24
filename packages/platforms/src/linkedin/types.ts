export type LinkedInCampaignStatus =
  | "ACTIVE"
  | "PAUSED"
  | "ARCHIVED"
  | "CANCELED"
  | "DRAFT";

export type LinkedInCampaignType =
  | "SPONSORED_UPDATES"
  | "SPONSORED_INMAILS"
  | "TEXT_AD";

export type LinkedInObjective =
  | "BRAND_AWARENESS"
  | "WEBSITE_VISITS"
  | "ENGAGEMENT"
  | "LEAD_GENERATION"
  | "WEBSITE_CONVERSIONS";

export type LinkedInTargeting = {
  locations?: string[]; // URN format: urn:li:geo:101174742
  jobTitles?: string[];
  industries?: string[];
  companySizes?: string[]; // "SIZE_1_10", "SIZE_11_50", etc.
  seniorities?: string[];
};

export type LinkedInAnalytics = {
  impressions: number;
  clicks: number;
  spend: number;
  ctr: number;
  cpc: number;
  conversions: number;
  date: string;
};

export const OBJECTIVE_MAP: Record<string, LinkedInObjective> = {
  awareness: "BRAND_AWARENESS",
  traffic: "WEBSITE_VISITS",
  engagement: "ENGAGEMENT",
  leads: "LEAD_GENERATION",
  conversions: "WEBSITE_CONVERSIONS",
  "lead generation": "LEAD_GENERATION",
  "brand awareness": "BRAND_AWARENESS",
};

export const LINKEDIN_ERROR_MESSAGES: Record<number, string> = {
  400: "Invalid request — check parameters",
  401: "Authentication failed — reconnect LinkedIn",
  403: "Insufficient permissions — check OAuth scopes",
  404: "Resource not found",
  429: "Rate limit exceeded — try again later",
};

// Sweden geo URN
export const GEO_SWEDEN = "urn:li:geo:101174742";
export const GEO_STOCKHOLM = "urn:li:geo:103752802";
