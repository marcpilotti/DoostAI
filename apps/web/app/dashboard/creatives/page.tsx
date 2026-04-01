"use client";

import { Suspense, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAIPanelStore } from "@/lib/stores/ai-panel";

import { CreativeGrid } from "@/components/dashboard/creative-grid";
import { CreativeFilters } from "@/components/dashboard/creative-filters";
import { useCreatives } from "@/hooks/use-creatives";

type ViewMode = "grid" | "list" | "compact";

function CreativesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setOpen: setAIPanelOpen } = useAIPanelStore();

  useEffect(() => { document.title = "Creatives — Doost AI"; }, []);
  useEffect(() => { setAIPanelOpen(true); }, [setAIPanelOpen]);

  const timeRange = searchParams.get("range") ?? "30d";
  const sort = searchParams.get("sort") ?? "roas_desc";
  const spendRange = searchParams.get("spend") ?? "all";
  const view = (searchParams.get("view") as ViewMode) ?? "grid";
  const page = Number(searchParams.get("page") ?? "1");

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key !== "page") params.set("page", "1");
    params.set(key, value);
    router.replace(`/dashboard/creatives?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const setPage = useCallback((p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.replace(`/dashboard/creatives?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const { creatives, totalPages } = useCreatives({ timeRange, sort, spendRange, page, perPage: 12 });

  return (
    <div className="px-5 py-4">
      <CreativeFilters
        timeRange={timeRange} sort={sort} spendRange={spendRange} view={view}
        onTimeRangeChange={(v) => updateParam("range", v)}
        onSortChange={(v) => updateParam("sort", v)}
        onSpendRangeChange={(v) => updateParam("spend", v)}
        onViewChange={(v) => updateParam("view", v)}
      />
      <div className="mt-6">
        <CreativeGrid creatives={creatives} view={view} />
      </div>
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-[var(--doost-text-secondary)] hover:bg-[var(--doost-bg)] disabled:opacity-30">Previous</button>
          <span className="text-[12px] text-[var(--doost-text-muted)]">{page} / {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-[var(--doost-text-secondary)] hover:bg-[var(--doost-bg)] disabled:opacity-30">Next</button>
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

export default function CreativesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-[13px] text-[var(--doost-text-muted)]">Loading...</div>}>
      <CreativesContent />
    </Suspense>
  );
}
