export type MetaObjective =
  | "OUTCOME_AWARENESS"
  | "OUTCOME_TRAFFIC"
  | "OUTCOME_LEADS"
  | "OUTCOME_ENGAGEMENT"
  | "OUTCOME_SALES";

export type MetaCampaignStatus = "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED";

export type MetaTargeting = {
  geo_locations?: {
    countries?: string[];
    cities?: Array<{ key: string; name?: string }>;
  };
  age_min?: number;
  age_max?: number;
  interests?: Array<{ id: string; name: string }>;
  locales?: number[];
};

export type MetaCreativeSpec = {
  name: string;
  object_story_spec: {
    page_id: string;
    link_data: {
      link: string;
      message: string;
      name: string;
      description?: string;
      call_to_action: { type: string; value?: { link: string } };
      image_hash?: string;
    };
  };
};

export type MetaInsight = {
  impressions: number;
  clicks: number;
  spend: string;
  ctr: string;
  cpc: string;
  conversions?: number;
  date_start: string;
  date_stop: string;
};

export const OBJECTIVE_MAP: Record<string, MetaObjective> = {
  awareness: "OUTCOME_AWARENESS",
  traffic: "OUTCOME_TRAFFIC",
  conversions: "OUTCOME_SALES",
  leads: "OUTCOME_LEADS",
  engagement: "OUTCOME_ENGAGEMENT",
  "lead generation": "OUTCOME_LEADS",
  "brand awareness": "OUTCOME_AWARENESS",
};

export const META_ERROR_MESSAGES: Record<number, string> = {
  1: "Unknown error — try again later",
  2: "Service temporarily unavailable",
  4: "API rate limit reached — please wait",
  17: "API rate limit reached — too many calls",
  100: "Invalid parameter — check your request",
  190: "Access token has expired or is invalid",
  200: "Insufficient permissions",
  294: "Ad account is in an unsupported state",
  368: "Temporarily blocked for policy violations",
  2446: "Ad creative was rejected",
};
