/**
 * Brand Intelligence Pipeline Orchestrator
 * Runs L1-L6 in parallel, merges results with confidence scoring.
 */

import { analyzeWithVision } from "./vision-analysis";
import { detectSocialPresence, enrichSocialProfiles } from "./social-detection";
import { fetchLogoApis, type DownloadedLogo } from "./logo-api";
import { cacheOgImage } from "./image-cache";
import { auditWebsite, recalculateReadinessWithSocial } from "./website-audit";
import { mergeIntelligence, type MergedBrandIntelligence } from "./confidence-merge";
import { extractSchemaOrg, type SchemaOrgData } from "./schema-org";
import { analyzeCompetitorAds, type CompetitorAdInsight } from "./competitor-ads";

export type PipelineInput = {
  url: string;
  html: string;
  links: string[];
  cssColors: string[];
  industryPalette?: { primary: string; secondary: string; accent: string };
  cssFonts: string[];
  scrapedLogos: string[];
  ogImage?: string;
  screenshot?: string;
  companyName: string;
  enrichedIndustry?: string;
};

export type PipelineResult = {
  intelligence: MergedBrandIntelligence;
  downloadedLogo: DownloadedLogo | null;
  schemaOrg: SchemaOrgData | null;
  competitorInsights: CompetitorAdInsight | null;
  timing: {
    total: number;
    ogCache: number | null;
    vision: number | null;
    social: number | null;
    socialEnrich: number | null;
    logoApi: number | null;
    audit: number | null;
    competitorAds: number | null;
  };
};

/**
 * Run the complete Brand Intelligence Pipeline.
 * All layers execute in parallel for maximum speed.
 *
 * The OG image is pre-cached at the start so that vision analysis
 * receives a reliable base64 data-URI instead of a raw URL that
 * could time out or fail due to CDN issues.
 */
