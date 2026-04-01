/**
 * Ad Strategy Engine — generates creative strategy before copy generation.
 *
 * A professional agency creates a creative brief BEFORE writing copy.
 * This module does the same: analyzes the brand, goal, and audience,
 * then produces a strategy that guides the copywriter to create
 * dramatically better, more targeted ad copy.
 *
 * Each variant gets a DIFFERENT strategy angle (e.g., emotional vs rational)
 * so the user sees genuinely distinct options, not just word swaps.
 */

import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import type { BrandContext } from "../types";

// ── Types ────────────────────────────────────────────────────────

export type AdStrategy = {
  concept: string;          // One-sentence campaign concept
  hook: string;             // The attention-grabbing opening angle
  emotionalTrigger: string; // The feeling we want to evoke
  keyMessage: string;       // The single most important thing to communicate
  visualDirection: string;  // How the visual should look/feel
  ctaStrategy: string;      // Why the CTA works for this audience
  angle: "emotional" | "rational" | "social-proof" | "urgency" | "aspirational";
};

export type AdStrategySet = {
  variantA: AdStrategy;     // Primary variant (strongest angle)
  variantB: AdStrategy;     // Alternative angle (different approach)
  recommendation: string;   // Which variant to start with and why
  imagePromptA: string;     // Detailed DALL-E prompt for variant A
  imagePromptB: string;     // Detailed DALL-E prompt for variant B
};

// ── Schema ───────────────────────────────────────────────────────

const strategySchema = z.object({
  variantA: z.object({
    concept: z.string().describe("One-sentence campaign concept for this variant"),
    hook: z.string().describe("The attention-grabbing opening angle (what stops the scroll)"),
    emotionalTrigger: z.string().describe("The feeling to evoke: trust, curiosity, FOMO, pride, relief, excitement"),
    keyMessage: z.string().describe("The single most important message to communicate"),
    visualDirection: z.string().describe("Brief visual direction: mood, style, composition idea"),
    ctaStrategy: z.string().describe("Why this CTA works for this audience"),
    angle: z.enum(["emotional", "rational", "social-proof", "urgency", "aspirational"]),
  }),
  variantB: z.object({
    concept: z.string().describe("Different campaign concept — must contrast with variant A"),
    hook: z.string().describe("Different hook angle from variant A"),
    emotionalTrigger: z.string().describe("Different emotional trigger from variant A"),
    keyMessage: z.string().describe("Different key message from variant A"),
    visualDirection: z.string().describe("Different visual direction from variant A"),
    ctaStrategy: z.string().describe("Why this CTA works for this audience"),
    angle: z.enum(["emotional", "rational", "social-proof", "urgency", "aspirational"]),
  }),
  recommendation: z.string().describe("Which variant to start with and a one-sentence reason why"),
  imagePromptA: z.string().describe("Detailed image generation prompt for variant A. Include: composition, lighting, color palette, mood, style. Must follow brand colors. NO text/logos/watermarks in image."),
  imagePromptB: z.string().describe("Detailed image generation prompt for variant B. Different mood/composition from A. Must follow brand colors. NO text/logos/watermarks in image."),
});

// ── Platform Strategy Contexts ───────────────────────────────────

const PLATFORM_CONTEXT: Record<string, string> = {
  meta: `Platform: Meta (Facebook/Instagram).
Users scroll fast. You have 0.5 seconds to stop them.
Best hooks: emotional, surprising, relatable, visual-first.
Copy should feel native — not like an ad. Use conversational language.
Stories/Reels: vertical, bold, immediate. Feed: square, polished.`,

  google: `Platform: Google Search/Display.
Users have high intent — they're actively searching.
Best hooks: answer their question, match their search intent.
Headlines must be ultra-specific and benefit-driven.
Copy should feel like a trusted recommendation, not a pitch.`,

  linkedin: `Platform: LinkedIn.
Users are in professional mode. They respect data, insights, expertise.
Best hooks: surprising statistics, industry insights, thought leadership.
Copy should feel like a smart colleague sharing a tip, not a salesperson.
Avoid salesy language. Use professional but warm tone.`,

  tiktok: `Platform: TikTok.
Users want entertainment and authenticity.
Best hooks: pattern interrupts, relatable moments, behind-the-scenes.
Copy should feel native to the platform — casual, energetic, real.
Avoid corporate speak. Use trending language naturally.`,
};

// ── Main Function ────────────────────────────────────────────────

