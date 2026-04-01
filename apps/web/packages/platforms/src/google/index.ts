export { GoogleAdsClient, GoogleAdsError } from "./client";
export {
  exchangeCode as googleExchangeCode,
  getOAuthUrl as googleGetOAuthUrl,
  refreshAccessToken as googleRefreshAccessToken,
} from "./auth";
export {
  createClientAccount,
  deploySearchCampaign,
  getCampaignMetrics as getGoogleCampaignMetrics,
  pauseCampaign as pauseGoogleCampaign,
  resumeCampaign as resumeGoogleCampaign,
} from "./campaigns";
export type {
  DeploySearchCampaignInput,
  DeploySearchCampaignResult,
} from "./campaigns";
export type {
  GoogleAdType,
  GoogleBiddingStrategy,
  GoogleCampaignObjective,
  GoogleCampaignStatus,
  GoogleMetrics,
} from "./types";
export { GOOGLE_ERROR_MESSAGES } from "./types";
