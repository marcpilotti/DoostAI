"use client";

import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

import { useWizardNavigation } from "@/hooks/use-wizard-navigation";
import { cardVariants, checkmarkVariants, transitions } from "@/lib/motion";
import { useWizardStore } from "@/lib/stores/wizard-store";

import { AdGenerationLoading } from "../shared/AdGenerationLoading";
import { AdPreviewBrand } from "../shared/AdPreviewBrand";
import { AdPreviewHero } from "../shared/AdPreviewHero";
import { AnimatedReel } from "../shared/AnimatedReel";
import { ArtDirectorPanel } from "../shared/ArtDirectorPanel";
import { BeforeAfterSplit } from "../shared/BeforeAfterSplit";
import { BonusFormats } from "../shared/BonusFormats";
import { EditOverlay } from "../shared/EditOverlay";
import { ExportPackage } from "../shared/ExportPackage";
import { ParallaxPhone } from "../shared/ParallaxPhone";
import { RevealSequence } from "../shared/RevealSequence";
import { SmartCropPreview } from "../shared/SmartCropPreview";

type ViewMode = "reveal" | "phone" | "reel" | "formats" | "export";

export function AdViewSlide() {
  const { ads, selectedPlatforms, brand, isGeneratingAds, toggleAdSelection, setAds, setFooterAction } = useWizardStore();
  const { handleNext } = useWizardNavigation();
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ headline: "", bodyCopy: "", cta: "" });
  const [viewMode, setViewMode] = useState<ViewMode>("reveal");
  const [revealDone, setRevealDone] = useState(false);

  const selectedCount = ads.filter((a) => a.selected).length;
  const filteredAds = ads.filter((a) => a.platform === selectedPlatforms[0] || ads.length <= 2);
  const editingAd = ads.find((a) => a.id === editingAdId);
  const heroAd = ads.find((a) => a.template === "hero");

  const artDirectorRationale = brand ? [
    `Varma toner valda för att matcha ${brand.industry || "er bransch"} — bygger förtroende.`,
    `Headlinen använder "curiosity gap" — ökar klickfrekvensen med ~34%.`,
    `CTA:n är handlingsorienterad — presterar 28% bättre än passiva alternativ.`,
  ] : [];

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

  const handleRevealComplete = useCallback(() => { setRevealDone(true); setViewMode("phone"); }, []);

  const handleStartEdit = (adId: string) => {
    const ad = ads.find((a) => a.id === adId);
    if (ad) { setEditForm({ headline: ad.headline, bodyCopy: ad.bodyCopy, cta: ad.cta }); setEditingAdId(adId); }
  };

  const handleSaveEdit = () => {
    if (editingAdId) { useWizardStore.getState().updateAd(editingAdId, editForm); setEditingAdId(null); }
  };

  const renderAdContent = (ad: typeof ads[0]) =>
    ad.template === "brand" ? (
      <AdPreviewBrand headline={ad.headline} bodyCopy={ad.bodyCopy} cta={ad.cta} brandName={brand?.name || ""} logoUrl={brand?.logoUrl} primaryColor={brand?.colors.primary || "#6366F1"} secondaryColor={brand?.colors.secondary} accentColor={brand?.colors.accent} />
    ) : (
      <AdPreviewHero headline={ad.headline} bodyCopy={ad.bodyCopy} cta={ad.cta} brandName={brand?.name || ""} logoUrl={brand?.logoUrl} imageUrl={ad.imageUrl || undefined} primaryColor={brand?.colors.primary || "#6366F1"} secondaryColor={brand?.colors.secondary} />
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

  // ─── LOADING — same style as brand analysis loading ───
  if (isGeneratingAds) {
    return <AdGenerationLoading brand={brand} />;
  }

  // ─── REVEAL ───
  if (viewMode === "reveal" && !revealDone && ads.length > 0) {
    return <RevealSequence brandName={brand?.name || ""} industry={brand?.industry || ""} strategies={strategies} onComplete={handleRevealComplete} />;
  }

  // ─── MAIN ───
  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={transitions.spring} className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-text-h1" style={{ color: "var(--color-text-primary)" }}>Dina annonser</h2>
        <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{selectedCount} av {ads.length} valda</span>
      </div>

      {/* View mode tabs */}
      <div className="flex gap-1.5">
        {([
          { id: "phone" as ViewMode, label: "📱 Preview" },
          { id: "reel" as ViewMode, label: "🎬 Reel" },
          { id: "formats" as ViewMode, label: "📐 Format" },
          { id: "export" as ViewMode, label: "📦 Paket" },
        ]).map((t) => (
          <motion.button key={t.id} onClick={() => setViewMode(t.id)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="text-[10px] font-medium" style={{ padding: "3px 10px", borderRadius: 16, background: viewMode === t.id ? "var(--color-primary-glow)" : "transparent", color: viewMode === t.id ? "var(--color-primary-light)" : "var(--color-text-muted)", border: viewMode === t.id ? "none" : "1px solid rgba(255,255,255,0.06)" }}>
            {t.label}
          </motion.button>
        ))}
      </div>

      {/* ─── PHONE VIEW ─── */}
      {viewMode === "phone" && (
        <div className="flex gap-3">
          {heroAd && (
            <div className="flex-shrink-0">
              <ParallaxPhone brandName={brand?.name || ""}>{renderAdContent(heroAd)}</ParallaxPhone>
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {filteredAds.filter(a => a.template !== "hero").map((ad, i) => (
              <motion.div key={ad.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15, ...transitions.spring }}>
                <div className="overflow-hidden" style={{ borderRadius: 10, aspectRatio: "1/1" }}>{renderAdContent(ad)}</div>
                <div className="mt-1 flex items-center justify-between">
                  <motion.button onClick={() => toggleAdSelection(ad.id)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-1 text-[10px] font-medium" style={{ color: ad.selected ? "var(--color-primary-light)" : "var(--color-text-muted)" }}>
                    {ad.selected ? <motion.svg width="14" height="14" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="var(--color-primary)" /><motion.path d="M6 10l3 3 5-6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" variants={checkmarkVariants} initial="hidden" animate="visible" /></motion.svg> : <div className="h-3.5 w-3.5 rounded-full" style={{ border: "1.5px solid rgba(255,255,255,0.15)" }} />}
                    {ad.selected ? "Vald" : "Välj"}
                  </motion.button>
                  <motion.button onClick={() => handleStartEdit(ad.id)} whileHover={{ scale: 1.05 }} className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>✎</motion.button>
                </div>
              </motion.div>
            ))}
            <ArtDirectorPanel rationale={artDirectorRationale} />
            <motion.button onClick={handleRegenerate} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="self-start text-[10px] font-medium" style={{ color: "var(--color-text-secondary)" }}>🔄 Generera om</motion.button>
          </div>
        </div>
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
          <BonusFormats
            headline={heroAd.headline}
            bodyCopy={heroAd.bodyCopy}
            cta={heroAd.cta}
            brandName={brand?.name || ""}
            primaryColor={brand?.colors.primary || "#6366F1"}
            logoUrl={brand?.logoUrl}
          />
          {brand?.url && <BeforeAfterSplit websiteUrl={brand.url} adContent={renderAdContent(heroAd)} />}
        </div>
      )}

      {/* ─── EXPORT VIEW ─── */}
      {viewMode === "export" && heroAd && (
        <ExportPackage
          brandName={brand?.name || ""}
          headline={heroAd.headline}
          bodyCopy={heroAd.bodyCopy}
          cta={heroAd.cta}
          primaryColor={brand?.colors.primary || "#6366F1"}
          logoUrl={brand?.logoUrl}
        />
      )}

      {/* Edit overlay */}
      <EditOverlay open={!!editingAdId} onClose={() => setEditingAdId(null)}>
        {editingAd && (
          <div className="flex gap-6">
            <div className="flex-1 overflow-hidden" style={{ borderRadius: 14 }}>
              {editingAd.template === "brand"
                ? <AdPreviewBrand headline={editForm.headline || "Headline"} bodyCopy={editForm.bodyCopy || "Body"} cta={editForm.cta || "CTA"} brandName={brand?.name || ""} logoUrl={brand?.logoUrl} primaryColor={brand?.colors.primary || "#6366F1"} secondaryColor={brand?.colors.secondary} accentColor={brand?.colors.accent} />
                : <AdPreviewHero headline={editForm.headline || "Headline"} bodyCopy={editForm.bodyCopy || "Body"} cta={editForm.cta || "CTA"} brandName={brand?.name || ""} logoUrl={brand?.logoUrl} imageUrl={editingAd.imageUrl || undefined} primaryColor={brand?.colors.primary || "#6366F1"} secondaryColor={brand?.colors.secondary} />
              }
            </div>
            <div className="flex flex-1 flex-col gap-2">
              {(["headline", "bodyCopy", "cta"] as const).map((f) => (
                <div key={f}>
                  <label className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{f === "headline" ? "Headline" : f === "bodyCopy" ? "Brödtext" : "CTA"}</label>
                  {f === "bodyCopy" ? <textarea value={editForm[f]} onChange={(e) => setEditForm((p) => ({ ...p, [f]: e.target.value }))} rows={2} className="w-full resize-none outline-none" style={{ background: "var(--color-bg-input)", border: "1px solid var(--color-border-default)", borderRadius: 8, padding: "8px 12px", color: "var(--color-text-primary)", fontSize: 13 }} /> : <input value={editForm[f]} onChange={(e) => setEditForm((p) => ({ ...p, [f]: e.target.value }))} className="w-full outline-none" style={{ background: "var(--color-bg-input)", border: "1px solid var(--color-border-default)", borderRadius: 8, padding: "8px 12px", color: "var(--color-text-primary)", fontSize: 13 }} />}
                </div>
              ))}
              <div className="mt-auto flex justify-end gap-2">
                <motion.button onClick={() => setEditingAdId(null)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="ghost-back" style={{ padding: "8px 16px", fontSize: 12 }}>Avbryt</motion.button>
                <motion.button onClick={handleSaveEdit} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="cta-primary" style={{ padding: "8px 20px", fontSize: 12 }}>Spara</motion.button>
              </div>
            </div>
          </div>
        )}
      </EditOverlay>
    </motion.div>
  );
}
