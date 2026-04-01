/**
 * L6: Confidence scoring and merge logic.
 * Merges results from L1-L5 into a unified BrandProfile with confidence per field.
 */

import type { VisionAnalysis } from "./vision-analysis";
import type { SocialProfile } from "./social-detection";
import type { BrandfetchResult } from "./logo-api";
import type { WebsiteAuditResult } from "./website-audit";
import type { SchemaOrgData } from "./schema-org";
import type { CompetitorAdInsight } from "./competitor-ads";
import { clusterColors } from "./color-clustering";

export type ConfidenceField<T> = {
  value: T;
  confidence: number;
  source: string;
  status: "found" | "uncertain" | "missing";
};

export type MergedBrandIntelligence = {
  logo: ConfidenceField<{ url: string | null; type: "image" | "initials"; initials: string }>;
  colors: ConfidenceField<{ primary: string; secondary: string; accent: string }>;
  font: ConfidenceField<{ family: string; category: string }>;
  industry: ConfidenceField<string>;
  visualStyle: string;
  tagline: string | null;
  social: SocialProfile[];
  audit: WebsiteAuditResult | null;
  competitorInsights: CompetitorAdInsight | null;
  overallConfidence: number;
  _confidenceBreakdown: {
    weighted: number;
    agreementBonus: number;
    missingPenalty: number;
  };
};

/** Returns true if the string is a valid 6-digit hex color (e.g. "#a1b2c3"). */
function isValidHex6(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex);
}

function getStatus(confidence: number): "found" | "uncertain" | "missing" {
  if (confidence >= 80) return "found";
  if (confidence >= 50) return "uncertain";
  return "missing";
}

/**
 * Calculate Euclidean distance between two colors in RGB space.
 * Returns a value in the range 0-441 — < 60 means visually similar in RGB space.
 */
function colorDistanceRgb(hex1: string, hex2: string): number {
  const toRgb = (hex: string) => {
    const h = hex.replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)] as [number, number, number];
  };

  const [r1, g1, b1] = toRgb(hex1);
  const [r2, g2, b2] = toRgb(hex2);

  // Euclidean distance in RGB space (range 0-441)
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

/**
 * Merge logo from multiple sources with priority.
 */
function mergeLogo(
  brandfetch: BrandfetchResult | null,
  logoDevUrl: string | null,
  scrapedLogos: string[],
  socialProfiles: SocialProfile[],
  companyName: string,
): ConfidenceField<{ url: string | null; type: "image" | "initials"; initials: string }> {
  const initials = companyName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // NOTE: Brandfetch CDN returns 403 for direct browser access — never use
  // Brandfetch URLs for <img> tags. Brandfetch is used for colors/fonts only.

  // Priority 1: Logo.dev (designed for browser <img> embedding)
  // May return 404 for some domains — component fallback chain handles this.
  if (logoDevUrl) {
    console.log(`[L6 Merge] Logo: Logo.dev → ${logoDevUrl.slice(0, 80)}`);
    return { value: { url: logoDevUrl, type: "image", initials }, confidence: 92, source: "logo.dev", status: "found" };
  }

  // Priority 2: Scraped logo from DOM (public URL, always loadable)
  const scrapedLogo = scrapedLogos.find((u) => !u.endsWith(".ico") && !u.includes("favicon"));
  if (scrapedLogo) {
    console.log(`[L6 Merge] Logo: Scraped → ${scrapedLogo.slice(0, 80)}`);
    return { value: { url: scrapedLogo, type: "image", initials }, confidence: 60, source: "scrape", status: "uncertain" };
  }

  // Priority 3: Favicon (public URL)
  const favicon = scrapedLogos.find((u) => u.endsWith(".ico") || u.includes("favicon"));
  if (favicon) {
    console.log(`[L6 Merge] Logo: Favicon → ${favicon.slice(0, 80)}`);
    return { value: { url: favicon, type: "image", initials }, confidence: 40, source: "favicon", status: "uncertain" };
  }

  console.log(`[L6 Merge] Logo: No sources found. Logo.dev: ${!!logoDevUrl}, scraped: ${scrapedLogos.length}`);

  // Fallback: Generated initials (always works, but low confidence — this is not real brand data)
  return { value: { url: null, type: "initials", initials }, confidence: 30, source: "generated", status: "missing" };
}

