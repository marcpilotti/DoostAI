"use client";

import { useState } from "react";
import { Check } from "lucide-react";

type Variant = {
  id: string;
  label: string;
  headline: string;
  bodyCopy: string;
  cta: string;
};

type VariantComparisonProps = {
  variants: Variant[];
  platform: string;
  onSelect: (variantId: string) => void;
};

export function VariantComparison({
  variants,
  platform,
  onSelect,
}: VariantComparisonProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="mt-2 space-y-3">
      <div className="text-xs font-medium text-muted-foreground">
        Jämför varianter — {platform}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {variants.map((v) => {
          const isSelected = selectedId === v.id;
          return (
            <button
              key={v.id}
              onClick={() => {
                setSelectedId(v.id);
                onSelect(v.id);
              }}
              className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                isSelected
                  ? "border-emerald-400 bg-emerald-50/50"
                  : "border-border/40 bg-white/60 hover:border-border"
              }`}
            >
              {isSelected && (
                <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {v.label}
              </div>
              <div className="text-sm font-semibold">{v.headline}</div>
              <div className="mt-1 text-xs text-foreground/60">{v.bodyCopy}</div>
              <div className="mt-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary">
                  {v.cta}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
