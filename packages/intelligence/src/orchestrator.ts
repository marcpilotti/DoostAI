/**
 * Brand Intelligence Pipeline Orchestrator
 * Runs L1-L6 in parallel, merges results with confidence scoring.
 */

import { analyzeWithVision } from "./vision-analysis";
import { detectSocialPresence } from "./social-detection";
import { fetchLogoApis, type DownloadedLogo } from "./logo-api";
import { auditWebsite } from "./website-audit";
import { mergeIntelligence, type MergedBrandIntelligence } from "./confidence-merge";

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
  timing: {
    total: number;
    vision: number | null;
    social: number;
    logoApi: number | null;
    audit: number;
  };
};

/**
 * Run the complete Brand Intelligence Pipeline.
 * All layers execute in parallel for maximum speed.
 */
export async function runBrandIntelligencePipeline(
  input: PipelineInput,
): Promise<PipelineResult> {
  const start = Date.now();
  const domain = input.url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]!;

  // Run all layers in parallel
  const [
    visionResult,
    socialResult,
    logoApiResult,
    auditResult,
  ] = await Promise.allSettled([
    // L1: Vision AI (analyze OG image or screenshot)
    timed(() => analyzeWithVision(input.ogImage, input.screenshot)),

    // L3: Social media detection (from HTML)
    timed(() => Promise.resolve(detectSocialPresence(input.html, input.links))),

    // L4: Logo APIs (Brandfetch + Clearbit)
    timed(() => fetchLogoApis(domain)),

    // L5b: Website audit (from HTML)
    timed(() => Promise.resolve(auditWebsite(input.url, input.html, input.links))),
  ]);

  // Extract results (null if failed)
  const vision = visionResult.status === "fulfilled" ? visionResult.value.result : null;
  const social = socialResult.status === "fulfilled" ? socialResult.value.result : [];
  const logoApi = logoApiResult.status === "fulfilled" ? logoApiResult.value.result : null;
  const audit = auditResult.status === "fulfilled" ? auditResult.value.result : null;

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
    audit,
    enrichedIndustry: input.enrichedIndustry,
    industryPalette: input.industryPalette,
  });

  return {
    intelligence,
    downloadedLogo: logoApi?.downloadedLogo ?? null,
    timing: {
      total: Date.now() - start,
      vision: visionResult.status === "fulfilled" ? visionResult.value.ms : null,
      social: socialResult.status === "fulfilled" ? socialResult.value.ms : 0,
      logoApi: logoApiResult.status === "fulfilled" ? logoApiResult.value.ms : null,
      audit: auditResult.status === "fulfilled" ? auditResult.value.ms : 0,
    },
  };
}

async function timed<T>(fn: () => Promise<T>): Promise<{ result: T; ms: number }> {
  const start = Date.now();
  const result = await fn();
  return { result, ms: Date.now() - start };
}
