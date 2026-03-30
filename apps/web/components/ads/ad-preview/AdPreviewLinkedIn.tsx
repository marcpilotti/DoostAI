"use client";

/**
 * AdPreviewLinkedIn — LinkedIn Sponsored Post preview.
 *
 * Layers (bottom → top):
 * 1. AI-generated background image (Ken Burns 8s) in creative area
 * 2. Gradient overlay
 * 3. Frosted glass CTA
 * 4. Text (headline, body)
 * 5. LinkedIn chrome (avatar, badge, reactions)
 */

import { useState, useEffect, useTransition } from "react";
import { Globe, MoreHorizontal, ThumbsUp, MessageCircle, Share2, Send, RefreshCw } from "lucide-react";
import { generateAdImage } from "@/app/actions/generate-ad-image";
import type { AdData, FormatPreviewProps } from "./types";

// ── Utilities ────────────────────────────────────────────────────

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

// ── LinkedIn Preview ─────────────────────────────────────────────

function LinkedInPreview({ data, imageUrl, isImageLoading, onRegenerateImage }: FormatPreviewProps) {
  const domain = data.brandUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const gradient = `linear-gradient(135deg, ${data.brandColor} 0%, ${darken(data.brandColor, 30)} 50%, ${darken(data.brandAccent ?? data.brandColor, 50)} 100%)`;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-white shadow-sm">
      {/* Header: avatar + brand + sponsored + LinkedIn blue accent */}
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Square avatar (LinkedIn uses square, not round) */}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-[11px] font-bold text-white"
          style={{ backgroundColor: data.brandColor }}
        >
          {getInitial(data.brandName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold text-gray-900">{data.brandName}</div>
          <div className="text-[9px] text-gray-500">Sponsrad · <Globe className="inline h-2 w-2" /></div>
        </div>
        <MoreHorizontal className="h-4 w-4 shrink-0 text-gray-400" />
      </div>

      {/* Primary text with line clamp */}
      <div className="px-3 pb-2">
        <p className="line-clamp-3 text-[11px] leading-relaxed text-gray-700">
          {data.primaryText}
        </p>
      </div>

      {/* Creative area — 1.91:1 ratio with AI background */}
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: "1.91/1", background: imageUrl ? undefined : gradient }}
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
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

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

        {/* Bottom text overlay */}
        <div className="absolute inset-x-0 bottom-0 z-[1] p-3">
          <h3 className="text-sm font-bold leading-tight text-white drop-shadow-sm">
            {data.headline}
          </h3>
        </div>
      </div>

      {/* Link card below creative — LinkedIn style */}
      <div className="flex items-center justify-between border-t bg-gray-50 px-3 py-2">
        <div className="min-w-0 flex-1">
          <div className="text-[8px] uppercase text-gray-400">{domain}</div>
          <div className="truncate text-[10px] font-semibold text-gray-800">
            {data.headline.slice(0, 45)}
          </div>
        </div>
        {/* Frosted glass CTA */}
        <button
          className="shrink-0 rounded px-3 py-1.5 text-[9px] font-bold transition-transform hover:scale-[1.03] active:scale-[0.97]"
          style={{
            backgroundColor: "#0A66C2",
            color: "#fff",
            boxShadow: "0 2px 8px rgba(10,102,194,0.3)",
          }}
        >
          {data.cta}
        </button>
      </div>

      {/* LinkedIn engagement bar */}
      <div className="flex justify-around border-t px-2 py-1.5 text-[9px] text-gray-500">
        <span className="flex items-center gap-1 transition-colors hover:text-[#0A66C2]">
          <ThumbsUp className="h-3 w-3" /> Gilla
        </span>
        <span className="flex items-center gap-1 transition-colors hover:text-[#0A66C2]">
          <MessageCircle className="h-3 w-3" /> Kommentera
        </span>
        <span className="flex items-center gap-1 transition-colors hover:text-[#0A66C2]">
          <Share2 className="h-3 w-3" /> Dela
        </span>
        <span className="flex items-center gap-1 transition-colors hover:text-[#0A66C2]">
          <Send className="h-3 w-3" /> Skicka
        </span>
      </div>
    </div>
  );
}

// ── Exported LinkedIn preview ────────────────────────────────────

export function AdPreviewLinkedIn({
  data,
  autoGenerateImage = true,
  imageDelay = 0,
}: {
  data: AdData;
  autoGenerateImage?: boolean;
  imageDelay?: number;
}) {
  const initialImage = data.imageUrl && (data.imageUrl.startsWith("data:") || data.imageUrl.startsWith("https:")) ? data.imageUrl : null;
  const [imageUrl, setImageUrl] = useState<string | null>(initialImage);
  const [isGenerating, startTransition] = useTransition();
  const [imageLoading, setImageLoading] = useState(false);

  // Auto-generate image on mount (with optional delay for variant B)
  useEffect(() => {
    if (imageUrl || !autoGenerateImage) return;
    const timer = setTimeout(() => {
      setImageLoading(true);
      generateAdImage(
        { id: data.id, headline: data.headline, primaryText: data.primaryText, brandName: data.brandName },
        "linkedin",
      ).then((result) => {
        if (result?.imageUrl) setImageUrl(result.imageUrl);
      }).finally(() => setImageLoading(false));
    }, imageDelay);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleRegenerate() {
    setImageLoading(true);
    startTransition(async () => {
      const result = await generateAdImage(
        { id: `${data.id}-${Date.now()}`, headline: data.headline, primaryText: data.primaryText, brandName: data.brandName },
        "linkedin",
      );
      if (result?.imageUrl) setImageUrl(result.imageUrl);
      setImageLoading(false);
    });
  }

  return (
    <LinkedInPreview
      data={data}
      isEditing={false}
      imageUrl={imageUrl}
      isImageLoading={imageLoading || isGenerating}
      onRegenerateImage={handleRegenerate}
    />
  );
}
