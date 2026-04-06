import { creditLedger, db } from "@doost/db";

const PLAN_CREDITS: Record<string, number> = {
  free: 0,
  starter: 500,
  pro: 2500,
  agency: 10000,
};

/**
 * Monthly credit refill for an organization.
 * Inserts a positive ledger entry with the plan's credit amount.
 */
export async function refillCredits(orgId: string, plan: string): Promise<void> {
  const credits = PLAN_CREDITS[plan] ?? 0;
  if (credits === 0) return;

  try {
    await db.insert(creditLedger).values({
      orgId,
      amount: credits,
      balanceAfter: credits,
      type: "monthly_refill",
      metadata: { plan, month: new Date().toISOString().slice(0, 7) },
    });
  } catch (err) {
    console.error("[credits] Refill failed:", err instanceof Error ? err.message : err);
  }
}