export async function generateAdStrategy(params: {
  brand: BrandContext;
  platform: string;
  goal: string;
  audience: string;
  language: string;
}): Promise<AdStrategySet> {
  const { brand, platform, goal, audience, language } = params;
  const platformContext = PLATFORM_CONTEXT[platform] ?? PLATFORM_CONTEXT.meta!;

  const prompt = `You are a world-class creative director at a top advertising agency.
Your client is "${brand.name}" — ${brand.description ?? "a company"} in the ${brand.industry ?? "business"} industry.

BRAND VOICE: ${brand.brandVoice}
TARGET AUDIENCE: ${audience}
CAMPAIGN GOAL: ${goal}
VALUE PROPOSITIONS: ${brand.valuePropositions.join(", ")}
WEBSITE: ${brand.url}
LANGUAGE: All strategy must be in ${language}.

${platformContext}

Create TWO distinct ad strategy variants. They MUST be genuinely different:
- Variant A: The strongest, safest approach (highest expected performance)
- Variant B: A creative alternative (different angle, different emotional trigger)

For each variant, define:
1. CONCEPT: One-sentence campaign concept
2. HOOK: What stops the scroll / grabs attention (be specific, not generic)
3. EMOTIONAL TRIGGER: What feeling we're evoking and why it works for this audience
4. KEY MESSAGE: The single most important thing to communicate
5. VISUAL DIRECTION: How the ad image should look (mood, composition, color usage)
6. CTA STRATEGY: Why this specific CTA works for this audience + goal

Then create TWO detailed image generation prompts:
- Each must create a DIFFERENT visual that matches its variant's strategy
- Include: composition, lighting, color palette (use brand colors: primary ${brand.name}), mood, style
- The image is a BACKGROUND — no text, logos, or watermarks
- Make it photorealistic, premium, modern
- Describe the scene, not the ad

Finally, recommend which variant to start with and why (one sentence).`;

  try {
    // Check cache first (1h TTL)
    const { buildStrategyKey, getCachedStrategy, setCachedStrategy } = await import("../cache");
    const cacheKey = buildStrategyKey(brand.name, platform, goal, audience, language);
    const cached = await getCachedStrategy(cacheKey);
    if (cached) return cached;

    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-6"),
      schema: strategySchema,
      prompt,
      temperature: 0.7,
    });

    // Cache for 1 hour
    await setCachedStrategy(cacheKey, object, 3600).catch(() => {});

    return object;
  } catch (err) {
    console.warn("[Ad Strategy] Generation failed:", err instanceof Error ? err.message : err);

    // Fallback: return a basic strategy so the flow continues
    return {
      variantA: {
        concept: `${brand.name} — ${goal}`,
        hook: language === "Swedish" ? "Upptäck något nytt" : "Discover something new",
        emotionalTrigger: language === "Swedish" ? "nyfikenhet" : "curiosity",
        keyMessage: brand.valuePropositions[0] ?? brand.description ?? "",
        visualDirection: language === "Swedish" ? "Rent, modernt, professionellt" : "Clean, modern, professional",
        ctaStrategy: language === "Swedish" ? "Direkt handling som matchar målet" : "Direct action that matches the goal",
        angle: "emotional",
      },
      variantB: {
        concept: `${brand.name} — ${language === "Swedish" ? "det smarta valet" : "the smart choice"}`,
        hook: language === "Swedish" ? "Varför tusentals litar på oss" : "Why thousands trust us",
        emotionalTrigger: language === "Swedish" ? "förtroende" : "trust",
        keyMessage: brand.valuePropositions[1] ?? brand.description ?? "",
        visualDirection: language === "Swedish" ? "Varmt, inbjudande, trovärdigt" : "Warm, inviting, trustworthy",
        ctaStrategy: language === "Swedish" ? "Lågtröskel-ingång" : "Low-commitment entry point",
        angle: "social-proof",
      },
      recommendation: language === "Swedish"
        ? "Börja med Variant A — direkt emotionell approach fungerar bäst för denna målgrupp."
        : "Start with Variant A — direct emotional appeal typically performs best for this audience.",
      imagePromptA: `Professional advertisement background for ${brand.industry ?? "business"}. Modern, clean. Brand colors. No text.`,
      imagePromptB: `Warm, inviting advertisement background for ${brand.industry ?? "business"}. Trustworthy feel. Brand colors. No text.`,
    };
  }
}
