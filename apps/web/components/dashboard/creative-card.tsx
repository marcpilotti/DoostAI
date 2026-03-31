"use client";

import type { Creative } from "@/lib/mock-data";

/**
 * CreativeCard — matches reference exactly:
 * - Image: ~4:3 aspect, rounded-xl, slight padding
 * - Name: 14px semibold below
 * - Metrics: ROAS/Spend/CTR in flex rows, values right-aligned
 */
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
      className="group w-full text-left"
    >
      {/* Image — 4:3 ratio with rounded-xl, matches reference */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[var(--doost-bg-secondary)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={creative.imageUrl}
          alt={creative.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>

      {/* Name + Metrics */}
      <div className="mt-2.5 px-0.5">
        <h3 className="text-[14px] font-semibold text-[var(--doost-text)]">
          {creative.name}
        </h3>
        <div className="mt-1 space-y-px">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-[var(--doost-text-muted)]">ROAS</span>
            <span className="tabular-nums text-[var(--doost-text)]">{creative.roas.toFixed(1)}x</span>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-[var(--doost-text-muted)]">Spend</span>
            <span className="tabular-nums text-[var(--doost-text)]">${creative.spend.toLocaleString("en-US")}</span>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-[var(--doost-text-muted)]">CTR</span>
            <span className="tabular-nums text-[var(--doost-text)]">{creative.ctr.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </button>
  );
}
