import { z } from "zod";

// --- Raw scrape result from Firecrawl ---

export const brandScrapeResultSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
  description: z.string().optional(),
  ogImage: z.string().optional(),
  screenshot: z.string().optional(),
  markdown: z.string().optional(),
  colors: z.array(z.string()),
  fonts: z.array(z.string()),
  logoUrls: z.array(z.string()),
  links: z.array(z.string()),
  rawHtml: z.string().optional(),
});

export type BrandScrapeResult = z.infer<typeof brandScrapeResultSchema>;

// --- Company enrichment (Roaring.io / Clearbit) ---

export const companyEnrichmentSchema = z.object({
  name: z.string(),
  orgNumber: z.string().optional(),
  industry: z.string().optional(),
  industryCodes: z.array(z.string()).optional(),
  employeeCount: z.number().optional(),
  revenue: z.string().optional(),
  location: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  ceo: z.string().optional(),
  boardMembers: z.array(z.string()).optional(),
  creditRating: z.string().optional(),
});

export type CompanyEnrichment = z.infer<typeof companyEnrichmentSchema>;

// --- AI-analyzed brand profile ---

export const brandColorsSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  background: z.string(),
  text: z.string(),
});

export const brandFontsSchema = z.object({
  heading: z.string(),
  body: z.string(),
});

export const brandLogosSchema = z.object({
  primary: z.string().optional(),
  icon: z.string().optional(),
  dark: z.string().optional(),
});

export const brandProfileSchema = z.object({
  url: z.string().url(),
  name: z.string(),
  description: z.string().optional(),
  industry: z.string().optional(),
  industryCodes: z.array(z.string()).optional(),
  employeeCount: z.number().optional(),
  revenue: z.string().optional(),
  location: z.string().optional(),
  ceo: z.string().optional(),
  orgNumber: z.string().optional(),
  colors: brandColorsSchema,
  fonts: brandFontsSchema,
  logos: brandLogosSchema,
  brandVoice: z.string(),
  targetAudience: z.string(),
  valuePropositions: z.array(z.string()),
  competitors: z.array(z.string()),
  rawScrapeData: z.unknown().optional(),
  rawEnrichmentData: z.unknown().optional(),
});

export type BrandProfile = z.infer<typeof brandProfileSchema>;
