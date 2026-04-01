"use client";

import { ImageOff } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

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
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={onClick}
      className="group w-full text-left hover:[transform:perspective(800px)_rotateY(2deg)] transition-transform duration-300"
    >
      {/* Image — 4:5 portrait ratio, rounded-xl */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-[var(--doost-bg-secondary)]">
        {imgError ? (
          <div className="flex h-full w-full items-center justify-center">
            <ImageOff className="h-8 w-8 text-[var(--doost-text-muted)]" />
          </div>
        ) : (
          <Image
            src={creative.imageUrl}
            alt={creative.name}
            width={400}
            height={500}
            quality={75}
            loading="lazy"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {/* Name + Metrics — tight spacing like reference */}
      <div className="mt-2">
        <h3 className="text-[13px] font-semibold text-[var(--doost-text)]">
          {creative.name}
        </h3>
        <div className="mt-0.5">
          {[
            { label: "ROAS", value: `${creative.roas.toFixed(1)}x` },
            { label: "Spenderat", value: `$${creative.spend.toLocaleString("en-US")}` },
            { label: "CTR", value: `${creative.ctr.toFixed(1)}%` },
          ].map((m) => (
            <div key={m.label} className="flex items-center justify-between text-[12px] leading-[20px]">
              <span className="text-[var(--doost-text-muted)]">{m.label}</span>
              <span className="tabular-nums text-[var(--doost-text)]">{m.value}</span>
            </div>
          ))}
        </div>
      </div>
    </button>
  );
}
