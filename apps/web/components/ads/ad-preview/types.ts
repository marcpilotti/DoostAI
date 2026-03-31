/**
 * AdPreview type definitions.
 * Shared across all ad preview components.
 */

// ── Format ──────────────────────────────────────────────────────

export type AdFormat = "meta-feed" | "meta-stories" | "google-search" | "linkedin";

// ── Ad Data ─────────────────────────────────────────────────────

export type AdData = {
  /** Unique identifier for this ad */
  id: string;
  /** Display headline (Meta: max 40, Google: 3×30, LinkedIn: max 150) */
  headline: string;
  /** Primary/body text (Meta: max 125, Google: max 90, LinkedIn: max 600) */
  primaryText: string;
  /** Call-to-action button text (max 20 across all platforms) */
  cta: string;
  /** Brand name shown in the ad header */
  brandName: string;
  /** Brand website URL */
  brandUrl: string;
  /** Brand primary color (hex) */
  brandColor: string;
  /** Brand accent color (hex) */
  brandAccent?: string;
  /** Brand logo as data URL or http URL */
  logoUrl?: string | null;
  /** AI-generated background image URL */
  imageUrl?: string | null;
  /** Google Search specific: up to 3 headlines separated by | */
  headlines?: string[];
  /** Google Search specific: up to 2 description lines */
  descriptions?: string[];
  /** Google Search specific: display URL path segments */
  displayUrlPaths?: string[];
};

// ── Variant ─────────────────────────────────────────────────────

export type AdVariant = {
  id: "A" | "B";
  data: AdData;
  /** Strategy metadata for this variant */
  strategy?: {
    concept: string;
    hook: string;
    angle: string;
    emotionalTrigger: string;
  };
};

// ── Props ───────────────────────────────────────────────────────

export type AdPreviewProps = {
  /** Primary variant (always required) */
  variantA: AdData;
  /** Optional second variant for A/B comparison */
  variantB?: AdData;
  /** Currently active ad format */
  format: AdFormat;
  /** Available formats (shown in tabs) */
  availableFormats?: AdFormat[];
  /** Strategy data for variant recommendations */
  strategy?: {
    variantA: { concept: string; hook: string; angle: string; emotionalTrigger: string };
    variantB: { concept: string; hook: string; angle: string; emotionalTrigger: string };
    recommendation: string;
  } | null;

  // ── Callbacks ───────────────────────────────────────────────

  /** Called when format tab changes */
  onFormatChange?: (format: AdFormat) => void;
  /** Called when variant A data is edited inline */
  onVariantAChange?: (updated: AdData) => void;
  /** Called when variant B data is edited inline */
  onVariantBChange?: (updated: AdData) => void;
  /** Called when user selects a winner in A/B comparison */
  onWinnerSelected?: (winner: "A" | "B") => void;
  /** Called when user clicks save (explicit save action) */
  onSave?: (updatedAd: AdData) => void;
  /** Called when a new image is generated for a variant */
  onImageGenerated?: (imageUrl: string, format: AdFormat, variant: "A" | "B") => void;
  /** Called when user wants to publish */
  onPublish?: (variant: AdData) => void;

  // ── Options ─────────────────────────────────────────────────

  /** Enable inline editing (default: true) */
  editable?: boolean;
  /** Auto-generate background image on mount (default: true) */
  autoGenerateImage?: boolean;
  /** A/B comparison mode (default: 'toggle') */
  defaultCompareMode?: "toggle" | "sidebyside";
  /** Hide the header (format switcher + A/B toggle). Default: false */
  hideHeader?: boolean;
};

// ── Internal sub-component props ────────────────────────────────

export type FormatPreviewProps = {
  data: AdData;
  isEditing: boolean;
  onFieldChange?: (field: keyof AdData, value: string) => void;
  imageUrl?: string | null;
  isImageLoading?: boolean;
  onRegenerateImage?: () => void;
};
