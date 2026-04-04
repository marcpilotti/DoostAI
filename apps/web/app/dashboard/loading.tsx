import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="p-6 animate-in fade-in duration-300">
      <Skeleton className="h-7 w-16 mb-3" />

      {/* Quick actions */}
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-8 w-28 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-32 rounded-full" />
      </div>

      {/* Channel filter */}
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-9 w-36 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      {/* KPI label */}
      <Skeleton className="h-3 w-16 mb-3" />

      {/* KPI Cards — match 5-column grid with icon + label + value shape */}
      <div className="flex gap-3 overflow-hidden sm:grid sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="min-w-[140px] shrink-0 sm:min-w-0 rounded-[var(--doost-radius-card)] bg-[var(--doost-bg)] p-4"
            style={{ border: "1px solid var(--doost-border)", animationDelay: `${i * 75}ms` }}
          >
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-3.5 w-3.5 rounded" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-10" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="mt-8 rounded-[var(--doost-radius-card)] bg-[var(--doost-bg)] p-6" style={{ border: "1px solid var(--doost-border)" }}>
        <Skeleton className="h-4 w-40 mb-6" />
        <div className="flex items-end gap-2 h-[260px]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end gap-1">
              <Skeleton className="w-full rounded-sm" style={{ height: `${40 + Math.random() * 60}%` }} />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Activity feed */}
      <div className="mt-8">
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="space-y-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
              <Skeleton className="h-5 w-5 rounded-full shrink-0" />
              <div className="flex-1 flex items-center gap-2">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-16 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
