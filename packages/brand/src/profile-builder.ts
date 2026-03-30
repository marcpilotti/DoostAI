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
    .max(50)
    .describe("Primary target audience as SHORT keywords (max 3-5 words). Examples: 'Kvinnor 25-45', 'Småföretagare', 'Föräldrar med barn'. NOT a full sentence."),
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
  // A.4: Filter generic Roaring industries that mislead the AI
  const GENERIC_INDUSTRIES = new Set([
    "Dataprogrammering",
    "Annan IT-verksamhet",
    "Databehandling",
    "Konsultverksamhet avseende informationsteknik",
    "Utgivning av programvara",
  ]);
  const enrichedIndustry = enrichment?.industry && !GENERIC_INDUSTRIES.has(enrichment.industry)
    ? enrichment.industry
    : undefined;

  const context = [
    `== HARD FACTS (use these directly) ==`,
    enrichment?.name && `Company name: ${enrichment.name}`,
    enrichedIndustry && `Industry (from registry): ${enrichedIndustry}`,
    enrichment?.location && `Location: ${enrichment.location}`,
    scrapeResult.colors.length > 0 &&
      `Colors found in CSS (hints — may include text/border colors, identify BRAND colors only): ${scrapeResult.colors.join(", ")}`,
    scrapeResult.fonts.length > 0 &&
      `Fonts found in CSS (hints — may include system fonts): ${scrapeResult.fonts.join(", ")}`,
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
1. COLORS: Identify the company's PRIMARY BRAND color — the color that represents their logo and identity. Many websites use third-party colors (Trustpilot green, social media colors, payment provider colors, sustainability badges, etc.) prominently in their CSS. IGNORE these. Focus on the color used in the company's OWN logo, header, and primary buttons. IGNORE body text colors, border colors, and neutral grays. CSS colors are provided as hints but often include text colors (#1a1a1a, #333, etc.) — skip those. Return the actual brand colors as 6-digit hex. Example: Biltema uses blue #003DA6 as primary, not black #231f20 which is just text. Example: Klarna uses pink #FFB3C7 as primary, not green from Trustpilot widgets.
2. FONTS: Identify the main font used for headings and body text. CSS font names are provided as hints. If they are generic system fonts (Arial, Helvetica, system-ui), try to identify the actual display font from the website content. If unsure, return "Inter".
3. INDUSTRY: Determine from website content. Use specific Swedish terms: "Fintech", "E-handel", "SaaS", "Rekrytering", "Fastigheter", "Hälsa & Träning", "Juridik", "Marknadsföring", "Logistik", "Utbildning", "Restaurang", "Bygg", "Konsult", etc. NEVER use "Dataprogrammering" or generic "IT".
4. NAME: Return the OFFICIAL company name as it appears on the website, with correct spacing and capitalization. Example: "Lyvia Group" not "Lyviagroup", "HubSpot" not "Hubspot". Remove legal suffixes (AB, Inc, Ltd, GmbH) but keep the brand spelling exactly as the company uses it. Look at the page title, logo text, and headings for the correct form.
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

  // Trust the AI for colors — it analyzes the page visually and understands
  // brand colors vs body text. CSS frequency counting picks up text colors
  // (#231f20) as "primary" which is almost always wrong.
  const finalColors = { ...object.colors };

  // Post-process: only override AI fonts if CSS found specific non-system fonts
  const SYSTEM_FONTS = new Set(["arial", "helvetica", "verdana", "tahoma", "times new roman", "georgia", "segoe ui", "system-ui", "sans-serif", "serif", "monospace", "-apple-system", "blinkmacsystemfont", "ui-sans-serif", "ui-serif", "ui-monospace"]);
  const cssFonts = scrapeResult.fonts.filter((f) => {
    const lower = f.toLowerCase().trim();
    if (SYSTEM_FONTS.has(lower)) return false;
    if (lower.startsWith("var(")) return false;  // Filter CSS variables like var(--_1s6etqh32)
    if (lower.startsWith("--")) return false;     // Filter CSS custom properties
    return true;
  });
  const finalFonts = { ...object.fonts };
  // Only override if CSS found specific named fonts (not system defaults)
  if (cssFonts.length >= 1 && cssFonts[0]) finalFonts.heading = cssFonts[0];
  if (cssFonts.length >= 2 && cssFonts[1]) finalFonts.body = cssFonts[1];
  else if (cssFonts.length === 1 && cssFonts[0]) finalFonts.body = cssFonts[0];

  const primaryLogo =
    scrapeResult.logoUrls[0] ?? scrapeResult.ogImage ?? undefined;

  return {
    url: scrapeResult.url,
    name: object.name, // AI reads actual website branding — more accurate than registry
    description: object.description,
    industry: enrichedIndustry ?? object.industry,
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
