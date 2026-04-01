"use client";

import Image from "next/image";
import type { Creative } from "@/lib/mock-data";
import { CreativeCard } from "./creative-card";

export function CreativeGrid({
  creatives,
  view = "grid",
  onSelect,
}: {
  creatives: Creative[];
  view?: "grid" | "list" | "compact";
  onSelect?: (creative: Creative) => void;
}) {
  if (view === "list") {
    return (
      <div className="space-y-2">
        {creatives.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect?.(c)}
            className="flex w-full items-center gap-4 rounded-lg bg-[var(--doost-bg)] p-3 text-left transition-colors hover:bg-[var(--doost-bg-secondary)]"
            style={{ border: `1px solid var(--doost-border)` }}
          >
            <Image
              src={c.imageUrl}
              alt={c.name}
              width={48}
              height={48}
              quality={75}
              loading="lazy"
              sizes="48px"
              className="h-12 w-12 shrink-0 rounded-md object-cover"
            />
            <div className="min-w-0 flex-1">
              <span className="text-[13px] font-semibold text-[var(--doost-text)]">{c.name}</span>
            </div>
            <div className="flex shrink-0 items-center gap-6 text-[13px]">
              <div className="text-right">
                <div className="text-[var(--doost-text-muted)]">ROAS</div>
                <div className="font-semibold text-[var(--doost-text)]">{c.roas.toFixed(1)}x</div>
              </div>
              <div className="text-right">
                <div className="text-[var(--doost-text-muted)]">Spenderat</div>
                <div className="font-semibold text-[var(--doost-text)]">${c.spend.toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="text-[var(--doost-text-muted)]">CTR</div>
                <div className="font-semibold text-[var(--doost-text)]">{c.ctr.toFixed(1)}%</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  }

  // Grid (default) and compact
  const cols = view === "compact"
    ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={`grid gap-x-4 gap-y-6 ${cols}`}>
      {creatives.map((c) => (
        <CreativeCard
          key={c.id}
          creative={c}
          onClick={() => onSelect?.(c)}
        />
      ))}
    </div>
  );
}
