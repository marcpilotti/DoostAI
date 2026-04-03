"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

import { useWizardNavigation } from "@/hooks/use-wizard-navigation";
import { cardVariants, checkmarkVariants,transitions } from "@/lib/motion";
import { type Platform,useWizardStore } from "@/lib/stores/wizard-store";

import { EditOverlay } from "../shared/EditOverlay";
import { PlatformMockup } from "../shared/PlatformMockup";

const PLATFORM_TAB_LABELS: Record<string, string> = {
  meta: "Meta",
  google: "Google",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  snapchat: "Snapchat",
};

export function AdViewSlide() {
  const { ads, selectedPlatforms, brand, isGeneratingAds, toggleAdSelection, updateAd, setAds, setFooterAction } =
    useWizardStore();
  const { handleNext } = useWizardNavigation();
  const [activeTab, setActiveTab] = useState<Platform>(selectedPlatforms[0] || "meta");
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ headline: "", bodyCopy: "", cta: "" });

  const selectedCount = ads.filter((a) => a.selected).length;

  useEffect(() => {
    setFooterAction(() => handleNext(), selectedCount === 0);
    return () => setFooterAction(null);
  }, [selectedCount, handleNext, setFooterAction]);
  const filteredAds = ads.filter((a) => a.platform === activeTab || ads.length <= 2);
  const editingAd = ads.find((a) => a.id === editingAdId);

  const handleStartEdit = (adId: string) => {
    const ad = ads.find((a) => a.id === adId);
    if (ad) {
      setEditForm({ headline: ad.headline, bodyCopy: ad.bodyCopy, cta: ad.cta });
      setEditingAdId(adId);
    }
  };

  const handleSaveEdit = () => {
    if (editingAdId) {
      updateAd(editingAdId, editForm);
      setEditingAdId(null);
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
      className="relative flex flex-col gap-4"
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
        <div className="flex gap-2">
          {selectedPlatforms.map((p) => (
            <button
              key={p}
              onClick={() => setActiveTab(p)}
              className="text-text-body-sm font-medium transition-colors"
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-full)",
                background: activeTab === p ? "var(--color-primary-glow)" : "transparent",
                color: activeTab === p ? "var(--color-primary-light)" : "var(--color-text-muted)",
                border: activeTab === p ? "none" : "1px solid var(--color-border-default)",
              }}
            >
              {activeTab === p ? "● " : "○ "}
              {PLATFORM_TAB_LABELS[p]}
            </button>
          ))}
        </div>
      )}

      {/* Ads grid */}
      {isGeneratingAds ? (
        <div className="grid grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="skeleton aspect-square"
              style={{
                borderRadius: "var(--radius-lg)",
                minHeight: 200,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filteredAds.map((ad) => (
            <motion.div
              key={ad.id}
              whileHover={{ y: -3 }}
              transition={transitions.spring}
              className="relative"
            >
              <PlatformMockup
                platform={ad.platform}
                brandName={brand?.name || ""}
                logoUrl={brand?.logoUrl}
              >
                <div
                  className="relative flex h-full w-full items-center justify-center p-4 text-center"
                  style={{
                    background: brand?.colors.primary || "var(--color-primary)",
                    color: "#fff",
                  }}
                >
                  {/* Background image if available — falls back to solid color */}
                  {ad.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ad.imageUrl}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  <div className="relative z-10">
                    <p className="text-lg font-bold drop-shadow-md">{ad.headline}</p>
                    <p className="mt-1 text-sm opacity-90 drop-shadow-md">{ad.bodyCopy}</p>
                  </div>
                </div>
              </PlatformMockup>

              {/* Selection + edit controls */}
              <div className="mt-2 flex items-center justify-between">
                <button
                  onClick={() => toggleAdSelection(ad.id)}
                  className="flex items-center gap-2 text-text-body-sm font-medium"
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
                        stroke="var(--color-text-inverse)"
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
                      style={{ border: "2px solid var(--color-border-default)" }}
                    />
                  )}
                  {ad.selected ? "Vald" : "Välj"}
                </button>
                <button
                  onClick={() => handleStartEdit(ad.id)}
                  className="text-text-body-sm"
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
      {!isGeneratingAds && (
        <button
          onClick={handleRegenerate}
          className="text-text-body-sm font-medium"
          style={{ color: "var(--color-text-secondary)" }}
        >
          🔄 Generera om
        </button>
      )}

      {/* Edit overlay */}
      <EditOverlay open={!!editingAdId} onClose={() => setEditingAdId(null)}>
        {editingAd && (
          <div className="flex gap-6">
            {/* Live preview */}
            <div className="flex-1">
              <div
                className="flex aspect-square items-center justify-center p-4 text-center"
                style={{
                  background: brand?.colors.primary || "var(--color-primary)",
                  color: "#fff",
                  borderRadius: "var(--radius-lg)",
                }}
              >
                <div>
                  <p className="text-lg font-bold">{editForm.headline}</p>
                  <p className="mt-1 text-sm opacity-80">{editForm.bodyCopy}</p>
                </div>
              </div>
            </div>

            {/* Edit form */}
            <div className="flex flex-1 flex-col gap-3">
              <div>
                <label className="text-text-caption mb-1 block" style={{ color: "var(--color-text-muted)" }}>
                  Headline
                </label>
                <input
                  value={editForm.headline}
                  onChange={(e) => setEditForm((f) => ({ ...f, headline: e.target.value }))}
                  className="w-full outline-none"
                  style={{
                    background: "var(--color-bg-input)",
                    border: "1px solid var(--color-border-default)",
                    borderRadius: "var(--radius-md)",
                    padding: "12px 16px",
                    color: "var(--color-text-primary)",
                    fontSize: 16,
                  }}
                />
              </div>
              <div>
                <label className="text-text-caption mb-1 block" style={{ color: "var(--color-text-muted)" }}>
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
                    borderRadius: "var(--radius-md)",
                    padding: "12px 16px",
                    color: "var(--color-text-primary)",
                    fontSize: 16,
                  }}
                />
              </div>
              <div className="mt-auto flex justify-end gap-2">
                <button
                  onClick={() => setEditingAdId(null)}
                  className="text-text-body-sm font-medium"
                  style={{
                    padding: "10px 20px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border-default)",
                    color: "var(--color-text-secondary)",
                    background: "transparent",
                  }}
                >
                  Avbryt
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="text-text-body-sm font-semibold"
                  style={{
                    padding: "10px 20px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--color-primary)",
                    color: "var(--color-text-inverse)",
                    border: "none",
                  }}
                >
                  Spara
                </button>
              </div>
            </div>
          </div>
        )}
      </EditOverlay>
    </motion.div>
  );
}
