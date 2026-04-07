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
    scrapeResult.colors.length > 0 &&
      `Colors found in CSS (hints — may include text/border colors, identify BRAND colors only): ${scrapeResult.colors.join(", ")}`,
    scrapeResult.fonts.length > 0 &&
      `Fonts found in CSS (hints — may include system fonts): ${scrapeResult.fonts.join(", ")}`,
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

  // Validate AI-selected colors — sometimes Haiku picks text/border colors
  const finalColors = { ...object.colors };

  // Check if primary color is actually distinctive (not near-gray/black/white)
  function isDistinctiveColor(hex: string): boolean {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    const lightness = (max + min) / (2 * 255);
    // Reject near-black, near-white, or low-saturation (gray/muted)
    if (lightness < 0.12 || lightness > 0.92) return false;
    if (saturation < 0.15) return false;
    return true;
  }

  if (!isDistinctiveColor(finalColors.primary) && scrapeResult.colors.length > 0) {
    // AI picked a non-distinctive color — use the most saturated scraped color instead
    const fallback = scrapeResult.colors.find((c) => c.length === 7 && isDistinctiveColor(c));
    if (fallback) {
      console.warn(`[profile-builder] AI primary ${finalColors.primary} is not distinctive, using scraped ${fallback}`);
      finalColors.primary = fallback;
    }
  }

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
  // Post-process: reject CSS variables and sanitize font names
  const isSafeFont = (f: string): boolean => /^[a-zA-Z0-9\s\-'.]+$/.test(f) && f.length <= 100;
  if (!isSafeFont(finalFonts.heading) || finalFonts.heading.startsWith("var(") || finalFonts.heading.startsWith("--")) finalFonts.heading = "Inter";
  if (!isSafeFont(finalFonts.body) || finalFonts.body.startsWith("var(") || finalFonts.body.startsWith("--")) finalFonts.body = "Inter";
  // Filter CSS variables from extracted fonts too — they're not real font names
  const validCssFonts = cssFonts.filter(f => !f.startsWith("var(") && !f.startsWith("--"));
  // Only override if CSS found specific named fonts (not system defaults)
  if (validCssFonts.length >= 1 && validCssFonts[0]) finalFonts.heading = validCssFonts[0];
  if (validCssFonts.length >= 2 && validCssFonts[1]) finalFonts.body = validCssFonts[1];
  else if (validCssFonts.length === 1 && validCssFonts[0]) finalFonts.body = validCssFonts[0];

  // Validate against known fonts — reject hallucinated or invalid names
  if (finalFonts.heading && !KNOWN_FONTS.has(finalFonts.heading)) {
    const industryKey = enrichedIndustry || object?.industry || "";
    // Try exact match, then partial match on first word
    const fallback = INDUSTRY_FONTS[industryKey]
      || Object.entries(INDUSTRY_FONTS).find(([k]) => industryKey.toLowerCase().includes(k.toLowerCase().split(" ")[0] || ""))?.[1]
      || { heading: "DM Sans", body: "DM Sans" };
    console.log(`[profile-builder] Font "${finalFonts.heading}" not recognized, using fallback: ${fallback.heading}`);
    finalFonts.heading = fallback.heading;
    finalFonts.body = fallback.body;
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
