import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

const visionSchema = z.object({
  logo_description: z.string().describe("Description of the logo seen on the page"),
  dominant_colors: z.array(z.object({
    hex: z.string().describe("Hex color code"),
    role: z.string().describe("Where this color is used: primary, accent, background, text, nav"),
  })).describe("Top 3-5 dominant brand colors visible on the page"),
  font_category: z.enum(["sans", "serif", "mono", "display"]).describe("Primary font category"),
  visual_style: z.enum(["modern", "classic", "playful", "premium", "neutral"]).describe("Overall visual style"),
  industry_guess: z.string().describe("Best guess at the company's industry in Swedish"),
  tagline: z.string().optional().describe("Company tagline if visible"),
  confidence: z.number().min(0).max(100).describe("Overall confidence in the analysis"),
});

export type VisionAnalysis = z.infer<typeof visionSchema>;

/**
 * L1: Analyze a website screenshot/OG image using Claude Vision.
 * Falls back to analyzing the OG image URL if no screenshot is available.
 */
export async function analyzeWithVision(
  ogImageUrl?: string,
  screenshotBase64?: string,
): Promise<VisionAnalysis | null> {
  // Prefer screenshot (base64 from Firecrawl) over OG image URL
  if (!screenshotBase64 && !ogImageUrl) return null;

  try {
    // Build the image content part
    const imagePart = screenshotBase64
      ? { type: "image" as const, image: screenshotBase64 }
      : { type: "image" as const, image: ogImageUrl! };

    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-6"),
      schema: visionSchema,
      messages: [
        {
          role: "user",
          content: [
            imagePart,
            {
              type: "text",
              text: `Analyze this website image. Extract the visual brand identity:
- What colors dominate? List the top 3-5 as hex codes with their role (primary, accent, nav, background, text).
- What font category is used? (sans-serif, serif, monospace, display)
- What visual style? (modern, classic, playful, premium, neutral)
- What industry does this company appear to be in? Answer in Swedish.
- Is there a visible tagline?
- Describe the logo.
Be precise with hex color codes.`,
            },
          ],
        },
      ],
    });

    return object;
  } catch (err) {
    console.warn("[L1 Vision] Analysis failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
