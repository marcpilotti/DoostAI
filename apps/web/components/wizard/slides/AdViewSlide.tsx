"use client";

/**
 * AdViewSlide — Focus + Detail Panel layout.
 *
 * Left: single device mockup (read-only) + A/B toggle + upload background.
 * Right: large editable text panel (headline 32px, body 16px, CTA preview).
 * Platform tabs at top filter to only selected platforms.
 */

import { Globe, Heart, MessageCircle, MoreHorizontal, RefreshCw, Send, Share2, ThumbsUp, Upload } from "lucide-react";
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
    <div className="relative overflow-hidden" style={{ borderRadius: 28, background: "#1C1C1E", padding: "6px 3px", boxShadow: "0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)" }}>
      <div className="absolute left-1/2 top-1 z-30 -translate-x-1/2" style={{ width: 60, height: 16, borderRadius: 10, background: "#1C1C1E" }} />
      <div className="overflow-hidden" style={{ borderRadius: 24, background: "#000" }}>{children}</div>
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
      <div className="flex items-center justify-between bg-black px-4 py-1">
        <span className="text-[9px] font-semibold text-white">9:41</span>
        <div className="flex gap-1"><div className="h-1.5 w-3 rounded-sm bg-white/50" /><div className="h-2 w-3.5 rounded-sm bg-white/50" /></div>
      </div>
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
      <div className="relative">
        <AdImageLayer ad={ad} primaryColor={c} aspectRatio="1/1" isRegenerating={isRegenerating} isLightBrand={isLightBrand} />
        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-0.5 p-3">
          <h3 className="text-[13px] font-extrabold leading-tight text-white" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.4)" }}>{ad.headline}</h3>
          <p className="text-[9px] leading-relaxed line-clamp-2" style={{ color: "rgba(255,255,255,0.75)" }}>{ad.bodyCopy}</p>
          <span className="mt-1 inline-flex self-start rounded-md px-2.5 py-1 text-[9px] font-bold" style={{ background: "rgba(255,255,255,0.9)", color: c }}>
            {ad.cta} →
          </span>
        </div>
      </div>
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

