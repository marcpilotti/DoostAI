import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

import { createTrace, traceGeneration, flushTraces } from "@doost/ai";
import type { BrandProfile, BrandScrapeResult, CompanyEnrichment } from "./types";
import { INDUSTRY_COLORS, INDUSTRY_FONTS, KNOWN_FONTS } from "./industry-defaults";

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
  // Keep ALL industries from registry — even generic ones are better than nothing.
  // Mark generic ones so AI knows to refine but not ignore.
  const GENERIC_INDUSTRIES = new Set([
    "Dataprogrammering",
    "Annan IT-verksamhet",
    "Databehandling",
    "Konsultverksamhet avseende informationsteknik",
    "Utgivning av programvara",
  ]);
  const enrichedIndustry = enrichment?.industry || undefined;
  const isGenericIndustry = enrichment?.industry ? GENERIC_INDUSTRIES.has(enrichment.industry) : false;

  let context = [
    `== HARD FACTS (use these directly) ==`,
    enrichment?.name && `Company name: ${enrichment.name}`,
    enrichedIndustry && `Industry (from registry): ${enrichedIndustry}${isGenericIndustry ? " (generic — refine based on website content)" : ""}`,
    enrichment?.location && `Location: ${enrichment.location}`,
  ]
    .filter(Boolean)
    .join("\n");

  if (scrapeResult.colors.length === 0) {
    const industryKey = enrichedIndustry || "";
    const palette = INDUSTRY_COLORS[industryKey];
    if (palette) {
      context += `\nNote: No brand colors detected from CSS. For ${industryKey}, typical colors are: ${palette.primary}, ${palette.secondary}, ${palette.accent}. Adjust based on content.`;
    }
  }

  context += [
    ``,
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
1. COLORS: Identify the company's PRIMARY BRAND color — the MOST SATURATED, distinctive color that represents their visual identity. RULES:
   - Pick the color used in their LOGO, HEADER, or PRIMARY CTA BUTTONS
   - NEVER pick text colors (#1a1a1a, #333, #231f20, #2c2c2c, etc.)
   - NEVER pick border/shadow colors (grays, near-blacks, near-whites)
   - NEVER pick third-party colors (Trustpilot green, social icons, payment badges)
   - The primary color MUST be visually distinctive — high saturation, not gray/black/white
   - If the website looks predominantly dark/neutral, look for the ACCENT color used on buttons or links — that's the brand color
   - Return 6-digit hex. Example: Biltema = #003DA6 (blue), not #231f20 (text). Klarna = #FFB3C7 (pink), not #333 (gray).
2. FONTS: Identify the main font used for headings and body text. CSS font names are provided as hints. If they are generic system fonts (Arial, Helvetica, system-ui), try to identify the actual display font from the website content. NEVER return CSS variables like "var(--font-normal)" or "--font-heading". Return the actual font NAME. If unsure, return "Inter".
3. INDUSTRY: Determine from website content. Use specific Swedish terms: "Fintech", "E-handel", "SaaS", "Rekrytering", "Fastigheter", "Hälsa & Träning", "Juridik", "Marknadsföring", "Logistik", "Utbildning", "Restaurang", "Bygg", "Konsult", etc. NEVER use "Dataprogrammering" or generic "IT".
4. NAME: Return the OFFICIAL company name as it appears on the website, with correct spacing and capitalization. Example: "Lyvia Group" not "Lyviagroup", "HubSpot" not "Hubspot". Remove legal suffixes (AB, Inc, Ltd, GmbH) but keep the brand spelling exactly as the company uses it. Look at the page title, logo text, and headings for the correct form.
5. DESCRIPTION: One sentence in Swedish describing what the company does.

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

  // ── Colors: CSS-extracted colors are GROUND TRUTH ──────────────
  // The scraper already filtered non-brand colors (grays, near-black/white).
  // What remains are the actual brand colors sorted by saturation.
  // The AI's color output is only used as fallback when CSS extraction fails.
  const scrapedColors = scrapeResult.colors.filter((c) => c.length === 7);
  const finalColors = scrapedColors.length >= 3
    ? {
        primary: scrapedColors[0]!,
        secondary: scrapedColors[1]!,
        accent: scrapedColors[2]!,
        background: "#FFFFFF",
        text: "#1A1A1A",
      }
    : scrapedColors.length >= 1
      ? {
          primary: scrapedColors[0]!,
          secondary: scrapedColors[1] ?? object.colors.secondary,
          accent: scrapedColors[2] ?? object.colors.accent,
          background: "#FFFFFF",
          text: "#1A1A1A",
        }
      : { ...object.colors }; // No CSS colors — trust the AI as last resort

  // ── Fonts: CSS-extracted fonts are GROUND TRUTH ───────────────
  const SYSTEM_FONTS = new Set(["arial", "helvetica", "verdana", "tahoma", "times new roman", "georgia", "segoe ui", "system-ui", "sans-serif", "serif", "monospace", "-apple-system", "blinkmacsystemfont", "ui-sans-serif", "ui-serif", "ui-monospace", "inherit", "initial", "unset"]);
  const validCssFonts = scrapeResult.fonts.filter((f) => {
    const lower = f.toLowerCase().trim();
    if (lower.length < 3) return false;
    if (SYSTEM_FONTS.has(lower)) return false;
    if (lower.startsWith("var(") || lower.startsWith("--") || lower.startsWith("&")) return false;
    if (lower.startsWith("font awesome")) return false; // icon font, not text
    if (!/^[a-zA-Z0-9\s\-'.]+$/.test(f)) return false; // only safe characters
    return true;
  });

  // CSS fonts win. AI fonts are fallback. KNOWN_FONTS only validates AI output.
  const finalFonts = { heading: "Inter", body: "Inter" };
  if (validCssFonts.length >= 1 && validCssFonts[0]) {
    finalFonts.heading = validCssFonts[0];
    finalFonts.body = validCssFonts.length >= 2 ? validCssFonts[1]! : validCssFonts[0];
  } else if (KNOWN_FONTS.has(object.fonts.heading)) {
    finalFonts.heading = object.fonts.heading;
    finalFonts.body = KNOWN_FONTS.has(object.fonts.body) ? object.fonts.body : object.fonts.heading;
  }

  // Pick logo — ONLY same-domain. Third-party logos are never used.
  // If no same-domain logo exists, guaranteeMinimumProfile() generates SVG initials.
  const primaryLogo = scrapeResult.logoUrls[0] ?? undefined;

  const profile: BrandProfile = {
    url: scrapeResult.url,
    name: object.name, // AI reads actual website branding — more accurate than registry
    description: object.description,
    industry: (!enrichedIndustry || isGenericIndustry) ? object.industry : enrichedIndustry,
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
    },
    brandVoice: object.brandVoice,
    targetAudience: object.targetAudience,
    valuePropositions: object.valuePropositions,
    competitors: object.competitors,
    rawScrapeData: scrapeResult,
    rawEnrichmentData: enrichment,
  };

  // Calculate profile completeness score (0-100)
  profile.profileCompleteness = calculateCompleteness(profile);

  return profile;
}

function calculateCompleteness(profile: BrandProfile): number {
  const checks = [
    !!profile.name,
    !!profile.description,
    !!profile.industry,
    !!profile.colors?.primary,
    !!profile.fonts?.heading,
    !!profile.logos?.primary,
    !!profile.brandVoice,
    !!profile.targetAudience,
    (profile.valuePropositions?.length ?? 0) > 0,
    !!profile.orgNumber,
    !!profile.employeeCount,
    !!profile.location,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
