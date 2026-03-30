export { buildCopyKey, buildVariantSetKey, getCachedCopy, getCachedVariantSet, invalidateBrandCopy, setCachedCopy, setCachedVariantSet } from "./cache";
export { generateAdCopy } from "./agents/copywriter";
export { generateAdStrategy } from "./agents/ad-strategist";
export type { AdStrategy, AdStrategySet } from "./agents/ad-strategist";
export { assembleCreatives } from "./agents/creative-director";
export { googleSearchCopy, linkedinCopy, metaAdCopy } from "./prompts/ad-copy";
export { createTrace, flushTraces, traceGeneration } from "./tracing";
export type {
  AdCopyResult,
  BrandContext,
  CopyOptions,
  CopyVariant,
  Platform,
} from "./types";
export { CHAR_LIMITS } from "./types";
export {
  PLATFORM_LIMITS,
  META_CTAS,
  META_CTA_LABELS,
  GOAL_TO_CTAS,
  validateCopyLimits,
  isValidMetaCta,
  normaliseMetaCta,
  getRecommendedCtas,
} from "./platform-limits";
export type {
  PlatformId,
  MetaCta,
  CopyFields,
  ValidationResult,
} from "./platform-limits";
export {
  classifyIntent,
  estimateCost,
  estimateTokens,
  routeModel,
  traceRouting,
} from "./router";
export type { ModelChoice, ModelIntent } from "./router";
export { getCostSummary, trackCost } from "./cost";
export {
  sniToCategory,
  mapFontToGoogle,
  INDUSTRY_PALETTES,
  INDUSTRY_AUDIENCES,
  INDUSTRY_BUDGETS,
  DEFAULT_BUDGETS,
  GOAL_MAPPINGS,
  FONT_MAPPING,
  SNI_TO_CATEGORY,
} from "./mappings";
export {
  canTransition,
  getAvailableEvents,
  getNextState,
} from "./machines/campaign-machine";
export type { CampaignEvent, CampaignState } from "./machines/campaign-machine";
export {
  getCampaignHistory,
  replayCampaignState,
  transitionCampaign,
} from "./services/campaign-state";
