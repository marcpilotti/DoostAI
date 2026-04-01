export type Platform = "meta" | "google" | "linkedin";

export type CopyVariant = "hero" | "variant_a" | "variant_b";

export type AdCopyResult = {
  headline: string;
  bodyCopy: string;
  cta: string;
  variant: CopyVariant;
  platform: Platform;
  // Google-specific
  headlines?: string[];
  descriptions?: string[];
};

export type BrandContext = {
  name: string;
  description?: string;
  industry?: string;
  brandVoice: string;
  targetAudience: string;
  valuePropositions: string[];
  url: string;
};

export type CopyOptions = {
  objective?: string;
  tone?: string;
  language?: string;
  variants?: number;
  skipCache?: boolean;
  brandProfileId?: string;
};

export const CHAR_LIMITS = {
  meta: { headline: 40, bodyCopy: 125, cta: 20 },
  google: { headline: 30, description: 90 },
  linkedin: { headline: 70, bodyCopy: 150, cta: 20 },
} as const;
