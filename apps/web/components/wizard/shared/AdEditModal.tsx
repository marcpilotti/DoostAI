"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { transitions } from "@/lib/motion";
import type { AdCreative } from "@/lib/stores/wizard-store";
import { useWizardStore } from "@/lib/stores/wizard-store";

import { AdPreviewBrand } from "./AdPreviewBrand";
import { AdPreviewHero } from "./AdPreviewHero";

type AdEditModalProps = {
  adId: string | null;
  onClose: () => void;
};

export function AdEditModal({ adId, onClose }: AdEditModalProps) {
  const { ads, brand, updateAd } = useWizardStore();
  const ad = ads.find((a) => a.id === adId);

  const [form, setForm] = useState({ headline: "", bodyCopy: "", cta: "" });
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ad) {
      setForm({ headline: ad.headline, bodyCopy: ad.bodyCopy, cta: ad.cta });
      setCustomImageUrl(null);
    }
  }, [ad]);

  const handleSave = useCallback(() => {
    if (adId) {
      const updates: Partial<AdCreative> = { ...form };
      if (customImageUrl) updates.imageUrl = customImageUrl;
      updateAd(adId, updates);
      onClose();
    }
  }, [adId, form, customImageUrl, updateAd, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && e.metaKey) handleSave();
    },
    [onClose, handleSave],
  );

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCustomImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const previewImageUrl = customImageUrl ?? ad?.imageUrl ?? undefined;

  const renderPreview = (data: { headline: string; bodyCopy: string; cta: string }, template: AdCreative["template"]) =>
    template === "brand" ? (
      <AdPreviewBrand
        headline={data.headline || "Headline"}
        bodyCopy={data.bodyCopy || "Body"}
        cta={data.cta || "CTA"}
        brandName={brand?.name || ""}
        logoUrl={brand?.logoUrl}
        primaryColor={brand?.colors.primary || "#6366F1"}
        secondaryColor={brand?.colors.secondary}
        accentColor={brand?.colors.accent}
      />
    ) : (
      <AdPreviewHero
        headline={data.headline || "Headline"}
        bodyCopy={data.bodyCopy || "Body"}
        cta={data.cta || "CTA"}
        brandName={brand?.name || ""}
        logoUrl={brand?.logoUrl}
        imageUrl={previewImageUrl}
        primaryColor={brand?.colors.primary || "#6366F1"}
        secondaryColor={brand?.colors.secondary}
      />
    );

  return (
    <AnimatePresence>
      {ad && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60]"
            style={{ background: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(8px)" }}
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={transitions.spring}
            className="fixed inset-0 z-[61] flex items-center justify-center p-6"
            onKeyDown={handleKeyDown}
          >
            <div
              className="relative flex w-full gap-6"
              style={{
                maxWidth: 700,
                maxHeight: "85vh",
                padding: 24,
                borderRadius: "var(--radius-xl)",
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border-default)",
                boxShadow: "0 24px 80px rgba(0, 0, 0, 0.5)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-[14px]"
                style={{ background: "var(--color-bg-raised)", color: "var(--color-text-muted)", border: "1px solid var(--color-border-default)" }}
              >
                ✕
              </motion.button>

              {/* Live preview */}
              <div className="flex-1 overflow-hidden" style={{ borderRadius: 14, minHeight: 260, aspectRatio: "4/5" }}>
                {renderPreview(form, ad.template)}
              </div>

              {/* Form */}
              <div className="flex flex-1 flex-col gap-2.5">
                <h3 className="text-[14px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  Redigera annons
                </h3>

                {/* Headline */}
                <div>
                  <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Headline</label>
                  <input
                    value={form.headline}
                    onChange={(e) => setForm((p) => ({ ...p, headline: e.target.value }))}
                    className="w-full outline-none text-[13px]"
                    style={{ background: "var(--color-bg-input)", border: "1px solid var(--color-border-default)", borderRadius: 8, padding: "8px 12px", color: "var(--color-text-primary)" }}
                    autoFocus
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Brödtext</label>
                  <textarea
                    value={form.bodyCopy}
                    onChange={(e) => setForm((p) => ({ ...p, bodyCopy: e.target.value }))}
                    rows={2}
                    className="w-full resize-none outline-none text-[13px]"
                    style={{ background: "var(--color-bg-input)", border: "1px solid var(--color-border-default)", borderRadius: 8, padding: "8px 12px", color: "var(--color-text-primary)" }}
                  />
                </div>

                {/* CTA */}
                <div>
                  <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>CTA</label>
                  <input
                    value={form.cta}
                    onChange={(e) => setForm((p) => ({ ...p, cta: e.target.value }))}
                    className="w-full outline-none text-[13px]"
                    style={{ background: "var(--color-bg-input)", border: "1px solid var(--color-border-default)", borderRadius: 8, padding: "8px 12px", color: "var(--color-text-primary)" }}
                  />
                </div>

                {/* Background image upload */}
                <div>
                  <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Bakgrundsbild</label>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <motion.button
                    onClick={() => fileInputRef.current?.click()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex w-full items-center gap-2 text-[12px] font-medium"
                    style={{
                      background: "var(--color-bg-input)",
                      border: "1px dashed var(--color-border-default)",
                      borderRadius: 8,
                      padding: "8px 12px",
                      color: customImageUrl ? "var(--color-primary-light)" : "var(--color-text-muted)",
                    }}
                  >
                    {customImageUrl ? "Ny bild vald — klicka för att byta" : "Ladda upp egen bakgrund..."}
                  </motion.button>
                </div>

                {/* Actions */}
                <div className="mt-auto flex justify-end gap-2 pt-1">
                  <motion.button onClick={onClose} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="ghost-back" style={{ padding: "7px 16px", fontSize: 12 }}>
                    Avbryt
                  </motion.button>
                  <motion.button onClick={handleSave} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="cta-primary" style={{ padding: "7px 20px", fontSize: 12 }}>
                    Spara
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
