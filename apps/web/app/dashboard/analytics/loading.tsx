import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="p-6 animate-in fade-in duration-300">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-7 w-20" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-36 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* Main chart */}
      <div className="mb-6 rounded-[var(--doost-radius-card)] bg-[var(--doost-bg)] p-6" style={{ border: "1px solid var(--doost-border)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="flex items-end gap-3 h-[240px] pb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2">
              <Skeleton className="w-full rounded-sm" style={{ height: `${30 + Math.random() * 70}%` }} />
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>
      </div>

      {/* Two side-by-side charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-[var(--doost-radius-card)] bg-[var(--doost-bg)] p-6" style={{ border: "1px solid var(--doost-border)" }}>
            <Skeleton className="h-4 w-28 mb-4" />
            <div className="flex items-end gap-4 h-[160px]">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex-1 flex flex-col items-center justify-end gap-2">
                  <Skeleton className="w-full rounded-sm" style={{ height: `${40 + Math.random() * 50}%` }} />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
