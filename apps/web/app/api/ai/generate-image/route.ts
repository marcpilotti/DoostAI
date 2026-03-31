import { NextResponse } from "next/server";
import { z } from "zod";

import { generateImage, getCreditCost } from "@/lib/providers/model-router";
import { getBalance } from "@/lib/credits/check";
import { deductCredits } from "@/lib/credits/deduct";

export const maxDuration = 60;

const inputSchema = z.object({
  model: z.string(),
  prompt: z.string().min(1).max(2000),
  size: z.string().optional(),
  referenceImages: z.array(z.string()).optional(),
  organizationId: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = inputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { model, prompt, size, referenceImages, organizationId } = parsed.data;
  const orgId = organizationId ?? "demo";
  const cost = getCreditCost(model);

  // Check balance
  const balance = await getBalance(orgId);
  if (balance < cost) {
    return NextResponse.json(
      { error: "Insufficient credits", balance, required: cost },
      { status: 402 },
    );
  }

  try {
    const result = await generateImage({ model, prompt, size, referenceImages });

    // Deduct credits on success
    const deduction = await deductCredits(orgId, cost, {
      type: "image_generation",
      model,
      description: prompt.slice(0, 100),
    });

    return NextResponse.json({
      imageUrl: result.imageUrl,
      model: result.model,
      creditsUsed: result.creditCost,
      creditsRemaining: deduction.balanceAfter,
    });
  } catch (err) {
    console.error("[generate-image] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Image generation failed" },
      { status: 500 },
    );
  }
}
