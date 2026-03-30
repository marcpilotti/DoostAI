"use client";

import { useState, useRef, useMemo } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Globe,
  MoreHorizontal,
  ThumbsUp,
  MessageCircle,
  Share2,
  Sparkles,
  Send,
  ImagePlus,
  Wand2,
  Pencil,
  Type,
  Palette,
  Zap,
  RotateCcw,
  Repeat2,
} from "lucide-react";
import { PLATFORM_LIMITS, validateCopyLimits } from "@doost/ai";
import type { PlatformId } from "@doost/ai";

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

type AdFormat = "meta-feed" | "meta-story" | "google" | "linkedin";
type EditMode = null | "ai" | "manual";

// Shared props for all preview components
type PreviewProps = {
  copy: CopyData;
  brand: BrandData;
  bgImage?: string;
  isSelected: boolean;
  isLoser: boolean;
  onPick: () => void;
};

// ── Utility functions ───────────────────────────────────────────

function getGradient(primary?: string, accent?: string): string {
  if (primary && accent) {
    return `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`;
  }
  if (primary) {
    return `linear-gradient(135deg, ${primary} 0%, ${darken(primary, 25)} 100%)`;
  }
  return "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)";
}

/** Darken a hex color by a given amount (0-255). */
function darken(hex: string, amount: number): string {
  const c = hex.replace("#", "");
  const r = Math.max(0, parseInt(c.substring(0, 2), 16) - amount);
  const g = Math.max(0, parseInt(c.substring(2, 4), 16) - amount);
  const b = Math.max(0, parseInt(c.substring(4, 6), 16) - amount);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/** Return "#ffffff" or "#1a1a1a" depending on which has better contrast against the given hex. */
function getContrastText(hex: string): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#1a1a1a" : "#ffffff";
}

// ── Shared sub-components ───────────────────────────────────────

function SelectedBadge() {
  return (
    <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2">
      <span className="flex items-center gap-1 rounded-b-lg bg-emerald-500 px-3 py-1 text-[9px] font-semibold text-white shadow-sm">
        <Check className="h-3 w-3" strokeWidth={3} /> Vald
      </span>
    </div>
  );
}

function VariantLabel({
  label,
  isSelected,
  isLoser,
}: {
  label: string;
  isSelected: boolean;
  isLoser: boolean;
}) {
  return (
    <div className="flex items-center justify-between bg-muted/30 px-3 py-1.5">
      <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        {label}
      </span>
      {!isSelected && !isLoser && (
        <span className="text-[9px] font-medium text-indigo-400 opacity-0 transition-opacity group-hover:opacity-100">
          Välj denna
        </span>
      )}
    </div>
  );
}

