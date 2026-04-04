"use client";

import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

import { useWizardNavigation } from "@/hooks/use-wizard-navigation";
import { cardVariants, transitions } from "@/lib/motion";
import { useWizardStore } from "@/lib/stores/wizard-store";
import type { AdCreative } from "@/lib/stores/wizard-store";

import { AdEditModal } from "../shared/AdEditModal";
import { AdGenerationLoading } from "../shared/AdGenerationLoading";
import { AdPreviewBrand } from "../shared/AdPreviewBrand";
import { AdPreviewHero } from "../shared/AdPreviewHero";
import { AnimatedReel } from "../shared/AnimatedReel";
import { BeforeAfterSplit } from "../shared/BeforeAfterSplit";
import { BonusFormats } from "../shared/BonusFormats";
import { ExportPackage } from "../shared/ExportPackage";
import {
  AccordionLayout,
  CardStackLayout,
  CarouselWheelLayout,
  FilmstripLayout,
  MagazineSpreadLayout,
  PolaroidLayout,
  SplitComparisonLayout,
  SpotlightStageLayout,
  TimelineRailLayout,
  TinderSwipeLayout,
} from "../shared/layouts";
import { RevealSequence } from "../shared/RevealSequence";
import { SmartCropPreview } from "../shared/SmartCropPreview";

type ViewMode = "reveal" | "layout" | "reel" | "formats" | "export";

type LayoutId =
  | "stack"
  | "tinder"
  | "magazine"
  | "filmstrip"
  | "polaroid"
  | "accordion"
  | "split"
  | "carousel"
  | "timeline"
  | "spotlight";

const LAYOUTS: { id: LayoutId; label: string; icon: string }[] = [
  { id: "stack", label: "Kortlek", icon: "🃏" },
  { id: "tinder", label: "Swipe", icon: "👆" },
  { id: "magazine", label: "Tidning", icon: "📰" },
  { id: "filmstrip", label: "Film", icon: "🎞" },
  { id: "polaroid", label: "Polaroid", icon: "📸" },
  { id: "accordion", label: "Dragspel", icon: "📋" },
  { id: "split", label: "Jämför", icon: "⚖️" },
  { id: "carousel", label: "3D", icon: "🎠" },
  { id: "timeline", label: "Tidslinje", icon: "📍" },
  { id: "spotlight", label: "Spotlight", icon: "🔦" },
];

