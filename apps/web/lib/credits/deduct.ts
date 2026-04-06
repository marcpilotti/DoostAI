import { creditLedger, db } from "@doost/db";

import { getBalance } from "./check";

export type DeductResult = {
  success: boolean;
  balanceAfter: number;
  error?: string;
};

/**
 * Deduct credits from an organization's balance.
 * Inserts a negative ledger entry.
 */
export async function deductCredits(
  orgId: string,
  amount: number,
  metadata?: { type: string; model?: string; description?: string },
): Promise<DeductResult> {
  const balance = await getBalance(orgId);

  if (balance < amount) {
    return { success: false, balanceAfter: balance, error: "Insufficient credits" };
  }

  const newBalance = balance - amount;

  try {
    await db.insert(creditLedger).values({
      orgId,
      amount: -amount,
      balanceAfter: newBalance,
      type: metadata?.type ?? "adjustment",
      modelUsed: metadata?.model,
      metadata: metadata as Record<string, unknown>,
    });
  } catch (err) {
    console.error("[credits] Deduction failed:", err instanceof Error ? err.message : err);
    return { success: false, balanceAfter: balance, error: "Credit deduction failed" };
  }

  return { success: true, balanceAfter: newBalance };
}
