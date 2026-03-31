/**
 * Credit balance check.
 * In production: queries credit_ledger from Supabase.
 * For now: returns mock balance.
 */

let mockBalance = 2500; // Starting balance for dev

export async function getBalance(orgId: string): Promise<number> {
  // TODO: Replace with Supabase query
  // const { data } = await supabase
  //   .from("credit_ledger")
  //   .select("balance_after")
  //   .eq("organization_id", orgId)
  //   .order("created_at", { ascending: false })
  //   .limit(1)
  //   .single();
  // return data?.balance_after ?? 0;

  return mockBalance;
}

export function _setMockBalance(balance: number) {
  mockBalance = balance;
}
