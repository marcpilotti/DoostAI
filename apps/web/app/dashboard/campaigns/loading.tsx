import { Skeleton } from "@/components/ui/skeleton";

export default function CampaignsLoading() {
  return (
    <div className="p-6 animate-in fade-in duration-300">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      {/* Status filter */}
      <div className="mb-4 pb-4 border-b" style={{ borderColor: "var(--doost-border)" }}>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      {/* Table */}
      <div className="rounded-[var(--doost-radius-card)] overflow-hidden bg-[var(--doost-bg)]" style={{ border: "1px solid var(--doost-border)" }}>
        {/* Header row */}
        <div className="flex items-center gap-4 px-4 py-3 border-b" style={{ borderColor: "var(--doost-border)" }}>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-14" />
          <div className="flex-1" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
        {/* Campaign rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3 border-b last:border-0"
            style={{ borderColor: "var(--doost-border)" }}
          >
            <div className="flex items-center gap-2 w-56">
              <Skeleton className="h-4 w-4 rounded-full shrink-0" />
              <Skeleton className="h-3.5 w-full" />
            </div>
            <Skeleton className="h-5 w-14 rounded-full" />
            <div className="flex-1" />
            <Skeleton className="h-3.5 w-14" />
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-10" />
            <Skeleton className="h-5 w-5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
