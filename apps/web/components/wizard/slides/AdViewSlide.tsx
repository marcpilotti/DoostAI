"use client";

/**
 * AdViewSlide — presents generated ad variants in platform-specific device mockups.
 *
 * Each platform gets its own device + UI chrome:
 * - Instagram: iPhone + Stories UI (profile, timestamp, reactions)
 * - Facebook: iPhone + Feed post (Sponsored, like/comment/share)
 * - Google: Laptop + browser chrome + fake news site with display banner
 * - LinkedIn: Monitor + LinkedIn feed with Promoted tag
 */

import { Check, Globe, Heart, MessageCircle, MoreHorizontal, Pencil, RefreshCw, Send, Share2, ThumbsUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";

import { generateAdImage } from "@/app/actions/generate-ad-image";
import { useWizardNavigation } from "@/hooks/use-wizard-navigation";
import { transitions } from "@/lib/motion";
import type { AdCreative } from "@/lib/stores/wizard-store";
import { useWizardStore } from "@/lib/stores/wizard-store";

import { AdEditModal } from "../shared/AdEditModal";
import { AdGenerationLoading } from "../shared/AdGenerationLoading";

// ── Types ────────────────────────────────────────────────────────

type Platform = "instagram" | "facebook" | "google" | "linkedin";
type BrandState = NonNullable<ReturnType<typeof useWizardStore.getState>["brand"]>;

const ACTION_VERBS = ["ge", "boka", "upptäck", "välj", "starta", "få", "skapa", "hitta", "testa", "prova", "köp", "läs", "se", "hör", "ring"];

function colorIsLight(hex: string): boolean {
  const h = hex.replace("#", "");
  if (h.length < 6) return false;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55;
}

function getAngleLabel(headline: string): { label: string; description: string } {
  const lower = headline.trim().toLowerCase();
  const firstWord = lower.split(/\s+/)[0] ?? "";
  if (lower.includes("?")) return { label: "Frågebaserad", description: "Väcker nyfikenhet" };
  if (ACTION_VERBS.some((v) => firstWord.startsWith(v))) return { label: "Direkt uppmaning", description: "Uppmanar till handling" };
  return { label: "Påstående", description: "Bygger trovärdighet" };
}

function brandSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "").replace(/[^a-zåäö0-9]/g, "");
}

// ── Platform Icons ───────────────────────────────────────────────

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function LinkedInIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const PLATFORM_ICONS: Record<Platform, React.ComponentType<{ size?: number }>> = {
  instagram: InstagramIcon, facebook: FacebookIcon, google: GoogleIcon, linkedin: LinkedInIcon,
};

// ── Inline Editable Text ─────────────────────────────────────────

function InlineEditableText({ value, onSave, as: Tag = "h3", className, style }: {
  value: string; onSave: (v: string) => void; as?: "h3" | "p"; className?: string; style?: React.CSSProperties;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing && ref.current) { ref.current.focus(); ref.current.select(); ref.current.style.height = "auto"; ref.current.style.height = ref.current.scrollHeight + "px"; } }, [editing]);
  function commit() { setEditing(false); if (draft.trim() !== value.trim()) onSave(draft.trim()); }
  if (editing) {
    return (
      <textarea ref={ref} value={draft}
        onChange={(e) => { setDraft(e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
        onBlur={commit} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commit(); } }}
        className={className} rows={1}
        style={{ ...style, resize: "none", background: "transparent", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 4, outline: "none", width: "100%", padding: "2px 4px", margin: "-2px -4px" }}
      />
    );
  }
  return (
    <div className="group/edit relative cursor-pointer" onClick={(e) => { e.stopPropagation(); setEditing(true); }}>
      <Tag className={className} style={style}>{value}</Tag>
      <span className="absolute -right-5 top-0 hidden text-white/50 group-hover/edit:inline"><Pencil className="h-3 w-3" /></span>
    </div>
  );
}

// ── Ad Image Layer (shared across platforms) ─────────────────────

