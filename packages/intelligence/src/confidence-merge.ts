/**
 * L6: Confidence scoring and merge logic.
 * Merges results from L1-L5 into a unified BrandProfile with confidence per field.
 */

import type { VisionAnalysis } from "./vision-analysis";
import type { SocialProfile } from "./social-detection";
import type { BrandfetchResult } from "./logo-api";
import type { WebsiteAuditResult } from "./website-audit";

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
  overallConfidence: number;
};

function getStatus(confidence: number): "found" | "uncertain" | "missing" {
  if (confidence >= 80) return "found";
  if (confidence >= 50) return "uncertain";
  return "missing";
}

/**
 * Calculate color distance in approximate LAB space.
 * Returns deltaE value — < 15 means visually similar.
 */
function colorDeltaE(hex1: string, hex2: string): number {
  const toRgb = (hex: string) => {
    const h = hex.replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)] as [number, number, number];
  };

  const [r1, g1, b1] = toRgb(hex1);
  const [r2, g2, b2] = toRgb(hex2);

  // Simple Euclidean distance in RGB (approximate, not true CIELAB but sufficient)
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

/**
 * Merge logo from multiple sources with priority.
 */
function mergeLogo(
  brandfetch: BrandfetchResult | null,
  clearbitLogo: string | null,
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

  // Priority 1: Brandfetch logo (confidence 95)
  const bfLogo = brandfetch?.logos.find((l) => l.type === "logo" && l.theme === "light")
    ?? brandfetch?.logos[0];
  if (bfLogo?.url) {
    return { value: { url: bfLogo.url, type: "image", initials }, confidence: 95, source: "brandfetch", status: "found" };
  }

  // Priority 2: Logo.dev (confidence 90)
  if (logoDevUrl) {
    return { value: { url: logoDevUrl, type: "image", initials }, confidence: 90, source: "logo.dev", status: "found" };
  }

  // Priority 3: Clearbit logo (confidence 85)
  if (clearbitLogo) {
    return { value: { url: clearbitLogo, type: "image", initials }, confidence: 85, source: "clearbit", status: "found" };
  }

  // Priority 3: Scraped logo from DOM (confidence 60)
  const scrapedLogo = scrapedLogos.find((u) => !u.endsWith(".ico") && !u.includes("favicon"));
  if (scrapedLogo) {
    return { value: { url: scrapedLogo, type: "image", initials }, confidence: 60, source: "scrape", status: "uncertain" };
  }

  // Priority 4: Favicon (confidence 40)
  const favicon = scrapedLogos.find((u) => u.endsWith(".ico") || u.includes("favicon"));
  if (favicon) {
    return { value: { url: favicon, type: "image", initials }, confidence: 40, source: "favicon", status: "uncertain" };
  }

  // Fallback: Generated initials (confidence 100 — always works)
  return { value: { url: null, type: "initials", initials }, confidence: 100, source: "generated", status: "found" };
}

/**
 * Merge colors from multiple sources.
 */
