"use client";

/**
 * AdPreviewLinkedIn — Pixel-perfect LinkedIn Sponsored Post.
 *
 * Style-isolated: uses LinkedIn's own colors, fonts, and layout.
 * White background, 552px max-width, LinkedIn's feed aesthetic.
 *
 * Layout:
 * 1. Company header (logo, name, followers, Sponsrad badge)
 * 2. Primary text (introtext, max 3 lines)
 * 3. Creative image (1.91:1, Ken Burns)
 * 4. Headline + URL in grey container + CTA outline button
 * 5. Reaction row (overlapping emoji circles)
 * 6. Action bar (Gilla, Kommentera, Dela, Skicka)
 */

import { RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState, useTransition } from "react";

import { generateAdImage } from "@/app/actions/generate-ad-image";
import { getPrewarmedImage } from "@/lib/image-prewarm";
import { transitions } from "@/lib/motion";

import type { AdData, FormatPreviewProps } from "./types";

// ── LinkedIn colors (hardcoded, not design tokens) ───────────────

const LI = {
  blue: "#0a66c2",
  black: "#000000",
  grey: "#666666",
  lightGrey: "#f3f2ef",
  border: "#e0dfdc",
  hover: "#e8e6e3",
  white: "#ffffff",
  reactionHeart: "#df704d",
  reactionCelebrate: "#44712e",
  font: "-apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', 'Fira Sans', Ubuntu, Oxygen, 'Oxygen Sans', Cantarell, 'Droid Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Lucida Grande', Helvetica, Arial, sans-serif",
} as const;

// ── Stagger animation variants ───────────────────────────────────

const sectionVariants = (delay: number) => ({
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { ...transitions.spring, delay } },
});

// ── LinkedIn Preview (visual) ────────────────────────────────────

