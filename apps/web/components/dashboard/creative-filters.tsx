"use client";

import { useEffect } from "react";
import {
  ArrowDownUp,
  Calendar,
  ChevronDown,
  DollarSign,
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
  { id: "all", label: "Spend range" },
  { id: "0-500", label: "$0 – $500" },
  { id: "500-2000", label: "$500 – $2,000" },
  { id: "2000+", label: "$2,000+" },
];

type ViewMode = "grid" | "list" | "compact";

/**
 * Matches reference exactly:
 * - rounded-full pills with icon + text + chevron
 * - white bg, subtle border
 * - view toggles: 3 square buttons, rightmost group
 */
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

  return (
    <div className="flex items-center gap-2">
      {/* Time range pill */}
      <div className="relative flex items-center gap-1.5 rounded-full bg-[var(--doost-bg)] px-3.5 py-[7px] text-[12px] font-medium text-[var(--doost-text)]" style={{ border: `1px solid var(--doost-border)` }}>
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
        <ChevronDown className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-[var(--doost-text-muted)]" />
      </div>

      {/* Sort pill */}
      <div className="relative flex items-center gap-1.5 rounded-full bg-[var(--doost-bg)] px-3.5 py-[7px] text-[12px] font-medium text-[var(--doost-text)]" style={{ border: `1px solid var(--doost-border)` }}>
        <ArrowDownUp className="h-3.5 w-3.5 text-[var(--doost-text-muted)]" />
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="appearance-none bg-transparent pr-4 outline-none cursor-pointer"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-[var(--doost-text-muted)]" />
      </div>

      {/* Spend range pill */}
      <div className="relative flex items-center gap-1.5 rounded-full bg-[var(--doost-bg)] px-3.5 py-[7px] text-[12px] font-medium text-[var(--doost-text)]" style={{ border: `1px solid var(--doost-border)` }}>
        <DollarSign className="h-3.5 w-3.5 text-[var(--doost-text-muted)]" />
        <select
          value={spendRange}
          onChange={(e) => onSpendRangeChange(e.target.value)}
          className="appearance-none bg-transparent pr-4 outline-none cursor-pointer"
        >
          {SPEND_RANGES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-[var(--doost-text-muted)]" />
      </div>

      <div className="flex-1" />

      {/* View toggles — match reference: 3 square buttons in a group */}
      <div className="flex overflow-hidden rounded-lg" style={{ border: `1px solid var(--doost-border)` }}>
        {([
          { id: "list" as const, icon: LayoutList },
          { id: "grid" as const, icon: LayoutGrid },
          { id: "compact" as const, icon: Grid3X3 },
        ]).map(({ id, icon: Icon }, i) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`flex h-9 w-9 items-center justify-center transition-colors ${
              view === id
                ? "bg-[var(--doost-bg-active)] text-white"
                : "bg-[var(--doost-bg)] text-[var(--doost-text-muted)] hover:text-[var(--doost-text)]"
            } ${i > 0 ? "border-l" : ""}`}
            style={i > 0 ? { borderColor: "var(--doost-border)" } : undefined}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
    </div>
  );
}
