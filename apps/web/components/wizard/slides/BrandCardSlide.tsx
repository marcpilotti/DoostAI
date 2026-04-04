"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useWizardNavigation } from "@/hooks/use-wizard-navigation";
import { cardVariants, listItemVariants,transitions } from "@/lib/motion";
import { useWizardStore } from "@/lib/stores/wizard-store";

export function BrandCardSlide() {
  const { brand, setBrand, setFooterAction } = useWizardStore();
  const { handleNext } = useWizardNavigation();
  const [isEditing, setIsEditing] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFooterAction(() => handleNext());
    return () => setFooterAction(null);
  }, [handleNext, setFooterAction]);

  const handleLogoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !brand) return;

      setLogoUploading(true);
      const reader = new FileReader();
      reader.onload = () => {
        setBrand({ ...brand, logoUrl: reader.result as string });
        setLogoUploading(false);
      };
      reader.onerror = () => setLogoUploading(false);
      reader.readAsDataURL(file);
    },
    [brand, setBrand],
  );

  if (!brand) return null;

  const handleFieldChange = (field: string, value: string) => {
    setBrand({ ...brand, [field]: value });
  };

  const handleFontChange = (type: "heading" | "body", value: string) => {
    setBrand({ ...brand, fonts: { heading: brand.fonts?.heading || "", body: brand.fonts?.body || "", [type]: value } });
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={transitions.spring}
      className="flex w-full flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-text-h1" style={{ color: "var(--color-text-primary)" }}>
            Ditt varumärke
          </h2>
          <p className="mt-1 text-text-body-sm" style={{ color: "var(--color-text-muted)" }}>
            Så ser ditt varumärke ut för AI:n. Redigera om något stämmer dåligt.
          </p>
        </div>
        <motion.button
          onClick={() => setIsEditing(!isEditing)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="text-text-body-sm font-medium"
          style={{ color: "var(--color-primary)" }}
        >
          {isEditing ? "Klar" : "✎ Redigera"}
        </motion.button>
      </div>

      {/* Brand card */}
      <motion.div
        className="ai-border"
        style={{
          borderRadius: "var(--radius-xl)",
          background: "linear-gradient(135deg, var(--color-bg-elevated) 0%, rgba(99, 102, 241, 0.03) 100%)",
          boxShadow: "var(--shadow-lg), var(--shadow-glow-sm)",
          padding: "var(--space-6)",
        }}
        variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } } }}
        initial="hidden"
        animate="visible"
      >
        {/* Header: logo + name + industry */}
        <motion.div variants={listItemVariants} className="flex items-start gap-4">
          {/* Logo — clickable to upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />
          {/* Logo — dynamic width, clickable to upload */}
          <motion.button
            onClick={() => fileInputRef.current?.click()}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="group relative h-12 shrink-0 overflow-hidden rounded-lg"
            style={{ background: "var(--color-bg-raised)", border: "1px solid var(--color-border-default)" }}
            title="Klicka för att byta logotyp"
          >
            {logoUploading ? (
              <div className="flex h-full w-16 items-center justify-center">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" style={{ color: "var(--color-primary)" }} />
              </div>
            ) : brand.logoUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  className="h-full w-auto object-contain px-3"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="text-[9px] font-medium text-white">Byt logotyp</span>
                </div>
              </>
            ) : (
              <div className="flex h-full w-16 items-center justify-center">
                <span className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
                  {brand.name.charAt(0)}
                </span>
              </div>
            )}
          </motion.button>
          <div className="flex-1">
            {isEditing ? (
              <input
                value={brand.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                className="w-full bg-transparent text-text-h2 font-bold outline-none"
                style={{
                  color: "var(--color-text-primary)",
                  borderBottom: "1px solid var(--color-border-focus)",
                }}
              />
            ) : (
              <h3 className="text-text-h2" style={{ color: "var(--color-text-primary)" }}>
                {brand.name}
              </h3>
            )}
            <p className="text-text-body-sm" style={{ color: "var(--color-text-muted)" }}>
              {brand.industry}
              {brand.subIndustry && ` · ${brand.subIndustry}`}
            </p>
          </div>
        </motion.div>

        {/* Description */}
        <motion.div
          variants={listItemVariants}
          className="mt-4"
        >
          {isEditing ? (
            <textarea
              value={brand.description}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              className="w-full resize-none bg-transparent text-text-body outline-none"
              style={{
                color: "var(--color-text-secondary)",
                borderBottom: "1px solid var(--color-border-focus)",
              }}
              rows={3}
            />
          ) : (
            <p className="text-text-body italic" style={{ color: "var(--color-text-secondary)" }}>
              &ldquo;{brand.description}&rdquo;
            </p>
          )}
        </motion.div>

        {/* Colors */}
        <motion.div variants={listItemVariants} className="mt-4 flex items-center gap-2">
          {Object.entries(brand.colors).map(([name, hex]) =>
            hex ? (
              <motion.div
                key={name}
                className="h-8 w-8 cursor-pointer"
                title={name}
                whileHover={{ scale: 1.2, boxShadow: `0 0 20px ${hex}80` }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                style={{
                  backgroundColor: hex,
                  borderRadius: "var(--radius-sm)",
                  border: "2px solid var(--color-border-default)",
                  boxShadow: `0 0 12px ${hex}40`,
                }}
              />
            ) : null
          )}
        </motion.div>

        {/* Fonts */}
        <motion.div variants={listItemVariants} className="mt-4">
          <div>
          <span className="text-text-caption uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
            Typsnitt
          </span>
          {isEditing ? (
            <div className="mt-1.5 flex gap-2">
              <div className="flex-1">
                <label className="mb-0.5 block text-[9px] font-medium" style={{ color: "var(--color-text-muted)" }}>Rubrik</label>
                <input
                  value={brand.fonts?.heading || ""}
                  onChange={(e) => handleFontChange("heading", e.target.value)}
                  placeholder="t.ex. Inter"
                  className="w-full bg-transparent text-text-body-sm outline-none"
                  style={{
                    color: "var(--color-text-primary)",
                    borderBottom: "1px solid var(--color-border-focus)",
                    padding: "4px 0",
                  }}
                />
              </div>
              <div className="flex-1">
                <label className="mb-0.5 block text-[9px] font-medium" style={{ color: "var(--color-text-muted)" }}>Brödtext</label>
                <input
                  value={brand.fonts?.body || ""}
                  onChange={(e) => handleFontChange("body", e.target.value)}
                  placeholder="t.ex. Inter"
                  className="w-full bg-transparent text-text-body-sm outline-none"
                  style={{
                    color: "var(--color-text-primary)",
                    borderBottom: "1px solid var(--color-border-focus)",
                    padding: "4px 0",
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="mt-1.5 flex gap-3">
              {brand.fonts?.heading && (
                <div className="flex items-center gap-2">
                  <span
                    className="text-[18px] font-bold leading-none"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Aa
                  </span>
                  <div>
                    <p className="text-[11px] font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {brand.fonts.heading}
                    </p>
                    <p className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>Rubrik</p>
                  </div>
                </div>
              )}
              {brand.fonts?.body && brand.fonts.body !== brand.fonts?.heading && (
                <div className="flex items-center gap-2">
                  <span
                    className="text-[18px] leading-none"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Aa
                  </span>
                  <div>
                    <p className="text-[11px] font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {brand.fonts.body}
                    </p>
                    <p className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>Brödtext</p>
                  </div>
                </div>
              )}
              {!brand.fonts?.heading && !brand.fonts?.body && (
                <p className="text-[11px] italic" style={{ color: "var(--color-text-muted)" }}>
                  Inga typsnitt hittades — klicka Redigera för att lägga till
                </p>
              )}
            </div>
          )}
          </div>
        </motion.div>

        {/* Products — only if data exists */}
        {brand.products.length > 0 && (
          <motion.div variants={listItemVariants} className="mt-4">
            <span className="text-text-caption uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
              Produkter
            </span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <AnimatePresence>
                {brand.products.map((p, i) => (
                  <motion.span
                    key={p}
                    className="text-text-body-sm"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300, delay: i * 0.05 }}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--color-bg-raised)",
                      border: "1px solid var(--color-border-default)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {p}
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Offers — only if data exists */}
        {brand.offers.length > 0 && (
          <motion.div variants={listItemVariants} className="mt-4">
            <span className="text-text-caption uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
              Erbjudande
            </span>
            <p className="mt-1 text-text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
              {brand.offers.join(", ")}
            </p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
