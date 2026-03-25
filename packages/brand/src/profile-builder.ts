import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

import { createTrace, traceGeneration, flushTraces } from "@doost/ai";
import type { BrandProfile, BrandScrapeResult, CompanyEnrichment } from "./types";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be 6-digit hex like #1B2F5B");

const brandAnalysisSchema = z.object({
  name: z.string().describe("Company name without suffix (no AB, Inc, Ltd)"),
  description: z.string().max(200).describe("One-sentence company description in Swedish"),
  industry: z.string().describe("Primary industry in Swedish. Be specific: 'Fintech', 'E-handel', 'SaaS', 'Restaurang', 'Fastigheter', etc."),
  brandVoice: z
    .string()
    .describe(
      "Brand voice description (e.g. 'Professional, warm, and approachable')",
    ),
  targetAudience: z
    .string()
    .describe("Primary target audience description"),
  valuePropositions: z
    .array(z.string())
    .describe("3-5 key value propositions"),
  competitors: z
    .array(z.string())
    .describe("3-5 likely competitors"),
  colors: z.object({
    primary: hexColor.describe("Primary brand color from the website CSS. MUST be from the CSS data if available."),
    secondary: hexColor.describe("Secondary brand color from the website CSS"),
    accent: hexColor.describe("Accent color from the website CSS"),
    background: hexColor.describe("Background color, usually #FFFFFF or near-white"),
    text: hexColor.describe("Text color, usually #1A1A1A or similar dark"),
  }),
  fonts: z.object({
    heading: z.string().describe("Heading font family from CSS. Use the EXACT name found in CSS."),
    body: z.string().describe("Body font family from CSS. Use the EXACT name found in CSS."),
  }),
});

export async function buildBrandProfile(
  scrapeResult: BrandScrapeResult,
  enrichment?: CompanyEnrichment,
): Promise<BrandProfile> {
  // Put hard facts first, website content last — AI prioritizes early context
  const context = [
    `== HARD FACTS (use these directly) ==`,
    enrichment?.name && `Company name: ${enrichment.name}`,
    enrichment?.industry && `Industry (from registry): ${enrichment.industry}`,
    enrichment?.location && `Location: ${enrichment.location}`,
    scrapeResult.colors.length > 0 &&
      `Colors found in CSS (USE THESE EXACT HEX VALUES): ${scrapeResult.colors.join(", ")}`,
    scrapeResult.fonts.length > 0 &&
      `Fonts found in CSS (USE THESE EXACT NAMES): ${scrapeResult.fonts.join(", ")}`,
    ``,
    `== WEBSITE METADATA ==`,
    `URL: ${scrapeResult.url}`,
    scrapeResult.title && `Page title: ${scrapeResult.title}`,
    scrapeResult.description && `Meta description: ${scrapeResult.description}`,
    ``,
    `== WEBSITE CONTENT ==`,
    scrapeResult.markdown &&
      scrapeResult.markdown.slice(0, 6000),
  ]
    .filter(Boolean)
    .join("\n");

  const trace = createTrace("build-brand-profile", { url: scrapeResult.url });
  const start = Date.now();

  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-6"),
    schema: brandAnalysisSchema,
    temperature: 0,
    prompt: `Analyze this company's brand identity. Return ONLY facts from the data below — do NOT guess or hallucinate.

RULES (follow exactly):
1. COLORS: You MUST use the exact hex colors from "Colors found in CSS". Pick the most prominent non-white/non-black color as primary. If no CSS colors, use the most visible color from the page content.
2. FONTS: You MUST use the exact font names from "Fonts found in CSS". If none found, return "Inter" as default.
3. INDUSTRY: Determine from website content. Use specific Swedish terms: "Fintech", "E-handel", "SaaS", "Rekrytering", "Fastigheter", "Hälsa & Träning", "Juridik", "Marknadsföring", "Logistik", "Utbildning", "Restaurang", "Bygg", "Konsult", etc. NEVER use "Dataprogrammering" or generic "IT".
4. NAME: Return the company name WITHOUT suffix (no AB, Inc, Ltd, GmbH).
5. DESCRIPTION: One sentence in Swedish describing what the company does.

${context}`,
  });

  traceGeneration(trace, {
    name: "brand-analysis",
    model: "claude-sonnet-4-6",
    input: context.slice(0, 500),
    output: object,
    latencyMs: Date.now() - start,
  });
  await flushTraces();

  // Post-process: use UNIQUE CSS colors, never assign same color to multiple roles
  const cssColors = [...new Set(
    scrapeResult.colors
      .filter((c) => /^#[0-9a-fA-F]{6}$/.test(c))
      .map((c) => c.toLowerCase())
  )];
  const finalColors = { ...object.colors };

  // Only override with CSS colors if we have enough DISTINCT ones
  if (cssColors.length >= 3) {
    finalColors.primary = cssColors[0]!;
    finalColors.secondary = cssColors[1]!;
    finalColors.accent = cssColors[2]!;
  } else if (cssColors.length === 2) {
    finalColors.primary = cssColors[0]!;
    finalColors.accent = cssColors[1]!;
    // Let AI choose secondary
  } else if (cssColors.length === 1) {
    finalColors.primary = cssColors[0]!;
    // Let AI choose secondary + accent (they're usually decent)
  }
  // If 0 CSS colors, trust the AI entirely

  // Post-process: prefer scraped fonts
  const cssFonts = scrapeResult.fonts;
  const finalFonts = { ...object.fonts };
  if (cssFonts.length >= 1 && cssFonts[0]) finalFonts.heading = cssFonts[0];
  if (cssFonts.length >= 2 && cssFonts[1]) finalFonts.body = cssFonts[1];
  else if (cssFonts.length === 1 && cssFonts[0]) finalFonts.body = cssFonts[0];

  const primaryLogo =
    scrapeResult.logoUrls[0] ?? scrapeResult.ogImage ?? undefined;

  return {
    url: scrapeResult.url,
    name: enrichment?.name ?? object.name,
    description: object.description,
    industry: enrichment?.industry ?? object.industry,
    industryCodes: enrichment?.industryCodes,
    employeeCount: enrichment?.employeeCount,
    revenue: enrichment?.revenue,
    location: enrichment?.location,
    ceo: enrichment?.ceo,
    orgNumber: enrichment?.orgNumber,
    colors: finalColors,
    fonts: finalFonts,
    logos: {
      primary: primaryLogo,
      icon: scrapeResult.logoUrls[1],
      dark: scrapeResult.logoUrls[2],
    },
    brandVoice: object.brandVoice,
    targetAudience: object.targetAudience,
    valuePropositions: object.valuePropositions,
    competitors: object.competitors,
    rawScrapeData: scrapeResult,
    rawEnrichmentData: enrichment,
  };
}
