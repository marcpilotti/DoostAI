import type { AdCopyResult, Platform } from "../types";

type BrandInput = {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: { heading: string; body: string };
  logos: { primary?: string; icon?: string; dark?: string };
};

type CreativeOutput = {
  platform: Platform;
  templateId: string;
  headline: string;
  bodyCopy: string;
  cta: string;
  variant: string;
  imageBuffer?: Buffer;
};

// Lazy import to avoid pulling heavy deps at module level
async function getTemplates() {
  const { getTemplatesForPlatform, renderToImage } = await import(
    "@doost/templates"
  );
  return { getTemplatesForPlatform, renderToImage };
}

function selectTemplate(
  templates: Array<{ id: string; category: string; [key: string]: unknown }>,
  industry?: string,
): { id: string; category: string; [key: string]: unknown } {
  // Prefer "minimal" or "corporate" for B2B, "bold" for B2C
  const isB2b =
    industry?.toLowerCase().includes("b2b") ||
    industry?.toLowerCase().includes("saas") ||
    industry?.toLowerCase().includes("software");

  const preferred = isB2b
    ? ["minimal", "corporate", "insight", "standard"]
    : ["bold", "split", "minimal", "standard"];

  for (const cat of preferred) {
    const match = templates.find((t) => t.category === cat);
    if (match) return match;
  }
  return templates[0]!;
}

export async function assembleCreatives(
  brand: BrandInput,
  copyVariants: AdCopyResult[],
  platforms: Platform[],
  options?: { industry?: string; renderImages?: boolean },
): Promise<CreativeOutput[]> {
  const { getTemplatesForPlatform, renderToImage } = await getTemplates();
  const results: CreativeOutput[] = [];

  for (const platform of platforms) {
    const platformTemplates = getTemplatesForPlatform(platform);
    if (platformTemplates.length === 0) continue;

    const template = selectTemplate(platformTemplates, options?.industry);
    const fullTemplate = platformTemplates.find(
      (t: { id: string }) => t.id === template.id,
    )!;

    const platformCopy = copyVariants.filter((c) => c.platform === platform);

    for (const copy of platformCopy) {
      let imageBuffer: Buffer | undefined;

      if (options?.renderImages !== false && platform !== "google") {
        imageBuffer = await renderToImage(fullTemplate, brand, {
          headline: copy.headline,
          bodyCopy: copy.bodyCopy,
          cta: copy.cta,
        });
      }

      results.push({
        platform,
        templateId: template.id,
        headline: copy.headline,
        bodyCopy: copy.bodyCopy,
        cta: copy.cta,
        variant: copy.variant,
        imageBuffer,
      });
    }
  }

  return results;
}