function AdImageLayer({ ad, primaryColor, aspectRatio, isRegenerating, isLightBrand }: {
  ad: AdCreative; primaryColor: string; aspectRatio: string; isRegenerating: boolean; isLightBrand?: boolean;
}) {
  const gradientBg = isLightBrand
    ? "linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)"
    : `linear-gradient(145deg, ${primaryColor} 0%, ${primaryColor}CC 100%)`;
  const overlayGradient = isLightBrand
    ? "linear-gradient(to top, rgba(20,20,30,0.85) 0%, rgba(20,20,30,0.5) 35%, transparent 70%)"
    : `linear-gradient(to top, ${primaryColor}E0 0%, ${primaryColor}60 35%, transparent 70%)`;
  return (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio }}>
      {ad.imageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ad.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ transform: "scale(1.05)" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <div className="absolute inset-0" style={{ background: overlayGradient }} />
        </>
      ) : (
        <div className="absolute inset-0" style={{ background: gradientBg }}>
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>
      )}
      {isRegenerating && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <RefreshCw className="h-6 w-6 animate-spin text-white/80" />
        </div>
      )}
    </div>
  );
}

// ── Device Frames ────────────────────────────────────────────────

function IPhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden" style={{ borderRadius: 28, background: "#1C1C1E", padding: "6px 3px", boxShadow: "0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)" }}>
      <div className="absolute left-1/2 top-1 z-30 -translate-x-1/2" style={{ width: 60, height: 16, borderRadius: 10, background: "#1C1C1E" }} />
      <div className="overflow-hidden" style={{ borderRadius: 24, background: "#000" }}>{children}</div>
    </div>
  );
}

