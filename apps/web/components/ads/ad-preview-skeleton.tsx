"use client";

function Shimmer({ className }: { className?: string }) {
  return (
    <div className={`shimmer-bar animate-pulse rounded bg-muted/50 ${className ?? ""}`} />
  );
}

function MetaSkeleton() {
  return (
    <div className="w-full max-w-[400px] space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2.5">
        <Shimmer className="h-10 w-10 rounded-full" />
        <div className="space-y-1.5">
          <Shimmer className="h-3 w-28" />
          <Shimmer className="h-2 w-16" />
        </div>
      </div>
      <Shimmer className="h-3 w-full" />
      <Shimmer className="aspect-square w-full rounded" />
      <div className="flex items-center gap-3">
        <Shimmer className="h-3 w-24" />
        <div className="flex-1" />
        <Shimmer className="h-9 w-24 rounded-md" />
      </div>
      <div className="flex justify-around pt-1">
        <Shimmer className="h-4 w-12" />
        <Shimmer className="h-4 w-16" />
        <Shimmer className="h-4 w-10" />
      </div>
    </div>
  );
}

function GoogleSkeleton() {
  return (
    <div className="w-full max-w-[480px] space-y-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Shimmer className="h-[26px] w-[26px] rounded-full" />
        <div className="space-y-1">
          <Shimmer className="h-3 w-20" />
          <Shimmer className="h-2 w-32" />
        </div>
        <Shimmer className="ml-auto h-5 w-14 rounded" />
      </div>
      <Shimmer className="mt-2 h-5 w-3/4" />
      <Shimmer className="h-3 w-full" />
      <Shimmer className="h-3 w-2/3" />
      <div className="mt-2 flex gap-2">
        <Shimmer className="h-6 w-14 rounded-full" />
        <Shimmer className="h-6 w-16 rounded-full" />
        <Shimmer className="h-6 w-12 rounded-full" />
        <Shimmer className="h-6 w-14 rounded-full" />
      </div>
    </div>
  );
}

function LinkedInSkeleton() {
  return (
    <div className="w-full max-w-[480px] space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-2.5">
        <Shimmer className="h-12 w-12 rounded" />
        <div className="space-y-1.5">
          <Shimmer className="h-3 w-28" />
          <Shimmer className="h-2 w-20" />
          <Shimmer className="h-2 w-16" />
        </div>
      </div>
      <Shimmer className="h-3 w-full" />
      <Shimmer className="aspect-[1200/627] w-full rounded" />
      <div className="flex items-center gap-3">
        <Shimmer className="h-3 w-32" />
        <div className="flex-1" />
        <Shimmer className="h-8 w-20 rounded-full" />
      </div>
      <div className="flex justify-around pt-1">
        <Shimmer className="h-4 w-10" />
        <Shimmer className="h-4 w-16" />
        <Shimmer className="h-4 w-14" />
        <Shimmer className="h-4 w-12" />
      </div>
    </div>
  );
}

export function AdPreviewSkeleton({ platform }: { platform: string }) {
  switch (platform) {
    case "meta":
      return <MetaSkeleton />;
    case "google":
      return <GoogleSkeleton />;
    case "linkedin":
      return <LinkedInSkeleton />;
    default:
      return <MetaSkeleton />;
  }
}
