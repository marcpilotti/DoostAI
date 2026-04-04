"use client";

import { Activity, Pencil } from "lucide-react";
import { motion } from "motion/react";

import { NumberTicker } from "@/components/ui/number-ticker";
import type { KPI } from "@/lib/mock-data";

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
      {kpis.map((kpi, index) => {
        const selected = kpi.id === selectedId;
        return (
          <motion.button
            key={kpi.id}
            onClick={() => onSelect(kpi.id)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
            whileTap={{ scale: 0.98 }}
            className={`doost-glow-border group relative min-w-[140px] shrink-0 sm:min-w-0 sm:shrink rounded-[var(--doost-radius-card)] p-4 text-left transition-[ring,background] duration-200 focus-visible:ring-2 focus-visible:ring-[var(--doost-bg-active)] focus-visible:outline-none ${
              selected
                ? "active bg-[var(--doost-bg)] ring-2 ring-[var(--doost-bg-active)] shadow-md"
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
                {kpi.prefix ?? ""}
                <NumberTicker
                  value={kpi.value}
                  delay={index * 0.1}
                  decimalPlaces={kpi.format === "multiplier" ? 1 : 0}
                  className="text-[28px] font-bold leading-none text-[var(--doost-text)]"
                />
                {kpi.suffix ?? ""}
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
          </motion.button>
        );
      })}
    </div>
  );
}