/**
 * Merge colors from multiple sources.
 *
 * CSS colors are run through CIELAB perceptual clustering (Delta-E < 15)
 * instead of simple brightness/saturation filtering.  This groups visually
 * identical shades and surfaces the true brand palette.
 */
function mergeColors(
  brandfetch: BrandfetchResult | null,
  vision: VisionAnalysis | null,
  cssColors: string[],
  industryPalette?: { primary: string; secondary: string; accent: string },
): ConfidenceField<{ primary: string; secondary: string; accent: string }> {
  // Priority 1: Brandfetch brand guidelines (confidence 95)
  // Filter out utility colors (dark/light type, or near-black/near-white hex)
  const bfBrandColors = (brandfetch?.colors ?? []).filter((c) => {
    if (c.type === "dark" || c.type === "light") return false;
    const hex = c.hex.toLowerCase();
    if (!isValidHex6(hex)) return false;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r + g + b) / 3;
    return brightness > 30 && brightness < 230;
  });
  if (bfBrandColors.length >= 2) {
    const primary = bfBrandColors[0]!.hex;
    const secondary = bfBrandColors[1]?.hex ?? primary;
    const accent = bfBrandColors[2]?.hex ?? secondary;
    return { value: { primary, secondary, accent }, confidence: 95, source: "brandfetch", status: "found" };
  }

  // --- CIELAB clustering replaces the old usableCss brightness/saturation filter ---
  // Cluster all CSS colors perceptually, then keep only "brand" role clusters.
  const clustered = clusterColors(cssColors);
  const brandClusters = clustered.filter((c) => c.role === "brand");

  // Priority 2: Vision AI + clustered CSS agree (confidence 90)
  if (vision && brandClusters.length >= 1) {
    const visionPrimary = vision.dominant_colors[0]?.hex;
    const cssPrimary = brandClusters[0]!.hex;
    if (visionPrimary && cssPrimary && colorDistanceRgb(visionPrimary, cssPrimary) < 60) {
      return {
        value: {
          primary: cssPrimary,
          secondary: brandClusters[1]?.hex ?? cssPrimary,
          accent: brandClusters[2]?.hex ?? cssPrimary,
        },
        confidence: 90,
        source: "vision+css_clustered",
        status: "found",
      };
    }
  }

  // Priority 3: Clustered CSS only (confidence 70)
  if (brandClusters.length >= 1) {
    return {
      value: {
        primary: brandClusters[0]!.hex,
        secondary: brandClusters[1]?.hex ?? brandClusters[0]!.hex,
        accent: brandClusters[2]?.hex ?? brandClusters[0]!.hex,
      },
      confidence: 70,
      source: "css_clustered",
      status: "uncertain",
    };
  }

  // Priority 4: Vision AI only (confidence 60)
  // Filter out near-black, near-white, and grays from vision colors too
  if (vision && vision.dominant_colors.length >= 1) {
    const usableVision = vision.dominant_colors.filter((c) => {
      if (!isValidHex6(c.hex)) return false;
      const r = parseInt(c.hex.slice(1, 3), 16);
      const g = parseInt(c.hex.slice(3, 5), 16);
      const b = parseInt(c.hex.slice(5, 7), 16);
      const brightness = (r + g + b) / 3;
      const saturation = Math.max(r, g, b) - Math.min(r, g, b);
      return brightness > 30 && brightness < 230 && saturation > 15;
    });
    if (usableVision.length >= 1) {
      return {
        value: {
          primary: usableVision[0]!.hex,
          secondary: usableVision[1]?.hex ?? usableVision[0]!.hex,
          accent: usableVision[2]?.hex ?? usableVision[0]!.hex,
        },
        confidence: 60,
        source: "vision",
        status: "uncertain",
      };
    }
  }

  // Fallback: industry palette or generic default (low confidence — not real brand data)
  const fallback = industryPalette ?? { primary: "#6366f1", secondary: "#4f46e5", accent: "#818cf8" };
  return { value: fallback, confidence: 30, source: industryPalette ? "industry_palette" : "default", status: "missing" };
}

/**
 * Merge font from multiple sources.
 */
