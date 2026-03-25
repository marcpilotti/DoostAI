"use client";

import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, MoreHorizontal, ThumbsUp, MessageCircle, Share2 } from "lucide-react";

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

const PLATFORM_LABELS: Record<string, string> = {
  meta: "Meta / Instagram",
  google: "Google Search",
  linkedin: "LinkedIn",
};

// Industry-to-gradient mapping for creative backgrounds
const INDUSTRY_GRADIENTS: Record<string, string> = {
  saas: "135deg, #667eea 0%, #764ba2 100%",
  fintech: "135deg, #0c3483 0%, #a2b6df 100%",
  ecommerce: "135deg, #f093fb 0%, #f5576c 100%",
  health: "135deg, #4facfe 0%, #00f2fe 100%",
  education: "135deg, #43e97b 0%, #38f9d7 100%",
  default: "135deg, var(--primary) 0%, var(--accent) 100%",
};

function getGradient(industry?: string, primary?: string, accent?: string): string {
  if (primary && accent) {
    return `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`;
  }
  const key = (industry ?? "default").toLowerCase();
  for (const [k, v] of Object.entries(INDUSTRY_GRADIENTS)) {
    if (key.includes(k)) return `linear-gradient(${v})`;
  }
  return `linear-gradient(${INDUSTRY_GRADIENTS.default})`;
}

// Full Meta ad preview for variant comparison
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
  const gradient = getGradient(brand.industry, brand.colors.primary, brand.colors.accent);
  const logoUrl = brand.url.startsWith("http") ? brand.url : `https://${brand.url}`;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
        isSelected
          ? "border-emerald-400 shadow-md"
          : isLoser
            ? "border-border/20 opacity-50"
            : "border-border/40"
      }`}
    >
      {isSelected && (
        <div className="absolute -top-0 left-1/2 z-10 -translate-x-1/2">
          <span className="flex items-center gap-1 rounded-b-lg bg-emerald-500 px-3 py-0.5 text-[10px] font-semibold text-white">
            <Check className="h-3 w-3" /> Vald
          </span>
        </div>
      )}

      {/* Variant label */}
      <div className="bg-muted/30 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        {copy.label ?? "Variant"}
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

        {/* Creative image with brand gradient + headline */}
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
              style={{
                backgroundColor: "#ffffff",
                color: brand.colors.primary,
              }}
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

      {/* Pick button */}
      <button
        onClick={onPick}
        disabled={isSelected}
        className={`w-full py-2.5 text-xs font-medium transition-all ${
          isSelected
            ? "bg-emerald-500 text-white"
            : "bg-muted/20 text-foreground hover:bg-indigo-50 hover:text-indigo-600"
        }`}
      >
        {isSelected ? "Vald ✓" : "Välj denna"}
      </button>
    </div>
  );
}

// Google ad preview for variant comparison
function GoogleVariantPreview({
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
  const displayHeadline = copy.headlines?.join(" | ") ?? copy.headline;
  const displayDesc = copy.descriptions?.join(" ") ?? copy.bodyCopy;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
        isSelected
          ? "border-emerald-400 shadow-md"
          : isLoser
            ? "border-border/20 opacity-50"
            : "border-border/40"
      }`}
    >
      {isSelected && (
        <div className="absolute -top-0 left-1/2 z-10 -translate-x-1/2">
          <span className="flex items-center gap-1 rounded-b-lg bg-emerald-500 px-3 py-0.5 text-[10px] font-semibold text-white">
            <Check className="h-3 w-3" /> Vald
          </span>
        </div>
      )}

      <div className="bg-muted/30 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        {copy.label ?? "Variant"}
      </div>

      <div className="bg-white p-3">
        <div className="flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[8px] text-gray-500">
            {brand.name[0]}
          </div>
          <span className="text-xs text-gray-800">{brand.name}</span>
          <span className="ml-auto rounded bg-[#e8f0fe] px-1 py-0.5 text-[9px] font-bold text-[#1a73e8]">Annons</span>
        </div>
        <div className="mt-1.5 text-sm font-normal text-[#1a0dab]">{displayHeadline}</div>
        <div className="mt-1 text-xs text-[#4d5156]">{displayDesc}</div>
      </div>

      <button
        onClick={onPick}
        disabled={isSelected}
        className={`w-full py-2.5 text-xs font-medium transition-all ${
          isSelected
            ? "bg-emerald-500 text-white"
            : "bg-muted/20 text-foreground hover:bg-indigo-50 hover:text-indigo-600"
        }`}
      >
        {isSelected ? "Vald ✓" : "Välj denna"}
      </button>
    </div>
  );
}