function LinkedInPreview({ data, imageUrl, isImageLoading, onRegenerateImage }: FormatPreviewProps) {
  const domain = data.brandUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const bodySnippet = data.primaryText.length > 150 ? data.primaryText.slice(0, 147) : data.primaryText;
  const isTruncated = data.primaryText.length > 150;

  return (
    <div
      className="w-full max-w-[552px] overflow-hidden"
      style={{
        fontFamily: LI.font,
        color: LI.black,
        backgroundColor: LI.white,
        border: `1px solid ${LI.border}`,
        borderRadius: 8,
        boxShadow: "0 0 0 1px rgba(0,0,0,0.08)",
      }}
    >
      {/* ── Header ─────────────────────────────── */}
      <motion.div
        className="flex items-start gap-2"
        style={{ padding: "12px 16px 0" }}
        {...sectionVariants(0)}
      >
        {/* Square logo (LinkedIn uses rounded square, not circle) */}
        <div
          className="flex shrink-0 items-center justify-center"
          style={{
            width: 48,
            height: 48,
            borderRadius: 4,
            backgroundColor: data.brandColor || LI.blue,
          }}
        >
          {data.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.logoUrl} alt="" className="h-full w-full rounded-[4px] object-cover" />
          ) : (
            <span style={{ fontSize: 20, fontWeight: 700, color: LI.white }}>
              {data.brandName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="cursor-pointer truncate hover:underline" style={{ fontSize: 14, fontWeight: 600, color: LI.black }}>
            {data.brandName}
          </div>
          <div style={{ fontSize: 12, color: LI.grey }}>
            1 234 följare
          </div>
          <div className="flex items-center gap-0.5" style={{ fontSize: 12, color: LI.grey }}>
            Sponsrad ·{" "}
            <svg width="12" height="12" viewBox="0 0 16 16" fill={LI.grey}>
              <path d="M8 0a8 8 0 108 8 8 8 0 00-8-8zm5.6 3.8l-1.3 5.3a.6.6 0 01-.4.4L6.5 11a.6.6 0 01-.7-.3l-2.4-4a.6.6 0 01.1-.7l4-3.4a.6.6 0 01.7 0l5.3 1a.6.6 0 01.1.2zm-3.1.7a1 1 0 101 1 1 1 0 00-1-1z" />
            </svg>
          </div>
        </div>

        {/* Three-dots menu */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill={LI.grey} className="mt-1 shrink-0">
          <circle cx="2" cy="8" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="14" cy="8" r="1.5" />
        </svg>
      </motion.div>

      {/* ── Primary text ───────────────────────── */}
      <motion.div
        style={{ padding: "8px 16px 12px" }}
        {...sectionVariants(0.05)}
      >
        <p style={{ fontSize: 14, lineHeight: 1.4, color: LI.black }} className="line-clamp-3">
          {bodySnippet}
          {isTruncated && (
            <span style={{ color: LI.blue, cursor: "pointer" }}>...mer</span>
          )}
        </p>
      </motion.div>

      {/* ── Creative image (1.91:1) ────────────── */}
      <motion.div
        className="relative overflow-hidden"
        style={{ aspectRatio: "1.91/1", backgroundColor: LI.lightGrey }}
        {...sectionVariants(0.1)}
      >
        {imageUrl && (
          <div
            className="absolute inset-0 animate-[kenburns_8s_ease-in-out_infinite_alternate]"
            style={{ background: `url(${imageUrl}) center/cover` }}
          />
        )}
        {isImageLoading && !imageUrl && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200" />
        )}
        {!imageUrl && !isImageLoading && (
          <div className="flex h-full items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#b0b0b0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}
        {onRegenerateImage && (
          <button
            onClick={(e) => { e.stopPropagation(); onRegenerateImage(); }}
            className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/30 text-white/70 backdrop-blur-sm transition-all hover:bg-black/50 hover:text-white"
          >
            <RefreshCw className={`h-3 w-3 ${isImageLoading ? "animate-spin" : ""}`} />
          </button>
        )}
      </motion.div>

      {/* ── Headline + URL + CTA (grey container) */}
      <motion.div
        className="flex items-center gap-3 transition-colors duration-150"
        style={{ padding: "12px 16px", backgroundColor: LI.lightGrey, cursor: "pointer" }}
        whileHover={{ backgroundColor: LI.hover }}
        {...sectionVariants(0.15)}
      >
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2" style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3, color: LI.black }}>
            {data.headline}
          </h3>
          <div className="mt-0.5 truncate" style={{ fontSize: 12, color: LI.grey }}>
            {domain}
          </div>
        </div>
        {/* CTA — LinkedIn outline pill */}
        <button
          className="shrink-0 transition-colors duration-150"
          style={{
            border: `1.5px solid ${LI.blue}`,
            background: "transparent",
            color: LI.blue,
            fontSize: 14,
            fontWeight: 600,
            padding: "8px 16px",
            borderRadius: 20,
            fontFamily: LI.font,
            cursor: "pointer",
          }}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.backgroundColor = "rgba(10,102,194,0.08)"; }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.backgroundColor = "transparent"; }}
        >
          {data.cta}
        </button>
      </motion.div>

      {/* ── Separator ──────────────────────────── */}
      <div style={{ margin: "0 16px", borderTop: `1px solid ${LI.border}` }} />

      {/* ── Reaction row ───────────────────────── */}
      <motion.div
        className="flex items-center justify-between"
        style={{ padding: "8px 16px" }}
        {...sectionVariants(0.2)}
      >
        <div className="flex items-center gap-1.5">
          {/* Overlapping reaction circles */}
          <div className="flex items-center">
            <motion.div
              className="flex items-center justify-center rounded-full"
              style={{ width: 20, height: 20, backgroundColor: LI.blue, border: `2px solid ${LI.white}`, zIndex: 3 }}
              animate={{ scale: [0.8, 1.05, 1] }}
              transition={{ duration: 0.3, delay: 0.25 }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M2 21h2V9H2v12zm20-10a2 2 0 00-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L13.17 2 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" /></svg>
            </motion.div>
            <motion.div
              className="-ml-1 flex items-center justify-center rounded-full"
              style={{ width: 20, height: 20, backgroundColor: LI.reactionHeart, border: `2px solid ${LI.white}`, zIndex: 2 }}
              animate={{ scale: [0.8, 1.05, 1] }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
            </motion.div>
            <motion.div
              className="-ml-1 flex items-center justify-center rounded-full"
              style={{ width: 20, height: 20, backgroundColor: LI.reactionCelebrate, border: `2px solid ${LI.white}`, zIndex: 1 }}
              animate={{ scale: [0.8, 1.05, 1] }}
              transition={{ duration: 0.3, delay: 0.35 }}
            >
              <span style={{ fontSize: 9, lineHeight: 1 }}>🎉</span>
            </motion.div>
          </div>
          <span style={{ fontSize: 12, color: LI.grey }}>47</span>
        </div>
        <span style={{ fontSize: 12, color: LI.grey }}>2 kommentarer · 3 delningar</span>
      </motion.div>

      {/* ── Separator ──────────────────────────── */}
      <div style={{ margin: "0 16px", borderTop: `1px solid ${LI.border}` }} />

      {/* ── Action bar ─────────────────────────── */}
      <motion.div
        className="flex items-center justify-around"
        style={{ padding: "4px 16px" }}
        {...sectionVariants(0.25)}
      >
        {[
          { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={LI.grey} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" /></svg>, label: "Gilla" },
          { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={LI.grey} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>, label: "Kommentera" },
          { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={LI.grey} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 014-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 01-4 4H3" /></svg>, label: "Dela" },
          { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={LI.grey} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" /></svg>, label: "Skicka" },
        ].map(({ icon, label }) => (
          <button
            key={label}
            className="flex items-center gap-1.5 rounded px-3 py-2 transition-colors duration-150"
            style={{ fontSize: 12, fontWeight: 600, color: LI.grey, fontFamily: LI.font }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.backgroundColor = "rgba(0,0,0,0.08)"; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.backgroundColor = "transparent"; }}
          >
            {icon}
            {label}
          </button>
        ))}
      </motion.div>
    </div>
  );
}

// ── Exported LinkedIn preview (with image management) ────────────

export function AdPreviewLinkedIn({
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
  const prewarmed = getPrewarmedImage(data.brandName, "linkedin");
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
        "linkedin",
      ).then((result) => {
        if (result?.imageUrl) { setImageUrl(result.imageUrl); onImageReady?.(result.imageUrl); }
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
      if (result?.imageUrl) { setImageUrl(result.imageUrl); onImageReady?.(result.imageUrl); }
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
