"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

type UpgradeData = {
  reason: string;
  suggestedPlan: string;
  currentPlan: string;
};

const PLAN_PRICES_SEK: Record<string, number> = {
  starter: 1995,
  pro: 4995,
  agency: 9995,
};

export function UpgradePrompt({ data }: { data: UpgradeData }) {
  const price = PLAN_PRICES_SEK[data.suggestedPlan] ?? 0;
  const planName =
    data.suggestedPlan.charAt(0).toUpperCase() + data.suggestedPlan.slice(1);

  return (
    <div className="mt-2 rounded-2xl border border-border/30 bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] backdrop-blur-xl p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-foreground">
            Uppgradera din plan
          </h4>
          <p className="mt-1 text-sm text-muted-foreground">{data.reason}</p>
          <Link
            href="/dashboard/settings/billing"
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-indigo-600 hover:to-indigo-700 hover:shadow-md"
          >
            Uppgradera till {planName} — {price.toLocaleString("sv-SE")} kr/mån
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