export function AdViewSlide() {
  const { ads, selectedPlatforms, brand, isGeneratingAds, toggleAdSelection, setAds, setFooterAction } = useWizardStore();
  const { handleNext } = useWizardNavigation();
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("reveal");
  const [layoutId, setLayoutId] = useState<LayoutId>("magazine");
  const [revealDone, setRevealDone] = useState(false);

  const selectedCount = ads.filter((a) => a.selected).length;
  const heroAd = ads.find((a) => a.template === "hero");

  const strategies = brand ? [
    brand.industry ? `Optimerat för ${brand.industry}` : "Branschanpassat",
    "Emotionell + aspirational",
    "Konverteringsfokuserat",
  ] : [];

  useEffect(() => {
    setFooterAction(() => handleNext(), selectedCount === 0);
    return () => setFooterAction(null);
  }, [selectedCount, handleNext, setFooterAction]);

  useEffect(() => {
    if (ads.length > 0 && !isGeneratingAds && !revealDone) setViewMode("reveal");
  }, [ads, isGeneratingAds, revealDone]);

  const handleRevealComplete = useCallback(() => { setRevealDone(true); setViewMode("layout"); }, []);

  const renderAdContent = useCallback(
    (ad: AdCreative) =>
      ad.template === "brand" ? (
        <AdPreviewBrand headline={ad.headline} bodyCopy={ad.bodyCopy} cta={ad.cta} brandName={brand?.name || ""} logoUrl={brand?.logoUrl} primaryColor={brand?.colors.primary || "#6366F1"} secondaryColor={brand?.colors.secondary} accentColor={brand?.colors.accent} />
      ) : (
        <AdPreviewHero headline={ad.headline} bodyCopy={ad.bodyCopy} cta={ad.cta} brandName={brand?.name || ""} logoUrl={brand?.logoUrl} imageUrl={ad.imageUrl || undefined} primaryColor={brand?.colors.primary || "#6366F1"} secondaryColor={brand?.colors.secondary} />
      ),
    [brand],
  );

  const handleRegenerate = async () => {
    if (!brand) return;
    useWizardStore.getState().setIsGeneratingAds(true);
    setRevealDone(false);
    try {
      const res = await fetch("/api/ad/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ brand: { name: brand.name, description: brand.description, industry: brand.industry, targetAudience: brand.targetAudience, valuePropositions: brand.valuePropositions, url: brand.url, colors: brand.colors, fonts: brand.fonts }, platform: selectedPlatforms[0], language: "sv" }) });
      if (!res.ok) throw new Error("fail");
      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") continue;
          try {
            const d = JSON.parse(raw);
            if (d.event === "complete" && d.result?.copies) {
              setAds(d.result.copies.map((c: Record<string, string>, i: number) => ({ id: `ad-${Date.now()}-${i}`, platform: selectedPlatforms[0], template: i === 0 ? "hero" as const : "brand" as const, headline: c.headline || "", bodyCopy: c.bodyCopy || "", cta: c.cta || "Läs mer", imageUrl: d.result.backgroundUrl, selected: i === 0 })));
            }
          } catch { /* */ }
        }
      }
    } catch (e) { console.error(e); } finally { useWizardStore.getState().setIsGeneratingAds(false); }
  };

  // Shared layout props
  const layoutProps = {
    ads,
    brand,
    onToggleSelection: toggleAdSelection,
    onEdit: (adId: string) => setEditingAdId(adId),
    onRegenerate: handleRegenerate,
    renderAdContent,
  };

  // ─── LOADING ───
  if (isGeneratingAds) return <AdGenerationLoading brand={brand} />;

  // ─── REVEAL ───
  if (viewMode === "reveal" && !revealDone && ads.length > 0) {
    return <RevealSequence brandName={brand?.name || ""} industry={brand?.industry || ""} strategies={strategies} onComplete={handleRevealComplete} />;
  }

  // ─── MAIN ───
  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={transitions.spring} className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-text-h1" style={{ color: "var(--color-text-primary)" }}>Dina annonser</h2>
        <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{selectedCount} av {ads.length} valda</span>
      </div>

      {/* View mode tabs */}
      <div className="flex gap-1.5">
        {([
          { id: "layout" as ViewMode, label: "📱 Preview" },
          { id: "reel" as ViewMode, label: "🎬 Reel" },
          { id: "formats" as ViewMode, label: "📐 Format" },
          { id: "export" as ViewMode, label: "📦 Paket" },
        ]).map((t) => (
          <motion.button key={t.id} onClick={() => setViewMode(t.id)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="text-[10px] font-medium" style={{ padding: "3px 10px", borderRadius: 16, background: viewMode === t.id ? "var(--color-primary-glow)" : "transparent", color: viewMode === t.id ? "var(--color-primary-light)" : "var(--color-text-muted)", border: viewMode === t.id ? "none" : "1px solid rgba(255,255,255,0.06)" }}>
            {t.label}
          </motion.button>
        ))}
      </div>

      {/* ─── LAYOUT SWITCHER (only in Preview mode) ─── */}
      {viewMode === "layout" && (
        <>
          <div className="flex flex-wrap gap-1">
            {LAYOUTS.map((l) => (
              <motion.button
                key={l.id}
                onClick={() => setLayoutId(l.id)}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                className="text-[9px] font-medium"
                style={{
                  padding: "2px 8px",
                  borderRadius: 12,
                  background: layoutId === l.id ? "var(--color-primary-glow)" : "var(--color-bg-raised)",
                  color: layoutId === l.id ? "var(--color-primary-light)" : "var(--color-text-muted)",
                  border: layoutId === l.id ? "1px solid var(--color-primary)" : "1px solid transparent",
                }}
              >
                {l.icon} {l.label}
              </motion.button>
            ))}
          </div>

          {/* Active layout */}
          <motion.div
            key={layoutId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transitions.spring}
          >
            {layoutId === "stack" && <CardStackLayout {...layoutProps} />}
            {layoutId === "tinder" && <TinderSwipeLayout {...layoutProps} />}
            {layoutId === "magazine" && <MagazineSpreadLayout {...layoutProps} />}
            {layoutId === "filmstrip" && <FilmstripLayout {...layoutProps} />}
            {layoutId === "polaroid" && <PolaroidLayout {...layoutProps} />}
            {layoutId === "accordion" && <AccordionLayout {...layoutProps} />}
            {layoutId === "split" && <SplitComparisonLayout {...layoutProps} />}
            {layoutId === "carousel" && <CarouselWheelLayout {...layoutProps} />}
            {layoutId === "timeline" && <TimelineRailLayout {...layoutProps} />}
            {layoutId === "spotlight" && <SpotlightStageLayout {...layoutProps} />}
          </motion.div>
        </>
      )}

      {/* ─── REEL VIEW ─── */}
      {viewMode === "reel" && heroAd && (
        <div className="flex items-start justify-center gap-6">
          <AnimatedReel headline={heroAd.headline} bodyCopy={heroAd.bodyCopy} cta={heroAd.cta} brandName={brand?.name || ""} logoUrl={brand?.logoUrl} imageUrl={heroAd.imageUrl || undefined} primaryColor={brand?.colors.primary || "#6366F1"} />
          <div className="flex flex-col gap-2" style={{ maxWidth: 180 }}>
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Auto-genererad Reel</span>
            <p className="text-[11px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>6-sekunders video från din annons. Perfekt för Reels och TikTok.</p>
            <span className="text-[9px]" style={{ color: "var(--color-primary-light)" }}>🎬 Ingår i ditt kreativa paket</span>
          </div>
        </div>
      )}

      {/* ─── FORMATS VIEW ─── */}
      {viewMode === "formats" && heroAd && (
        <div className="flex flex-col gap-3">
          <SmartCropPreview adContent={renderAdContent(heroAd)} />
          <BonusFormats headline={heroAd.headline} bodyCopy={heroAd.bodyCopy} cta={heroAd.cta} brandName={brand?.name || ""} primaryColor={brand?.colors.primary || "#6366F1"} logoUrl={brand?.logoUrl} />
          {brand?.url && <BeforeAfterSplit websiteUrl={brand.url} adContent={renderAdContent(heroAd)} />}
        </div>
      )}

      {/* ─── EXPORT VIEW ─── */}
      {viewMode === "export" && heroAd && (
        <ExportPackage brandName={brand?.name || ""} headline={heroAd.headline} bodyCopy={heroAd.bodyCopy} cta={heroAd.cta} primaryColor={brand?.colors.primary || "#6366F1"} logoUrl={brand?.logoUrl} />
      )}

      {/* Edit modal */}
      <AdEditModal adId={editingAdId} onClose={() => setEditingAdId(null)} />
    </motion.div>
  );
}
