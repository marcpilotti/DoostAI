"use client";

import { useState, useMemo } from "react";

import { CreativeGrid } from "@/components/dashboard/creative-grid";
import { CreativeFilters } from "@/components/dashboard/creative-filters";
import { MOCK_CREATIVES } from "@/lib/mock-data";
import type { Creative } from "@/lib/mock-data";

type ViewMode = "grid" | "list" | "compact";

function sortCreatives(creatives: Creative[], sort: string): Creative[] {
  const sorted = [...creatives];
  switch (sort) {
    case "roas_desc": return sorted.sort((a, b) => b.roas - a.roas);
    case "roas_asc": return sorted.sort((a, b) => a.roas - b.roas);
    case "spend_desc": return sorted.sort((a, b) => b.spend - a.spend);
    case "spend_asc": return sorted.sort((a, b) => a.spend - b.spend);
    case "ctr_desc": return sorted.sort((a, b) => b.ctr - a.ctr);
    case "ctr_asc": return sorted.sort((a, b) => a.ctr - b.ctr);
    default: return sorted;
  }
}

function filterBySpend(creatives: Creative[], range: string): Creative[] {
  switch (range) {
    case "0-500": return creatives.filter((c) => c.spend <= 500);
    case "500-2000": return creatives.filter((c) => c.spend > 500 && c.spend <= 2000);
    case "2000+": return creatives.filter((c) => c.spend > 2000);
    default: return creatives;
  }
}

export default function CreativesPage() {
  const [timeRange, setTimeRange] = useState("30d");
  const [sort, setSort] = useState("roas_desc");
  const [spendRange, setSpendRange] = useState("all");
  const [view, setView] = useState<ViewMode>("grid");

  const filtered = useMemo(() => {
    let result = filterBySpend(MOCK_CREATIVES, spendRange);
    result = sortCreatives(result, sort);
    return result;
  }, [sort, spendRange]);

  return (
    <div className="p-6">
      {/* Filters */}
      <CreativeFilters
        timeRange={timeRange}
        sort={sort}
        spendRange={spendRange}
        view={view}
        onTimeRangeChange={setTimeRange}
        onSortChange={setSort}
        onSpendRangeChange={setSpendRange}
        onViewChange={setView}
      />

      {/* Grid */}
      <div className="mt-6">
        <CreativeGrid
          creatives={filtered}
          view={view}
        />
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="mt-12 text-center">
          <p className="text-[14px] text-[var(--doost-text-muted)]">
            Inga kreativ matchar filtren
          </p>
        </div>
      )}
    </div>
  );
}
