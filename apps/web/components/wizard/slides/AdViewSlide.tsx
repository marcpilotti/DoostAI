"use client";

import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

import { useWizardNavigation } from "@/hooks/use-wizard-navigation";
import { cardVariants, checkmarkVariants, transitions } from "@/lib/motion";
import { type Platform, useWizardStore } from "@/lib/stores/wizard-store";

import { EditOverlay } from "../shared/EditOverlay";
import { PlatformMockup } from "../shared/PlatformMockup";

const PLATFORM_TAB_LABELS: Record<string, string> = {
  meta: "Meta",
  google: "Google",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  snapchat: "Snapchat",
};

/**
 * Render an ad via the Satori pipeline and return a data URL.
 */
async function renderAdImage(params: {
  template: string;
  headline: string;
  bodyCopy: string;
  cta: string;
  brandName: string;
  logoUrl?: string;
  imageUrl?: string;
  colors: Record<string, string | undefined>;
}): Promise<string | null> {
  try {
    const res = await fetch("/api/ads/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

export function AdViewSlide() {
  const {
    ads,
    selectedPlatforms,
    brand,
    isGeneratingAds,
    toggleAdSelection,
    updateAd,
    setAds,
    setFooterAction,
  } = useWizardStore();
  const { handleNext } = useWizardNavigation();
  const [activeTab, setActiveTab] = useState<Platform>(selectedPlatforms[0] || "meta");
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ headline: "", bodyCopy: "", cta: "" });
  const [renderedUrls, setRenderedUrls] = useState<Record<string, string>>({});
  const [isRendering, setIsRendering] = useState(false);

  const selectedCount = ads.filter((a) => a.selected).length;
  const filteredAds = ads.filter((a) => a.platform === activeTab || ads.length <= 2);
  const editingAd = ads.find((a) => a.id === editingAdId);

  // Register footer action
  useEffect(() => {
    setFooterAction(() => handleNext(), selectedCount === 0);
    return () => setFooterAction(null);
  }, [selectedCount, handleNext, setFooterAction]);

  // Render ads via Satori when they change
  const renderAds = useCallback(async () => {
    if (ads.length === 0 || !brand) return;
    setIsRendering(true);

    const results: Record<string, string> = {};

    await Promise.all(
      ads.map(async (ad) => {
        const url = await renderAdImage({
          template: ad.template,
          headline: ad.headline,
          bodyCopy: ad.bodyCopy,
          cta: ad.cta,
          brandName: brand.name,
          logoUrl: brand.logoUrl,
          imageUrl: ad.imageUrl || undefined,
          colors: brand.colors,
        });
        if (url) results[ad.id] = url;
      })
    );

    setRenderedUrls(results);
    setIsRendering(false);
  }, [ads, brand]);

  useEffect(() => {
    if (ads.length > 0 && !isGeneratingAds) {
      renderAds();
    }
  }, [ads, isGeneratingAds, renderAds]);

  const handleStartEdit = (adId: string) => {
    const ad = ads.find((a) => a.id === adId);
    if (ad) {
      setEditForm({ headline: ad.headline, bodyCopy: ad.bodyCopy, cta: ad.cta });
      setEditingAdId(adId);
    }
  };

  const handleSaveEdit = async () => {
    if (editingAdId) {
      updateAd(editingAdId, editForm);
      setEditingAdId(null);

      // Re-render the edited ad
      if (brand) {
        const ad = ads.find((a) => a.id === editingAdId);
        if (ad) {
          const url = await renderAdImage({
            template: ad.template,
            headline: editForm.headline,
            bodyCopy: editForm.bodyCopy,
            cta: editForm.cta,
            brandName: brand.name,
            logoUrl: brand.logoUrl,
            imageUrl: ad.imageUrl || undefined,
            colors: brand.colors,
          });
          if (url) {
            setRenderedUrls((prev) => ({ ...prev, [editingAdId]: url }));
          }
        }
      }
    }
  };

  const handleRegenerate = async () => {
    if (!brand) return;
    useWizardStore.getState().setIsGeneratingAds(true);

    try {
      const response = await fetch("/api/ad/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: {
            name: brand.name,
            description: brand.description,
            industry: brand.industry,
            targetAudience: brand.targetAudience,
            valuePropositions: brand.valuePropositions,
            url: brand.url,
            colors: brand.colors,
            fonts: brand.fonts,
          },
          platform: activeTab,
          language: "sv",
        }),
      });

      if (!response.ok) throw new Error("Regeneration failed");

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") continue;

          try {
            const data = JSON.parse(raw);
            if (data.event === "complete" && data.result?.copies) {
              const newAds = data.result.copies.map(
                (c: Record<string, string>, i: number) => ({
                  id: `ad-regen-${Date.now()}-${i}`,
                  platform: activeTab,
                  template: i === 0 ? ("hero" as const) : ("brand" as const),
                  headline: c.headline || "",
                  bodyCopy: c.bodyCopy || "",
                  cta: c.cta || "Läs mer",
                  imageUrl: data.result.backgroundUrl,
                  selected: i === 0,
                })
              );
              setAds(newAds);
            }
          } catch {
            // ignore
          }
        }
      }
    } catch (err) {
      console.error("Regeneration failed:", err);
    } finally {
      useWizardStore.getState().setIsGeneratingAds(false);
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={transitions.spring}
      className="relative flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-text-h1" style={{ color: "var(--color-text-primary)" }}>
          Dina annonser
        </h2>
        <span className="text-text-body-sm" style={{ color: "var(--color-text-muted)" }}>
          {selectedCount} av {ads.length} valda
        </span>
      </div>

      {/* Platform tabs */}
      {selectedPlatforms.length > 1 && (
        <div className="relative flex gap-2">
          {selectedPlatforms.map((p) => (
            <motion.button
              key={p}
              onClick={() => setActiveTab(p)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="relative text-[13px] font-medium"
              style={{
                padding: "5px 14px",
                borderRadius: 20,
                background: "transparent",
                color: activeTab === p ? "var(--color-primary-light)" : "var(--color-text-muted)",
                border: activeTab === p ? "none" : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {activeTab === p && (
                <motion.div
                  layoutId="adview-tab-bg"
                  className="absolute inset-0"
                  style={{
                    borderRadius: 20,
                    background: "var(--color-primary-glow)",
                  }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                />
              )}
              <span className="relative z-10">
                {activeTab === p ? "● " : "○ "}
                {PLATFORM_TAB_LABELS[p]}
              </span>
            </motion.button>
          ))}
        </div>
      )}

      {/* Ads grid */}
      {isGeneratingAds || isRendering ? (
        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <motion.div
              key={i}
              className="overflow-hidden"
              style={{
                borderRadius: 14,
                aspectRatio: "4/3",
                background: "var(--color-bg-raised)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filteredAds.map((ad, i) => (
            <motion.div
              key={ad.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.2, ...transitions.spring }}
              whileHover={{ y: -3 }}
              className="relative"
            >
              <PlatformMockup
                platform={ad.platform}
                brandName={brand?.name || ""}
                logoUrl={brand?.logoUrl}
              >
                {renderedUrls[ad.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={renderedUrls[ad.id]}
                    alt={ad.headline}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center p-4 text-center"
                    style={{
                      background: brand?.colors.primary || "var(--color-primary)",
                      color: "#fff",
                    }}
                  >
                    <div>
                      <p className="text-lg font-bold drop-shadow-md">{ad.headline}</p>
                      <p className="mt-1 text-sm opacity-90 drop-shadow-md">{ad.bodyCopy}</p>
                    </div>
                  </div>
                )}
              </PlatformMockup>

              {/* Selection + edit controls */}
              <div className="mt-1.5 flex items-center justify-between">
                <button
                  onClick={() => toggleAdSelection(ad.id)}
                  className="flex items-center gap-1.5 text-[13px] font-medium"
                  style={{
                    color: ad.selected ? "var(--color-primary-light)" : "var(--color-text-muted)",
                  }}
                >
                  {ad.selected ? (
                    <motion.svg width="18" height="18" viewBox="0 0 20 20">
                      <circle cx="10" cy="10" r="9" fill="var(--color-primary)" />
                      <motion.path
                        d="M6 10l3 3 5-6"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        variants={checkmarkVariants}
                        initial="hidden"
                        animate="visible"
                      />
                    </motion.svg>
                  ) : (
                    <div
                      className="h-[18px] w-[18px] rounded-full"
                      style={{ border: "1.5px solid rgba(255,255,255,0.12)" }}
                    />
                  )}
                  {ad.selected ? "Vald" : "Välj"}
                </button>
                <button
                  onClick={() => handleStartEdit(ad.id)}
                  className="text-[13px]"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  ✎ Redigera
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Regenerate button */}
      {!isGeneratingAds && !isRendering && (
        <motion.button
          onClick={handleRegenerate}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="self-center text-[13px] font-medium"
          style={{ color: "var(--color-text-secondary)" }}
        >
          🔄 Generera om
        </motion.button>
      )}

      {/* Edit overlay with live preview */}
      <EditOverlay open={!!editingAdId} onClose={() => setEditingAdId(null)}>
        {editingAd && (
          <div className="flex gap-6">
            {/* Live preview — CSS clone of template */}
            <div className="flex-1">
              <div
                className="flex aspect-square items-center justify-center overflow-hidden p-6 text-center"
                style={{
                  background: brand?.colors.primary
                    ? `linear-gradient(135deg, ${brand.colors.primary} 0%, ${brand.colors.secondary || brand.colors.primary}80 100%)`
                    : "var(--color-primary)",
                  color: "#fff",
                  borderRadius: 14,
                  position: "relative",
                }}
              >
                {/* Logo */}
                {brand?.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={brand.logoUrl}
                    alt=""
                    className="absolute left-4 top-4 h-8 w-8 rounded-lg object-contain"
                    style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                  />
                )}
                <div>
                  <p className="text-xl font-bold drop-shadow-md">{editForm.headline || "Headline"}</p>
                  <p className="mt-2 text-sm opacity-85 drop-shadow-md">{editForm.bodyCopy || "Body copy"}</p>
                  <div
                    className="mx-auto mt-4 inline-block rounded-lg px-6 py-2 text-sm font-bold"
                    style={{
                      background: "rgba(255,255,255,0.95)",
                      color: brand?.colors.primary || "var(--color-primary)",
                    }}
                  >
                    {editForm.cta || "Läs mer"} →
                  </div>
                </div>
              </div>
            </div>

            {/* Edit form */}
            <div className="flex flex-1 flex-col gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                  Headline
                </label>
                <input
                  value={editForm.headline}
                  onChange={(e) => setEditForm((f) => ({ ...f, headline: e.target.value }))}
                  className="w-full outline-none"
                  style={{
                    background: "var(--color-bg-input)",
                    border: "1px solid var(--color-border-default)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    color: "var(--color-text-primary)",
                    fontSize: 15,
                  }}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                  Brödtext
                </label>
                <textarea
                  value={editForm.bodyCopy}
                  onChange={(e) => setEditForm((f) => ({ ...f, bodyCopy: e.target.value }))}
                  rows={3}
                  className="w-full resize-none outline-none"
                  style={{
                    background: "var(--color-bg-input)",
                    border: "1px solid var(--color-border-default)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    color: "var(--color-text-primary)",
                    fontSize: 15,
                  }}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                  CTA
                </label>
                <input
                  value={editForm.cta}
                  onChange={(e) => setEditForm((f) => ({ ...f, cta: e.target.value }))}
                  className="w-full outline-none"
                  style={{
                    background: "var(--color-bg-input)",
                    border: "1px solid var(--color-border-default)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    color: "var(--color-text-primary)",
                    fontSize: 15,
                  }}
                />
              </div>
              <div className="mt-auto flex justify-end gap-2">
                <motion.button
                  onClick={() => setEditingAdId(null)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                  className="ghost-back"
                >
                  Avbryt
                </motion.button>
                <motion.button
                  onClick={handleSaveEdit}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                  className="cta-primary"
                  style={{ padding: "10px 24px", fontSize: 14 }}
                >
                  Spara & rendera
                </motion.button>
              </div>
            </div>
          </div>
        )}
      </EditOverlay>
    </motion.div>
  );
}
