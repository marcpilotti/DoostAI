"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { useWizardNavigation } from "@/hooks/use-wizard-navigation";
import { cardVariants, listItemVariants,transitions } from "@/lib/motion";
import { useWizardStore } from "@/lib/stores/wizard-store";

export function BrandCardSlide() {
  const { brand, setBrand, setFooterAction } = useWizardStore();
  const { handleNext } = useWizardNavigation();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setFooterAction(() => handleNext());
    return () => setFooterAction(null);
  }, [handleNext, setFooterAction]);

  if (!brand) return null;

  const handleFieldChange = (field: string, value: string) => {
    setBrand({ ...brand, [field]: value });
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
          {brand.logoUrl ? (
            <img
              src={brand.logoUrl}
              alt={brand.name}
              className="h-14 w-14 rounded-lg object-contain"
              style={{ background: "var(--color-bg-raised)" }}
            />
          ) : (
            <div
              className="flex h-14 w-14 items-center justify-center rounded-lg text-xl font-bold"
              style={{
                background: "var(--color-bg-raised)",
                color: "var(--color-text-primary)",
              }}
            >
              {brand.name.charAt(0)}
            </div>
          )}
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