function mergeFont(
  brandfetch: BrandfetchResult | null,
  vision: VisionAnalysis | null,
  cssFonts: string[],
): ConfidenceField<{ family: string; category: string }> {
  // Priority 1: Brandfetch font (confidence 95)
  const bfFont = brandfetch?.fonts?.find((f) => f.type === "heading" || f.type === "body");
  if (bfFont?.name) {
    return { value: { family: bfFont.name, category: "sans" }, confidence: 95, source: "brandfetch", status: "found" };
  }

  // Priority 2: Vision-detected font with high confidence (confidence 85)
  // Claude Vision can identify specific rendered fonts from the screenshot
  if (vision?.detected_fonts?.length) {
    const highConfidenceFonts = vision.detected_fonts.filter((f) => f.confidence >= 70);
    // Prefer a heading font, fall back to body font
    const bestFont = highConfidenceFonts.find((f) => f.role === "heading")
      ?? highConfidenceFonts.find((f) => f.role === "body");
    if (bestFont) {
      const category = vision.font_category ?? "sans";
      return {
        value: { family: bestFont.name, category },
        confidence: 85,
        source: "vision_font",
        status: "found",
      };
    }
  }

  // Priority 3: CSS font (confidence 80)
  if (cssFonts.length > 0 && cssFonts[0]) {
    return { value: { family: cssFonts[0], category: "sans" }, confidence: 80, source: "css", status: "found" };
  }

  // Priority 4: Vision category (confidence 50)
  if (vision) {
    const categoryMap: Record<string, string> = { sans: "Inter", serif: "Lora", mono: "JetBrains Mono", display: "Poppins" };
    return {
      value: { family: categoryMap[vision.font_category] ?? "Inter", category: vision.font_category },
      confidence: 50,
      source: "vision",
      status: "uncertain",
    };
  }

  // Fallback: Inter (low confidence — not real brand data)
  return { value: { family: "Inter", category: "sans" }, confidence: 30, source: "default", status: "missing" };
}

/**
 * Bayesian-inspired confidence model.
 *
 * Instead of a simple average, this uses:
 * 1. **Weighted importance** — colors and logo matter most for ad generation.
 * 2. **Agreement bonus** — when multiple fields come from the same high-quality
 *    source (brandfetch, enrichment, logo.dev) the data is internally consistent.
 * 3. **Missing penalty** — any critical field with "missing" status drags the
 *    overall score down hard.
 *
 * Result is clamped to [0, 100].
 */
function calculateOverallConfidence(
  logo: ConfidenceField<unknown>,
  colors: ConfidenceField<unknown>,
  font: ConfidenceField<unknown>,
  industry: ConfidenceField<unknown>,
): { score: number; weighted: number; agreementBonus: number; missingPenalty: number } {
  // Weighted importance: colors and logo matter most for ad generation
  const weights = { logo: 0.25, colors: 0.30, font: 0.20, industry: 0.25 };

  const weighted =
    logo.confidence * weights.logo +
    colors.confidence * weights.colors +
    font.confidence * weights.font +
    industry.confidence * weights.industry;

  // Bonus: when multiple fields come from same high-quality source (brandfetch, enrichment, logo.dev)
  // it means the data is internally consistent
  const sources = [logo.source, colors.source, font.source, industry.source];
  const highQualitySources = sources.filter(
    (s) => s === "brandfetch" || s === "enrichment" || s === "logo.dev",
  );
  const agreementBonus = highQualitySources.length >= 3 ? 5 : highQualitySources.length >= 2 ? 2 : 0;

  // Penalty: if any critical field is "missing" status, reduce overall
  const missingPenalty = [logo, colors, font, industry].filter((f) => f.status === "missing").length * 10;

  const score = Math.min(100, Math.max(0, Math.round(weighted + agreementBonus - missingPenalty)));

  return { score, weighted: Math.round(weighted * 100) / 100, agreementBonus, missingPenalty };
}

/**
 * Main merge function — combines all intelligence layers.
 */
