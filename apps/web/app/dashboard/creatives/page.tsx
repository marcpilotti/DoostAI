"use client";

import { Image as ImageIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect } from "react";

import { CreativeFilters } from "@/components/dashboard/creative-filters";
import { CreativeGrid } from "@/components/dashboard/creative-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreatives } from "@/hooks/use-creatives";
import { useAIPanelStore } from "@/lib/stores/ai-panel";

type ViewMode = "grid" | "list" | "compact";

function CreativesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setOpen: setAIPanelOpen } = useAIPanelStore();

  useEffect(() => { document.title = "Kreativ — Doost AI"; }, []);
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
      <div className="pb-4 border-b" style={{ borderColor: "var(--doost-border)" }}>
        <CreativeFilters
          timeRange={timeRange} sort={sort} spendRange={spendRange} view={view}
          onTimeRangeChange={(v) => updateParam("range", v)}
          onSortChange={(v) => updateParam("sort", v)}
          onSpendRangeChange={(v) => updateParam("spend", v)}
          onViewChange={(v) => updateParam("view", v)}
        />
      </div>
      <div className="mt-6">
        <CreativeGrid creatives={creatives} view={view} />
      </div>
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-[var(--doost-text-secondary)] hover:bg-[var(--doost-bg)] disabled:opacity-30">Föregående</button>
          <span className="text-[12px] text-[var(--doost-text-muted)]">{page} / {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-[var(--doost-text-secondary)] hover:bg-[var(--doost-bg)] disabled:opacity-30">Nästa</button>
        </div>
      )}
      {creatives.length === 0 && (
        <EmptyState
          icon={ImageIcon}
          title="Inga kreativ matchar filtren"
          description="Justera dina filter eller skapa en ny annons för att komma igång."
          ctaLabel="Skapa din första annons"
          ctaHref="/"
        />
      )}
    </div>
  );
}

function CreativesSkeleton() {
  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-2 pb-4 border-b" style={{ borderColor: "var(--doost-border)" }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-full" />
        ))}
        <div className="flex-1" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-[11px] overflow-hidden" style={{ border: "1px solid var(--doost-border)" }}>
            <Skeleton className="aspect-[4/5] w-full rounded-none" />
            <div className="p-3 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CreativesPage() {
  return (
    <Suspense fallback={<CreativesSkeleton />}>
      <CreativesContent />
    </Suspense>
  );
}
