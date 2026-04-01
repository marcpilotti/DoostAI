import { Skeleton } from "@/components/ui/skeleton";

export default function CampaignsLoading() {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <Skeleton className="mb-4 h-10 w-28 rounded-lg" />
      <div className="rounded-[10px] overflow-hidden" style={{ border: "1px solid var(--doost-border)" }}>
        <Skeleton className="h-10 w-full rounded-none" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-none border-t" style={{ borderColor: "var(--doost-border)" }} />
        ))}
      </div>
    </div>
  );
}
