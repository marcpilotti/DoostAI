"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  ChevronDown,
  LayoutGrid,
  LayoutList,
  Grid3X3,
} from "lucide-react";

import { TIME_RANGES } from "@/lib/mock-data";

const SORT_OPTIONS = [
  { id: "roas_desc", label: "ROAS (High → Low)" },
  { id: "roas_asc", label: "ROAS (Low → High)" },
  { id: "spend_desc", label: "Spend (High → Low)" },
  { id: "spend_asc", label: "Spend (Low → High)" },
  { id: "ctr_desc", label: "CTR (High → Low)" },
  { id: "ctr_asc", label: "CTR (Low → High)" },
];

const SPEND_RANGES = [
  { id: "all", label: "All spend" },
  { id: "0-500", label: "$0 – $500" },
  { id: "500-2000", label: "$500 – $2,000" },
  { id: "2000+", label: "$2,000+" },
];

type ViewMode = "grid" | "list" | "compact";

export function CreativeFilters({
  timeRange,
  sort,
  spendRange,
  view,
  onTimeRangeChange,
  onSortChange,
  onSpendRangeChange,
  onViewChange,
}: {
  timeRange: string;
  sort: string;
  spendRange: string;
  view: ViewMode;
  onTimeRangeChange: (id: string) => void;
  onSortChange: (id: string) => void;
  onSpendRangeChange: (id: string) => void;
  onViewChange: (view: ViewMode) => void;
}) {
  // Persist view mode
  useEffect(() => {
    const saved = localStorage.getItem("doost:creative-view");
    if (saved && ["grid", "list", "compact"].includes(saved)) {
      onViewChange(saved as ViewMode);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setView(v: ViewMode) {
    localStorage.setItem("doost:creative-view", v);
    onViewChange(v);
  }

  const filterPill = "relative flex items-center gap-1.5 rounded-lg bg-[var(--doost-bg)] px-3 py-2 text-[13px] font-medium text-[var(--doost-text)]";
  const filterBorder = { border: `1px solid var(--doost-border)` };

  return (
    <div className="flex items-center gap-2">
      {/* Time range */}
      <div className={filterPill} style={filterBorder}>
        <Calendar className="h-3.5 w-3.5 text-[var(--doost-text-muted)]" />
        <select
          value={timeRange}
          onChange={(e) => onTimeRangeChange(e.target.value)}
          className="appearance-none bg-transparent pr-4 outline-none cursor-pointer"
        >
          {TIME_RANGES.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-[var(--doost-text-muted)]" />
      </div>

      {/* Sort */}
      <div className={filterPill} style={filterBorder}>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="appearance-none bg-transparent pr-4 outline-none cursor-pointer"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-[var(--doost-text-muted)]" />
      </div>

      {/* Spend range */}
      <div className={filterPill} style={filterBorder}>
        <select
          value={spendRange}
          onChange={(e) => onSpendRangeChange(e.target.value)}
          className="appearance-none bg-transparent pr-4 outline-none cursor-pointer"
        >
          {SPEND_RANGES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-[var(--doost-text-muted)]" />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* View toggles */}
      <div className="flex rounded-lg" style={filterBorder}>
        {([
          { id: "list" as const, icon: LayoutList },
          { id: "grid" as const, icon: LayoutGrid },
          { id: "compact" as const, icon: Grid3X3 },
        ]).map(({ id, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`flex h-9 w-9 items-center justify-center transition-colors ${
              view === id
                ? "bg-[var(--doost-bg-active)] text-white"
                : "text-[var(--doost-text-muted)] hover:text-[var(--doost-text)]"
            } ${id === "list" ? "rounded-l-lg" : id === "compact" ? "rounded-r-lg" : ""}`}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
    </div>
  );
}
