"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

type UpgradeData = {
  reason: string;
  suggestedPlan: string;
  currentPlan: string;
};

const PLAN_PRICES: Record<string, number> = {
  starter: 199,
  pro: 499,
  agency: 999,
};

export function UpgradePrompt({ data }: { data: UpgradeData }) {
  const price = PLAN_PRICES[data.suggestedPlan] ?? 0;
  const planName =
    data.suggestedPlan.charAt(0).toUpperCase() + data.suggestedPlan.slice(1);

  return (
    <div className="mt-1 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/80 to-orange-50/40 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-foreground">
            Plangräns nådd
          </h4>
          <p className="mt-1 text-sm text-muted-foreground">{data.reason}</p>
          <Link
            href="/settings/billing"
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Uppgradera till {planName} — €{price}/mån
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
