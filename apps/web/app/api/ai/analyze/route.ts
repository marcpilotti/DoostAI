import { NextResponse } from "next/server";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

import { deductCredits } from "@/lib/credits/deduct";

export const maxDuration = 60;

const inputSchema = z.object({
  creatives: z.array(z.object({
    name: z.string(),
    roas: z.number(),
    spend: z.number(),
    ctr: z.number(),
  })),
  question: z.string().optional(),
  organizationId: z.string().optional(),
});

/**
 * POST /api/ai/analyze
 * AI-powered creative analysis. Compares creatives and returns
 * scaling recommendations, insights, and action items.
 */
export async function POST(req: Request) {
  const body = await req.json();
  const parsed = inputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { creatives, question, organizationId } = parsed.data;
  const orgId = organizationId ?? "demo";

  // Deduct credits
  const deduction = await deductCredits(orgId, 3, {
    type: "creative_analysis",
    description: question ?? "Creative performance analysis",
  });

  if (!deduction.success) {
    return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
  }

  const creativeSummary = creatives
    .map((c) => `- ${c.name}: ROAS ${c.roas}x, Spend $${c.spend}, CTR ${c.ctr}%`)
    .join("\n");

  const prompt = `You are a senior media buyer analyzing ad creative performance. Here are the creatives:

${creativeSummary}

${question ? `User question: ${question}` : "Provide a comprehensive analysis with scaling recommendations."}

Respond in a structured format with:
1. Top performer and why
2. Scaling recommendations (which to increase budget on)
3. Which to pause or refresh
4. Key patterns you notice

Be concise and actionable. Use markdown.`;

  try {
    const result = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      prompt,
    });

    return NextResponse.json({
      analysis: result.text,
      creditsUsed: 3,
      creditsRemaining: deduction.balanceAfter,
    });
  } catch (err) {
    // Refund credits on failure — generation was charged but didn't complete
    await deductCredits(orgId, -3, {
      type: "refund",
      description: "Refund: creative analysis failed",
    });

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 },
    );
  }
}
