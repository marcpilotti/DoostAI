/**
 * Monthly credit refill.
 * Called by Vercel Cron at 0 0 1 * * (first of each month).
 * In production: queries plans table for credit amount, inserts into credit_ledger.
 */

import { _setMockBalance } from "./check";

const PLAN_CREDITS: Record<string, number> = {
  starter: 500,
  growth: 2500,
  scale: 10000,
};

export async function refillCredits(orgId: string, planId: string): Promise<void> {
  const credits = PLAN_CREDITS[planId] ?? 500;

  // TODO: Replace with Supabase insert
  // await supabase.from("credit_ledger").insert({
  //   organization_id: orgId,
  //   amount: credits,
  //   balance_after: credits,
  //   type: "monthly_refill",
  //   metadata: { plan_id: planId, month: new Date().toISOString().slice(0, 7) },
  // });

  _setMockBalance(credits);
}
