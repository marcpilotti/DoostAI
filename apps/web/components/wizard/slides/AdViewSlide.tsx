"use client";

/**
 * AdViewSlide — presents generated ad variants in device mockup frames.
 *
 * Features:
 * - Phone/browser mockup per platform
 * - Side-by-side A/B with staggered reveal
 * - Icon-only platform tab switcher
 * - Trust tags (format, language, industry)
 * - Inline headline/body editing
 * - Per-variant image regeneration
 */

import { AnimatePresence, motion } from "motion/react";
import { Check, Pencil, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { generateAdImage } from "@/app/actions/generate-ad-image";
import { useWizardNavigation } from "@/hooks/use-wizard-navigation";
import { transitions } from "@/lib/motion";
import type { AdCreative } from "@/lib/stores/wizard-store";
import { useWizardStore } from "@/lib/stores/wizard-store";

import { AdEditModal } from "../shared/AdEditModal";
import { AdGenerationLoading } from "../shared/AdGenerationLoading";

// ── Types ────────────────────────────────────────────────────────

type Platform = "instagram" | "facebook" | "google" | "linkedin";

const PLATFORM_CONFIG: Record<Platform, { label: string; aspect: string; spec: string }> = {
  instagram: { label: "Instagram", aspect: "1/1", spec: "1080 x 1080 px" },
  facebook: { label: "Facebook", aspect: "4/5", spec: "1080 x 1350 px" },
  google: { label: "Google", aspect: "1.91/1", spec: "1200 x 628 px" },
  linkedin: { label: "LinkedIn", aspect: "1.91/1", spec: "1200 x 627 px" },
};

// Swedish action verbs for angle detection
const ACTION_VERBS = ["ge", "boka", "upptäck", "välj", "starta", "få", "skapa", "hitta", "testa", "prova", "köp", "läs", "se", "hör", "ring"];

function getAngleLabel(headline: string): string {
  const firstWord = headline.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  return ACTION_VERBS.some((v) => firstWord.startsWith(v))
    ? "Handlingsorienterad"
    : "Nyfikenhetsdriven";
}

// ── Platform Icons ───────────────────────────────────────────────

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
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
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  google: GoogleIcon,
  linkedin: LinkedInIcon,
};

// ── Device Mockup Frames ─────────────────────────────────────────

function PhoneMockup({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        borderRadius: 28,
        background: "#1C1C1E",
        padding: "6px 3px",
        boxShadow: "0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)",
      }}
    >
      {/* Notch */}
      <div
        className="absolute left-1/2 top-1 z-30 -translate-x-1/2"
        style={{ width: 60, height: 16, borderRadius: 10, background: "#1C1C1E" }}
      />
      {/* Screen */}
      <div className="overflow-hidden" style={{ borderRadius: 24, background: "#000" }}>
        {children}
      </div>
    </div>
  );
}

function BrowserMockup({ children, url }: { children: React.ReactNode; url?: string }) {
  return (
    <div
      className="overflow-hidden"
      style={{
        borderRadius: 12,
        background: "#f8f8f8",
        border: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.04)",
      }}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-black/5 px-3 py-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        </div>
        {/* Address bar */}
        <div className="flex flex-1 items-center gap-1.5 rounded-md bg-white px-2.5 py-1" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#28C840">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
          </svg>
          <span className="truncate text-[9px] text-gray-500">{url || "google.com/search"}</span>
        </div>
      </div>
      {/* Content */}
      <div className="bg-white">{children}</div>
    </div>
  );
}

function DeviceMockup({
  platform,
  children,
  brandUrl,
}: {
  platform: Platform;
  children: React.ReactNode;
  brandUrl?: string;
}) {
  if (platform === "google") {
    return <BrowserMockup url={brandUrl}>{children}</BrowserMockup>;
  }
  if (platform === "linkedin") {
    return <BrowserMockup url="linkedin.com/feed">{children}</BrowserMockup>;
  }
  // Instagram / Facebook → phone frame
  return <PhoneMockup>{children}</PhoneMockup>;
}

