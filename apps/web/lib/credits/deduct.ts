/**
 * Credit deduction.
 * In production: inserts into credit_ledger in Supabase.
 * For now: uses in-memory mock.
 */

import { getBalance, _setMockBalance } from "./check";

export type DeductResult = {
  success: boolean;
  balanceAfter: number;
  error?: string;
};

export async function deductCredits(
  orgId: string,
  amount: number,
  metadata?: { type: string; model?: string; description?: string },
): Promise<DeductResult> {
  const balance = await getBalance(orgId);

  if (balance < amount) {
    return {
      success: false,
      balanceAfter: balance,
      error: "Insufficient credits",
    };
  }

  const newBalance = balance - amount;

  // TODO: Replace with Supabase insert
  // await supabase.from("credit_ledger").insert({
  //   organization_id: orgId,
  //   amount: -amount,
  //   balance_after: newBalance,
  //   type: metadata?.type ?? "adjustment",
  //   model_used: metadata?.model,
  //   metadata,
  // });

  _setMockBalance(newBalance);

  return {
    success: true,
    balanceAfter: newBalance,
  };
}