function LaptopFrame({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {/* Screen */}
      <div className="overflow-hidden" style={{ borderRadius: "8px 8px 0 0", background: "#2D2D2D", padding: "3px 3px 0", boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}>
        <div className="overflow-hidden" style={{ borderRadius: "6px 6px 0 0", background: "#fff" }}>{children}</div>
      </div>
      {/* Base/hinge */}
      <div className="mx-auto" style={{ width: "110%", maxWidth: "100%", height: 10, background: "linear-gradient(to bottom, #C0C0C0, #A0A0A0)", borderRadius: "0 0 4px 4px" }} />
      <div className="mx-auto" style={{ width: "40%", height: 3, background: "#B0B0B0", borderRadius: "0 0 2px 2px" }} />
    </div>
  );
}

function MonitorFrame({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {/* Screen */}
      <div className="overflow-hidden" style={{ borderRadius: 8, background: "#1C1C1E", padding: 3, boxShadow: "0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)" }}>
        <div className="overflow-hidden" style={{ borderRadius: 5, background: "#fff" }}>{children}</div>
      </div>
      {/* Stand */}
      <div className="mx-auto" style={{ width: 40, height: 18, background: "linear-gradient(to bottom, #C0C0C0, #A0A0A0)" }} />
      <div className="mx-auto" style={{ width: 70, height: 4, background: "#A0A0A0", borderRadius: 2 }} />
    </div>
  );
}

// ── Platform-Specific Mockups ────────────────────────────────────

function InstagramMockup({ ad, brand, isRegenerating, onUpdate, isLightBrand }: {
  ad: AdCreative; brand: BrandState; isRegenerating: boolean; onUpdate: (f: "headline" | "bodyCopy" | "cta", v: string) => void; isLightBrand?: boolean;
}) {
  const c = brand.colors.primary || "#6366F1";
  const slug = brandSlug(brand.name);
  return (
    <IPhoneFrame>
      {/* Status bar */}
      <div className="flex items-center justify-between bg-black px-4 py-1">
        <span className="text-[9px] font-semibold text-white">9:41</span>
        <div className="flex gap-1"><div className="h-1.5 w-3 rounded-sm bg-white/50" /><div className="h-2 w-3.5 rounded-sm bg-white/50" /></div>
      </div>
      {/* Stories header */}
      <div className="flex items-center gap-2 bg-black px-3 py-1.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ background: c, border: "2px solid #E1306C" }}>
          {brand.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-semibold text-white">{slug}</span>
          <span className="ml-1.5 text-[8px] text-white/40">Sponsrad</span>
        </div>
        <MoreHorizontal className="h-3.5 w-3.5 text-white/50" />
      </div>
      {/* Ad image */}
      <div className="relative">
        <AdImageLayer ad={ad} primaryColor={c} aspectRatio="1/1" isRegenerating={isRegenerating} isLightBrand={isLightBrand} />
        {/* Text overlay */}
        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-0.5 p-3">
          <InlineEditableText value={ad.headline} onSave={(v) => onUpdate("headline", v)} as="h3"
            className="text-[13px] font-extrabold leading-tight" style={{ color: "#fff", textShadow: "0 1px 8px rgba(0,0,0,0.4)" }} />
          <InlineEditableText value={ad.bodyCopy} onSave={(v) => onUpdate("bodyCopy", v)} as="p"
            className="text-[9px] leading-relaxed line-clamp-2" style={{ color: "rgba(255,255,255,0.75)" }} />
          <span className="mt-1 inline-flex self-start rounded-md px-2.5 py-1 text-[9px] font-bold" style={{ background: "rgba(255,255,255,0.9)", color: c }}>
            {ad.cta} →
          </span>
        </div>
      </div>
      {/* Reactions */}
      <div className="flex items-center justify-between bg-black px-3 py-2">
        <div className="flex gap-3.5">
          <Heart className="h-4 w-4 text-white" />
          <MessageCircle className="h-4 w-4 text-white" />
          <Send className="h-4 w-4 text-white" />
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>
      </div>
      <div className="bg-black px-3 pb-2">
        <span className="text-[9px] font-semibold text-white">142 gillamarkeringar</span>
      </div>
    </IPhoneFrame>
  );
}

function FacebookMockup({ ad, brand, isRegenerating, onUpdate, isLightBrand }: {
  ad: AdCreative; brand: BrandState; isRegenerating: boolean; onUpdate: (f: "headline" | "bodyCopy" | "cta", v: string) => void; isLightBrand?: boolean;
}) {
  const c = brand.colors.primary || "#6366F1";
  const domain = brand.url?.replace(/^https?:\/\//, "").replace(/\/$/, "") || "example.com";
  return (
    <IPhoneFrame>
      {/* Status bar */}
      <div className="flex items-center justify-between bg-white px-4 py-1">
        <span className="text-[9px] font-semibold text-gray-800">9:41</span>
        <div className="flex gap-1"><div className="h-1.5 w-3 rounded-sm bg-gray-400" /><div className="h-2 w-3.5 rounded-sm bg-gray-400" /></div>
      </div>
      {/* Facebook chrome */}
      <div className="bg-white">
        {/* Post header */}
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: c }}>
            {brand.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold text-gray-900">{brand.name}</div>
            <div className="flex items-center gap-1 text-[9px] text-gray-400">Sponsrad · <Globe className="inline h-2.5 w-2.5" /></div>
          </div>
          <MoreHorizontal className="h-4 w-4 text-gray-300" />
        </div>
        {/* Primary text */}
        <div className="px-3 pb-2">
          <InlineEditableText value={ad.bodyCopy} onSave={(v) => onUpdate("bodyCopy", v)} as="p"
            className="text-[10px] leading-relaxed line-clamp-2" style={{ color: "#1c1e21" }} />
        </div>
      </div>
      {/* Ad image */}
      <AdImageLayer ad={ad} primaryColor={c} aspectRatio="4/5" isRegenerating={isRegenerating} isLightBrand={isLightBrand} />
      {/* Link preview bar */}
      <div className="flex items-center justify-between bg-gray-50 px-3 py-1.5">
        <div className="min-w-0 flex-1">
          <div className="text-[8px] uppercase text-gray-400">{domain}</div>
          <InlineEditableText value={ad.headline} onSave={(v) => onUpdate("headline", v)} as="h3"
            className="truncate text-[10px] font-semibold" style={{ color: "#1c1e21" }} />
        </div>
        <div className="shrink-0 rounded px-2.5 py-1 text-[9px] font-bold text-white" style={{ background: c }}>
          {ad.cta}
        </div>
      </div>
      {/* Reactions bar */}
      <div className="bg-white">
        <div className="flex items-center gap-1 border-b border-gray-100 px-3 py-1">
          <span className="text-[10px]">👍❤️</span>
          <span className="text-[9px] text-gray-400">48</span>
        </div>
        <div className="flex justify-around py-1.5 text-[10px] font-medium text-gray-500">
          <span className="flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" /> Gilla</span>
          <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> Kommentera</span>
          <span className="flex items-center gap-1"><Share2 className="h-3.5 w-3.5" /> Dela</span>
        </div>
      </div>
    </IPhoneFrame>
  );
}

function GoogleMockup({ ad, brand, isRegenerating, onUpdate, isLightBrand }: {
  ad: AdCreative; brand: BrandState; isRegenerating: boolean; onUpdate: (f: "headline" | "bodyCopy" | "cta", v: string) => void; isLightBrand?: boolean;
}) {
  const c = brand.colors.primary || "#6366F1";
  return (
    <LaptopFrame>
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-[#DEE1E6] px-3 py-1.5">
        <div className="flex gap-1"><div className="h-2 w-2 rounded-full bg-[#FF5F57]" /><div className="h-2 w-2 rounded-full bg-[#FEBC2E]" /><div className="h-2 w-2 rounded-full bg-[#28C840]" /></div>
        <div className="flex flex-1 items-center gap-1.5 rounded-md bg-white px-2 py-0.5" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="#28C840"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" /></svg>
          <span className="truncate text-[8px] text-gray-500">nyheter.se/ekonomi/senaste</span>
        </div>
      </div>
      {/* Fake news site with ad banner */}
      <div className="flex gap-3 bg-[#f9f9f9] p-3">
        {/* Article content */}
        <div className="flex-1 space-y-2">
          <div className="h-2 w-3/4 rounded bg-gray-300" />
          <div className="space-y-1">
            <div className="h-1.5 w-full rounded bg-gray-200" />
            <div className="h-1.5 w-full rounded bg-gray-200" />
            <div className="h-1.5 w-5/6 rounded bg-gray-200" />
          </div>
          <div className="space-y-1">
            <div className="h-1.5 w-full rounded bg-gray-200" />
            <div className="h-1.5 w-4/5 rounded bg-gray-200" />
          </div>
        </div>
        {/* Sidebar with ad */}
        <div className="w-2/5 shrink-0">
          <div className="text-[6px] uppercase tracking-wider text-gray-400">Annons</div>
          <div className="mt-0.5 overflow-hidden rounded" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
            <AdImageLayer ad={ad} primaryColor={c} aspectRatio="1.91/1" isRegenerating={isRegenerating} isLightBrand={isLightBrand} />
          </div>
          <div className="mt-1 space-y-0.5">
            <InlineEditableText value={ad.headline} onSave={(v) => onUpdate("headline", v)} as="h3"
              className="text-[11px] font-bold leading-tight" style={{ color: c }} />
            <InlineEditableText value={ad.bodyCopy} onSave={(v) => onUpdate("bodyCopy", v)} as="p"
              className="text-[9px] leading-snug line-clamp-2" style={{ color: "#545454" }} />
            <span className="inline-block rounded px-1.5 py-0.5 text-[9px] font-bold text-white" style={{ background: c }}>
              {ad.cta}
            </span>
          </div>
        </div>
      </div>
      {/* More article text below */}
      <div className="space-y-1 bg-[#f9f9f9] px-3 pb-3">
        <div className="h-1.5 w-full rounded bg-gray-200" />
        <div className="h-1.5 w-full rounded bg-gray-200" />
        <div className="h-1.5 w-3/4 rounded bg-gray-200" />
      </div>
    </LaptopFrame>
  );
}

function LinkedInMockup({ ad, brand, isRegenerating, onUpdate, isLightBrand }: {
  ad: AdCreative; brand: BrandState; isRegenerating: boolean; onUpdate: (f: "headline" | "bodyCopy" | "cta", v: string) => void; isLightBrand?: boolean;
}) {
  const c = brand.colors.primary || "#6366F1";
  return (
    <MonitorFrame>
      {/* LinkedIn top bar */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-3 py-1.5">
        <svg width="16" height="14" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
        <div className="flex flex-1 items-center gap-1 rounded bg-[#EEF3F8] px-2 py-0.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          <span className="text-[8px] text-gray-400">Sök</span>
        </div>
      </div>
      {/* Feed card */}
      <div className="bg-[#F4F2EE] p-3">
        <div className="overflow-hidden rounded-lg bg-white" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
          {/* Post header */}
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: c }}>
              {brand.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold text-gray-900">{brand.name}</div>
              <div className="text-[8px] text-gray-400">Marknadsförd</div>
            </div>
            <MoreHorizontal className="h-4 w-4 text-gray-300" />
          </div>
          {/* Body text */}
          <div className="px-3 pb-2">
            <InlineEditableText value={ad.bodyCopy} onSave={(v) => onUpdate("bodyCopy", v)} as="p"
              className="text-[10px] leading-relaxed line-clamp-3" style={{ color: "#000" }} />
          </div>
          {/* Ad image */}
          <AdImageLayer ad={ad} primaryColor={c} aspectRatio="1.91/1" isRegenerating={isRegenerating} isLightBrand={isLightBrand} />
          {/* Link preview */}
          <div className="flex items-center justify-between bg-[#EEF3F8] px-3 py-2">
            <InlineEditableText value={ad.headline} onSave={(v) => onUpdate("headline", v)} as="h3"
              className="text-[10px] font-semibold" style={{ color: "#000" }} />
            <span className="shrink-0 rounded-full border border-[#0A66C2] px-2.5 py-0.5 text-[9px] font-bold text-[#0A66C2]">
              {ad.cta}
            </span>
          </div>
          {/* Reactions */}
          <div className="flex items-center gap-1 border-t border-gray-100 px-3 py-1">
            <span className="text-[10px]">👍💡</span>
            <span className="text-[8px] text-gray-400">23</span>
          </div>
          <div className="flex justify-around border-t border-gray-100 py-1.5 text-[9px] font-medium text-gray-500">
            <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> Gilla</span>
            <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> Kommentera</span>
            <span className="flex items-center gap-1"><Share2 className="h-3 w-3" /> Dela</span>
          </div>
        </div>
      </div>
    </MonitorFrame>
  );
}

// ── Ad Mockup Card ───────────────────────────────────────────────

function useMockupScale(
  containerRef: React.RefObject<HTMLDivElement | null>,
  mockupRef: React.RefObject<HTMLDivElement | null>,
  deps: unknown[],
) {
  const [scale, setScale] = useState(1);

  // Measure after DOM paint and recalculate
  useLayoutEffect(() => {
    function measure() {
      const container = containerRef.current;
      const mockup = mockupRef.current;
      if (!container || !mockup) return;
      // scrollHeight is NOT affected by CSS transform — gives us the natural content height
      const natural = mockup.scrollHeight;
      const available = container.clientHeight;
      if (natural > 0 && available > 0 && natural > available) {
        setScale(Math.max(0.5, available / natural));
      } else {
        setScale(1);
      }
    }
    // Measure immediately (sync, before paint)
    measure();
    // Measure again after a frame (images/fonts may have loaded)
    const raf1 = requestAnimationFrame(measure);
    // And once more after a short delay for any async content
    const timer = setTimeout(measure, 200);
    return () => { cancelAnimationFrame(raf1); clearTimeout(timer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return scale;
}

function AdMockupCard({ ad, brand, label, index, selected, platform, onToggle, onEdit }: {
  ad: AdCreative; brand: BrandState; label: string; index: number; selected: boolean; platform: Platform; onToggle: () => void; onEdit: () => void;
}) {
  const { updateAd } = useWizardStore();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const scale = useMockupScale(containerRef, mockupRef, [platform, ad.imageUrl]);

  function handleUpdate(field: "headline" | "bodyCopy" | "cta", value: string) { updateAd(ad.id, { [field]: value }); }

  function handleRegenerate() {
    setIsRegenerating(true);
    startTransition(async () => {
      try {
        const result = await generateAdImage(
          { id: `${ad.id}-regen-${Date.now()}`, headline: ad.headline, primaryText: ad.bodyCopy, brandName: brand.name, brandColor: brand.colors.primary, brandAccent: brand.colors.secondary },
          platform === "linkedin" ? "linkedin" : "meta-feed",
        );
        if (result?.imageUrl) updateAd(ad.id, { imageUrl: result.imageUrl });
      } catch (err) { console.error("[AdMockupCard] Regenerate failed:", err); }
      finally { setIsRegenerating(false); }
    });
  }

  const light = colorIsLight(brand.colors.primary || "#6366F1");
  const mockupProps = { ad, brand, isRegenerating, onUpdate: handleUpdate, isLightBrand: light };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: index * 0.15 }}
      className="flex w-full min-w-full flex-shrink-0 snap-center flex-col items-center gap-2 mx-auto md:min-w-0 md:w-auto md:flex-1">
      {/* Select toggle + strategy label + AI badge */}
      <div className="flex items-center gap-2">
        <motion.button onClick={onToggle} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1.5 text-[11px] font-semibold"
          style={{ padding: "5px 14px", borderRadius: 20, background: selected ? "#22c55e" : "transparent", color: selected ? "#fff" : "var(--color-text-muted)", border: selected ? "2px solid #22c55e" : "1px solid rgba(255,255,255,0.1)" }}>
          {selected && <Check className="h-3 w-3" />}{label}
        </motion.button>
        {index === 0 && (
          <span className="rounded-full text-[9px] font-medium" style={{ padding: "2px 8px", background: "rgba(99,102,241,0.1)", color: "var(--color-primary-light)" }}>
            ✦ AI-favorit
          </span>
        )}
        <span className="text-[10px] font-medium" style={{ color: "var(--color-text-muted)" }}>
          {getAngleLabel(ad.headline).label}
        </span>
      </div>

      {/* Device mockup — auto-scales to fit available height */}
      <div
        ref={containerRef}
        className="relative w-full cursor-pointer overflow-hidden"
        style={{
          height: "calc(100dvh - 280px)",
          maxHeight: 480,
          borderRadius: 14,
          border: selected ? "2px solid var(--color-primary)" : "2px solid transparent",
          background: selected ? "rgba(99,102,241,0.05)" : "transparent",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          transition: "border-color 200ms, background-color 200ms",
        }}
        onClick={onEdit}
      >
        {selected && (
          <div className="absolute -right-1 -top-1 z-40 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 shadow-lg">
            <Check className="h-3.5 w-3.5 text-white" />
          </div>
        )}
        <div
          ref={mockupRef}
          style={{
            transformOrigin: "top center",
            transform: `scale(${scale})`,
          }}
        >
          {platform === "instagram" && <InstagramMockup {...mockupProps} />}
          {platform === "facebook" && <FacebookMockup {...mockupProps} />}
          {platform === "google" && <GoogleMockup {...mockupProps} />}
          {platform === "linkedin" && <LinkedInMockup {...mockupProps} />}
        </div>
      </div>

      <motion.button onClick={handleRegenerate} disabled={isRegenerating} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        className="flex items-center gap-1.5 text-[11px] font-medium disabled:opacity-40"
        style={{ padding: "6px 14px", borderRadius: 8, background: "transparent", color: "var(--color-text-muted)", border: "1px solid var(--color-border-default)" }}>
        <RefreshCw className={`h-3 w-3 ${isRegenerating ? "animate-spin" : ""}`} />Generera ny bild
      </motion.button>
    </motion.div>
  );
}

// ── Platform Tab Switcher ────────────────────────────────────────

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram", facebook: "Facebook", google: "Google", linkedin: "LinkedIn",
};

function PlatformTabSwitcher({ active, onChange, brandColor }: { active: Platform; onChange: (p: Platform) => void; brandColor: string }) {
  const platforms: Platform[] = ["instagram", "facebook", "google", "linkedin"];
  return (
    <div className="flex items-center justify-center gap-1">
      {platforms.map((p) => {
        const Icon = PLATFORM_ICONS[p];
        const isActive = active === p;
        return (
          <motion.button
            key={p}
            onClick={() => onChange(p)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative flex items-center justify-center gap-1.5"
            style={{
              padding: isActive ? "6px 14px" : "6px 10px",
              borderRadius: 10,
              background: isActive ? "var(--color-bg-raised)" : "transparent",
              color: isActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
              border: isActive ? "1px solid var(--color-border-default)" : "1px solid transparent",
              opacity: isActive ? 1 : 0.4,
              transition: "opacity 200ms, background 200ms",
            }}
          >
            <Icon size={16} />
            {isActive && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                className="overflow-hidden whitespace-nowrap text-[11px] font-medium"
              >
                {PLATFORM_LABELS[p]}
              </motion.span>
            )}
            {isActive && (
              <motion.div
                layoutId="platform-underline"
                className="absolute -bottom-1 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full"
                style={{ background: brandColor }}
                transition={transitions.snappy}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────

export function AdViewSlide() {
  const { ads, selectedPlatforms, brand, isGeneratingAds, toggleAdSelection, setAds, setFooterAction, preGeneratedImageUrl } = useWizardStore();
  const { handleNext } = useWizardNavigation();
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<Platform>("instagram");

  const selectedCount = ads.filter((a) => a.selected).length;
  const adA = ads[0];
  const adB = ads[1];

  useEffect(() => {
    setFooterAction(() => handleNext(), selectedCount === 0);
    return () => setFooterAction(null);
  }, [selectedCount, handleNext, setFooterAction]);

  const handleRegenerate = useCallback(async () => {
    if (!brand) return;
    useWizardStore.getState().setIsGeneratingAds(true);
    try {
      const res = await fetch("/api/ad/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: { name: brand.name, description: brand.description, industry: brand.industry, targetAudience: brand.targetAudience, valuePropositions: brand.valuePropositions, url: brand.url, colors: brand.colors, fonts: brand.fonts }, platform: selectedPlatforms[0], language: "sv" }),
      });
      if (!res.ok) throw new Error("fail");
      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") continue;
          try {
            const d = JSON.parse(raw);
            if (d.event === "complete" && d.result?.copies) {
              const bgUrlA = d.result.backgroundUrl || preGeneratedImageUrl;
              const bgUrlB = d.result.backgroundUrlB || bgUrlA;
              setAds(d.result.copies.map((c: Record<string, string>, i: number) => ({
                id: `ad-${Date.now()}-${i}`, platform: selectedPlatforms[0], template: i === 0 ? ("hero" as const) : ("brand" as const),
                headline: c.headline || "", bodyCopy: c.bodyCopy || "", cta: c.cta || "Läs mer", imageUrl: i === 0 ? bgUrlA : bgUrlB, selected: i === 0,
              })));
            }
          } catch { /* partial chunk */ }
        }
      }
    } catch (e) { console.error(e); } finally { useWizardStore.getState().setIsGeneratingAds(false); }
  }, [brand, selectedPlatforms, preGeneratedImageUrl, setAds]);

  if (isGeneratingAds) return <AdGenerationLoading brand={brand} />;
  if (!brand) return null;

  if (ads.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={transitions.spring}
        className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <p style={{ color: "var(--color-text-secondary)" }}>Annonserna kunde inte genereras.</p>
        <motion.button onClick={handleRegenerate} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="cta-primary" style={{ padding: "10px 24px", fontSize: 14 }}>Försök igen</motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="flex flex-col gap-3">

      {/* Value delivery heading */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center"
      >
        <h2 className="text-text-h1" style={{ color: "var(--color-text-primary)" }}>
          Dina annonser är klara!
        </h2>
        <p className="mt-1 text-[13px]" style={{ color: "var(--color-text-muted)" }}>
          Välj din favorit — vi publicerar den som primär annons. Klicka på en annons för att redigera.
        </p>
      </motion.div>

      {/* Platform tab switcher */}
      <PlatformTabSwitcher active={activePlatform} onChange={setActivePlatform} brandColor={brand.colors.primary || "#6366F1"} />

      {/* A/B cards — 300ms crossfade on platform switch */}
      <AnimatePresence mode="wait">
        <motion.div key={activePlatform} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}>
          {/* Mobile: horizontal snap-scroll, one card at a time */}
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 scrollbar-none md:gap-6 md:overflow-visible">
            {adA && (
              <AdMockupCard ad={adA} brand={brand} label="Välj A" index={0} selected={adA.selected} platform={activePlatform}
                onToggle={() => toggleAdSelection(adA.id)} onEdit={() => setEditingAdId(adA.id)} />
            )}
            {adA && adB && (
              <div className="hidden flex-col items-center justify-center md:flex" style={{ minWidth: 1 }}>
                <div className="h-full w-px" style={{ background: "var(--color-border-default)" }} />
              </div>
            )}
            {adB && (
              <AdMockupCard ad={adB} brand={brand} label="Välj B" index={1} selected={adB.selected} platform={activePlatform}
                onToggle={() => toggleAdSelection(adB.id)} onEdit={() => setEditingAdId(adB.id)} />
            )}
          </div>
          {/* Swipe dots — mobile only */}
          {adB && (
            <div className="mt-2 flex justify-center gap-1.5 md:hidden">
              <div className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-text-muted)", opacity: 0.8 }} />
              <div className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-text-muted)", opacity: 0.3 }} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Regenerate all */}
      <div className="flex justify-center">
        <motion.button
          onClick={handleRegenerate}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-1.5 text-[11px] font-medium"
          style={{ padding: "6px 14px", borderRadius: 8, color: "var(--color-text-muted)", border: "1px solid var(--color-border-default)" }}
        >
          <RefreshCw className="h-3 w-3" />
          Generera om allt
        </motion.button>
      </div>

      <AdEditModal adId={editingAdId} onClose={() => setEditingAdId(null)} />
    </motion.div>
  );
}
