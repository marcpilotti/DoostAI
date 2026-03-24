import type { ReactNode } from "react";

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
