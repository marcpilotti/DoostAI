// ---------------------------------------------------------------------------
// Existing per-component template system (Satori pipeline)
// ---------------------------------------------------------------------------
export { getTemplate, getTemplatesForPlatform, templates } from "./registry";
export { renderToImage, renderToSvg } from "./renderer";
export {
  getIndustryBackground,
  prewarmBackgrounds,
} from "./background-service";
export {
  INDUSTRY_BACKGROUNDS,
  DEFAULT_BACKGROUND_TERMS,
  getBackgroundTerms,
} from "./industry-backgrounds";

// ---------------------------------------------------------------------------
// Composable layout system (data-driven, hot-swappable)
// ---------------------------------------------------------------------------
export {
  getFormatsForPlatform,
  getLayout,
  getLayoutsForPlatform,
  LAYOUTS,
} from "./layouts";
export { renderLayout } from "./layout-renderer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type {
  AdContent,
  AdFormat,
  BlockConfig,
  BlockType,
  BrandInput,
  LayoutDefinition,
  LayoutFormat,
  Platform,
  Template,
  TemplateInput,
  TemplateMeta,
} from "./types";
