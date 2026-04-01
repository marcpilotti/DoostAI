import { safeQuery,supabase } from "@/lib/supabase";

import { _setMockBalance,getBalance } from "./check";

export type DeductResult = {
  success: boolean;
  balanceAfter: number;
  error?: string;
};

/**
 * Deduct credits. Tries Supabase first, falls back to in-memory.
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

  // Try real DB insert
  const inserted = await safeQuery(() =>
    supabase.from("credit_ledger").insert({
      organization_id: orgId,
      amount: -amount,
      balance_after: newBalance,
      type: metadata?.type ?? "adjustment",
      model_used: metadata?.model,
      metadata: metadata as Record<string, unknown>,
    }).select("id").single(),
  );

  if (!inserted) {
    // Fallback to mock
    _setMockBalance(newBalance);
  }

  return { success: true, balanceAfter: newBalance };
}
