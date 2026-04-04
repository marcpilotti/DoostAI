"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

import { transitions } from "@/lib/motion";
import { useWizardStore } from "@/lib/stores/wizard-store";
import type { AdCreative } from "@/lib/stores/wizard-store";

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

  useEffect(() => {
    if (ad) {
      setForm({ headline: ad.headline, bodyCopy: ad.bodyCopy, cta: ad.cta });
    }
  }, [ad]);

  const handleSave = useCallback(() => {
    if (adId) {
      updateAd(adId, form);
      onClose();
    }
  }, [adId, form, updateAd, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && e.metaKey) handleSave();
    },
    [onClose, handleSave],
  );

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
        imageUrl={ad?.imageUrl || undefined}
        primaryColor={brand?.colors.primary || "#6366F1"}
        secondaryColor={brand?.colors.secondary}
      />
    );

  return (
    <AnimatePresence>
      {ad && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60]"
            style={{ background: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(8px)" }}
            onClick={onClose}
          />

          {/* Modal */}
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
                maxWidth: 680,
                maxHeight: "80vh",
                padding: 28,
                borderRadius: "var(--radius-xl)",
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border-default)",
                boxShadow: "0 24px 80px rgba(0, 0, 0, 0.5)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-[14px]"
                style={{
                  background: "var(--color-bg-raised)",
                  color: "var(--color-text-muted)",
                  border: "1px solid var(--color-border-default)",
                }}
              >
                ✕
              </motion.button>

              {/* Live preview */}
              <div className="flex-1 overflow-hidden" style={{ borderRadius: 14, minHeight: 280 }}>
                {renderPreview(form, ad.template)}
              </div>

              {/* Form */}
              <div className="flex flex-1 flex-col gap-3">
                <h3
                  className="text-[14px] font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Redigera annons
                </h3>

                <div>
                  <label
                    className="mb-1 block text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Headline
                  </label>
                  <input
                    value={form.headline}
                    onChange={(e) => setForm((p) => ({ ...p, headline: e.target.value }))}
                    className="w-full outline-none text-[13px]"
                    style={{
                      background: "var(--color-bg-input)",
                      border: "1px solid var(--color-border-default)",
                      borderRadius: 8,
                      padding: "10px 14px",
                      color: "var(--color-text-primary)",
                    }}
                    autoFocus
                  />
                </div>

                <div>
                  <label
                    className="mb-1 block text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Brödtext
                  </label>
                  <textarea
                    value={form.bodyCopy}
                    onChange={(e) => setForm((p) => ({ ...p, bodyCopy: e.target.value }))}
                    rows={3}
                    className="w-full resize-none outline-none text-[13px]"
                    style={{
                      background: "var(--color-bg-input)",
                      border: "1px solid var(--color-border-default)",
                      borderRadius: 8,
                      padding: "10px 14px",
                      color: "var(--color-text-primary)",
                    }}
                  />
                </div>

                <div>
                  <label
                    className="mb-1 block text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    CTA
                  </label>
                  <input
                    value={form.cta}
                    onChange={(e) => setForm((p) => ({ ...p, cta: e.target.value }))}
                    className="w-full outline-none text-[13px]"
                    style={{
                      background: "var(--color-bg-input)",
                      border: "1px solid var(--color-border-default)",
                      borderRadius: 8,
                      padding: "10px 14px",
                      color: "var(--color-text-primary)",
                    }}
                  />
                </div>

                <div className="mt-auto flex justify-end gap-2 pt-2">
                  <motion.button
                    onClick={onClose}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="ghost-back"
                    style={{ padding: "8px 18px", fontSize: 12 }}
                  >
                    Avbryt
                  </motion.button>
                  <motion.button
                    onClick={handleSave}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="cta-primary"
                    style={{ padding: "8px 22px", fontSize: 12 }}
                  >
                    Spara
                  </motion.button>
                </div>

                <p
                  className="text-[9px] text-center"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  ⌘+Enter för att spara · Esc för att avbryta
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
