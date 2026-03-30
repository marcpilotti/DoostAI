"use client";

/**
 * AdPreviewMeta — Meta Feed (Instagram Post) + Meta Stories (Facebook Annons).
 * Renders inside the AdPreview container. Never causes scroll.
 *
 * Layers (bottom → top):
 * 1. AI-generated background image (Ken Burns 8s)
 * 2. Gradient overlay
 * 3. Frosted glass panel
 * 4. Text (headline, body)
 * 5. CTA button
 * 6. Platform chrome (avatar, badge, reactions)
 */

import { useState, useEffect, useTransition } from "react";
import { Globe, MoreHorizontal, ThumbsUp, MessageCircle, Share2, ChevronUp, RefreshCw } from "lucide-react";
import { generateAdImage } from "@/app/actions/generate-ad-image";
import type { AdData, AdFormat, FormatPreviewProps } from "./types";

// ── Shared utilities ─────────────────────────────────────────────

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

function darken(hex: string, amount: number): string {
  const c = hex.replace("#", "");
  const r = Math.max(0, parseInt(c.slice(0, 2), 16) - amount);
  const g = Math.max(0, parseInt(c.slice(2, 4), 16) - amount);
  const b = Math.max(0, parseInt(c.slice(4, 6), 16) - amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function getGradient(primary: string, accent?: string): string {
  if (accent && accent !== primary) {
    return `linear-gradient(135deg, ${primary} 0%, ${accent} 50%, ${darken(accent, 30)} 100%)`;
  }
  return `linear-gradient(135deg, ${primary} 0%, ${darken(primary, 25)} 50%, ${darken(primary, 50)} 100%)`;
}

// ── Meta Feed Preview ────────────────────────────────────────────

function MetaFeedPreview({ data, imageUrl, isImageLoading, onRegenerateImage, isEditing, onFieldChange }: FormatPreviewProps) {
  const gradient = getGradient(data.brandColor, data.brandAccent);
  const domain = data.brandUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-white shadow-sm">
      {/* Header: avatar + brand + sponsored */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ backgroundColor: data.brandColor }}
        >
          {getInitial(data.brandName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold text-gray-900">{data.brandName}</div>
          <div className="flex items-center gap-1 text-[9px] text-gray-400">
            Sponsrad <Globe className="inline h-2 w-2" />
          </div>
        </div>
        <MoreHorizontal className="h-4 w-4 shrink-0 text-gray-300" />
      </div>

      {/* Primary text */}
      <div className="px-3 pb-2">
        <p className="line-clamp-2 text-[11px] leading-relaxed text-gray-700">
          {data.primaryText}
        </p>
      </div>

      {/* Creative area — AI background + frosted glass */}
      <div
        className="relative flex flex-1 items-end justify-center overflow-hidden"
        style={{ background: imageUrl ? undefined : gradient }}
      >
        {/* AI background with Ken Burns */}
        {imageUrl && (
          <div
            className="absolute inset-0 animate-[kenburns_8s_ease-in-out_infinite_alternate]"
            style={{ background: `url(${imageUrl}) center/cover` }}
          />
        )}
        {/* Skeleton while loading */}
        {isImageLoading && !imageUrl && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200" />
        )}
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />

        {/* Regenerate button */}
        {onRegenerateImage && (
          <button
            onClick={(e) => { e.stopPropagation(); onRegenerateImage(); }}
            className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/30 text-white/70 backdrop-blur-sm transition-all hover:bg-black/50 hover:text-white"
            title="Ny bakgrund"
          >
            <RefreshCw className={`h-3 w-3 ${isImageLoading ? "animate-spin" : ""}`} />
          </button>
        )}

        {/* Frosted glass text panel */}
        <div
          className="relative z-[1] mx-3 mb-3 w-[calc(100%-24px)] space-y-1.5 rounded-xl px-4 py-3 text-center"
          style={{
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(12px) saturate(180%)",
            WebkitBackdropFilter: "blur(12px) saturate(180%)",
          }}
        >
          <div className="text-[7px] font-bold uppercase tracking-[0.3em] text-white/50">
            {data.brandName}
          </div>
          <h3 className="text-sm font-bold leading-tight text-white drop-shadow-sm">
            {data.headline}
          </h3>
          {/* CTA pill */}
          <button
            className="mx-auto inline-flex items-center rounded-full px-4 py-1 text-[10px] font-bold shadow-md transition-transform hover:scale-[1.03] active:scale-[0.97]"
            style={{
              backgroundColor: data.brandColor,
              color: "#fff",
              boxShadow: `0 4px 16px ${data.brandColor}55`,
            }}
          >
            {data.cta}
          </button>
        </div>
      </div>

      {/* Bottom bar: domain + CTA */}
      <div className="flex items-center justify-between bg-gray-50 px-3 py-1.5">
        <div className="min-w-0 flex-1">
          <div className="text-[8px] uppercase text-gray-400">{domain}</div>
          <div className="truncate text-[10px] font-semibold text-gray-800">
            {data.headline.slice(0, 35)}
          </div>
        </div>
        <div
          className="shrink-0 rounded-full px-3 py-1 text-[9px] font-bold text-white"
          style={{ backgroundColor: data.brandColor }}
        >
          {data.cta}
        </div>
      </div>

      {/* Reactions bar */}
      <div className="flex justify-around border-t px-2 py-1 text-[9px] text-gray-400">
        <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> Gilla</span>
        <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> Kommentera</span>
        <span className="flex items-center gap-1"><Share2 className="h-3 w-3" /> Dela</span>
      </div>
    </div>
  );
}

// ── Meta Stories Preview ─────────────────────────────────────────

function MetaStoriesPreview({ data, imageUrl, isImageLoading, onRegenerateImage }: FormatPreviewProps) {
  const gradient = getGradient(data.brandColor, data.brandAccent);
  const bodySnippet = data.primaryText.slice(0, 60) + (data.primaryText.length > 60 ? "…" : "");

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl shadow-sm" style={{ aspectRatio: "9/16" }}>
      <div className="relative flex flex-1 flex-col overflow-hidden" style={{ background: gradient }}>
        {/* AI background with Ken Burns */}
        {imageUrl && (
          <div
            className="absolute inset-0 animate-[kenburns_8s_ease-in-out_infinite_alternate]"
            style={{ background: `url(${imageUrl}) center/cover` }}
          />
        )}
        {isImageLoading && !imageUrl && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

        {/* Regenerate button */}
        {onRegenerateImage && (
          <button
            onClick={(e) => { e.stopPropagation(); onRegenerateImage(); }}
            className="absolute right-2 top-10 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/30 text-white/70 backdrop-blur-sm transition-all hover:bg-black/50 hover:text-white"
          >
            <RefreshCw className={`h-3 w-3 ${isImageLoading ? "animate-spin" : ""}`} />
          </button>
        )}

        {/* Progress bar (3 segments) */}
        <div className="relative z-[1] flex gap-1 px-3 pt-3">
          <div className="h-0.5 flex-1 rounded-full bg-white/50" />
          <div className="h-0.5 flex-1 rounded-full bg-white/20" />
          <div className="h-0.5 flex-1 rounded-full bg-white/20" />
        </div>

        {/* Brand header */}
        <div className="relative z-[1] flex items-center gap-2 px-3 pt-2">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-white/50"
            style={{ backgroundColor: data.brandColor }}
          >
            {getInitial(data.brandName)}
          </div>
          <div>
            <div className="text-[10px] font-semibold text-white drop-shadow">{data.brandName}</div>
            <div className="text-[7px] text-white/50">Sponsrad</div>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom frosted glass panel */}
        <div
          className="relative z-[1] mx-2 mb-2 space-y-1.5 rounded-xl px-3 py-3 text-center"
          style={{
            background: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(16px) saturate(180%)",
            WebkitBackdropFilter: "blur(16px) saturate(180%)",
          }}
        >
          <h3 className="text-sm font-bold leading-tight text-white drop-shadow-sm">
            {data.headline}
          </h3>
          <p className="text-[9px] leading-snug text-white/60">{bodySnippet}</p>
          {/* CTA pill with chevron */}
          <button
            className="mx-auto inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-[9px] font-bold shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.97]"
            style={{
              backgroundColor: data.brandColor,
              color: "#fff",
              boxShadow: `0 4px 16px ${data.brandColor}55`,
            }}
          >
            <ChevronUp className="h-3 w-3" />
            {data.cta}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Exported Meta preview (switches between Feed and Stories) ────

export function AdPreviewMeta({
  data,
  format,
  autoGenerateImage = true,
}: {
  data: AdData;
  format: "meta-feed" | "meta-stories";
  autoGenerateImage?: boolean;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(data.imageUrl ?? null);
  const [isGenerating, startTransition] = useTransition();
  const [imageLoading, setImageLoading] = useState(false);

  // Auto-generate image on mount if none provided
  useEffect(() => {
    if (imageUrl || !autoGenerateImage) return;
    setImageLoading(true);
    generateAdImage(
      { id: data.id, headline: data.headline, primaryText: data.primaryText, brandName: data.brandName },
      format,
    ).then((result) => {
      if (result?.imageUrl) setImageUrl(result.imageUrl);
    }).finally(() => setImageLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleRegenerate() {
    setImageLoading(true);
    startTransition(async () => {
      const result = await generateAdImage(
        { id: `${data.id}-${Date.now()}`, headline: data.headline, primaryText: data.primaryText, brandName: data.brandName },
        format,
      );
      if (result?.imageUrl) setImageUrl(result.imageUrl);
      setImageLoading(false);
    });
  }

  const previewProps: FormatPreviewProps = {
    data,
    isEditing: false,
    imageUrl,
    isImageLoading: imageLoading || isGenerating,
    onRegenerateImage: handleRegenerate,
  };

  if (format === "meta-stories") {
    return <MetaStoriesPreview {...previewProps} />;
  }
  return <MetaFeedPreview {...previewProps} />;
}
