"use client";

import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, MoreHorizontal, ThumbsUp, MessageCircle, Share2, Sparkles } from "lucide-react";

type CopyData = {
  id?: string;
  platform: string;
  variant?: string;
  label?: string;
  headline: string;
  bodyCopy: string;
  cta: string;
  headlines?: string[];
  descriptions?: string[];
};

type BrandData = {
  name: string;
  url: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts?: { heading: string; body: string };
  industry?: string;
};

type CopyPreviewData = {
  copies: CopyData[];
  platforms: string[];
  brand?: BrandData;
  renderingImages?: boolean;
};

function getGradient(primary?: string, accent?: string): string {
  if (primary && accent) {
    return `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`;
  }
  return "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)";
}

function MetaVariantPreview({
  copy,
  brand,
  isSelected,
  isLoser,
  onPick,
}: {
  copy: CopyData;
  brand: BrandData;
  isSelected: boolean;
  isLoser: boolean;
  onPick: () => void;
}) {
  const gradient = getGradient(brand.colors.primary, brand.colors.accent);

  return (
    <button
      onClick={onPick}
      disabled={isSelected}
      className={`group relative w-full overflow-hidden rounded-2xl border-2 text-left transition-all duration-300 ${
        isSelected
          ? "border-emerald-400 shadow-lg ring-2 ring-emerald-200"
          : isLoser
            ? "border-border/20 opacity-40 hover:opacity-60"
            : "border-border/40 hover:border-indigo-300 hover:shadow-md"
      }`}
    >
      {/* Selection badge */}
      {isSelected && (
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2">
          <span className="flex items-center gap-1 rounded-b-lg bg-emerald-500 px-3 py-1 text-[10px] font-semibold text-white shadow-sm">
            <Check className="h-3 w-3" strokeWidth={3} /> Vald
          </span>
        </div>
      )}

      {/* Variant label */}
      <div className="flex items-center justify-between bg-muted/30 px-3 py-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          {copy.label ?? "Variant"}
        </span>
        {!isSelected && !isLoser && (
          <span className="text-[10px] font-medium text-indigo-400 opacity-0 transition-opacity group-hover:opacity-100">
            Välj denna
          </span>
        )}
      </div>

      {/* Meta ad format */}
      <div className="bg-white">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: brand.colors.primary }}
          >
            {brand.name[0]}
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold">{brand.name}</div>
            <div className="text-[10px] text-gray-400">Sponsrad</div>
          </div>
          <MoreHorizontal className="h-4 w-4 text-gray-300" />
        </div>

        {/* Body text */}
        <div className="px-3 pb-2 text-xs leading-snug">{copy.bodyCopy}</div>

        {/* Creative image */}
        <div
          className="flex aspect-square items-center justify-center p-6 text-center"
          style={{ background: gradient }}
        >
          <div className="space-y-3">
            <div className="text-lg font-bold leading-tight text-white drop-shadow-sm sm:text-xl">
              {copy.headline}
            </div>
            <div
              className="mx-auto inline-flex rounded-lg px-4 py-1.5 text-xs font-semibold"
              style={{ backgroundColor: "#ffffff", color: brand.colors.primary }}
            >
              {copy.cta}
            </div>
          </div>
        </div>

        {/* Link bar */}
        <div className="flex items-center justify-between border-t px-3 py-2">
          <div className="truncate text-[10px] text-gray-400">
            {brand.url.replace(/^https?:\/\//, "")}
          </div>
          <div
            className="rounded px-3 py-1 text-[10px] font-semibold text-white"
            style={{ backgroundColor: brand.colors.primary }}
          >
            {copy.cta}
          </div>
        </div>

        {/* Engagement bar */}
        <div className="flex justify-around border-t px-2 py-1.5 text-[10px] text-gray-400">
          <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> Gilla</span>
          <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> Kommentera</span>
          <span className="flex items-center gap-1"><Share2 className="h-3 w-3" /> Dela</span>
        </div>
      </div>
    </button>
  );
}

export function CopyPreviewCard({ data }: { data: CopyPreviewData }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileIndex, setMobileIndex] = useState(0);

  // Take first two copies regardless of platform
  const variants = data.copies.slice(0, 2);

  if (!data.brand || variants.length === 0) return null;

  return (
    <div className="animate-message-in mt-3 overflow-hidden rounded-2xl border border-border/40 bg-white/70 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/30 px-5 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-purple-500">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold">Meta / Instagram</div>
          <div className="text-[11px] text-muted-foreground">
            Välj den variant du föredrar
          </div>
        </div>
      </div>

      {/* Desktop: side by side */}
      <div className="hidden gap-4 p-4 sm:grid sm:grid-cols-2">
        {variants.map((copy) => {
          const copyId = copy.id ?? `${copy.platform}-${copy.variant}`;
          return (
            <MetaVariantPreview
              key={copyId}
              copy={copy}
              brand={data.brand!}
              isSelected={selectedId === copyId}
              isLoser={selectedId !== null && selectedId !== copyId}
              onPick={() => setSelectedId(copyId)}
            />
          );
        })}
      </div>

      {/* Mobile: swipeable */}
      <div className="p-4 sm:hidden">
        {variants[mobileIndex] && (() => {
          const copy = variants[mobileIndex]!;
          const copyId = copy.id ?? `${copy.platform}-${copy.variant}`;
          return (
            <div className="relative">
              <MetaVariantPreview
                copy={copy}
                brand={data.brand!}
                isSelected={selectedId === copyId}
                isLoser={selectedId !== null && selectedId !== copyId}
                onPick={() => setSelectedId(copyId)}
              />
              {mobileIndex > 0 && (
                <button onClick={() => setMobileIndex((i) => i - 1)} className="absolute -left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md">
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              {mobileIndex < variants.length - 1 && (
                <button onClick={() => setMobileIndex((i) => i + 1)} className="absolute -right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md">
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        })()}
        <div className="mt-3 flex justify-center gap-1.5">
          {variants.map((_, i) => (
            <button key={i} onClick={() => setMobileIndex(i)} className={`h-2 rounded-full transition-all ${i === mobileIndex ? "w-5 bg-indigo-500" : "w-2 bg-border/60"}`} />
          ))}
        </div>
      </div>

      {/* Footer hint */}
      {!selectedId && (
        <div className="border-t border-border/30 px-5 py-2.5 text-center text-[11px] text-muted-foreground/50">
          Klicka på den variant du vill använda
        </div>
      )}

      {selectedId && (
        <div className="border-t border-border/30 bg-emerald-50/50 px-5 py-2.5 text-center text-[11px] font-medium text-emerald-600">
          <Check className="mr-1 inline h-3 w-3" />
          Variant vald — skriv din budget för att gå vidare
        </div>
      )}
    </div>
  );
}