// ── Inline Editable Text ─────────────────────────────────────────

function InlineEditableText({
  value,
  onSave,
  as: Tag = "h3",
  className,
  style,
}: {
  value: string;
  onSave: (v: string) => void;
  as?: "h3" | "p";
  className?: string;
  style?: React.CSSProperties;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value); }, [value]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
      // Auto-resize
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [editing]);

  function commit() {
    setEditing(false);
    if (draft.trim() !== value.trim()) onSave(draft.trim());
  }

  if (editing) {
    return (
      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = e.target.scrollHeight + "px";
        }}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commit(); } }}
        className={className}
        style={{
          ...style,
          resize: "none",
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: 4,
          outline: "none",
          width: "100%",
          padding: "2px 4px",
          margin: "-2px -4px",
        }}
        rows={1}
      />
    );
  }

  return (
    <div className="group/edit relative cursor-pointer" onClick={() => setEditing(true)}>
      <Tag className={className} style={style}>{value}</Tag>
      <span className="absolute -right-5 top-0 hidden text-white/50 group-hover/edit:inline">
        <Pencil className="h-3 w-3" />
      </span>
    </div>
  );
}

// ── Ad Content Overlay ───────────────────────────────────────────

function AdContentOverlay({
  ad,
  brand,
  aspectRatio,
  isRegenerating,
  onUpdate,
}: {
  ad: AdCreative;
  brand: NonNullable<ReturnType<typeof useWizardStore.getState>["brand"]>;
  aspectRatio: string;
  isRegenerating: boolean;
  onUpdate: (field: "headline" | "bodyCopy" | "cta", value: string) => void;
}) {
  const primaryColor = brand.colors.primary || "#6366F1";
  const gradientBg = brand.colors.secondary
    ? `linear-gradient(145deg, ${primaryColor} 0%, ${brand.colors.secondary} 100%)`
    : `linear-gradient(145deg, ${primaryColor} 0%, ${primaryColor}CC 100%)`;

  return (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio }}>
      {/* Background image or gradient */}
      {ad.imageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ad.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ transform: "scale(1.05)" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(to top, ${primaryColor}E0 0%, ${primaryColor}60 35%, transparent 70%)` }}
          />
        </>
      ) : (
        <div className="absolute inset-0" style={{ background: gradientBg }}>
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>
      )}

      {/* Regenerating spinner overlay */}
      {isRegenerating && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <RefreshCw className="h-6 w-6 animate-spin text-white/80" />
        </div>
      )}

      {/* Text overlay */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-1 p-3">
        <span className="text-[7px] font-semibold uppercase tracking-[0.12em]" style={{ color: "rgba(255,255,255,0.5)" }}>
          {brand.name}
        </span>
        <InlineEditableText
          value={ad.headline}
          onSave={(v) => onUpdate("headline", v)}
          as="h3"
          className="text-[13px] font-extrabold leading-tight"
          style={{ color: "#fff", textShadow: "0 1px 8px rgba(0,0,0,0.3)" }}
        />
        <InlineEditableText
          value={ad.bodyCopy}
          onSave={(v) => onUpdate("bodyCopy", v)}
          as="p"
          className="text-[9px] leading-relaxed line-clamp-2"
          style={{ color: "rgba(255,255,255,0.75)" }}
        />
        <span
          className="mt-0.5 inline-flex self-start items-center gap-1 rounded-md px-2.5 py-1 text-[9px] font-bold"
          style={{ background: "rgba(255,255,255,0.9)", color: primaryColor }}
        >
          {ad.cta} →
        </span>
      </div>
    </div>
  );
}

// ── Trust Tags ───────────────────────────────────────────────────

function TrustTags({ industry }: { industry?: string }) {
  const tags = [
    "Rätt format",
    "Svensk copy",
    industry ? `Anpassad till ${industry}` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full text-[11px]"
          style={{ background: "rgba(255,255,255,0.06)", padding: "4px 10px", color: "var(--color-text-muted)" }}
        >
          <span style={{ color: "#22c55e" }}>✓</span> {tag}
        </span>
      ))}
    </div>
  );
}

// ── Ad Mockup Card ───────────────────────────────────────────────

function AdMockupCard({
  ad,
  brand,
  label,
  index,
  selected,
  platform,
  onToggle,
  onEdit,
}: {
  ad: AdCreative;
  brand: NonNullable<ReturnType<typeof useWizardStore.getState>["brand"]>;
  label: string;
  index: number;
  selected: boolean;
  platform: Platform;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const { updateAd } = useWizardStore();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [, startTransition] = useTransition();
  const { aspect } = PLATFORM_CONFIG[platform];

  function handleUpdate(field: "headline" | "bodyCopy" | "cta", value: string) {
    updateAd(ad.id, { [field]: value });
  }

  function handleRegenerate() {
    setIsRegenerating(true);
    startTransition(async () => {
      try {
        const result = await generateAdImage(
          {
            id: `${ad.id}-regen-${Date.now()}`,
            headline: ad.headline,
            primaryText: ad.bodyCopy,
            brandName: brand.name,
            brandColor: brand.colors.primary,
            brandAccent: brand.colors.secondary,
          },
          platform === "linkedin" ? "linkedin" : "meta-feed",
        );
        if (result?.imageUrl) {
          updateAd(ad.id, { imageUrl: result.imageUrl });
        }
      } catch (err) {
        console.error("[AdMockupCard] Regenerate failed:", err);
      } finally {
        setIsRegenerating(false);
      }
    });
  }

  const angleLabel = getAngleLabel(ad.headline);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: index * 0.15 }}
      className="flex min-w-[260px] flex-1 snap-center flex-col items-center gap-3"
    >
      {/* Select toggle + label */}
      <div className="flex items-center gap-2">
        <motion.button
          onClick={onToggle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1.5 text-[11px] font-semibold"
          style={{
            padding: "5px 14px",
            borderRadius: 20,
            background: selected ? "#22c55e" : "transparent",
            color: selected ? "#fff" : "var(--color-text-muted)",
            border: selected ? "2px solid #22c55e" : "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {selected && <Check className="h-3 w-3" />}
          {label}
        </motion.button>
        <span className="text-[10px] font-medium" style={{ color: "var(--color-text-muted)" }}>
          {angleLabel}
        </span>
      </div>

      {/* Device mockup with tilt */}
      <motion.div
        initial={{ rotate: -1.5 }}
        whileHover={{ rotate: 0, scale: 1.02 }}
        transition={transitions.spring}
        className="relative w-full cursor-pointer"
        style={{ maxHeight: "calc(100dvh - 320px)" }}
        onClick={onEdit}
      >
        {/* Selected indicator */}
        {selected && (
          <div className="absolute -right-1 -top-1 z-40 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 shadow-lg">
            <Check className="h-3.5 w-3.5 text-white" />
          </div>
        )}

        <DeviceMockup platform={platform} brandUrl={brand.url}>
          <AdContentOverlay
            ad={ad}
            brand={brand}
            aspectRatio={aspect}
            isRegenerating={isRegenerating}
            onUpdate={handleUpdate}
          />
        </DeviceMockup>
      </motion.div>

      {/* Trust tags */}
      <TrustTags industry={brand.industry} />

      {/* Regenerate button */}
      <motion.button
        onClick={handleRegenerate}
        disabled={isRegenerating}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-1.5 text-[11px] font-medium disabled:opacity-40"
        style={{
          padding: "6px 14px",
          borderRadius: 8,
          background: "transparent",
          color: "var(--color-text-muted)",
          border: "1px solid var(--color-border-default)",
        }}
      >
        <RefreshCw className={`h-3 w-3 ${isRegenerating ? "animate-spin" : ""}`} />
        Generera ny bild
      </motion.button>
    </motion.div>
  );
}

// ── Platform Tab Switcher ────────────────────────────────────────

function PlatformTabSwitcher({
  active,
  onChange,
  brandColor,
}: {
  active: Platform;
  onChange: (p: Platform) => void;
  brandColor: string;
}) {
  const platforms: Platform[] = ["instagram", "facebook", "google", "linkedin"];

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1">
        {platforms.map((p) => {
          const Icon = PLATFORM_ICONS[p];
          const isActive = active === p;
          return (
            <motion.button
              key={p}
              onClick={() => onChange(p)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className="relative flex items-center justify-center"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: isActive ? "var(--color-bg-raised)" : "transparent",
                color: isActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
                border: isActive ? "1px solid var(--color-border-default)" : "1px solid transparent",
              }}
            >
              <Icon size={16} />
              {/* Active underline */}
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
      <span className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>
        {PLATFORM_CONFIG[active].spec}
      </span>
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: { name: brand.name, description: brand.description, industry: brand.industry, targetAudience: brand.targetAudience, valuePropositions: brand.valuePropositions, url: brand.url, colors: brand.colors, fonts: brand.fonts },
          platform: selectedPlatforms[0],
          language: "sv",
        }),
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
                id: `ad-${Date.now()}-${i}`,
                platform: selectedPlatforms[0],
                template: i === 0 ? ("hero" as const) : ("brand" as const),
                headline: c.headline || "",
                bodyCopy: c.bodyCopy || "",
                cta: c.cta || "Läs mer",
                imageUrl: i === 0 ? bgUrlA : bgUrlB,
                selected: i === 0,
              })));
            }
          } catch { /* ignore parse errors for partial chunks */ }
        }
      }
    } catch (e) { console.error(e); } finally { useWizardStore.getState().setIsGeneratingAds(false); }
  }, [brand, selectedPlatforms, preGeneratedImageUrl, setAds]);

  if (isGeneratingAds) return <AdGenerationLoading brand={brand} />;
  if (!brand) return null;

  if (ads.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transitions.spring}
        className="flex flex-col items-center justify-center gap-4 py-12 text-center"
      >
        <p style={{ color: "var(--color-text-secondary)" }}>
          Annonserna kunde inte genereras.
        </p>
        <motion.button
          onClick={handleRegenerate}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="cta-primary"
          style={{ padding: "10px 24px", fontSize: 14 }}
        >
          Försök igen
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-4"
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-text-h1" style={{ color: "var(--color-text-primary)" }}>Dina annonser</h2>
          <motion.button
            onClick={handleRegenerate}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1 text-[11px] font-medium"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <RefreshCw className="h-3 w-3" />
            Generera om
          </motion.button>
        </div>
        <p className="mt-0.5 text-[12px]" style={{ color: "var(--color-text-muted)" }}>
          Välj den variant du gillar bäst. Klicka för att redigera text direkt.
        </p>
      </div>

      {/* Platform tab switcher */}
      <PlatformTabSwitcher
        active={activePlatform}
        onChange={setActivePlatform}
        brandColor={brand.colors.primary || "#6366F1"}
      />

      {/* A/B cards with crossfade on platform switch */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activePlatform}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex gap-6 overflow-x-auto pb-2 snap-x snap-mandatory md:overflow-visible"
        >
          {/* Variant A */}
          {adA && (
            <AdMockupCard
              ad={adA}
              brand={brand}
              label="Välj A"
              index={0}
              selected={adA.selected}
              platform={activePlatform}
              onToggle={() => toggleAdSelection(adA.id)}
              onEdit={() => setEditingAdId(adA.id)}
            />
          )}

          {/* Divider (desktop only) */}
          {adA && adB && (
            <div className="hidden flex-col items-center justify-center gap-2 md:flex" style={{ minWidth: 1 }}>
              <div className="h-full w-px" style={{ background: "var(--color-border-default)" }} />
            </div>
          )}

          {/* Variant B */}
          {adB && (
            <AdMockupCard
              ad={adB}
              brand={brand}
              label="Välj B"
              index={1}
              selected={adB.selected}
              platform={activePlatform}
              onToggle={() => toggleAdSelection(adB.id)}
              onEdit={() => setEditingAdId(adB.id)}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Edit modal (fallback for deeper editing) */}
      <AdEditModal adId={editingAdId} onClose={() => setEditingAdId(null)} />
    </motion.div>
  );
}
