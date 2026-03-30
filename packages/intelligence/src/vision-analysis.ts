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
  detected_fonts: z.array(z.object({
    name: z.string().describe("Exact font name if recognizable (e.g. 'Montserrat', 'Playfair Display')"),
    role: z.enum(["heading", "body"]).describe("Whether this is used for headings or body text"),
    confidence: z.number().describe("How confident 0-100 that this is the exact font"),
  })).describe("Fonts detected visually from the page. Only include if you can identify the specific font."),
  industry_guess: z.string().describe("Best guess at the company's industry in Swedish"),
  tagline: z.string().optional().describe("Company tagline if visible"),
  confidence: z.number().describe("Overall confidence 0-100"),
});

export type VisionAnalysis = z.infer<typeof visionSchema>;

/**
 * Simple retry wrapper — retries `fn` up to `retries` times with a delay between attempts.
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 1, delayMs = 3000): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    console.warn(`[Vision] Retrying after error: ${err instanceof Error ? err.message : err}`);
    await new Promise(r => setTimeout(r, delayMs));
    return withRetry(fn, retries - 1, delayMs);
  }
}

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

  // Validate ogImageUrl is a real URL with a path component (not just "http://")
  if (!screenshotBase64 && ogImageUrl) {
    try {
      const parsed = new URL(ogImageUrl);
      if (!parsed.protocol.startsWith("http") || parsed.pathname.length <= 1) {
        return null;
      }
    } catch {
      return null;
    }
  }

  try {
    // Build the image content part
    const imagePart = screenshotBase64
      ? { type: "image" as const, image: screenshotBase64 }
      : { type: "image" as const, image: ogImageUrl! };

    const { object } = await withRetry(() => generateObject({
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
- What specific fonts are used? If you can identify them by name (e.g., Montserrat, Roboto, Playfair Display), list them with role (heading/body) and confidence. Only name fonts you're fairly sure about.
- What visual style? (modern, classic, playful, premium, neutral)
- What industry does this company appear to be in? Answer in Swedish.
- Is there a visible tagline?
- Describe the logo.
Be precise with hex color codes.`,
            },
          ],
        },
      ],
    }));

    return object;
  } catch (err) {
    console.warn("[L1 Vision] Analysis failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
