import type { BrandContext, CopyOptions } from "../types";

function brandBlock(brand: BrandContext): string {
  return [
    `Company: ${brand.name}`,
    brand.description && `Description: ${brand.description}`,
    brand.industry && `Industry: ${brand.industry}`,
    `Brand voice: ${brand.brandVoice}`,
    `Target audience: ${brand.targetAudience}`,
    `Value propositions: ${brand.valuePropositions.join("; ")}`,
    `Website: ${brand.url}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function optionsBlock(options: CopyOptions): string {
  return [
    options.objective && `Campaign objective: ${options.objective}`,
    options.tone && `Tone: ${options.tone}`,
    options.language && `Language: ${options.language}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function metaAdCopy(brand: BrandContext, options: CopyOptions): string {
  return `Generate Facebook/Instagram ad copy for this brand.

${brandBlock(brand)}
${optionsBlock(options)}

STRICT CHARACTER LIMITS — exceeding these means the ad will be rejected:
- Headline: maximum 40 characters (including spaces)
- Body text: maximum 125 characters (including spaces)
- CTA button text: maximum 20 characters

Write punchy, scroll-stopping copy. Use the brand voice. Focus on a single benefit.
The headline should grab attention. The body should create urgency or curiosity.
CTA MUST be natural, human-readable language in the same language as the ad copy — for example "Läs mer", "Kontakta oss", "Boka nu", "Handla nu". NEVER use technical enum values like "LEARN_MORE", "SHOP_NOW", "CONTACT_US".
Count every character carefully before responding.`;
}

export function googleSearchCopy(
  brand: BrandContext,
  options: CopyOptions,
): string {
  return `Generate Google responsive search ad copy for this brand.

${brandBlock(brand)}
${optionsBlock(options)}

STRICT CHARACTER LIMITS — exceeding these means the ad will be rejected:
- 3 headlines: each maximum 30 characters (including spaces)
- 2 descriptions: each maximum 90 characters (including spaces)

Headlines should be distinct, not repetitive. Include the brand name in one headline.
Descriptions should expand on the value proposition with a clear call to action.
If the ad is in Swedish, write Swedish descriptions and CTAs. NEVER use technical enum values like "LEARN_MORE" as CTA text.
Count every character carefully before responding.`;
}

export function linkedinCopy(
  brand: BrandContext,
  options: CopyOptions,
): string {
  return `Generate LinkedIn sponsored content ad copy for this brand.

${brandBlock(brand)}
${optionsBlock(options)}

STRICT CHARACTER LIMITS — exceeding these means the ad will be rejected:
- Headline: maximum 70 characters (including spaces)
- Intro text / body: maximum 150 characters (including spaces)
- CTA button text: maximum 20 characters

Write professional, thought-leadership style copy. LinkedIn audiences respond to
data, insights, and business value. Avoid salesy language.
CTA MUST be natural, human-readable language in the same language as the ad copy — for example "Läs mer", "Kontakta oss", "Boka nu". NEVER use technical enum values like "LEARN_MORE", "SHOP_NOW", "CONTACT_US".
Count every character carefully before responding.`;
}
