"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { transitions } from "@/lib/motion";
import type { AdCreative } from "@/lib/stores/wizard-store";
import { useWizardStore } from "@/lib/stores/wizard-store";

const CTA_OPTIONS = [
  "Läs mer",
  "Kontakta oss",
  "Handla nu",
  "Boka nu",
  "Registrera dig",
  "Få offert",
  "Testa gratis",
  "Kom igång",
  "Se mer",
  "Ring oss",
];

const CHAR_LIMITS: Record<string, { headline: number; bodyCopy: number }> = {
  meta: { headline: 40, bodyCopy: 125 },
  google: { headline: 30, bodyCopy: 90 },
  linkedin: { headline: 70, bodyCopy: 150 },
};

function CharCount({ current, max }: { current: number; max: number }) {
  const ratio = current / max;
  const color =
    ratio > 1
      ? "var(--color-error)"
      : ratio > 0.9
        ? "var(--color-warning)"
        : "var(--color-text-muted)";
  return (
    <span className="text-[10px] tabular-nums" style={{ color }}>
      {current}/{max}
    </span>
  );
}

type AdEditModalProps = {
  adId: string | null;
  onClose: () => void;
};

export function AdEditModal({ adId, onClose }: AdEditModalProps) {
  const { ads, brand, updateAd } = useWizardStore();
  const ad = ads.find((a) => a.id === adId);

  const [form, setForm] = useState({ headline: "", bodyCopy: "", cta: "" });
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const platform = ad?.platform || "meta";
  const limits = CHAR_LIMITS[platform] ?? { headline: 40, bodyCopy: 125 };

  useEffect(() => {
    if (ad) {
      setForm({ headline: ad.headline, bodyCopy: ad.bodyCopy, cta: ad.cta });
      setCustomImageUrl(null);
      setSaved(false);
    }
  }, [ad]);

  const handleSave = useCallback(() => {
    if (adId) {
      const updates: Partial<AdCreative> = { ...form };
      if (customImageUrl) updates.imageUrl = customImageUrl;
      updateAd(adId, updates);
      setSaved(true);
      setTimeout(() => onClose(), 400);
    }
  }, [adId, form, customImageUrl, updateAd, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && e.metaKey) handleSave();
    },
    [onClose, handleSave],
  );

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => setCustomImageUrl(reader.result as string);
      reader.readAsDataURL(file);
    },
    [],
  );

  const previewImageUrl = customImageUrl ?? ad?.imageUrl ?? undefined;
  const primaryColor = brand?.colors.primary || "#6366F1";

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
            style={{
              background: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(8px)",
            }}
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
                maxWidth: 720,
                maxHeight: "85vh",
                padding: 24,
                borderRadius: "var(--radius-xl)",
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border-default)",
                boxShadow: "0 24px 80px rgba(0, 0, 0, 0.5)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
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

              {/* ── Live Preview ── */}
              <div
                className="flex-1 overflow-hidden"
                style={{
                  borderRadius: 14,
                  aspectRatio: "4/5",
                  position: "relative",
                }}
              >
                {previewImageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewImageUrl}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(to top, ${primaryColor}E0 0%, ${primaryColor}60 35%, transparent 70%)`,
                      }}
                    />
                  </>
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(145deg, ${primaryColor} 0%, ${primaryColor}CC 100%)`,
                    }}
                  >
                    <div
                      className="absolute -right-8 -top-8 h-28 w-28 rounded-full"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-1.5 p-5">
                  <span
                    className="text-[8px] font-semibold uppercase tracking-[0.12em]"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    {brand?.name}
                  </span>
                  <h3
                    className="text-[16px] font-extrabold leading-tight"
                    style={{ color: "#fff" }}
                  >
                    {form.headline || "Headline"}
                  </h3>
                  <p
                    className="line-clamp-2 text-[11px] leading-relaxed"
                    style={{ color: "rgba(255,255,255,0.75)" }}
                  >
                    {form.bodyCopy || "Body"}
                  </p>
                  <span
                    className="mt-1 inline-flex items-center gap-1 self-start rounded-lg px-3 py-1.5 text-[11px] font-bold"
                    style={{
                      background: "rgba(255,255,255,0.9)",
                      color: primaryColor,
                    }}
                  >
                    {form.cta || "CTA"} →
                  </span>
                </div>
              </div>

              {/* ── Edit Form ── */}
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
                <h3
                  className="text-[15px] font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Redigera annons
                </h3>

                {/* Section: Copy */}
                <div className="flex flex-col gap-2.5">
                  <span
                    className="text-[10px] font-medium uppercase tracking-wider"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Annonstext
                  </span>

                  <div>
                    <div className="mb-0.5 flex items-center justify-between">
                      <label
                        className="text-[10px] font-semibold"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        Rubrik
                      </label>
                      <CharCount
                        current={form.headline.length}
                        max={limits.headline}
                      />
                    </div>
                    <input
                      value={form.headline}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, headline: e.target.value }))
                      }
                      className="w-full text-[13px] outline-none"
                      style={{
                        background: "var(--color-bg-input)",
                        border: "1px solid var(--color-border-default)",
                        borderRadius: 8,
                        padding: "8px 12px",
                        color: "var(--color-text-primary)",
                      }}
                      autoFocus
                    />
                  </div>

                  <div>
                    <div className="mb-0.5 flex items-center justify-between">
                      <label
                        className="text-[10px] font-semibold"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        Brödtext
                      </label>
                      <CharCount
                        current={form.bodyCopy.length}
                        max={limits.bodyCopy}
                      />
                    </div>
                    <textarea
                      value={form.bodyCopy}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, bodyCopy: e.target.value }))
                      }
                      rows={3}
                      className="w-full resize-none text-[13px] outline-none"
                      style={{
                        background: "var(--color-bg-input)",
                        border: "1px solid var(--color-border-default)",
                        borderRadius: 8,
                        padding: "8px 12px",
                        color: "var(--color-text-primary)",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      className="mb-1 block text-[10px] font-semibold"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      CTA-knapp
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {CTA_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          onClick={() =>
                            setForm((p) => ({ ...p, cta: opt }))
                          }
                          className="text-[11px] font-medium transition-all"
                          style={{
                            padding: "3px 10px",
                            borderRadius: 14,
                            background:
                              form.cta === opt
                                ? "rgba(99,102,241,0.15)"
                                : "transparent",
                            color:
                              form.cta === opt
                                ? "var(--color-primary-light)"
                                : "var(--color-text-muted)",
                            border:
                              form.cta === opt
                                ? "1px solid rgba(99,102,241,0.3)"
                                : "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div
                  style={{
                    height: 1,
                    background: "var(--color-border-subtle)",
                  }}
                />

                {/* Section: Image */}
                <div className="flex flex-col gap-2">
                  <span
                    className="text-[10px] font-medium uppercase tracking-wider"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Bild
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
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
                      color: customImageUrl
                        ? "var(--color-primary-light)"
                        : "var(--color-text-muted)",
                    }}
                  >
                    {customImageUrl
                      ? "✓ Ny bild vald — klicka för att byta"
                      : "Ladda upp egen bakgrund..."}
                  </motion.button>
                </div>

                {/* Action bar */}
                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                  {saved && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[11px] font-medium"
                      style={{ color: "var(--color-success)" }}
                    >
                      ✓ Sparad
                    </motion.span>
                  )}
                  <div className="ml-auto flex gap-2">
                    <motion.button
                      onClick={onClose}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="ghost-back"
                      style={{ padding: "7px 16px", fontSize: 12 }}
                    >
                      Avbryt
                    </motion.button>
                    <motion.button
                      onClick={handleSave}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="cta-primary"
                      style={{
                        padding: "7px 20px",
                        fontSize: 12,
                        minHeight: "auto",
                      }}
                    >
                      Spara ändringar
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
