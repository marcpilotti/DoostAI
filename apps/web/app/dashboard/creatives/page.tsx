"use client";

import { useState } from "react";

import { CreativeGrid } from "@/components/dashboard/creative-grid";
import { CreativeFilters } from "@/components/dashboard/creative-filters";
import { useCreatives } from "@/hooks/use-creatives";

type ViewMode = "grid" | "list" | "compact";

export default function CreativesPage() {
  const [timeRange, setTimeRange] = useState("30d");
  const [sort, setSort] = useState("roas_desc");
  const [spendRange, setSpendRange] = useState("all");
  const [view, setView] = useState<ViewMode>("grid");
  const [page, setPage] = useState(1);

  const { creatives, total, totalPages } = useCreatives({
    timeRange,
    sort,
    spendRange,
    page,
    perPage: 12,
  });

  return (
    <div className="p-6">
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

      <div className="mt-6">
        <CreativeGrid creatives={creatives} view={view} />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-[var(--doost-text-secondary)] hover:bg-[var(--doost-bg)] disabled:opacity-30"
          >
            Previous
          </button>
          <span className="text-[12px] text-[var(--doost-text-muted)]">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-[var(--doost-text-secondary)] hover:bg-[var(--doost-bg)] disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}

      {creatives.length === 0 && (
        <div className="mt-12 text-center">
          <p className="text-[14px] text-[var(--doost-text-muted)]">Inga kreativ matchar filtren</p>
        </div>
      )}
    </div>
  );
}
