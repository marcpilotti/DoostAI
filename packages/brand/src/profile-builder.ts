import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

import { createTrace, traceGeneration, flushTraces } from "@doost/ai";
import type { BrandProfile, BrandScrapeResult, CompanyEnrichment } from "./types";

const brandAnalysisSchema = z.object({
  name: z.string().describe("Company name"),
  description: z.string().describe("One-sentence company description"),
  industry: z.string().describe("Primary industry"),
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
    primary: z
      .string()
      .describe("Primary brand color as hex (e.g. #1B2F5B)"),
    secondary: z.string().describe("Secondary brand color as hex"),
    accent: z.string().describe("Accent color as hex"),
    background: z
      .string()
      .describe("Background color as hex, usually white or near-white"),
    text: z
      .string()
      .describe("Text color as hex, usually dark"),
  }),
  fonts: z.object({
    heading: z.string().describe("Heading font family name"),
    body: z.string().describe("Body font family name"),
  }),
});

export async function buildBrandProfile(
  scrapeResult: BrandScrapeResult,
  enrichment?: CompanyEnrichment,
): Promise<BrandProfile> {
  const context = [
    `URL: ${scrapeResult.url}`,
    scrapeResult.title && `Page title: ${scrapeResult.title}`,
    scrapeResult.description && `Meta description: ${scrapeResult.description}`,
    scrapeResult.colors.length > 0 &&
      `Colors found in CSS: ${scrapeResult.colors.join(", ")}`,
    scrapeResult.fonts.length > 0 &&
      `Fonts found in CSS: ${scrapeResult.fonts.join(", ")}`,
    enrichment?.name && `Company name: ${enrichment.name}`,
    enrichment?.industry && `Industry: ${enrichment.industry}`,
    enrichment?.employeeCount &&
      `Employee count: ${enrichment.employeeCount}`,
    enrichment?.location && `Location: ${enrichment.location}`,
    scrapeResult.markdown &&
      `Website content (truncated):\n${scrapeResult.markdown.slice(0, 6000)}`,
  ]
    .filter(Boolean)
    .join("\n");

  const trace = createTrace("build-brand-profile", { url: scrapeResult.url });
  const start = Date.now();

  const { object } = await generateObject({
    model: anthropic("claude-haiku-4-5-20251001"),
    schema: brandAnalysisSchema,
    prompt: `Analyze this company's brand identity from their website data. Extract structured brand information.

CRITICAL:
- For "industry": Determine the ACTUAL industry from the website content. Examples: "Fintech", "E-handel", "SaaS", "Restaurang", "Fastigheter", "Hälsa & Träning", "Bygg & Konstruktion", "Utbildning", "Juridik", "Marknadsföring", "Konsult", etc. Be SPECIFIC — never default to "Dataprogrammering" or generic "IT".
- If color data is available from CSS, prefer those exact colors. If fonts are detected, use those exact names.
- Infer brand voice, target audience, and value propositions from the actual website content.

${context}`,
  });

  traceGeneration(trace, {
    name: "brand-analysis",
    model: "claude-haiku-4-5-20251001",
    input: context.slice(0, 500),
    output: object,
    latencyMs: Date.now() - start,
  });
  await flushTraces();

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
    colors: object.colors,
    fonts: object.fonts,
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