export function mergeIntelligence(input: {
  companyName: string;
  brandfetch: BrandfetchResult | null;
  logoDevUrl: string | null;
  vision: VisionAnalysis | null;
  cssColors: string[];
  cssFonts: string[];
  scrapedLogos: string[];
  social: SocialProfile[];
  audit: WebsiteAuditResult | null;
  enrichedIndustry?: string;
  industryPalette?: { primary: string; secondary: string; accent: string };
  schemaOrg?: SchemaOrgData | null;
  competitorInsights?: CompetitorAdInsight | null;
}): MergedBrandIntelligence {
  const logo = mergeLogo(input.brandfetch, input.logoDevUrl, input.scrapedLogos, input.social, input.companyName);
  const colors = mergeColors(input.brandfetch, input.vision, input.cssColors, input.industryPalette);
  const font = mergeFont(input.brandfetch, input.vision, input.cssFonts);

  // Schema.org industry: strip NAICS: prefix if it's just a code (not useful as display text)
  const schemaOrgIndustry = input.schemaOrg?.industry && !input.schemaOrg.industry.startsWith("NAICS:")
    ? input.schemaOrg.industry
    : undefined;

  // Industry priority: Brandfetch (95) > Schema.org (92) > enrichment (90) > vision (60) > default
  // Schema.org sits between enrichment and Brandfetch because it's authoritative structured data
  // from the website itself, but Brandfetch has curated/verified data.
  let industry: ConfidenceField<string>;
  if (input.enrichedIndustry) {
    industry = { value: input.enrichedIndustry, confidence: 90, source: "enrichment", status: "found" };
  } else if (schemaOrgIndustry) {
    industry = { value: schemaOrgIndustry, confidence: 92, source: "schema.org", status: "found" };
  } else if (input.vision?.industry_guess) {
    industry = { value: input.vision.industry_guess, confidence: 60, source: "vision", status: "uncertain" };
  } else {
    industry = { value: "Ej identifierad", confidence: 0, source: "none", status: "missing" };
  }

  // Merge Schema.org sameAs URLs into social profiles.
  // These are high-confidence social links declared by the site owner.
  const social = mergeSocialWithSchemaOrg(input.social, input.schemaOrg);

  const { score: overallConfidence, weighted, agreementBonus, missingPenalty } =
    calculateOverallConfidence(logo, colors, font, industry);

  return {
    logo,
    colors,
    font,
    industry,
    visualStyle: input.vision?.visual_style ?? "modern",
    tagline: input.vision?.tagline ?? null,
    social,
    audit: input.audit,
    competitorInsights: input.competitorInsights ?? null,
    overallConfidence,
    _confidenceBreakdown: { weighted, agreementBonus, missingPenalty },
  };
}

// ---------------------------------------------------------------------------
// Schema.org social URL merging
// ---------------------------------------------------------------------------

/** Known social platform URL patterns for classifying sameAs URLs. */
const SAME_AS_PLATFORMS: [string, RegExp][] = [
  ["facebook", /facebook\.com\//i],
  ["instagram", /instagram\.com\//i],
  ["linkedin", /linkedin\.com\//i],
  ["twitter", /(?:twitter\.com|x\.com)\//i],
  ["youtube", /youtube\.com\//i],
  ["tiktok", /tiktok\.com\//i],
  ["github", /github\.com\//i],
  ["pinterest", /pinterest\.com\//i],
];

/**
 * Merge Schema.org sameAs URLs into the existing social profiles list.
 * Schema.org sameAs URLs get confidence 95 because they are declared by
 * the site owner in structured data — higher than link scanning (70-90).
 */
function mergeSocialWithSchemaOrg(
  existing: SocialProfile[],
  schemaOrg?: SchemaOrgData | null,
): SocialProfile[] {
  if (!schemaOrg?.sameAs?.length) return existing;

  const result = [...existing];
  const seenUrls = new Set(existing.map((p) => p.url.toLowerCase()));

  for (const url of schemaOrg.sameAs) {
    const normalized = url.toLowerCase().replace(/\/$/, "");
    if (seenUrls.has(normalized)) continue;

    // Identify the platform from the URL
    let platform = "other";
    for (const [name, pattern] of SAME_AS_PLATFORMS) {
      if (pattern.test(url)) {
        platform = name;
        break;
      }
    }

    // Only add recognized social platforms (skip generic "other" URLs)
    if (platform !== "other") {
      seenUrls.add(normalized);
      result.push({ platform, url, confidence: 95 });
    }
  }

  return result;
}
