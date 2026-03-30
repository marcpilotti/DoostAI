/**
 * L5b: Website audit — PageSpeed, pixel detection, tech stack, readiness.
 */

import type { SocialProfile } from "./social-detection";

export type WebsiteAuditResult = {
  mobileScore: number | null;
  desktopScore: number | null;
  loadTime: number | null;
  hasMetaPixel: boolean;
  hasGoogleTag: boolean;
  hasLinkedinTag: boolean;
  hasSitemap: boolean;
  hasSsl: boolean;
  isMobileFriendly: boolean;
  hasBlog: boolean;
  hasContactForm: boolean;
  hasPricingPage: boolean;
  techStack: string[];
  adPixels: string[];
  readinessScore: number;
  issues: { severity: string; title: string; description: string }[];
};

/**
 * Detect tracking pixels and tech stack from HTML.
 */
function detectPixelsAndTech(html: string): {
  hasMetaPixel: boolean;
  hasGoogleTag: boolean;
  hasLinkedinTag: boolean;
  techStack: string[];
  adPixels: string[];
} {
  const lower = html.toLowerCase();

  const hasMetaPixel = lower.includes("fbq(") || lower.includes("facebook.com/tr") || lower.includes("connect.facebook.net");
  const hasGoogleTag = lower.includes("gtag(") || lower.includes("googletagmanager.com") || lower.includes("google-analytics.com");
  const hasLinkedinTag = lower.includes("snap.licdn.com") || lower.includes("linkedin.com/px") || lower.includes("_linkedin_partner_id");

  const adPixels: string[] = [];
  if (hasMetaPixel) adPixels.push("meta_pixel");
  if (hasGoogleTag) adPixels.push("google_tag");
  if (hasLinkedinTag) adPixels.push("linkedin_insight");
  if (lower.includes("hotjar.com")) adPixels.push("hotjar");
  if (lower.includes("hubspot.com")) adPixels.push("hubspot");

  const techStack: string[] = [];
  if (lower.includes("wp-content") || lower.includes("wordpress")) techStack.push("WordPress");
  if (lower.includes("shopify")) techStack.push("Shopify");
  if (lower.includes("wix.com")) techStack.push("Wix");
  if (lower.includes("squarespace")) techStack.push("Squarespace");
  if (lower.includes("next") || lower.includes("__next")) techStack.push("Next.js");
  if (lower.includes("data-reactroot") || lower.includes("_reactroot") || lower.includes("react-app") || lower.includes("_react") || lower.includes("__next_data__")) techStack.push("React");
  if (lower.includes("vue")) techStack.push("Vue");
  if (lower.includes("gatsby")) techStack.push("Gatsby");
  if (lower.includes("webflow")) techStack.push("Webflow");

  return { hasMetaPixel, hasGoogleTag, hasLinkedinTag, techStack, adPixels };
}

/**
 * Detect content features from HTML.
 */
function detectContent(html: string, links: string[]): {
  hasBlog: boolean;
  hasContactForm: boolean;
  hasPricingPage: boolean;
  hasSitemap: boolean;
} {
  const lower = html.toLowerCase();
  const allLinks = links.map((l) => l.toLowerCase());

  return {
    hasBlog: allLinks.some((l) => l.includes("/blog") || l.includes("/nyheter") || l.includes("/aktuellt")),
    hasContactForm: lower.includes("<form") && (lower.includes("kontakt") || lower.includes("contact") || lower.includes("email")),
    hasPricingPage: allLinks.some((l) => l.includes("/pris") || l.includes("/pricing") || l.includes("/priser")),
    hasSitemap: false, // Would need a HEAD request to /sitemap.xml
  };
}

/**
 * Calculate marketing readiness score (0-100).
 *
 * @param audit  Partial audit data from pixel/content/tech detection.
 * @param social Optional enriched social profiles. Each verified profile
 *               (HEAD returned 200) adds +3 points, up to a max of 15.
 */
function calculateReadiness(
  audit: Partial<WebsiteAuditResult>,
  social?: SocialProfile[],
): number {
  let score = 0;
  const max = 100;

  // Tracking (30 points)
  if (audit.hasMetaPixel) score += 15;
  if (audit.hasGoogleTag) score += 15;

  // Content (25 points)
  if (audit.hasBlog) score += 10;
  if (audit.hasContactForm) score += 10;
  if (audit.hasPricingPage) score += 5;

  // Technical (25 points)
  if (audit.hasSsl) score += 10;
  if (audit.isMobileFriendly) score += 10;
  // TODO: Add real PageSpeed API integration for mobile score

  // Social (15 points max) — bonus for validated social profiles
  // Each verified profile (HEAD returned 200) adds +3, capped at 15.
  if (social?.length) {
    const verifiedCount = social.filter((p) => p.verified === true).length;
    const socialBonus = Math.min(verifiedCount * 3, 15);
    score += socialBonus;
  }

  return Math.min(score, max);
}

/**
 * Run website audit from scraped HTML data.
 *
 * @param url    The target website URL.
 * @param html   Raw HTML content of the page.
 * @param links  All links extracted from the page.
 * @param social Optional enriched social profiles for readiness scoring.
 */
export function auditWebsite(
  url: string,
  html: string,
  links: string[],
  social?: SocialProfile[],
): WebsiteAuditResult {
  const hasSsl = url.startsWith("https");
  const pixelsAndTech = detectPixelsAndTech(html);
  const content = detectContent(html, links);

  // Mobile-friendly heuristic: check for viewport meta tag
  const isMobileFriendly = html.toLowerCase().includes("viewport") &&
    html.toLowerCase().includes("width=device-width");

  const partial: Partial<WebsiteAuditResult> = {
    hasSsl,
    isMobileFriendly,
    ...pixelsAndTech,
    ...content,
    mobileScore: null,
    desktopScore: null,
    loadTime: null,
  };

  const readinessScore = calculateReadiness(partial, social);

  const issues: { severity: string; title: string; description: string }[] = [];
  if (!pixelsAndTech.hasMetaPixel) issues.push({ severity: "high", title: "Meta Pixel saknas", description: "Installera Meta Pixel för att spåra konverteringar från Facebook/Instagram-annonser" });
  if (!pixelsAndTech.hasGoogleTag) issues.push({ severity: "high", title: "Google Tag saknas", description: "Installera Google Tag för att spåra konverteringar från Google Ads" });
  if (!hasSsl) issues.push({ severity: "critical", title: "Ingen SSL", description: "Hemsidan körs inte på HTTPS — detta påverkar SEO och annonsering negativt" });
  if (!isMobileFriendly) issues.push({ severity: "medium", title: "Ej mobilanpassad", description: "Hemsidan saknar mobilanpassning — majoriteten av annonser visas på mobil" });
  if (!content.hasBlog) issues.push({ severity: "low", title: "Ingen blogg", description: "En blogg förbättrar SEO och ger mer innehåll för annonsering" });

  return {
    ...partial as WebsiteAuditResult,
    readinessScore,
    issues,
  };
}

/**
 * Recalculate readiness score on an existing audit result with enriched social data.
 *
 * This is called by the orchestrator after social enrichment completes,
 * since the initial audit runs in parallel with social detection and
 * doesn't have access to verified social profiles yet.
 */
export function recalculateReadinessWithSocial(
  audit: WebsiteAuditResult,
  social: SocialProfile[],
): WebsiteAuditResult {
  const readinessScore = calculateReadiness(audit, social);
  return { ...audit, readinessScore };
}
