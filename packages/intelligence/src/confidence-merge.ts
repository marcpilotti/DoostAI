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
    // Exclude near-black and near-white
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

  // Filter CSS colors: remove malformed hex, near-black, near-white, and grays
  const usableCss = cssColors.filter((hex) => {
    if (!isValidHex6(hex)) return false;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r + g + b) / 3;
    const saturation = Math.max(r, g, b) - Math.min(r, g, b);
    return brightness > 30 && brightness < 230 && saturation > 20;
  });

  // Priority 2: Vision AI + CSS agree (confidence 90)
  if (vision && usableCss.length >= 2) {
    const visionPrimary = vision.dominant_colors[0]?.hex;
    const cssPrimary = usableCss[0];
    if (visionPrimary && cssPrimary && colorDistanceRgb(visionPrimary, cssPrimary) < 60) {
      return {
        value: { primary: cssPrimary, secondary: usableCss[1] ?? cssPrimary, accent: usableCss[2] ?? cssPrimary },
        confidence: 90,
        source: "vision+css",
        status: "found",
      };
    }
  }

  // Priority 3: CSS only (confidence 70)
  if (usableCss.length >= 2) {
    return {
      value: { primary: usableCss[0]!, secondary: usableCss[1] ?? usableCss[0]!, accent: usableCss[2] ?? usableCss[0]! },
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
  const bfFont = brandfetch?.fonts.find((f) => f.type === "heading" || f.type === "body");
  if (bfFont?.name) {
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

  // Fallback: Inter (low confidence — not real brand data)
  return { value: { family: "Inter", category: "sans" }, confidence: 30, source: "default", status: "missing" };
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
}): MergedBrandIntelligence {
  const logo = mergeLogo(input.brandfetch, input.logoDevUrl, input.scrapedLogos, input.social, input.companyName);
  const colors = mergeColors(input.brandfetch, input.vision, input.cssColors, input.industryPalette);
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
