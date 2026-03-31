"use client";

import type { Creative } from "@/lib/mock-data";

export function CreativeCard({
  creative,
  onClick,
}: {
  creative: Creative;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group w-full text-left transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
    >
      {/* Image — square, rounded */}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-[var(--doost-bg-secondary)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={creative.imageUrl}
          alt={creative.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </div>

      {/* Info */}
      <div className="mt-3">
        <h3 className="text-[14px] font-semibold text-[var(--doost-text)]">
          {creative.name}
        </h3>

        {/* Metrics — 2 columns matching reference */}
        <div className="mt-1.5 space-y-0.5">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-[var(--doost-text-secondary)]">ROAS</span>
            <span className="font-semibold text-[var(--doost-text)]">{creative.roas.toFixed(1)}x</span>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-[var(--doost-text-secondary)]">Spend</span>
            <span className="font-semibold text-[var(--doost-text)]">${creative.spend.toLocaleString("en-US")}</span>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-[var(--doost-text-secondary)]">CTR</span>
            <span className="font-semibold text-[var(--doost-text)]">{creative.ctr.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </button>
  );
}
