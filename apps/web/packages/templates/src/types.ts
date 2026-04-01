import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Existing types (used by the Satori-based renderer + per-platform templates)
// ---------------------------------------------------------------------------

export type BrandInput = {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  logos: {
    primary?: string;
    icon?: string;
    dark?: string;
  };
  name: string;
};

export type AdContent = {
  headline: string;
  bodyCopy?: string;
  cta?: string;
  descriptions?: string[];
  sitelinks?: Array<{ text: string; url?: string }>;
  callouts?: string[];
  badge?: string;
};

export type Platform = "meta" | "google" | "linkedin";
export type AdFormat =
  | "meta_feed"
  | "meta_story"
  | "google_search"
  | "google_display"
  | "linkedin_sponsored"
  | "linkedin_message";

export type TemplateMeta = {
  id: string;
  name: string;
  platform: Platform;
  format: AdFormat;
  category: string;
  width: number;
  height: number;
};

export type TemplateRenderFn = (
  brand: BrandInput,
  content: AdContent,
) => ReactNode;

export type Template = TemplateMeta & {
  render: TemplateRenderFn;
};

// ---------------------------------------------------------------------------
// Composable Layout System — data-driven template definitions
// ---------------------------------------------------------------------------

/** The visual block primitives that layouts are composed from. */
export type BlockType =
  | "hero"
  | "sidebar"
  | "split"
  | "minimal"
  | "bold"
  | "cta-bar"
  | "logo-strip";

/** A single block inside a layout, with optional configuration props. */
export type BlockConfig = {
  type: BlockType;
  props?: Record<string, unknown>;
};

/** Supported layout format categories per platform. */
export type LayoutFormat =
  | "feed"
  | "story"
  | "search"
  | "display"
  | "sponsored";

/**
 * A pure-data definition of a layout.
 * Layouts are composed of one or more block configs and carry all the
 * metadata needed to select, filter, and render them.
 */
export type LayoutDefinition = {
  id: string;
  name: string;
  platform: Platform;
  format: LayoutFormat;
  blocks: BlockConfig[];
  /** CSS aspect-ratio value, e.g. "1:1", "4:5", "9:16", "16:9" */
  aspectRatio: string;
  /** Pixel dimensions used when rendering to image via Satori. */
  dimensions: { width: number; height: number };
};

/**
 * Simplified input contract for the layout renderer.
 * Maps cleanly from the AI-generated ad copy + brand profile data
 * without requiring callers to construct a full `BrandInput`.
 */
export type TemplateInput = {
  headline: string;
  bodyCopy: string;
  cta: string;
  brand: {
    name: string;
    logoUrl?: string | null;
    colors: {
      primary: string;
      secondary?: string;
      accent?: string;
    };
    fonts?: {
      heading: string;
      body: string;
    };
  };
  backgroundUrl?: string | null;
};