function FacebookMockup({ ad, brand, isRegenerating, isLightBrand }: {
  ad: AdCreative; brand: BrandState; isRegenerating: boolean; isLightBrand?: boolean;
}) {
  const c = brand.colors.primary || "#6366F1";
  const domain = brand.url?.replace(/^https?:\/\//, "").replace(/\/$/, "") || "example.com";
  return (
    <IPhoneFrame>
      <div className="flex items-center justify-between bg-white px-4 py-1">
        <span className="text-[9px] font-semibold text-gray-800">9:41</span>
        <div className="flex gap-1"><div className="h-1.5 w-3 rounded-sm bg-gray-400" /><div className="h-2 w-3.5 rounded-sm bg-gray-400" /></div>
      </div>
      <div className="bg-white">
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
        <div className="px-3 pb-2">
          <p className="text-[10px] leading-relaxed line-clamp-2" style={{ color: "#1c1e21" }}>{ad.bodyCopy}</p>
        </div>
      </div>
      <AdImageLayer ad={ad} primaryColor={c} aspectRatio="4/5" isRegenerating={isRegenerating} isLightBrand={isLightBrand} />
      <div className="flex items-center justify-between bg-gray-50 px-3 py-1.5">
        <div className="min-w-0 flex-1">
          <div className="text-[8px] uppercase text-gray-400">{domain}</div>
          <h3 className="truncate text-[10px] font-semibold" style={{ color: "#1c1e21" }}>{ad.headline}</h3>
        </div>
        <div className="shrink-0 rounded px-2.5 py-1 text-[9px] font-bold text-white" style={{ background: c }}>
          {ad.cta}
        </div>
      </div>
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

function GoogleMockup({ ad, brand, isRegenerating, isLightBrand }: {
  ad: AdCreative; brand: BrandState; isRegenerating: boolean; isLightBrand?: boolean;
}) {
  const c = brand.colors.primary || "#6366F1";
  return (
    <LaptopFrame>
      <div className="flex items-center gap-2 border-b border-gray-200 bg-[#DEE1E6] px-3 py-1.5">
        <div className="flex gap-1"><div className="h-2 w-2 rounded-full bg-[#FF5F57]" /><div className="h-2 w-2 rounded-full bg-[#FEBC2E]" /><div className="h-2 w-2 rounded-full bg-[#28C840]" /></div>
        <div className="flex flex-1 items-center gap-1.5 rounded-md bg-white px-2 py-0.5" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="#28C840"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" /></svg>
          <span className="truncate text-[8px] text-gray-500">nyheter.se/ekonomi/senaste</span>
        </div>
      </div>
      <div className="flex gap-3 bg-[#f9f9f9] p-3">
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
        <div className="w-2/5 shrink-0">
          <div className="text-[6px] uppercase tracking-wider text-gray-400">Annons</div>
          <div className="mt-0.5 overflow-hidden rounded" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
            <AdImageLayer ad={ad} primaryColor={c} aspectRatio="1.91/1" isRegenerating={isRegenerating} isLightBrand={isLightBrand} />
          </div>
          <div className="mt-1 space-y-0.5">
            <h3 className="text-[11px] font-bold leading-tight" style={{ color: c }}>{ad.headline}</h3>
            <p className="text-[9px] leading-snug line-clamp-2" style={{ color: "#545454" }}>{ad.bodyCopy}</p>
            <span className="inline-block rounded px-1.5 py-0.5 text-[9px] font-bold text-white" style={{ background: c }}>
              {ad.cta}
            </span>
          </div>
        </div>
      </div>
      <div className="space-y-1 bg-[#f9f9f9] px-3 pb-3">
        <div className="h-1.5 w-full rounded bg-gray-200" />
        <div className="h-1.5 w-full rounded bg-gray-200" />
        <div className="h-1.5 w-3/4 rounded bg-gray-200" />
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
      const natural = mockup.scrollHeight;
      const available = container.clientHeight;
      if (natural > 0 && available > 0 && natural > available) {
        setScale(Math.max(0.5, available / natural));
      } else {
        setScale(1);
      }
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

  useEffect(() => { setHeadline(ad.headline); }, [ad.headline]);
  useEffect(() => { setBodyCopy(ad.bodyCopy); }, [ad.bodyCopy]);

  function commitHeadline() { if (headline.trim() !== ad.headline) updateAd(ad.id, { headline: headline.trim() }); }
  function commitBody() { if (bodyCopy.trim() !== ad.bodyCopy) updateAd(ad.id, { bodyCopy: bodyCopy.trim() }); }

  return (
    <div className="flex flex-1 flex-col gap-6 py-4 md:py-0">
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
        <div className="flex flex-wrap gap-1.5">
          {CTA_OPTIONS.map((opt) => (
            <motion.button key={opt} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => updateAd(ad.id, { cta: opt })}
              className="rounded-md px-3 py-1.5 text-[11px] font-semibold transition-all duration-150"
              style={{
                background: ad.cta === opt ? "var(--color-primary, #6366F1)" : "rgba(255,255,255,0.04)",
                color: ad.cta === opt ? "#fff" : "rgba(255,255,255,0.4)",
                border: ad.cta === opt ? "1px solid var(--color-primary, #6366F1)" : "1px solid rgba(255,255,255,0.06)",
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

  const [activePlatform, setActivePlatform] = useState<DisplayPlatform>(availableDisplayPlatforms[0]!);

  // Keep activePlatform in sync if available platforms change
  useEffect(() => {
    if (!availableDisplayPlatforms.includes(activePlatform)) {
      setActivePlatform(availableDisplayPlatforms[0]!);
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
        <div className="flex flex-col items-center gap-3" style={{ width: "100%", maxWidth: 300, flexShrink: 0, margin: "0 auto" }}>
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
                className="relative w-full overflow-hidden"
                style={{ height: "calc(100dvh - 320px)", maxHeight: 460 }}
              >
                <div ref={mockupRef} style={{ transformOrigin: "top center", transform: `scale(${scale})` }}>
                  {activeAd && <MockupRenderer ad={activeAd} brand={brand} platform={activePlatform} isRegenerating={isRegenerating} />}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {adB && <ABTogglePill activeVariant={activeVariant} onSwitch={handleVariantSwitch} />}
          {activeAd && <UploadBackgroundButton adId={activeAd.id} />}
        </div>

        {/* Divider */}
        <div className="hidden md:block" style={{ width: 1, background: "rgba(255,255,255,0.06)", alignSelf: "stretch" }} />

        {/* Right column: detail panel */}
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
    </motion.div>
  );
}
