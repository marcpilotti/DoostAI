"use client";

import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

import { useWizardNavigation } from "@/hooks/use-wizard-navigation";
import { cardVariants, transitions } from "@/lib/motion";
import type { AdCreative } from "@/lib/stores/wizard-store";
import { useWizardStore } from "@/lib/stores/wizard-store";

import { AdEditModal } from "../shared/AdEditModal";
import { AdGenerationLoading } from "../shared/AdGenerationLoading";

type Platform = "instagram" | "facebook" | "google" | "linkedin";

const PLATFORM_CONFIG: Record<Platform, { label: string; aspect: string; spec: string }> = {
  instagram: { label: "Instagram", aspect: "1/1", spec: "1080 x 1080 px" },
  facebook: { label: "Facebook", aspect: "4/5", spec: "1080 x 1350 px" },
  google: { label: "Google", aspect: "1.91/1", spec: "1200 x 628 px" },
  linkedin: { label: "LinkedIn", aspect: "1.91/1", spec: "1200 x 627 px" },
};

function InstagramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function ReelAdCard({
  ad,
  brand,
  label,
  selected,
  aspectRatio,
  onToggle,
  onEdit,
}: {
  ad: AdCreative;
  brand: NonNullable<ReturnType<typeof useWizardStore.getState>["brand"]>;
  label: string;
  selected: boolean;
  aspectRatio: string;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const primaryColor = brand.colors.primary || "#6366F1";
  const gradientBg = brand.colors.secondary
    ? `linear-gradient(145deg, ${primaryColor} 0%, ${brand.colors.secondary} 100%)`
    : `linear-gradient(145deg, ${primaryColor} 0%, ${primaryColor}CC 100%)`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitions.spring}
      className="flex flex-1 flex-col items-center gap-2 min-w-0"
    >
      <motion.button
        onClick={onToggle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="text-[11px] font-medium"
        style={{
          padding: "4px 14px",
          borderRadius: 20,
          background: selected ? "var(--color-primary)" : "transparent",
          color: selected ? "#fff" : "var(--color-text-muted)",
          border: `1px solid ${selected ? "var(--color-primary)" : "rgba(255,255,255,0.1)"}`,
        }}
      >
        {selected ? `✓ ${label}` : label}
      </motion.button>

      <motion.div
        onClick={onEdit}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="relative w-full cursor-pointer overflow-hidden"
        style={{
          aspectRatio,
          borderRadius: 14,
          maxHeight: "calc(100dvh - 280px)",
          boxShadow: selected
            ? "0 8px 32px rgba(99,102,241,0.2), 0 0 0 2px var(--color-primary)"
            : "0 4px 20px rgba(0,0,0,0.3)",
        }}
      >
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

        {brand.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={brand.logoUrl}
            alt=""
            className="absolute left-3 top-3 z-10 h-6 w-6 rounded-md object-contain"
            style={{ backgroundColor: "rgba(255,255,255,0.15)", padding: 2 }}
          />
        )}

        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-1 p-3">
          <span className="text-[7px] font-semibold uppercase tracking-[0.12em]" style={{ color: "rgba(255,255,255,0.5)" }}>
            {brand.name}
          </span>
          <h3 className="text-[13px] font-extrabold leading-tight" style={{ color: "#fff", textShadow: "0 1px 8px rgba(0,0,0,0.3)" }}>
            {ad.headline}
          </h3>
          <p className="text-[9px] leading-relaxed line-clamp-2" style={{ color: "rgba(255,255,255,0.75)" }}>
            {ad.bodyCopy}
          </p>
          <span
            className="mt-0.5 inline-flex self-start items-center gap-1 rounded-md px-2.5 py-1 text-[9px] font-bold"
            style={{ background: "rgba(255,255,255,0.9)", color: primaryColor }}
          >
            {ad.cta} →
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

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
              const bgUrl = d.result.backgroundUrl || preGeneratedImageUrl;
              setAds(d.result.copies.map((c: Record<string, string>, i: number) => ({
                id: `ad-${Date.now()}-${i}`,
                platform: selectedPlatforms[0],
                template: i === 0 ? ("hero" as const) : ("brand" as const),
                headline: c.headline || "",
                bodyCopy: c.bodyCopy || "",
                cta: c.cta || "Läs mer",
                imageUrl: bgUrl,
                selected: i === 0,
              })));
            }
          } catch { /* */ }
        }
      }
    } catch (e) { console.error(e); } finally { useWizardStore.getState().setIsGeneratingAds(false); }
  }, [brand, selectedPlatforms, preGeneratedImageUrl, setAds]);

  if (isGeneratingAds) return <AdGenerationLoading brand={brand} />;
  if (!brand || ads.length === 0) return null;

  const { aspect } = PLATFORM_CONFIG[activePlatform];

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={transitions.spring} className="flex flex-col gap-3">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-text-h1" style={{ color: "var(--color-text-primary)" }}>Dina annonser</h2>
          <motion.button onClick={handleRegenerate} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="text-[11px] font-medium" style={{ color: "var(--color-text-secondary)" }}>
            Generera om
          </motion.button>
        </div>
        <p className="mt-0.5 text-[12px]" style={{ color: "var(--color-text-muted)" }}>
          Välj den variant du gillar bäst. Klicka på en annons för att redigera.
        </p>
      </div>

      {/* A/B cards */}
      <motion.div key={activePlatform} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="flex gap-3">
        {adA && (
          <ReelAdCard ad={adA} brand={brand} label="Välj A" selected={adA.selected} aspectRatio={aspect} onToggle={() => toggleAdSelection(adA.id)} onEdit={() => setEditingAdId(adA.id)} />
        )}
        {adB && (
          <ReelAdCard ad={adB} brand={brand} label="Välj B" selected={adB.selected} aspectRatio={aspect} onToggle={() => toggleAdSelection(adB.id)} onEdit={() => setEditingAdId(adB.id)} />
        )}
      </motion.div>

      {/* Platform switcher */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1">
          {([
            { id: "instagram" as Platform, label: "Instagram", Icon: InstagramIcon },
            { id: "facebook" as Platform, label: "Facebook", Icon: FacebookIcon },
            { id: "google" as Platform, label: "Google", Icon: GoogleIcon },
            { id: "linkedin" as Platform, label: "LinkedIn", Icon: LinkedInIcon },
          ]).map(({ id, label, Icon }) => (
          <motion.button
            key={id}
            onClick={() => setActivePlatform(id)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 text-[11px] font-medium"
            style={{
              padding: "5px 12px",
              borderRadius: 20,
              background: activePlatform === id ? "var(--color-bg-raised)" : "transparent",
              color: activePlatform === id ? "var(--color-text-primary)" : "var(--color-text-muted)",
              border: activePlatform === id ? "1px solid var(--color-border-default)" : "1px solid transparent",
            }}
          >
            <Icon />
            {label}
          </motion.button>
        ))}
        </div>
        <span className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>
          {PLATFORM_CONFIG[activePlatform].spec}
        </span>
      </div>

      <AdEditModal adId={editingAdId} onClose={() => setEditingAdId(null)} />
    </motion.div>
  );
}
