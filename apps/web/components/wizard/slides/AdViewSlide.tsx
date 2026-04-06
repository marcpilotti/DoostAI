"use client";

/**
 * AdViewSlide — Focus + Detail Panel layout.
 *
 * Left: single device mockup (read-only) + A/B toggle + upload background.
 * Right: large editable text panel (headline 32px, body 16px, CTA preview).
 * Platform tabs at top filter to only selected platforms.
 */

import { Globe, MessageCircle, MoreHorizontal, RefreshCw, Share2, ThumbsUp, Upload } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";

import { generateAdImage } from "@/app/actions/generate-ad-image";
import { useWizardNavigation } from "@/hooks/use-wizard-navigation";
import { transitions } from "@/lib/motion";
import type { AdCreative } from "@/lib/stores/wizard-store";
import { useWizardStore } from "@/lib/stores/wizard-store";

import { AdGenerationLoading } from "../shared/AdGenerationLoading";

// ── Types & Constants ───────────────────────────────────────────

type DisplayPlatform = "instagram" | "facebook" | "google" | "linkedin";
type BrandState = NonNullable<ReturnType<typeof useWizardStore.getState>["brand"]>;

const STORE_TO_DISPLAY: Record<string, DisplayPlatform[]> = {
  meta: ["instagram", "facebook"],
  google: ["google"],
  linkedin: ["linkedin"],
};

const DISPLAY_PLATFORM_LIMITS: Record<DisplayPlatform, { headline: number; bodyCopy: number; label: string }> = {
  instagram: { headline: 40, bodyCopy: 125, label: "Meta" },
  facebook: { headline: 40, bodyCopy: 125, label: "Meta" },
  google: { headline: 30, bodyCopy: 90, label: "Google" },
  linkedin: { headline: 70, bodyCopy: 150, label: "LinkedIn" },
};

const CTA_OPTIONS = [
  "Läs mer", "Kontakta oss", "Handla nu", "Boka nu", "Registrera dig",
  "Få offert", "Testa gratis", "Kom igång", "Se mer", "Ring oss",
];

function colorIsLight(hex: string): boolean {
  const h = hex.replace("#", "");
  if (h.length < 6) return false;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55;
}

function brandSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "").replace(/[^a-zåäö0-9]/g, "");
}

// ── Platform Icons ──────────────────────────────────────────────

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

const PLATFORM_ICONS: Record<DisplayPlatform, React.ComponentType<{ size?: number }>> = {
  instagram: InstagramIcon, facebook: FacebookIcon, google: GoogleIcon, linkedin: LinkedInIcon,
};

const PLATFORM_LABELS: Record<DisplayPlatform, string> = {
  instagram: "Instagram", facebook: "Facebook", google: "Google", linkedin: "LinkedIn",
};

// ── Ad Image Layer ──────────────────────────────────────────────

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

// ── Device Frames ───────────────────────────────────────────────

function IPhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative" style={{ width: 420, height: 849 }}>
      {/* Screen area – matches Figma iPhone 14 (376×814, 32px corners) */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden bg-black"
        style={{ width: 376, height: 814, borderRadius: 32 }}
      >
        {children}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/mockups/iphone-14-frame.png" alt="" className="pointer-events-none absolute inset-0 h-full w-full" />
    </div>
  );
}