export function CopyPreviewCard({ data }: { data: CopyPreviewData }) {
  const available = data.platforms.filter((p) =>
    data.copies.some((c) => c.platform === p),
  );
  const [activeTab, setActiveTab] = useState(available[0] ?? "meta");
  const [selectedIds, setSelectedIds] = useState<Record<string, string>>({});
  const platformCopies = data.copies.filter((c) => c.platform === activeTab);
  const [mobileIndex, setMobileIndex] = useState(0);

  function handlePick(copyId: string) {
    setSelectedIds((prev) => ({ ...prev, [activeTab]: copyId }));
  }

  const selectedId = selectedIds[activeTab] ?? null;

  return (
    <div className="mt-1 space-y-3">
      {/* Platform tabs */}
      <div className="flex gap-1 rounded-xl bg-muted/50 p-1">
        {available.map((platform) => (
          <button
            key={platform}
            onClick={() => { setActiveTab(platform); setMobileIndex(0); }}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === platform
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {PLATFORM_LABELS[platform] ?? platform}
          </button>
        ))}
      </div>

      {/* Desktop: side by side full ad previews */}
      {data.brand && platformCopies.length >= 2 && (
        <>
          <div className="hidden gap-3 sm:grid sm:grid-cols-2">
            {platformCopies.slice(0, 2).map((copy) => {
              const copyId = copy.id ?? `${copy.platform}-${copy.variant}`;
              const isSelected = selectedId === copyId;
              const isLoser = selectedId !== null && selectedId !== copyId;

              return activeTab === "google" ? (
                <GoogleVariantPreview
                  key={copyId}
                  copy={copy}
                  brand={data.brand!}
                  isSelected={isSelected}
                  isLoser={isLoser}
                  onPick={() => handlePick(copyId)}
                />
              ) : (
                <MetaVariantPreview
                  key={copyId}
                  copy={copy}
                  brand={data.brand!}
                  isSelected={isSelected}
                  isLoser={isLoser}
                  onPick={() => handlePick(copyId)}
                />
              );
            })}
          </div>

          {/* Mobile: swipeable */}
          <div className="sm:hidden">
            {(() => {
              const copy = platformCopies[mobileIndex]!;
              const copyId = copy.id ?? `${copy.platform}-${copy.variant}`;
              const isSelected = selectedId === copyId;
              const isLoser = selectedId !== null && selectedId !== copyId;
              return (
                <div className="relative">
                  {activeTab === "google" ? (
                    <GoogleVariantPreview copy={copy} brand={data.brand!} isSelected={isSelected} isLoser={isLoser} onPick={() => handlePick(copyId)} />
                  ) : (
                    <MetaVariantPreview copy={copy} brand={data.brand!} isSelected={isSelected} isLoser={isLoser} onPick={() => handlePick(copyId)} />
                  )}
                  {mobileIndex > 0 && (
                    <button onClick={() => setMobileIndex((i) => i - 1)} className="absolute -left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  )}
                  {mobileIndex < platformCopies.length - 1 && (
                    <button onClick={() => setMobileIndex((i) => i + 1)} className="absolute -right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })()}
            <div className="mt-2 flex justify-center gap-1.5">
              {platformCopies.map((_, i) => (
                <button key={i} onClick={() => setMobileIndex(i)} className={`h-2 w-2 rounded-full transition-all ${i === mobileIndex ? "w-4 bg-indigo-500" : "bg-border/60"}`} />
              ))}
            </div>
          </div>

          {!selectedId && (
            <p className="text-center text-[11px] text-muted-foreground/50">
              Välj den variant du föredrar
            </p>
          )}
        </>
      )}

      {/* Single variant fallback */}
      {data.brand && platformCopies.length === 1 && platformCopies[0] && (
        activeTab === "google" ? (
          <GoogleVariantPreview copy={platformCopies[0]} brand={data.brand} isSelected={false} isLoser={false} onPick={() => {}} />
        ) : (
          <MetaVariantPreview copy={platformCopies[0]} brand={data.brand} isSelected={false} isLoser={false} onPick={() => {}} />
        )
      )}
    </div>
  );
}