export async function runBrandIntelligencePipeline(
  input: PipelineInput,
): Promise<PipelineResult> {
  const start = Date.now();
  const domain = input.url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] ?? "";

  if (!domain || !domain.includes(".")) {
    throw new Error(`Invalid domain extracted from URL "${input.url}": got "${domain}". Provide a valid URL like "https://example.com".`);
  }

  // Extract Schema.org structured data (synchronous, fast — runs before parallel layers)
  const schemaOrg = extractSchemaOrg(input.html);
  if (schemaOrg) {
    console.log(`[Intelligence] Schema.org data found: name=${schemaOrg.name ?? "?"}, industry=${schemaOrg.industry ?? "?"}, sameAs=${schemaOrg.sameAs?.length ?? 0} URLs`);
  }

  // Pre-cache OG image: download + cache so vision analysis gets a reliable
  // base64 string instead of a raw URL that could time out or fail.
  const ogCacheStart = Date.now();
  const cachedOgImage = input.ogImage
    ? await cacheOgImage(input.ogImage)
    : null;
  const ogCacheMs = Date.now() - ogCacheStart;

  // Determine what to pass to vision: prefer screenshot, then cached OG base64,
  // then fall back to the original OG URL (in case download failed but the LLM
  // can still fetch it).
  const ogForVision = cachedOgImage ?? input.ogImage;

  // Run all layers in parallel
  const [
    visionResult,
    socialResult,
    logoApiResult,
    auditResult,
    competitorAdsResult,
  ] = await Promise.allSettled([
    // L1: Vision AI (analyze OG image or screenshot — uses pre-cached base64)
    timed(() => analyzeWithVision(ogForVision, input.screenshot)),

    // L3: Social media detection (from HTML)
    timed(() => Promise.resolve(detectSocialPresence(input.html, input.links))),

    // L4: Logo APIs (Brandfetch + Clearbit)
    timed(() => fetchLogoApis(domain)),

    // L5b: Website audit (from HTML)
    timed(() => Promise.resolve(auditWebsite(input.url, input.html, input.links))),

    // L7: Competitor Ad Library analysis (stub — returns null until API access is approved)
    timed(() => analyzeCompetitorAds(domain, input.enrichedIndustry)),
  ]);

  // Extract results (null if failed) and log any errors
  if (visionResult.status === "rejected") {
    console.error("[Intelligence] Vision analysis failed:", visionResult.reason instanceof Error ? visionResult.reason.message : visionResult.reason);
  }
  if (socialResult.status === "rejected") {
    console.error("[Intelligence] Social detection failed:", socialResult.reason instanceof Error ? socialResult.reason.message : socialResult.reason);
  }
  if (logoApiResult.status === "rejected") {
    console.error("[Intelligence] Logo API failed:", logoApiResult.reason instanceof Error ? logoApiResult.reason.message : logoApiResult.reason);
  }
  if (auditResult.status === "rejected") {
    console.error("[Intelligence] Website audit failed:", auditResult.reason instanceof Error ? auditResult.reason.message : auditResult.reason);
  }
  if (competitorAdsResult.status === "rejected") {
    console.error("[Intelligence] Competitor ads analysis failed:", competitorAdsResult.reason instanceof Error ? competitorAdsResult.reason.message : competitorAdsResult.reason);
  }

  const vision = visionResult.status === "fulfilled" ? visionResult.value.result : null;
  const socialRaw = socialResult.status === "fulfilled" ? socialResult.value.result : [];
  const logoApi = logoApiResult.status === "fulfilled" ? logoApiResult.value.result : null;
  const audit = auditResult.status === "fulfilled" ? auditResult.value.result : null;
  const competitorInsights = competitorAdsResult.status === "fulfilled" ? competitorAdsResult.value.result : null;

  // L3b: Enrich social profiles — validate URLs are live (HEAD requests, 3s timeout each)
  const socialEnrichStart = Date.now();
  let social = socialRaw;
  try {
    social = await enrichSocialProfiles(socialRaw);
    const verified = social.filter((p) => p.verified).length;
    console.log(`[Intelligence] Social enrichment: ${verified}/${social.length} profiles verified`);
  } catch (err) {
    console.error("[Intelligence] Social enrichment failed, using raw profiles:", err instanceof Error ? err.message : err);
  }
  const socialEnrichMs = Date.now() - socialEnrichStart;

  // Recalculate readiness score now that we have verified social profiles.
  // The audit ran in parallel with social detection, so it didn't have
  // enrichment data available during its initial calculation.
  const auditWithSocial = audit && social.length > 0
    ? recalculateReadinessWithSocial(audit, social)
    : audit;

  // L6: Confidence merge
  const intelligence = mergeIntelligence({
    companyName: input.companyName,
    brandfetch: logoApi?.brandfetch ?? null,
    logoDevUrl: null, // Logo downloaded as base64 instead — see downloadedLogo
    vision,
    cssColors: input.cssColors,
    cssFonts: input.cssFonts,
    scrapedLogos: input.scrapedLogos,
    social: social ?? [],
    audit: auditWithSocial,
    enrichedIndustry: input.enrichedIndustry,
    industryPalette: input.industryPalette,
    schemaOrg,
    competitorInsights,
  });

  return {
    intelligence,
    downloadedLogo: logoApi?.downloadedLogo ?? null,
    schemaOrg,
    competitorInsights,
    timing: {
      total: Date.now() - start,
      ogCache: input.ogImage ? ogCacheMs : null,
      vision: visionResult.status === "fulfilled" ? visionResult.value.ms : null,
      social: socialResult.status === "fulfilled" ? socialResult.value.ms : null,
      socialEnrich: socialEnrichMs,
      logoApi: logoApiResult.status === "fulfilled" ? logoApiResult.value.ms : null,
      audit: auditResult.status === "fulfilled" ? auditResult.value.ms : null,
      competitorAds: competitorAdsResult.status === "fulfilled" ? competitorAdsResult.value.ms : null,
    },
  };
}

async function timed<T>(fn: () => Promise<T>): Promise<{ result: T; ms: number }> {
  const start = Date.now();
  const result = await fn();
  return { result, ms: Date.now() - start };
}
