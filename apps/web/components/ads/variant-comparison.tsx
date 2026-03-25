"use client";

import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

type Variant = {
  id: string;
  label: string;
  headline: string;
  bodyCopy: string;
  cta: string;
  headlines?: string[];
  descriptions?: string[];
};

type VariantComparisonProps = {
  variants: Variant[];
  platform: string;
  onSelect: (variantId: string) => void;
  onRegenerate?: (variantId: string) => void;
};

const PLATFORM_LABELS: Record<string, string> = {
  meta: "Meta / Instagram",
  google: "Google Search",
  linkedin: "LinkedIn",
};

function VariantCard({
  variant,
  isSelected,
  isLoser,
  onPick,
  onRegenerate,
}: {
  variant: Variant;
  isSelected: boolean;
  isLoser: boolean;
  onPick: () => void;
  onRegenerate?: () => void;
}) {
  return (
    <div
      className={`relative rounded-2xl border-2 p-5 transition-all duration-300 ${
        isSelected
          ? "border-emerald-400 bg-emerald-50/50 shadow-sm"
          : isLoser
            ? "border-border/20 bg-white/30 opacity-60"
            : "border-border/40 bg-white/60"
      }`}
    >
      {/* Selected badge */}
      {isSelected && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
          <span className="flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-0.5 text-[10px] font-semibold text-white shadow-sm">
            <Check className="h-3 w-3" /> Vald
          </span>
        </div>
      )}

      {/* Variant label */}
      <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        {variant.label}
      </div>

      {/* Copy content */}
      <div className="space-y-2">
        <div className="text-sm font-semibold leading-snug">{variant.headline}</div>
        <div className="text-xs leading-relaxed text-foreground/60">{variant.bodyCopy}</div>
        <div>
          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[10px] font-medium text-primary">
            {variant.cta}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={onPick}
          disabled={isSelected}
          className={`flex-1 rounded-xl py-2 text-xs font-medium transition-all ${
            isSelected
              ? "bg-emerald-500 text-white"
              : "border border-border/60 bg-white/80 text-foreground hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
          }`}
        >
          {isSelected ? "Vald ✓" : "Välj denna"}
        </button>
        {onRegenerate && !isSelected && (
          <button
            onClick={onRegenerate}
            className="flex items-center gap-1 rounded-xl border border-border/60 bg-white/80 px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

export function VariantComparison({
  variants,
  platform,
  onSelect,
  onRegenerate,
}: VariantComparisonProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileIndex, setMobileIndex] = useState(0);

  function handlePick(id: string) {
    setSelectedId(id);
    onSelect(id);
  }

  return (
    <div className="mt-2 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-muted-foreground">
          Variant A vs B — {PLATFORM_LABELS[platform] ?? platform}
        </div>
        {selectedId && (
          <span className="text-[10px] text-emerald-600">
            {variants.find((v) => v.id === selectedId)?.label} vald
          </span>
        )}
      </div>

      {/* Desktop: side by side */}
      <div className="hidden gap-3 sm:grid sm:grid-cols-2">
        {variants.slice(0, 2).map((v) => (
          <VariantCard
            key={v.id}
            variant={v}
            isSelected={selectedId === v.id}
            isLoser={selectedId !== null && selectedId !== v.id}
            onPick={() => handlePick(v.id)}
            onRegenerate={onRegenerate ? () => onRegenerate(v.id) : undefined}
          />
        ))}
      </div>

      {/* Mobile: swipeable cards */}
      <div className="sm:hidden">
        <div className="relative">
          <VariantCard
            variant={variants[mobileIndex]!}
            isSelected={selectedId === variants[mobileIndex]!.id}
            isLoser={selectedId !== null && selectedId !== variants[mobileIndex]!.id}
            onPick={() => handlePick(variants[mobileIndex]!.id)}
            onRegenerate={
              onRegenerate
                ? () => onRegenerate(variants[mobileIndex]!.id)
                : undefined
            }
          />

          {/* Navigation arrows */}
          {variants.length > 1 && (
            <>
              {mobileIndex > 0 && (
                <button
                  onClick={() => setMobileIndex((i) => i - 1)}
                  className="absolute -left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              {mobileIndex < variants.length - 1 && (
                <button
                  onClick={() => setMobileIndex((i) => i + 1)}
                  className="absolute -right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Dot indicators */}
        {variants.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5">
            {variants.map((_, i) => (
              <button
                key={i}
                onClick={() => setMobileIndex(i)}
                className={`h-2 w-2 rounded-full transition-all ${
                  i === mobileIndex ? "w-4 bg-indigo-500" : "bg-border/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer hint */}
      {!selectedId && (
        <p className="text-center text-[11px] text-muted-foreground/50">
          Eller be mig justera någon av varianterna
        </p>
      )}
    </div>
  );
}
