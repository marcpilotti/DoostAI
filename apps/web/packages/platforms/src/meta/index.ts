export { MetaAdsClient, MetaApiError } from "./client";
export {
  encryptAndStoreToken,
  exchangeCode,
  extendToken,
  getOAuthUrl,
} from "./auth";
export {
  deleteCampaign,
  deployCampaign,
  getCampaignInsights,
  pauseCampaign,
  resumeCampaign,
} from "./campaigns";
export type {
  DeployCampaignInput,
  DeployCampaignResult,
} from "./campaigns";
export type {
  MetaCampaignStatus,
  MetaCreativeSpec,
  MetaInsight,
  MetaObjective,
  MetaTargeting,
} from "./types";
export { META_ERROR_MESSAGES, OBJECTIVE_MAP } from "./types";
