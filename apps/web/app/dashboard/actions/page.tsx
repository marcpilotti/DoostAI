"use client";

import { ArrowRight, TrendingUp, AlertTriangle, Zap } from "lucide-react";

const MOCK_ACTIONS = [
  { id: "1", type: "optimize", icon: TrendingUp, title: "Scale Holiday Sale 2025", description: "ROAS is 3.2x and stable. Increase budget by 20% to capture more conversions.", priority: "high" },
  { id: "2", type: "warning", icon: AlertTriangle, title: "Black Friday CTR declining", description: "CTR dropped from 3.1% to 2.5% over the past week. Consider refreshing creative.", priority: "medium" },
  { id: "3", type: "opportunity", icon: Zap, title: "New audience segment available", description: "Lookalike audience based on top 5% customers is ready. Expected 2-3x better performance.", priority: "high" },
  { id: "4", type: "optimize", icon: TrendingUp, title: "Consolidate Google campaigns", description: "3 campaigns target overlapping keywords. Merging could reduce CPC by ~15%.", priority: "low" },
];

const PRIORITY_STYLES = {
  high: "bg-[var(--doost-bg-badge-review)] text-[#E65100]",
  medium: "bg-[var(--doost-bg-secondary)] text-[var(--doost-text-secondary)]",
  low: "bg-[var(--doost-bg-secondary)] text-[var(--doost-text-muted)]",
};

export default function ActionsPage() {
  return (
    <div className="p-6">
      <h2 className="mb-6 text-[18px] font-semibold text-[var(--doost-text)]">Actions</h2>

      <div className="space-y-3">
        {MOCK_ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <div key={a.id} className="group flex items-center gap-4 rounded-[var(--doost-radius-card)] bg-[var(--doost-bg)] p-4 transition-colors hover:bg-[var(--doost-bg-secondary)]" style={{ border: `1px solid var(--doost-border)` }}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--doost-bg-secondary)]">
                <Icon className="h-5 w-5 text-[var(--doost-text-secondary)]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-[13px] font-semibold text-[var(--doost-text)]">{a.title}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ${PRIORITY_STYLES[a.priority as keyof typeof PRIORITY_STYLES]}`}>{a.priority}</span>
                </div>
                <p className="mt-0.5 text-[12px] text-[var(--doost-text-secondary)]">{a.description}</p>
              </div>
              <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--doost-text-muted)] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white">
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
