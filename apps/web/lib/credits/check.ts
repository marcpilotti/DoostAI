import { creditLedger, db, desc, eq } from "@doost/db";

/**
 * Get credit balance for an organization.
 * Reads the most recent ledger entry's balance_after.
 */
export async function getBalance(orgId: string): Promise<number> {
  try {
    const [latest] = await db
      .select({ balanceAfter: creditLedger.balanceAfter })
      .from(creditLedger)
      .where(eq(creditLedger.orgId, orgId))
      .orderBy(desc(creditLedger.createdAt))
      .limit(1);

    return latest?.balanceAfter ?? 0;
  } catch {
    return 0;
  }
}