function mergeColors(
  brandfetch: BrandfetchResult | null,
  vision: VisionAnalysis | null,
  cssColors: string[],
): ConfidenceField<{ primary: string; secondary: string; accent: string }> {
  // Priority 1: Brandfetch brand guidelines (confidence 95)
  if (brandfetch && brandfetch.colors.length >= 2) {
    const primary = brandfetch.colors[0]!.hex;
    const secondary = brandfetch.colors[1]?.hex ?? primary;
    const accent = brandfetch.colors[2]?.hex ?? secondary;
    return { value: { primary, secondary, accent }, confidence: 95, source: "brandfetch", status: "found" };
  }

  // Priority 2: Vision AI + CSS agree (confidence 90)
  if (vision && cssColors.length >= 2) {
    const visionPrimary = vision.dominant_colors[0]?.hex;
    const cssPrimary = cssColors[0];
    if (visionPrimary && cssPrimary && colorDeltaE(visionPrimary, cssPrimary) < 60) {
      return {
        value: { primary: cssPrimary, secondary: cssColors[1] ?? cssPrimary, accent: cssColors[2] ?? cssPrimary },
        confidence: 90,
        source: "vision+css",
        status: "found",
      };
    }
  }

  // Priority 3: CSS only (confidence 70)
  if (cssColors.length >= 2) {
    return {
      value: { primary: cssColors[0]!, secondary: cssColors[1] ?? cssColors[0]!, accent: cssColors[2] ?? cssColors[0]! },
      confidence: 70,
      source: "css",
      status: "uncertain",
    };
  }

  // Priority 4: Vision AI only (confidence 60)
  if (vision && vision.dominant_colors.length >= 2) {
    const colors = vision.dominant_colors;
    return {
      value: { primary: colors[0]!.hex, secondary: colors[1]?.hex ?? colors[0]!.hex, accent: colors[2]?.hex ?? colors[0]!.hex },
      confidence: 60,
      source: "vision",
      status: "uncertain",
    };
  }

  // Fallback: industry default (confidence 100 — generated)
  return { value: { primary: "#6366f1", secondary: "#4f46e5", accent: "#818cf8" }, confidence: 100, source: "default", status: "found" };
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
  const bfFont = brandfetch?.fonts.find((f) => f.type === "heading" || f.type === "body");
  if (bfFont) {
    return { value: { family: bfFont.name, category: "sans" }, confidence: 95, source: "brandfetch", status: "found" };
  }

  // Priority 2: CSS font (confidence 80)
  if (cssFonts.length > 0 && cssFonts[0]) {
    return { value: { family: cssFonts[0], category: "sans" }, confidence: 80, source: "css", status: "found" };
  }

  // Priority 3: Vision category (confidence 50)
  if (vision) {
    const categoryMap: Record<string, string> = { sans: "Inter", serif: "Lora", mono: "JetBrains Mono", display: "Poppins" };
    return {
      value: { family: categoryMap[vision.font_category] ?? "Inter", category: vision.font_category },
      confidence: 50,
      source: "vision",
      status: "uncertain",
    };
  }

  // Fallback: Inter
  return { value: { family: "Inter", category: "sans" }, confidence: 100, source: "default", status: "found" };
}

/**
 * Main merge function — combines all intelligence layers.
 */
export function mergeIntelligence(input: {
  companyName: string;
  brandfetch: BrandfetchResult | null;
  clearbitLogo: string | null;
  logoDevUrl: string | null;
  vision: VisionAnalysis | null;
  cssColors: string[];
  cssFonts: string[];
  scrapedLogos: string[];
  social: SocialProfile[];
  audit: WebsiteAuditResult | null;
  enrichedIndustry?: string;
}): MergedBrandIntelligence {
  const logo = mergeLogo(input.brandfetch, input.clearbitLogo, input.logoDevUrl, input.scrapedLogos, input.social, input.companyName);
  const colors = mergeColors(input.brandfetch, input.vision, input.cssColors);
  const font = mergeFont(input.brandfetch, input.vision, input.cssFonts);

  // Industry: enrichment > vision > default
  const industry: ConfidenceField<string> = input.enrichedIndustry
    ? { value: input.enrichedIndustry, confidence: 90, source: "enrichment", status: "found" }
    : input.vision?.industry_guess
      ? { value: input.vision.industry_guess, confidence: 60, source: "vision", status: "uncertain" }
      : { value: "Ej identifierad", confidence: 0, source: "none", status: "missing" };

  const overallConfidence = Math.round(
    (logo.confidence + colors.confidence + font.confidence + industry.confidence) / 4,
  );

  return {
    logo,
    colors,
    font,
    industry,
    visualStyle: input.vision?.visual_style ?? "modern",
    tagline: input.vision?.tagline ?? null,
    social: input.social,
    audit: input.audit,
    overallConfidence,
  };
}
