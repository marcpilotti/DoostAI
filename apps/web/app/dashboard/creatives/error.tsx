"use client";

import { RefreshCw } from "lucide-react";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6">
      <h2 className="mb-2 text-[16px] font-semibold text-[var(--doost-text)]">
        Något gick fel
      </h2>
      <p className="mb-4 max-w-sm text-center text-[13px] text-[var(--doost-text-muted)]">
        {error.message || "Ett oväntat fel uppstod. Försök igen."}
      </p>
      <button
        onClick={reset}
        className="flex items-center gap-1.5 rounded-lg bg-[var(--doost-bg-active)] px-4 py-2 text-[12px] font-medium text-white hover:opacity-90"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Försök igen
      </button>
    </div>
  );
}
