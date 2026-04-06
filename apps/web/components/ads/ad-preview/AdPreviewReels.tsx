"use client";

/**
 * AdPreviewReels — Instagram Reels ad preview (9:16 vertical).
 *
 * Layers (bottom → top):
 * 1. AI-generated background image (Ken Burns 8s)
 * 2. Bottom 40% gradient overlay
 * 3. Profile row + "Sponsrad" badge
 * 4. Primary text + audio marquee
 * 5. Frosted-glass CTA button (full width)
 * 6. Right-side vertical interaction icons (stagger-in)
 */

import { Bookmark, Heart, MessageCircle, MoreHorizontal, RefreshCw, Send } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState, useTransition } from "react";

import { generateAdImage } from "@/app/actions/generate-ad-image";
import { getPrewarmedImage } from "@/lib/image-prewarm";
import { transitions } from "@/lib/motion";

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

// ── Reels icon stagger variants ──────────────────────────────────

const iconContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.3 } },
};

const iconItemVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: { opacity: 1, scale: 1, transition: transitions.spring },
};

// ── Reels Preview (visual) ───────────────────────────────────────

function ReelsPreview({ data, imageUrl, isImageLoading, onRegenerateImage }: FormatPreviewProps) {
  const gradient = `linear-gradient(135deg, ${data.brandColor} 0%, ${darken(data.brandColor, 30)} 50%, ${darken(data.brandColor, 60)} 100%)`;
  const bodySnippet = data.primaryText.length > 80 ? data.primaryText.slice(0, 80) + "...mer" : data.primaryText;
  const audioLabel = `♪ Originalljud · ${data.brandName}`;

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-xl shadow-sm" style={{ aspectRatio: "9/16", maxHeight: "100%" }}>
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

        {/* Bottom 40% gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 40%, transparent 60%)" }}
        />

        {/* Regenerate button */}
        {onRegenerateImage && (
          <button
            onClick={(e) => { e.stopPropagation(); onRegenerateImage(); }}
            className="absolute right-2 top-10 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/30 text-white/70 backdrop-blur-sm transition-all hover:bg-black/50 hover:text-white"
          >
            <RefreshCw className={`h-3 w-3 ${isImageLoading ? "animate-spin" : ""}`} />
          </button>
        )}

        {/* Right-side vertical icon column */}
        <motion.div
          className="absolute bottom-[28%] right-2.5 z-[2] flex flex-col items-center gap-4"
          variants={iconContainerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={iconItemVariants}>
            <Heart className="h-6 w-6 text-white drop-shadow" />
            <span className="mt-0.5 block text-center text-[8px] font-semibold text-white">1,2k</span>
          </motion.div>
          <motion.div variants={iconItemVariants}>
            <MessageCircle className="h-6 w-6 text-white drop-shadow" />
            <span className="mt-0.5 block text-center text-[8px] font-semibold text-white">48</span>
          </motion.div>
          <motion.div variants={iconItemVariants}>
            <Send className="h-6 w-6 text-white drop-shadow" />
          </motion.div>
          <motion.div variants={iconItemVariants}>
            <MoreHorizontal className="h-6 w-6 text-white drop-shadow" />
          </motion.div>
          <motion.div variants={iconItemVariants}>
            <Bookmark className="h-6 w-6 text-white drop-shadow" />
          </motion.div>
          {/* Audio disc spinner */}
          <motion.div
            variants={iconItemVariants}
            className="mt-1 h-6 w-6 animate-[spin_3s_linear_infinite] rounded-full border-2 border-white/30"
            style={{ backgroundColor: data.brandColor }}
          >
            <div className="flex h-full w-full items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
            </div>
          </motion.div>
        </motion.div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom content overlay */}
        <div className="relative z-[1] flex flex-col gap-2.5 px-3 pb-3">
          {/* Profile row */}
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-white/40"
              style={{ backgroundColor: data.brandColor }}
            >
              {getInitial(data.brandName)}
            </div>
            <div>
              <div className="text-[12px] font-semibold text-white drop-shadow">{data.brandName}</div>
              <div className="text-[9px] text-white/50">Sponsrad</div>
            </div>
          </div>

          {/* Primary text */}
          <p className="text-[11px] leading-snug text-white/90 line-clamp-2 drop-shadow">
            {bodySnippet}
          </p>

          {/* Audio track marquee */}
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="shrink-0 text-[10px] text-white/60">♪</span>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="inline-flex whitespace-nowrap animate-[marquee_15s_linear_infinite]">
                <span className="text-[10px] text-white/60">{audioLabel}</span>
                <span className="px-8 text-[10px] text-white/60">{audioLabel}</span>
              </div>
            </div>
          </div>

          {/* CTA button — frosted glass, full width */}
          <button
            className="w-full rounded-lg py-2 text-center text-[13px] font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            {data.cta}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Exported Reels preview (with image management) ───────────────

export function AdPreviewReels({
  data,
  autoGenerateImage = true,
  imageDelay = 0,
  onImageReady,
}: {
  data: AdData;
  autoGenerateImage?: boolean;
  imageDelay?: number;
  onImageReady?: (url: string) => void;
}) {
  const prewarmed = getPrewarmedImage(data.brandName, "instagram-reels");
  const propImage = data.imageUrl && (data.imageUrl.startsWith("data:") || data.imageUrl.startsWith("https:")) ? data.imageUrl : null;
  const initialImage = propImage ?? prewarmed;
  const [imageUrl, setImageUrl] = useState<string | null>(initialImage);
  const [isGenerating, startTransition] = useTransition();
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    if (imageUrl || !autoGenerateImage) return;
    const timer = setTimeout(() => {
      setImageLoading(true);
      generateAdImage(
        { id: data.id, headline: data.headline, primaryText: data.primaryText, brandName: data.brandName },
        "instagram-reels",
      ).then((result) => {
        if (result?.imageUrl) { setImageUrl(result.imageUrl); onImageReady?.(result.imageUrl); }
      }).catch((err) => {
        console.error("[AdPreviewReels] Image generation error:", err);
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
        "instagram-reels",
      );
      if (result?.imageUrl) { setImageUrl(result.imageUrl); onImageReady?.(result.imageUrl); }
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

  return <ReelsPreview {...previewProps} />;
}
