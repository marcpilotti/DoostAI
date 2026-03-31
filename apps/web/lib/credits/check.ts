import { supabase, safeQuery } from "@/lib/supabase";

let mockBalance = 2500;

/**
 * Get credit balance. Tries Supabase first, falls back to in-memory.
 */
export async function getBalance(orgId: string): Promise<number> {
  // Try real DB
  const data = await safeQuery(() =>
    supabase
      .from("credit_ledger")
      .select("balance_after")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
  );

  if (data && typeof (data as { balance_after?: number }).balance_after === "number") {
    return (data as { balance_after: number }).balance_after;
  }

  // Fallback to mock
  return mockBalance;
}

export function _setMockBalance(balance: number) {
  mockBalance = balance;
}