function PreviewWrapper({
  isSelected,
  isLoser,
  onPick,
  className,
  children,
}: {
  isSelected: boolean;
  isLoser: boolean;
  onPick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
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
      } ${className ?? ""}`}
    >
      {isSelected && <SelectedBadge />}
      {children}
    </button>
  );
}

// ── Meta Feed Preview (Facebook / Instagram feed ads) ───────────
function MetaFeedPreview({ copy, brand, bgImage, isSelected, isLoser, onPick }: PreviewProps) {
  const gradient = getGradient(brand.colors.primary, brand.colors.accent);
  const cleanDomain = brand.url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <PreviewWrapper isSelected={isSelected} isLoser={isLoser} onPick={onPick}>
      <VariantLabel label={copy.label ?? "Variant"} isSelected={isSelected} isLoser={isLoser} />

      <div className="bg-white">
        {/* Header — brand avatar, name, sponsored label */}
        <div className="flex items-center gap-2 px-3 py-2">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm"
            style={{ backgroundColor: brand.colors.primary }}
          >
            {brand.name[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-gray-900">{brand.name}</div>
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              Sponsrad
              <Globe className="inline h-2.5 w-2.5" />
            </div>
          </div>
          <MoreHorizontal className="h-4 w-4 shrink-0 text-gray-300" />
        </div>

        {/* Body text above creative */}
        <div className="px-3 pb-2 text-[12px] leading-snug text-gray-800">
          {copy.bodyCopy}
        </div>

        {/* Creative area — 1.91:1 landscape */}
        <div
          className="relative flex aspect-[1.91/1] items-center justify-center overflow-hidden text-center"
          style={{
            background: bgImage ? `url(${bgImage}) center/cover` : gradient,
          }}
        >
          {/* Subtle dark overlay for text readability on gradient */}
          {!bgImage && <div className="absolute inset-0 bg-black/10" />}

          <div className="relative z-[1] space-y-4 px-6">
            {/* Brand name watermark */}
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
              {brand.name}
            </div>

            {/* Headline — large and bold */}
            <div className="text-xl font-extrabold leading-tight text-white drop-shadow-lg sm:text-2xl">
              {copy.headline}
            </div>

            {/* CTA button styled with brand accent */}
            <div
              className="inline-flex items-center gap-1.5 rounded-lg px-5 py-2 text-xs font-bold shadow-md"
              style={{
                backgroundColor: brand.colors.accent || "#ffffff",
                color: brand.colors.accent
                  ? getContrastText(brand.colors.accent)
                  : brand.colors.primary,
              }}
            >
              {copy.cta}
              <ArrowRight className="h-3 w-3" />
            </div>
          </div>
        </div>

        {/* Link bar */}
        <div className="flex items-center justify-between bg-gray-50 px-3 py-2">
          <div className="min-w-0 flex-1">
            <div className="text-[9px] uppercase text-gray-400">{cleanDomain}</div>
            <div className="truncate text-xs font-semibold text-gray-800">
              {copy.headline.slice(0, 50)}
            </div>
          </div>
          <div
            className="shrink-0 rounded px-3 py-1.5 text-[10px] font-semibold"
            style={{ backgroundColor: brand.colors.primary, color: "#fff" }}
          >
            {copy.cta}
          </div>
        </div>

        {/* Engagement row */}
        <div className="flex justify-around border-t px-2 py-1.5 text-[10px] text-gray-400">
          <span className="flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" /> Gilla</span>
          <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> Kommentera</span>
          <span className="flex items-center gap-1"><Share2 className="h-3.5 w-3.5" /> Dela</span>
        </div>
      </div>
    </PreviewWrapper>
  );
}

// ── Meta Story / Reel Preview ───────────────────────────────────
function MetaStoryPreview({ copy, brand, bgImage, isSelected, isLoser, onPick }: PreviewProps) {
  const gradient = getGradient(brand.colors.primary, brand.colors.accent);

  return (
    <PreviewWrapper
      isSelected={isSelected}
      isLoser={isLoser}
      onPick={onPick}
      className="mx-auto w-[200px]"
    >
      <div
        className="flex aspect-[9/16] flex-col items-center justify-between p-4 text-center"
        style={{ background: bgImage ? `url(${bgImage}) center/cover` : gradient }}
      >
        {/* Top: brand avatar + name + sponsored */}
        <div className="flex w-full items-center gap-2">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-white/50"
            style={{ backgroundColor: brand.colors.primary }}
          >
            {brand.name[0]}
          </div>
          <div className="min-w-0 text-left">
            <div className="truncate text-[10px] font-semibold text-white drop-shadow">
              {brand.name}
            </div>
            <div className="text-[8px] text-white/60">Sponsrad</div>
          </div>
        </div>

        {/* Center: headline + snippet of body copy */}
        <div className="space-y-3 px-2">
          <div className="text-lg font-extrabold leading-tight text-white drop-shadow-lg">
            {copy.headline}
          </div>
          <div className="text-[10px] leading-snug text-white/80 drop-shadow">
            {copy.bodyCopy.slice(0, 60)}{copy.bodyCopy.length > 60 ? "..." : ""}
          </div>
        </div>

        {/* Bottom: CTA swipe-up pill */}
        <div className="flex flex-col items-center gap-1.5">
          <ChevronUp className="h-4 w-4 animate-bounce text-white/80" />
          <div
            className="rounded-full px-5 py-2 text-[10px] font-bold shadow-lg"
            style={{
              backgroundColor: brand.colors.accent || "rgba(255,255,255,0.25)",
              color: brand.colors.accent
                ? getContrastText(brand.colors.accent)
                : "#ffffff",
              backdropFilter: brand.colors.accent ? undefined : "blur(8px)",
            }}
          >
            {copy.cta}
          </div>
        </div>
      </div>
    </PreviewWrapper>
  );
}

// ── Google Search Ad Preview ────────────────────────────────────
function GoogleSearchPreview({ copy, brand, isSelected, isLoser, onPick }: PreviewProps) {
  const cleanDomain = brand.url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <PreviewWrapper isSelected={isSelected} isLoser={isLoser} onPick={onPick}>
      <VariantLabel label={copy.label ?? "Variant"} isSelected={isSelected} isLoser={isLoser} />

      {/* Google search results styling */}
      <div className="bg-white p-4">
        {/* Google search bar mock */}
        <div className="mb-4 flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm">
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span className="truncate text-sm text-gray-600">{brand.name.toLowerCase()}</span>
        </div>

        {/* Sponsored label */}
        <div className="mb-1 flex items-center gap-1.5">
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-semibold text-gray-500">
            Sponsrad
          </span>
        </div>

        {/* URL line with favicon-style brand initial */}
        <div className="mb-1 flex items-center gap-1.5">
          <div
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white"
            style={{ backgroundColor: brand.colors.primary }}
          >
            {brand.name[0]}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[11px] text-gray-800">{brand.name}</div>
            <div className="flex items-center gap-0.5 text-[10px] text-gray-500">
              {cleanDomain}
              <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Headline — blue link style */}
        <div className="mb-1.5 text-lg font-medium leading-tight text-[#1a0dab] sm:text-xl">
          {copy.headline}
        </div>

        {/* Description text */}
        <div className="text-[12px] leading-relaxed text-gray-600">
          {copy.bodyCopy}
        </div>

        {/* Sitelink extensions (decorative) */}
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 border-t border-gray-100 pt-3">
          <span className="text-[11px] font-medium text-[#1a0dab]">{copy.cta}</span>
          <span className="text-[11px] font-medium text-[#1a0dab]">Om {brand.name}</span>
          <span className="text-[11px] font-medium text-[#1a0dab]">Priser</span>
          <span className="text-[11px] font-medium text-[#1a0dab]">Kontakt</span>
        </div>
      </div>
    </PreviewWrapper>
  );
}

// ── LinkedIn Sponsored Post Preview ─────────────────────────────
function LinkedInPreview({ copy, brand, bgImage, isSelected, isLoser, onPick }: PreviewProps) {
  const gradient = getGradient(brand.colors.primary, brand.colors.accent);

  return (
    <PreviewWrapper isSelected={isSelected} isLoser={isLoser} onPick={onPick}>
      <VariantLabel label={copy.label ?? "Variant"} isSelected={isSelected} isLoser={isLoser} />

      <div className="bg-white">
        {/* LinkedIn post header — company logo (square), name, industry, followers */}
        <div className="flex items-start gap-2.5 px-3 py-2.5">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded text-sm font-bold text-white"
            style={{ backgroundColor: brand.colors.primary }}
          >
            {brand.name[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-gray-900">{brand.name}</div>
            <div className="text-[10px] leading-snug text-gray-500">
              {brand.industry
                ? `${brand.industry.charAt(0).toUpperCase()}${brand.industry.slice(1)}`
                : "Företag"}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              Sponsrad
              <Globe className="inline h-2.5 w-2.5" />
            </div>
          </div>
          <MoreHorizontal className="h-4 w-4 shrink-0 text-gray-300" />
        </div>

        {/* Post body text */}
        <div className="px-3 pb-2.5 text-[12px] leading-snug text-gray-800">
          {copy.bodyCopy}
        </div>

        {/* Creative area */}
        <div
          className="relative flex aspect-[1.91/1] items-center justify-center overflow-hidden text-center"
          style={{
            background: bgImage ? `url(${bgImage}) center/cover` : gradient,
          }}
        >
          {!bgImage && <div className="absolute inset-0 bg-black/10" />}

          <div className="relative z-[1] space-y-4 px-6">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
              {brand.name}
            </div>
            <div className="text-xl font-extrabold leading-tight text-white drop-shadow-lg sm:text-2xl">
              {copy.headline}
            </div>
            <div
              className="inline-flex items-center gap-1.5 rounded-lg px-5 py-2 text-xs font-bold shadow-md"
              style={{
                backgroundColor: brand.colors.accent || "#ffffff",
                color: brand.colors.accent
                  ? getContrastText(brand.colors.accent)
                  : brand.colors.primary,
              }}
            >
              {copy.cta}
              <ArrowRight className="h-3 w-3" />
            </div>
          </div>
        </div>

        {/* Link card below creative */}
        <div className="border-t border-gray-100 bg-gray-50 px-3 py-2">
          <div className="text-[9px] text-gray-400">
            {brand.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          </div>
          <div className="truncate text-xs font-semibold text-gray-800">
            {copy.headline.slice(0, 60)}
          </div>
        </div>

        {/* LinkedIn engagement row */}
        <div className="flex justify-around border-t px-2 py-1.5 text-[10px] text-gray-500">
          <span className="flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" /> Gilla</span>
          <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> Kommentera</span>
          <span className="flex items-center gap-1"><Repeat2 className="h-3.5 w-3.5" /> Dela</span>
          <span className="flex items-center gap-1"><Send className="h-3.5 w-3.5" /> Skicka</span>
        </div>
      </div>
    </PreviewWrapper>
  );
}

// ── Platform tab icon components ────────────────────────────────

function MetaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.563V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function StoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="2" width="14" height="20" rx="3" />
      <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ── Format tab definitions ──────────────────────────────────────

const FORMAT_TABS: Array<{
  id: AdFormat;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "meta-feed", label: "Meta Feed", icon: MetaIcon },
  { id: "meta-story", label: "Meta Story", icon: StoryIcon },
  { id: "google", label: "Google Sök", icon: GoogleIcon },
  { id: "linkedin", label: "LinkedIn", icon: LinkedInIcon },
];

// ── Preview component map ───────────────────────────────────────

const PREVIEW_COMPONENTS: Record<AdFormat, React.ComponentType<PreviewProps>> = {
  "meta-feed": MetaFeedPreview,
  "meta-story": MetaStoryPreview,
  google: GoogleSearchPreview,
  linkedin: LinkedInPreview,
};

// ── AI Prompt Suggestions ───────────────────────────────────────
const AI_PROMPTS = [
  { icon: Zap, label: "Kortare & punchigare", prompt: "Gör rubriken kortare och mer slagkraftig" },
  { icon: Palette, label: "Annan stil", prompt: "Prova en helt annan kreativ vinkel" },
  { icon: Type, label: "Mer professionell", prompt: "Gör texten mer professionell och affärsmässig" },
  { icon: RotateCcw, label: "Generera nya", prompt: "Generera helt nya annonsförslag" },
];

// ── Main Component ──────────────────────────────────────────────
export function CopyPreviewCard({
  data,
  onSendMessage,
}: {
  data: CopyPreviewData;
  onSendMessage?: (text: string) => void;
}) {
  const [format, setFormat] = useState<AdFormat>("meta-feed");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [bgImages, setBgImages] = useState<Record<string, string>>({});
  const [mobileIndex, setMobileIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, { headline: string; bodyCopy: string; cta: string }>>({});

  const variants = data.copies.slice(0, 2);

  function getEditedCopy(copy: CopyData): CopyData {
    const copyId = copy.id ?? `${copy.platform}-${copy.variant}`;
    const edit = edits[copyId];
    if (!edit) return copy;
    return { ...copy, headline: edit.headline, bodyCopy: edit.bodyCopy, cta: edit.cta };
  }

  function updateEdit(copyId: string, field: "headline" | "bodyCopy" | "cta", value: string, original: CopyData) {
    setEdits((prev) => ({
      ...prev,
      [copyId]: {
        headline: prev[copyId]?.headline ?? original.headline,
        bodyCopy: prev[copyId]?.bodyCopy ?? original.bodyCopy,
        cta: prev[copyId]?.cta ?? original.cta,
        [field]: value,
      },
    }));
  }

  /** Resolve platform string from CopyData to a PlatformId, defaulting to "meta". */
  function resolvePlatform(platformStr: string): PlatformId {
    const lower = platformStr.toLowerCase();
    if (lower === "meta" || lower === "facebook" || lower === "instagram") return "meta";
    if (lower === "google") return "google";
    if (lower === "linkedin") return "linkedin";
    return "meta";
  }

  /** Get the character limit for a specific field on the resolved platform. */
  function getLimit(platformStr: string, field: "headline" | "bodyCopy" | "cta"): number {
    const pid = resolvePlatform(platformStr);
    const limits = PLATFORM_LIMITS[pid];
    if (field === "headline") return limits.headline;
    if (field === "bodyCopy") return "bodyCopy" in limits ? (limits as { bodyCopy: number }).bodyCopy : 9999;
    if (field === "cta") return limits.cta;
    return 9999;
  }

  /** Check all variants for any character limit violations. */
  const allViolations = useMemo(() => {
    const result: Record<string, string[]> = {};
    for (const copy of variants) {
      const copyId = copy.id ?? `${copy.platform}-${copy.variant}`;
      const edited = getEditedCopy(copy);
      const pid = resolvePlatform(copy.platform);
      const validation = validateCopyLimits(pid, {
        headline: edited.headline,
        bodyCopy: edited.bodyCopy,
        cta: edited.cta,
      });
      if (!validation.valid) {
        result[copyId] = validation.violations;
      }
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variants, edits]);

  const hasAnyViolation = Object.keys(allViolations).length > 0;

  if (!data.brand || variants.length === 0) return null;

  const Preview = PREVIEW_COMPONENTS[format];

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;
    const url = URL.createObjectURL(file);
    setBgImages((prev) => ({ ...prev, [uploadTarget]: url }));
    setUploadTarget(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (e.target) e.target.value = "";
  }

  return (
    <div className="animate-card-in mt-2 overflow-hidden rounded-2xl border border-border/30 bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-purple-500">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold">Annonsförslag</div>
            <div className="text-xs text-muted-foreground">
              Välj format och variant
            </div>
          </div>
        </div>
      </div>

      {/* Format toggle — edits intentionally persist across format switches because
         they are keyed by copy.id, not by format. The same copies render in all formats,
         so user edits should carry over when switching tabs. */}
      <div className="flex gap-1 overflow-x-auto border-b border-border/30 bg-muted/20 px-4 py-2">
        {FORMAT_TABS.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setFormat(tab.id);
                setSelectedId(null);
                setMobileIndex(0);
              }}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                format === tab.id
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TabIcon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Desktop: side by side */}
      <div className="hidden gap-4 p-4 sm:grid sm:grid-cols-2">
        {variants.map((copy) => {
          const copyId = copy.id ?? `${copy.platform}-${copy.variant}`;
          return (
            <Preview
              key={`${format}-${copyId}`}
              copy={getEditedCopy(copy)}
              brand={data.brand!}
              bgImage={bgImages[copyId]}
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
              <Preview
                copy={getEditedCopy(copy)}
                brand={data.brand!}
                bgImage={bgImages[copyId]}
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

      {/* Template style chips */}
      <div className="flex gap-1.5 border-t border-border/20 px-4 py-2">
        {[
          { id: "logo-headline", label: "Logo + rubrik" },
          { id: "stat-impact", label: "Siffra + impact" },
          { id: "testimonial", label: "Kundreferens" },
          { id: "minimal", label: "Minimalistisk" },
        ].map((t) => (
          <button
            key={t.id}
            className="rounded-full border border-border/40 bg-white px-2.5 py-1 text-[9px] font-medium text-muted-foreground transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
            onClick={() => onSendMessage?.(`Byt till mall: ${t.label}`)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Editing toolbar */}
      <div className="border-t border-border/30 px-4 py-3">
        <div className="flex gap-2">
          <button
            onClick={() => setEditMode(editMode === "ai" ? null : "ai")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
              editMode === "ai"
                ? "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200"
                : "bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            <Wand2 className="h-3.5 w-3.5" />
            Redigera med AI
          </button>
          <button
            onClick={() => setEditMode(editMode === "manual" ? null : "manual")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
              editMode === "manual"
                ? "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200"
                : "bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            <Pencil className="h-3.5 w-3.5" />
            Redigera själv
          </button>
        </div>

        {/* AI prompt suggestions */}
        {editMode === "ai" && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {AI_PROMPTS.map((p) => (
              <button
                key={p.label}
                onClick={() => onSendMessage?.(p.prompt)}
                className="flex items-center gap-2 rounded-xl border border-border/50 bg-white px-3 py-2.5 text-left text-xs font-medium text-muted-foreground transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
              >
                <p.icon className="h-3.5 w-3.5 shrink-0" />
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* Manual editing options */}
        {editMode === "manual" && (
          <div className="mt-3 space-y-3">
            {/* Global violations banner */}
            {hasAnyViolation && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                <div className="space-y-0.5">
                  <div className="text-[10px] font-semibold text-red-600">
                    Teckengränser överskrids
                  </div>
                  {Object.entries(allViolations).map(([copyId, violations]) => (
                    <div key={copyId} className="text-[9px] text-red-500">
                      {violations.join(" / ")}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {variants.map((copy) => {
              const copyId = copy.id ?? `${copy.platform}-${copy.variant}`;
              const edited = getEditedCopy(copy);
              const headlineLimit = getLimit(copy.platform, "headline");
              const bodyLimit = getLimit(copy.platform, "bodyCopy");
              const ctaLimit = getLimit(copy.platform, "cta");
              const headlineOver = edited.headline.length > headlineLimit;
              const bodyOver = edited.bodyCopy.length > bodyLimit;
              const ctaOver = edited.cta.length > ctaLimit;
              const copyViolations = allViolations[copyId];

              return (
                <div
                  key={copyId}
                  className={`rounded-xl border bg-white p-3 space-y-2 ${
                    copyViolations ? "border-red-300" : "border-border/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                      {copy.label}
                    </div>
                    <div className="text-[8px] font-medium text-muted-foreground/40">
                      {resolvePlatform(copy.platform).toUpperCase()}
                    </div>
                  </div>

                  {/* Headline */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-medium text-muted-foreground/50">RUBRIK</span>
                      <span className={`text-[9px] font-mono ${headlineOver ? "font-semibold text-red-500" : "text-muted-foreground/40"}`}>
                        {edited.headline.length}/{headlineLimit}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={edited.headline}
                      onChange={(e) => updateEdit(copyId, "headline", e.target.value, copy)}
                      maxLength={headlineLimit}
                      className={`w-full rounded-lg border bg-muted/5 px-2.5 py-1.5 text-xs font-medium outline-none transition-all focus:ring-1 ${
                        headlineOver
                          ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                          : "border-border/40 focus:border-indigo-300 focus:ring-indigo-200"
                      }`}
                    />
                  </div>

                  {/* Body */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-medium text-muted-foreground/50">BRÖDTEXT</span>
                      <span className={`text-[9px] font-mono ${bodyOver ? "font-semibold text-red-500" : "text-muted-foreground/40"}`}>
                        {edited.bodyCopy.length}/{bodyLimit}
                      </span>
                    </div>
                    <textarea
                      value={edited.bodyCopy}
                      onChange={(e) => updateEdit(copyId, "bodyCopy", e.target.value, copy)}
                      maxLength={bodyLimit}
                      rows={2}
                      className={`w-full resize-none rounded-lg border bg-muted/5 px-2.5 py-1.5 text-xs outline-none transition-all focus:ring-1 ${
                        bodyOver
                          ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                          : "border-border/40 focus:border-indigo-300 focus:ring-indigo-200"
                      }`}
                    />
                  </div>

                  {/* CTA */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-medium text-muted-foreground/50">CTA</span>
                      <span className={`text-[9px] font-mono ${ctaOver ? "font-semibold text-red-500" : "text-muted-foreground/40"}`}>
                        {edited.cta.length}/{ctaLimit}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={edited.cta}
                      onChange={(e) => updateEdit(copyId, "cta", e.target.value, copy)}
                      maxLength={ctaLimit}
                      className={`w-full rounded-lg border bg-muted/5 px-2.5 py-1.5 text-xs font-medium outline-none transition-all focus:ring-1 ${
                        ctaOver
                          ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                          : "border-border/40 focus:border-indigo-300 focus:ring-indigo-200"
                      }`}
                    />
                  </div>

                  {/* Per-variant violations */}
                  {copyViolations && (
                    <div className="flex items-center gap-1.5 rounded-md bg-red-50 px-2 py-1">
                      <AlertTriangle className="h-3 w-3 shrink-0 text-red-400" />
                      <span className="text-[9px] text-red-500">
                        {copyViolations.join(" / ")}
                      </span>
                    </div>
                  )}

                  {/* Background image */}
                  <button
                    onClick={() => {
                      setUploadTarget(copyId);
                      fileInputRef.current?.click();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border/50 bg-muted/5 px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-indigo-300 hover:bg-indigo-50/20 hover:text-indigo-600"
                  >
                    <ImagePlus className="h-3.5 w-3.5" />
                    {bgImages[copyId] ? "Byt bakgrundsbild" : "Ladda upp bakgrundsbild"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      {/* QuickPicks + Footer */}
      <div className="border-t border-border/20 px-4 py-2">
        {selectedId ? (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[9px] font-medium text-emerald-600">
              <Check className="h-3 w-3" /> Variant vald
            </span>
            <div className="ml-auto flex gap-1.5">
              <button
                onClick={() => onSendMessage?.("Visa fler varianter")}
                className="rounded-full border border-border/40 bg-white px-2.5 py-1 text-[9px] font-medium text-muted-foreground transition-all hover:border-indigo-300 hover:text-indigo-600"
              >
                Fler varianter
              </button>
              <button
                disabled={hasAnyViolation}
                onClick={() => {
                  if (hasAnyViolation) return;
                  const selected = variants.find((c) => (c.id ?? `${c.platform}-${c.variant}`) === selectedId);
                  const edited = selected ? getEditedCopy(selected) : undefined;
                  const msg = edited
                    ? `Ser bra ut, publicera! [headline: ${edited.headline}] [body: ${edited.bodyCopy}] [cta: ${edited.cta}]`
                    : "Ser bra ut, publicera!";
                  onSendMessage?.(msg);
                }}
                title={hasAnyViolation ? "Fix character limit violations before publishing" : undefined}
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-[9px] font-semibold shadow-sm transition-all ${
                  hasAnyViolation
                    ? "cursor-not-allowed bg-gray-300 text-gray-500"
                    : "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700"
                }`}
              >
                {hasAnyViolation ? (
                  <>
                    <AlertTriangle className="h-3 w-3" />
                    Teckengräns överskriden
                  </>
                ) : (
                  <>
                    Ser bra ut, publicera!
                    <ArrowRight className="h-3 w-3" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-1.5">
            <button
              onClick={() => onSendMessage?.("Ändra texten")}
              className="rounded-full border border-border/40 bg-white px-2.5 py-1 text-[9px] font-medium text-muted-foreground transition-all hover:border-indigo-300 hover:text-indigo-600"
            >
              Ändra texten
            </button>
            <button
              onClick={() => onSendMessage?.("Visa fler varianter")}
              className="rounded-full border border-border/40 bg-white px-2.5 py-1 text-[9px] font-medium text-muted-foreground transition-all hover:border-indigo-300 hover:text-indigo-600"
            >
              Fler varianter
            </button>
            <span className="ml-auto text-[9px] text-muted-foreground/40 self-center">Välj en variant ↑</span>
          </div>
        )}
      </div>
    </div>
  );
}