function LaptopFrame({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="overflow-hidden" style={{ borderRadius: "8px 8px 0 0", background: "#2D2D2D", padding: "3px 3px 0", boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}>
        <div className="overflow-hidden" style={{ borderRadius: "6px 6px 0 0", background: "#fff" }}>{children}</div>
      </div>
      <div className="mx-auto" style={{ width: "110%", maxWidth: "100%", height: 10, background: "linear-gradient(to bottom, #C0C0C0, #A0A0A0)", borderRadius: "0 0 4px 4px" }} />
      <div className="mx-auto" style={{ width: "40%", height: 3, background: "#B0B0B0", borderRadius: "0 0 2px 2px" }} />
    </div>
  );
}

function MonitorFrame({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="overflow-hidden" style={{ borderRadius: 8, background: "#1C1C1E", padding: 3, boxShadow: "0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)" }}>
        <div className="overflow-hidden" style={{ borderRadius: 5, background: "#fff" }}>{children}</div>
      </div>
      <div className="mx-auto" style={{ width: 40, height: 18, background: "linear-gradient(to bottom, #C0C0C0, #A0A0A0)" }} />
      <div className="mx-auto" style={{ width: 70, height: 4, background: "#A0A0A0", borderRadius: 2 }} />
    </div>
  );
}

// ── Read-Only Platform Mockups ──────────────────────────────────

function InstagramMockup({ ad, brand, isRegenerating, isLightBrand }: {
  ad: AdCreative; brand: BrandState; isRegenerating: boolean; isLightBrand?: boolean;
}) {
  const c = brand.colors.primary || "#6366F1";
  const slug = brandSlug(brand.name);
  return (
    <IPhoneFrame>
      <div className="flex h-full flex-col bg-white">
        {/* Notch clearance */}
        <div className="h-[50px] shrink-0" />

        {/* Header (Figma: 60px) */}
        <div className="flex h-[60px] shrink-0 items-center px-3">
          <div className="flex flex-1 items-center gap-2.5 overflow-hidden">
            <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white" style={{ background: c }}>
              {brand.name.charAt(0)}
            </div>
            <div className="flex min-w-0 flex-col gap-px">
              <span className="truncate text-[14px] font-semibold leading-normal text-[#262626]">{slug}</span>
              <span className="text-[12px] leading-[20px] text-[#262626]">Sponsrad</span>
            </div>
          </div>
          <svg width="13" height="3" viewBox="0 0 13 3" fill="#000" className="shrink-0">
            <path fillRule="evenodd" clipRule="evenodd" d="M1.5 0C.67 0 0 .67 0 1.5S.67 3 1.5 3 3 2.33 3 1.5 2.33 0 1.5 0zm5 0C5.67 0 5 .67 5 1.5S5.67 3 6.5 3 8 2.33 8 1.5 7.33 0 6.5 0zm5 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5S13 2.33 13 1.5 12.33 0 11.5 0z" />
          </svg>
        </div>

        {/* Post image — 1:1, with headline overlay */}
        <div className="relative shrink-0">
          <AdImageLayer ad={ad} primaryColor={c} aspectRatio="1/1" isRegenerating={isRegenerating} isLightBrand={isLightBrand} />
          {ad.headline && (
            <div className="absolute inset-x-0 bottom-0 z-10 p-4">
              <h3 className="text-[16px] font-bold leading-tight text-white" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>
                {ad.headline}
              </h3>
            </div>
          )}
        </div>

        {/* CTA bar (Figma: 41px, dark) */}
        <div className="flex h-[41px] shrink-0 items-center justify-between bg-[#262626] px-4">
          <span className="text-[14px] font-medium tracking-[0.57px] text-[#fafafa]">{ad.cta}</span>
          <svg width="7" height="14" viewBox="0 0 7 14" fill="white"><path fillRule="evenodd" clipRule="evenodd" d="M4.66 7L.08 1.56A.4.4 0 01.09 1.06l.82-.96A.4.4 0 011.33.1L6.92 6.75a.36.36 0 01-.01.5L1.33 13.9a.4.4 0 01-.42 0L.09 12.94a.4.4 0 010-.5L4.66 7z" /></svg>
        </div>

        {/* Icons row (Figma: 48px) */}
        <div className="relative flex h-[48px] shrink-0 items-center px-3">
          <div className="flex items-center gap-[18px]">
            {/* Heart */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M17.3 3.05c2.85 0 5.2 2.6 5.2 5.75 0 3.4-2.95 5.5-5.75 8s-3.25 3.85-4.75 4.15c-.55-.35-2.35-2-4.75-4.15-2.85-2.5-5.75-4.6-5.75-8 0-3.15 2.35-5.75 5.2-5.75 2.1 0 3.25 1 4.05 2.15.95 1.3 1.1 1.95 1.25 1.95s.3-.65 1.25-1.95c.8-1.15 1.95-2.15 4.05-2.15zm0-1.5c-2.25 0-3.95.9-5.3 2.8-1.35-1.85-3.05-2.75-5.3-2.75C3 1.55 0 4.8 0 8.8c0 3.65 2.7 6 5.3 8.25.3.25.65.55.95.85l1.15 1c2.2 1.95 3.3 2.95 3.8 3.25.25.15.55.25.8.25.3 0 .55-.1.8-.25.5-.3 1.4-1.1 3.9-3.4l1-.9c.35-.3.65-.6 1-.85C21.35 14.8 24 12.5 24 8.8c0-4-3-7.25-6.7-7.25z" fill="#262626" /></svg>
            {/* Comment */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M23.75 23.05l-1.4-5.5c.9-1.65 1.4-3.55 1.4-5.55 0-6.5-5.25-11.75-11.75-11.75S.25 5.5.25 12 5.5 23.75 12 23.75c2 0 3.9-.5 5.55-1.4l5.5 1.4c.4.1.8-.3.7-.7zM22.25 12c0 2-.5 3.5-1.3 5-.1.2-.15.45-.1.7l1.05 4.2-4.15-1.05c-.25-.05-.5-.05-.7.1-.9.5-2.6 1.3-5 1.3-5.7 0-10.3-4.6-10.3-10.25S6.35 1.75 12 1.75 22.25 6.35 22.25 12z" fill="#262626" /></svg>
            {/* Share (paper plane) */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M23.9 1.9a.74.74 0 00-.65-.4H.75c-.3.05-.6.25-.7.5-.1.25-.05.6.15.85l7.95 7.8 2.75 11.3c.05.3.3.5.6.55h.1c.25 0 .5-.15.65-.35l11.6-19.5c.2-.2.2-.5.05-.75zM2.6 3.05h17.75L9 9.35 2.6 3.05zm9.35 16.8L9.75 10.65 21.2 4.3 11.95 19.85z" fill="#262626" /></svg>
          </div>
          {/* Bookmark */}
          <svg className="absolute right-3 top-3" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21.25 24c-.2 0-.4-.1-.55-.2L11.5 14.5 2.3 23.8c-.2.2-.55.3-.8.15-.3-.1-.5-.4-.5-.7V.75C1 .35 1.35 0 1.75 0h19.5c.4 0 .75.35.75.75v22.5c0 .3-.2.6-.45.7-.1.05-.2.05-.3.05zM11.5 13c.4 0 .8.15 1.1.45l7.9 8V1.5h-18v19.95l7.9-8c.3-.3.7-.45 1.1-.45z" fill="#262626" /></svg>
        </div>

        {/* Caption */}
        <div className="shrink-0 px-3 pb-3">
          <p className="text-[13px] font-medium text-[#262626]">142 gillamarkeringar</p>
          <p className="mt-1 text-[13px] leading-[18px] text-[#262626]">
            <span className="font-semibold">{slug}</span>{" "}{ad.bodyCopy}
          </p>
        </div>
      </div>
    </IPhoneFrame>
  );
}

function FacebookMockup({ ad, brand, isRegenerating, isLightBrand }: {
  ad: AdCreative; brand: BrandState; isRegenerating: boolean; isLightBrand?: boolean;
}) {
  const c = brand.colors.primary || "#6366F1";
  const domain = brand.url?.replace(/^https?:\/\//, "").replace(/\/$/, "") || "example.com";
  return (
    <IPhoneFrame>
      <div className="flex h-full flex-col bg-white">
        {/* Notch clearance */}
        <div className="h-[50px] shrink-0" />

        {/* Header */}
        <div className="shrink-0 px-3 pb-0 pt-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white" style={{ background: c, border: "1px solid #e5e5e5" }}>
              {brand.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold leading-[20px] text-[#050505]">{brand.name}</div>
              <div className="flex items-center gap-1.5 text-[14px] leading-[18px] text-[#65676b]">
                Sponsrad · <Globe className="inline h-[11px] w-[11px]" />
              </div>
            </div>
            <svg width="13" height="3" viewBox="0 0 13 3" fill="#65676b" className="shrink-0">
              <path fillRule="evenodd" clipRule="evenodd" d="M1.5 0C.67 0 0 .67 0 1.5S.67 3 1.5 3 3 2.33 3 1.5 2.33 0 1.5 0zm5 0C5.67 0 5 .67 5 1.5S5.67 3 6.5 3 8 2.33 8 1.5 7.33 0 6.5 0zm5 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5S13 2.33 13 1.5 12.33 0 11.5 0z" />
            </svg>
          </div>
          {/* Primary text */}
          <p className="mt-3 text-[15px] leading-[20px] text-[#050505]">{ad.bodyCopy}</p>
        </div>

        {/* Post image — 1:1 */}
        <div className="mt-3 shrink-0">
          <AdImageLayer ad={ad} primaryColor={c} aspectRatio="1/1" isRegenerating={isRegenerating} isLightBrand={isLightBrand} />
        </div>

        {/* CTA section (Figma: grey bg) */}
        <div className="flex shrink-0 items-center gap-3 bg-[#f0f2f5] px-3.5 py-1.5">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] uppercase leading-[16px] tracking-tight text-[#65676b]">{domain}</p>
            <p className="truncate text-[17px] font-semibold leading-[20px] text-[#050505]">{ad.headline}</p>
          </div>
          <div className="shrink-0 rounded-md bg-[#e4e6ea] px-3 py-1.5 text-[15px] font-semibold text-[#050505]">
            {ad.cta}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-4 pt-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex -space-x-0.5 text-[14px]"><span>👍</span><span>❤️</span></span>
              <span className="text-[15px] leading-[20px] text-[#65676b]">48</span>
            </div>
            <span className="text-[15px] leading-[20px] text-[#65676b]">2 kommentarer</span>
          </div>
          <div className="my-2.5 h-px bg-[#ced0d4]" />
          <div className="flex items-center justify-between pb-2">
            <span className="flex items-center gap-1.5 text-[15px] font-semibold text-[#65676b]"><ThumbsUp className="h-5 w-5" /> Gilla</span>
            <span className="flex items-center gap-1.5 text-[15px] font-semibold text-[#65676b]"><MessageCircle className="h-5 w-5" /> Kommentera</span>
            <span className="flex items-center gap-1.5 text-[15px] font-semibold text-[#65676b]"><Share2 className="h-5 w-5" /> Dela</span>
          </div>
        </div>
      </div>
    </IPhoneFrame>
  );
}

function GoogleMockup({ ad, brand }: {
  ad: AdCreative; brand: BrandState; isRegenerating: boolean; isLightBrand?: boolean;
}) {
  const url = brand.url?.replace(/^https?:\/\//, "") || "example.com";
  return (
    <LaptopFrame>
      {/* Chrome-style browser bar */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-[#DEE1E6] px-3 py-1.5">
        <div className="flex gap-1"><div className="h-2 w-2 rounded-full bg-[#FF5F57]" /><div className="h-2 w-2 rounded-full bg-[#FEBC2E]" /><div className="h-2 w-2 rounded-full bg-[#28C840]" /></div>
        <div className="flex flex-1 items-center gap-1.5 rounded-md bg-white px-2 py-0.5" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          <span className="truncate text-[8px] text-gray-500">{brand.name?.toLowerCase().replace(/\s+/g, "+")}</span>
        </div>
      </div>

      {/* Google Search results page */}
      <div className="bg-white px-4 py-3">
        {/* Google logo + search bar */}
        <div className="mb-3 flex items-center gap-2">
          <svg width="44" height="16" viewBox="0 0 272 92" fill="none">
            <text x="0" y="72" fontSize="72" fontWeight="bold" fontFamily="arial">
              <tspan fill="#4285F4">G</tspan><tspan fill="#EA4335">o</tspan><tspan fill="#FBBC05">o</tspan><tspan fill="#4285F4">g</tspan><tspan fill="#34A853">l</tspan><tspan fill="#EA4335">e</tspan>
            </text>
          </svg>
          <div className="flex flex-1 items-center rounded-full bg-white px-3 py-1" style={{ border: "1px solid #dfe1e5", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <span className="truncate text-[9px] text-gray-700">{brand.name?.toLowerCase()}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-3 flex gap-3 border-b border-gray-200 pb-1.5">
          <span className="border-b-2 border-[#1A73E8] pb-1 text-[8px] font-medium text-[#1A73E8]">Alla</span>
          <span className="text-[8px] text-gray-500">Bilder</span>
          <span className="text-[8px] text-gray-500">Kartor</span>
          <span className="text-[8px] text-gray-500">Nyheter</span>
        </div>

        {/* Sponsored result (THE AD) */}
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="rounded text-[7px] font-bold text-[#202124] px-1 py-0.5" style={{ border: "1px solid #dadce0" }}>Sponsrad</span>
            <div className="flex items-center gap-1">
              <div className="flex h-4 w-4 items-center justify-center rounded-full text-[6px] font-bold text-white" style={{ background: brand.colors.primary || "#6366F1" }}>
                {brand.name?.charAt(0)}
              </div>
              <span className="text-[9px] text-[#202124]">{brand.name}</span>
            </div>
          </div>
          <div className="text-[8px] text-[#4D5156] mb-0.5">{url}</div>
          <h3 className="text-[13px] font-normal leading-tight text-[#1A0DAB] mb-0.5">{ad.headline}</h3>
          <p className="text-[9px] leading-snug text-[#4D5156] line-clamp-2">{ad.bodyCopy}</p>
        </div>

        {/* Organic results (grey placeholders) */}
        <div className="space-y-3 opacity-50">
          <div>
            <div className="mb-0.5 flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-gray-200" />
              <div className="h-1.5 w-24 rounded bg-gray-200" />
            </div>
            <div className="h-2 w-3/4 rounded bg-gray-200 mb-0.5" />
            <div className="space-y-0.5">
              <div className="h-1.5 w-full rounded bg-gray-100" />
              <div className="h-1.5 w-5/6 rounded bg-gray-100" />
            </div>
          </div>
          <div>
            <div className="mb-0.5 flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-gray-200" />
              <div className="h-1.5 w-20 rounded bg-gray-200" />
            </div>
            <div className="h-2 w-2/3 rounded bg-gray-200 mb-0.5" />
            <div className="space-y-0.5">
              <div className="h-1.5 w-full rounded bg-gray-100" />
              <div className="h-1.5 w-4/5 rounded bg-gray-100" />
            </div>
          </div>
        </div>
      </div>
    </LaptopFrame>
  );
}

function LinkedInMockup({ ad, brand, isRegenerating, isLightBrand }: {
  ad: AdCreative; brand: BrandState; isRegenerating: boolean; isLightBrand?: boolean;
}) {
  const c = brand.colors.primary || "#6366F1";
  return (
    <MonitorFrame>
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-3 py-1.5">
        <svg width="16" height="14" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
        <div className="flex flex-1 items-center gap-1 rounded bg-[#EEF3F8] px-2 py-0.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          <span className="text-[8px] text-gray-400">Sök</span>
        </div>
      </div>
      <div className="bg-[#F4F2EE] p-3">
        <div className="overflow-hidden rounded-lg bg-white" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
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
          <div className="px-3 pb-2">
            <p className="text-[10px] leading-relaxed line-clamp-3" style={{ color: "#000" }}>{ad.bodyCopy}</p>
          </div>
          <AdImageLayer ad={ad} primaryColor={c} aspectRatio="1.91/1" isRegenerating={isRegenerating} isLightBrand={isLightBrand} />
          <div className="flex items-center justify-between bg-[#EEF3F8] px-3 py-2">
            <h3 className="text-[10px] font-semibold" style={{ color: "#000" }}>{ad.headline}</h3>
            <span className="shrink-0 rounded-full border border-[#0A66C2] px-2.5 py-0.5 text-[9px] font-bold text-[#0A66C2]">
              {ad.cta}
            </span>
          </div>
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

// ── Mockup Scale Hook ───────────────────────────────────────────

function useMockupScale(
  containerRef: React.RefObject<HTMLDivElement | null>,
  mockupRef: React.RefObject<HTMLDivElement | null>,
  deps: unknown[],
) {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    function measure() {
      const container = containerRef.current;
      const mockup = mockupRef.current;
      if (!container || !mockup) return;
      const naturalH = mockup.scrollHeight;
      const naturalW = mockup.scrollWidth;
      const availH = container.clientHeight;
      const availW = container.clientWidth;
      let s = 1;
      if (naturalH > 0 && availH > 0 && naturalH > availH) s = Math.min(s, availH / naturalH);
      if (naturalW > 0 && availW > 0 && naturalW > availW) s = Math.min(s, availW / naturalW);
      setScale(Math.max(0.4, s));
    }
    measure();
    const raf1 = requestAnimationFrame(measure);
    const timer = setTimeout(measure, 200);
    return () => { cancelAnimationFrame(raf1); clearTimeout(timer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return scale;
}

// ── Platform Tab Switcher ───────────────────────────────────────

function PlatformTabSwitcher({ active, onChange, availablePlatforms }: {
  active: DisplayPlatform; onChange: (p: DisplayPlatform) => void; availablePlatforms: DisplayPlatform[];
}) {
  return (
    <div className="flex items-center justify-center gap-1">
      {availablePlatforms.map((p) => {
        const Icon = PLATFORM_ICONS[p];
        const isActive = active === p;
        return (
          <motion.button key={p} onClick={() => onChange(p)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="relative flex items-center justify-center gap-1.5"
            style={{
              padding: isActive ? "6px 14px" : "6px 10px", borderRadius: 10,
              background: isActive ? "var(--color-bg-raised)" : "transparent",
              color: isActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
              border: isActive ? "1px solid var(--color-border-default)" : "1px solid transparent",
              opacity: isActive ? 1 : 0.4, transition: "opacity 200ms, background 200ms",
            }}
          >
            <Icon size={16} />
            {isActive && (
              <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }}
                className="overflow-hidden whitespace-nowrap text-[11px] font-medium">
                {PLATFORM_LABELS[p]}
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

// ── A/B Toggle Pill ─────────────────────────────────────────────

function ABTogglePill({ activeVariant, onSwitch }: {
  activeVariant: "A" | "B"; onSwitch: (v: "A" | "B") => void;
}) {
  return (
    <div className="flex gap-0.5 rounded-[10px] p-[3px]" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
      {(["A", "B"] as const).map((v) => (
        <motion.button key={v} onClick={() => onSwitch(v)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="relative px-5 py-1.5 text-[12px] font-semibold transition-all duration-200"
          style={{
            borderRadius: 8,
            background: activeVariant === v ? "rgba(255,255,255,0.08)" : "transparent",
            color: activeVariant === v ? "#fff" : "rgba(255,255,255,0.35)",
          }}
        >
          {v}
        </motion.button>
      ))}
    </div>
  );
}

// ── Upload Background Button ────────────────────────────────────

function UploadBackgroundButton({ adId }: { adId: string }) {
  const { updateAd } = useWizardStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateAd(adId, { imageUrl: reader.result as string });
    reader.readAsDataURL(file);
  }, [adId, updateAd]);

  return (
    <>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      <motion.button
        onClick={() => fileInputRef.current?.click()}
        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        className="flex items-center gap-1.5 text-[11px] font-medium"
        style={{ padding: "6px 14px", borderRadius: 8, color: "var(--color-text-muted)", border: "1px solid var(--color-border-default)" }}
      >
        <Upload className="h-3 w-3" /> Byt bakgrund
      </motion.button>
    </>
  );
}

// ── Character Count ─────────────────────────────────────────────

function CharCount({ current, max }: { current: number; max: number }) {
  const over = current > max;
  return (
    <span className="text-[10px] font-medium" style={{ color: over ? "var(--color-error, #ef4444)" : "rgba(255,255,255,0.2)" }}>
      {current}/{max}
    </span>
  );
}

// ── Detail Panel ────────────────────────────────────────────────

function DetailPanel({ ad, platform, onRegenerate, onRegenerateAll, isRegenerating }: {
  ad: AdCreative; platform: DisplayPlatform; onRegenerate: () => void; onRegenerateAll: () => void; isRegenerating: boolean;
}) {
  const { updateAd } = useWizardStore();
  const limits = DISPLAY_PLATFORM_LIMITS[platform];
  const [headline, setHeadline] = useState(ad.headline);
  const [bodyCopy, setBodyCopy] = useState(ad.bodyCopy);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => { setHeadline(ad.headline); }, [ad.headline]);
  useEffect(() => { setBodyCopy(ad.bodyCopy); }, [ad.bodyCopy]);

  function commitHeadline() { if (headline.trim() !== ad.headline) { updateAd(ad.id, { headline: headline.trim() }); setJustSaved(true); setTimeout(() => setJustSaved(false), 1200); } }
  function commitBody() { if (bodyCopy.trim() !== ad.bodyCopy) { updateAd(ad.id, { bodyCopy: bodyCopy.trim() }); setJustSaved(true); setTimeout(() => setJustSaved(false), 1200); } }

  return (
    <div className="relative flex flex-1 flex-col gap-6 py-4 md:py-0">
      <AnimatePresence>
        {justSaved && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[11px]"
            style={{ color: "var(--color-success)", position: "absolute", top: 8, right: 12 }}
          >
            ✓ Sparat
          </motion.span>
        )}
      </AnimatePresence>
      {/* Headline */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>Rubrik</span>
          <CharCount current={headline.length} max={limits.headline} />
        </div>
        <textarea
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          onBlur={commitHeadline}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitHeadline(); (e.target as HTMLTextAreaElement).blur(); } }}
          rows={1}
          className="w-full resize-none rounded-lg border border-transparent bg-transparent px-2 py-1 text-[28px] font-extrabold leading-tight tracking-tight text-white transition-colors focus:border-white/10 focus:bg-white/[0.02] focus:outline-none hover:border-white/10 hover:bg-white/[0.02] md:text-[32px]"
          style={{ letterSpacing: "-0.03em" }}
        />
        <p className="mt-1 pl-2 text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
          Klicka för att redigera · {limits.label}: max {limits.headline} tecken
        </p>
      </div>

      {/* Body */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>Brödtext</span>
          <CharCount current={bodyCopy.length} max={limits.bodyCopy} />
        </div>
        <textarea
          value={bodyCopy}
          onChange={(e) => setBodyCopy(e.target.value)}
          onBlur={commitBody}
          rows={2}
          className="w-full resize-none rounded-lg border border-transparent bg-transparent px-2 py-1 text-[15px] leading-relaxed transition-colors focus:border-white/10 focus:bg-white/[0.02] focus:outline-none hover:border-white/10 hover:bg-white/[0.02] md:text-[16px]"
          style={{ color: "rgba(255,255,255,0.6)" }}
        />
      </div>

      {/* CTA */}
      <div>
        <span className="mb-2 block text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>
          Call to action
        </span>
        <div className="flex flex-wrap gap-2">
          {CTA_OPTIONS.map((opt) => (
            <motion.button key={opt} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => updateAd(ad.id, { cta: opt })}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "5px 12px",
                borderRadius: "9999px",
                fontSize: 13,
                fontWeight: 500,
                whiteSpace: "nowrap" as const,
                transition: "all 150ms ease",
                background: ad.cta === opt ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.08)",
                color: ad.cta === opt ? "var(--color-primary-light, #A5B4FC)" : "var(--color-text-secondary)",
                border: ad.cta === opt ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(99,102,241,0.15)",
              }}
            >
              {opt}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <motion.button onClick={onRegenerate} disabled={isRegenerating} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="flex items-center gap-1.5 text-[11px] font-medium disabled:opacity-40"
          style={{ padding: "6px 14px", borderRadius: 8, color: "var(--color-text-muted)", border: "1px solid var(--color-border-default)" }}>
          <RefreshCw className={`h-3 w-3 ${isRegenerating ? "animate-spin" : ""}`} /> Ny bild
        </motion.button>
        <motion.button onClick={onRegenerateAll} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="flex items-center gap-1.5 text-[11px] font-medium"
          style={{ padding: "6px 14px", borderRadius: 8, color: "var(--color-text-muted)", border: "1px solid var(--color-border-default)" }}>
          <RefreshCw className="h-3 w-3" /> Generera om
        </motion.button>
      </div>
    </div>
  );
}

// ── Mockup Renderer ─────────────────────────────────────────────

function MockupRenderer({ ad, brand, platform, isRegenerating }: {
  ad: AdCreative; brand: BrandState; platform: DisplayPlatform; isRegenerating: boolean;
}) {
  const light = colorIsLight(brand.colors.primary || "#6366F1");
  const props = { ad, brand, isRegenerating, isLightBrand: light };
  switch (platform) {
    case "instagram": return <InstagramMockup {...props} />;
    case "facebook": return <FacebookMockup {...props} />;
    case "google": return <GoogleMockup {...props} />;
    case "linkedin": return <LinkedInMockup {...props} />;
  }
}

// ── Main Component ──────────────────────────────────────────────

export function AdViewSlide() {
  const { ads, selectedPlatforms, brand, isGeneratingAds, toggleAdSelection, setAds, setFooterAction, preGeneratedImageUrl } = useWizardStore();
  const { handleNext } = useWizardNavigation();
  const [activeVariant, setActiveVariant] = useState<"A" | "B">("A");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [mobileEditOpen, setMobileEditOpen] = useState(false);
  const [, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);

  const adA = ads[0];
  const adB = ads[1];
  const activeAd = activeVariant === "A" ? adA : adB;
  const selectedCount = ads.filter((a) => a.selected).length;

  // Derive available display platforms from store's selectedPlatforms
  const availableDisplayPlatforms = useMemo(() => {
    const result: DisplayPlatform[] = [];
    for (const sp of selectedPlatforms) {
      const mapped = STORE_TO_DISPLAY[sp];
      if (mapped) result.push(...mapped);
    }
    return result.length > 0 ? result : ["instagram" as DisplayPlatform];
  }, [selectedPlatforms]);

  const [activePlatform, setActivePlatform] = useState<DisplayPlatform>(availableDisplayPlatforms[0] ?? ("instagram" as DisplayPlatform));

  // Keep activePlatform in sync if available platforms change
  useEffect(() => {
    if (!availableDisplayPlatforms.includes(activePlatform)) {
      setActivePlatform(availableDisplayPlatforms[0] ?? ("instagram" as DisplayPlatform));
    }
  }, [availableDisplayPlatforms, activePlatform]);

  const scale = useMockupScale(containerRef, mockupRef, [activePlatform, activeAd?.imageUrl]);

  // Footer action
  useEffect(() => {
    setFooterAction(() => handleNext(), selectedCount === 0);
    return () => setFooterAction(null);
  }, [selectedCount, handleNext, setFooterAction]);

  // Switch variant and select it
  function handleVariantSwitch(v: "A" | "B") {
    setActiveVariant(v);
    const ad = v === "A" ? adA : adB;
    if (ad && !ad.selected) toggleAdSelection(ad.id);
  }

  // Regenerate single image
  function handleRegenerateImage() {
    if (!activeAd || !brand) return;
    setIsRegenerating(true);
    startTransition(async () => {
      try {
        const result = await generateAdImage(
          { id: `${activeAd.id}-regen-${Date.now()}`, headline: activeAd.headline, primaryText: activeAd.bodyCopy, brandName: brand.name, brandColor: brand.colors.primary, brandAccent: brand.colors.secondary },
          activePlatform === "linkedin" ? "linkedin" : "meta-feed",
        );
        if (result?.imageUrl) useWizardStore.getState().updateAd(activeAd.id, { imageUrl: result.imageUrl });
      } catch (err) { console.error("[AdViewSlide] Regenerate failed:", err); }
      finally { setIsRegenerating(false); }
    });
  }

  // Regenerate all
  const handleRegenerateAll = useCallback(async () => {
    if (!brand) return;
    useWizardStore.getState().setIsGeneratingAds(true);
    try {
      const res = await fetch("/api/ad/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: { name: brand.name, description: brand.description, industry: brand.industry, targetAudience: brand.targetAudience, valuePropositions: brand.valuePropositions, url: brand.url, colors: brand.colors, fonts: brand.fonts }, platform: selectedPlatforms[0] ?? "meta", language: "sv" }),
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
                id: `ad-${Date.now()}-${i}`, platform: selectedPlatforms[0] ?? "meta", template: i === 0 ? ("hero" as const) : ("brand" as const),
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
        <motion.button onClick={handleRegenerateAll} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="cta-primary" style={{ padding: "10px 24px", fontSize: 14 }}>Försök igen</motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="flex flex-col gap-4">

      {/* Heading */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="text-center">
        <h2 className="text-text-h1" style={{ color: "var(--color-text-primary)" }}>Dina annonser är klara!</h2>
        <p className="mt-1 text-[13px]" style={{ color: "var(--color-text-muted)" }}>
          Klicka på texten för att redigera direkt.
        </p>
      </motion.div>

      {/* Platform tabs */}
      <PlatformTabSwitcher active={activePlatform} onChange={setActivePlatform} availablePlatforms={availableDisplayPlatforms} />

      {/* Split layout: mockup left, detail panel right */}
      <div className="flex flex-col gap-6 md:flex-row md:gap-8">

        {/* Left column: device mockup + A/B toggle + upload */}
        <div className="flex flex-col items-center gap-3 max-w-full md:max-w-[340px] md:mx-0" style={{ width: "100%", flexShrink: 0 }}>
          <div
            className="w-full cursor-pointer md:cursor-default"
            onClick={() => {
              if (window.innerWidth < 768) setMobileEditOpen(true);
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activePlatform}-${activeVariant}`}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25 }}
                className="w-full"
              >
                <div
                  ref={containerRef}
                  className="relative flex w-full justify-center overflow-hidden"
                  style={{ height: "calc(100dvh - 300px)", maxHeight: 580 }}
                >
                  <div ref={mockupRef} className="shrink-0" style={{ transformOrigin: "top center", transform: `scale(${scale})` }}>
                    {activeAd && <MockupRenderer ad={activeAd} brand={brand} platform={activePlatform} isRegenerating={isRegenerating} />}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          <p className="text-center text-[11px] md:hidden" style={{ color: "var(--color-text-muted)" }}>
            Tryck för att redigera
          </p>

          {adB && <ABTogglePill activeVariant={activeVariant} onSwitch={handleVariantSwitch} />}
          {activeAd && <UploadBackgroundButton adId={activeAd.id} />}
        </div>

        {/* Divider */}
        <div className="hidden md:block" style={{ width: 1, background: "rgba(255,255,255,0.06)", alignSelf: "stretch" }} />

        {/* Right column: detail panel — desktop only */}
        <div className="hidden md:flex flex-1">
          {activeAd && (
            <DetailPanel
              ad={activeAd}
              platform={activePlatform}
              onRegenerate={handleRegenerateImage}
              onRegenerateAll={handleRegenerateAll}
              isRegenerating={isRegenerating}
            />
          )}
        </div>
      </div>

      {/* Mobile edit modal */}
      <AnimatePresence>
        {mobileEditOpen && activeAd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 md:hidden"
            onClick={() => setMobileEditOpen(false)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Bottom sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl"
              style={{
                background: "var(--color-bg-elevated)",
                borderTop: "1px solid rgba(255,255,255,0.1)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle bar */}
              <div className="sticky top-0 z-10 flex justify-center py-3" style={{ background: "var(--color-bg-elevated)" }}>
                <div className="h-1 w-10 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
              </div>

              <div className="px-5 pb-8">
                <DetailPanel
                  ad={activeAd}
                  platform={activePlatform}
                  onRegenerate={handleRegenerateImage}
                  onRegenerateAll={handleRegenerateAll}
                  isRegenerating={isRegenerating}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
