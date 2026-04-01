"use client";

import { Activity, Pencil } from "lucide-react";

import type { KPI } from "@/lib/mock-data";
import { formatCurrency,formatNumber } from "@/lib/mock-data";

function formatValue(kpi: KPI): string {
  if (kpi.format === "currency") return `${kpi.prefix ?? ""}${formatCurrency(kpi.value)}`;
  if (kpi.format === "multiplier") return `${kpi.value}${kpi.suffix ?? ""}`;
  return `${kpi.prefix ?? ""}${formatNumber(kpi.value)}${kpi.suffix ?? ""}`;
}

export function KPICards({
  kpis,
  selectedId,
  onSelect,
}: {
  kpis: KPI[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 lg:grid-cols-5">
      {kpis.map((kpi) => {
        const selected = kpi.id === selectedId;
        return (
          <button
            key={kpi.id}
            onClick={() => onSelect(kpi.id)}
            className={`group relative min-w-[140px] shrink-0 sm:min-w-0 sm:shrink rounded-[var(--doost-radius-card)] p-4 text-left transition-all focus-visible:ring-2 focus-visible:ring-[var(--doost-bg-active)] focus-visible:outline-none ${
              selected
                ? "bg-[var(--doost-bg)] ring-2 ring-[var(--doost-bg-active)] shadow-md"
                : "bg-[var(--doost-bg)] hover:ring-1 hover:ring-[var(--doost-border)]"
            }`}
            style={{ border: selected ? "none" : `1px solid var(--doost-border)` }}
          >
            {/* Icon + Label */}
            <div className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-[var(--doost-text-muted)]" />
              <span className="text-[12px] font-medium text-[var(--doost-text-muted)]">
                {kpi.label}
              </span>
            </div>

            {/* Value */}
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-[28px] font-bold leading-none text-[var(--doost-text)]">
                {formatValue(kpi)}
              </span>
              {/* Change badge */}
              <span
                className={`text-[12px] font-semibold ${
                  kpi.change > 0
                    ? "text-[var(--doost-text-positive)]"
                    : kpi.change < 0
                      ? "text-[var(--doost-text-negative)]"
                      : "text-[var(--doost-text-muted)]"
                }`}
                aria-label={`${kpi.change > 0 ? "Ökning" : kpi.change < 0 ? "Minskning" : "Oförändrad"} ${Math.abs(kpi.change)}%`}
              >
                {kpi.change > 0 ? "\u2191 +" : kpi.change < 0 ? "\u2193 " : ""}{kpi.change}%
              </span>
            </div>

            {/* Edit icon on selected */}
            {selected && (
              <Pencil className="absolute right-3 top-3 h-3.5 w-3.5 text-[var(--doost-text-muted)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
