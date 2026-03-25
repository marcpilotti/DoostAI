import { Skeleton } from "@/components/ui/skeleton";

export function MessageSkeleton() {
  return (
    <div className="flex items-start gap-3">
      <Skeleton className="h-7 w-7 shrink-0 rounded-xl" />
      <div className="space-y-2 pt-0.5">
        <Skeleton className="h-3.5 w-[60%] min-w-[180px]" />
        <Skeleton className="h-3.5 w-[80%] min-w-[240px]" />
        <Skeleton className="h-3.5 w-[40%] min-w-[120px]" />
      </div>
    </div>
  );
}
