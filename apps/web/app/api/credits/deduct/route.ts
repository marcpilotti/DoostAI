import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { deductCredits } from "@/lib/credits/deduct";

const inputSchema = z.object({
  organizationId: z.string(),
  amount: z.number().positive(),
  type: z.string(),
  model: z.string().optional(),
  description: z.string().optional(),
});

export async function POST(req: Request) {
  const { userId, orgId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = inputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { organizationId, amount, type, model, description } = parsed.data;

  // Verify the user belongs to the organization they're deducting from
  if (orgId && organizationId !== orgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await deductCredits(organizationId, amount, { type, model, description });

  if (!result.success) {
    return NextResponse.json({ error: result.error, balance: result.balanceAfter }, { status: 402 });
  }

  return NextResponse.json({ balance: result.balanceAfter });
}
