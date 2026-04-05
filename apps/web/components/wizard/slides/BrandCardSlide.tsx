"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useWizardNavigation } from "@/hooks/use-wizard-navigation";
import { cardVariants, listItemVariants, transitions } from "@/lib/motion";
import { useWizardStore } from "@/lib/stores/wizard-store";

function SectionHeader({
  children,
  onEdit,
}: {
  children: React.ReactNode;
  onEdit?: () => void;
}) {
  return (
    <div className="group/header flex items-center gap-2">
      <span
        className="text-[11px] font-medium uppercase tracking-wider"
        style={{ color: "var(--color-text-muted)" }}
      >
        {children}
      </span>
      {onEdit && (
        <button
          onClick={onEdit}
          className="opacity-0 transition-opacity group-hover/header:opacity-60 hover:!opacity-100"
          style={{ color: "var(--color-text-muted)" }}
          title="Redigera"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          </svg>
        </button>
      )}
    </div>
  );
}

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
    setBrand({
      ...brand,
      fonts: {
        heading: brand.fonts?.heading || "",
        body: brand.fonts?.body || "",
        [type]: value,
      },
    });
  };

  const colorEntries = Object.entries(brand.colors).filter(
    ([, hex]) => !!hex,
  );
  const hasColors = colorEntries.length > 0;
  const hasFonts = !!(brand.fonts?.heading || brand.fonts?.body);

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={transitions.spring}
      className="flex w-full flex-col gap-4"
    >
      {/* Header */}
      <div>
        <h2
          className="text-text-h1"
          style={{ color: "var(--color-text-primary)" }}
        >
          Vi hittade ditt varumärke ✓
        </h2>
        <p
          className="mt-1 text-text-body-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          Det här hittade vi på din sajt. Kontrollera att allt ser rätt ut — du
          kan redigera vad som helst.
        </p>
      </div>

      {/* Brand card */}
      <motion.div
        className="ai-border"
        style={{
          borderRadius: "var(--radius-xl)",
          background:
            "linear-gradient(135deg, var(--color-bg-elevated) 0%, rgba(99, 102, 241, 0.03) 100%)",
          boxShadow: "var(--shadow-lg), var(--shadow-glow-sm)",
          padding: 0,
          overflow: "hidden",
        }}
        variants={{
          visible: {
            transition: { staggerChildren: 0.08, delayChildren: 0.1 },
          },
        }}
        initial="hidden"
        animate="visible"
      >
        {/* ── Brand Identity ─────────────────────────── */}
        <motion.div
          variants={listItemVariants}
          className="flex items-start gap-4 p-6"
        >
          {/* Logo */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />
          <motion.button
            onClick={() => fileInputRef.current?.click()}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="group/logo relative h-14 shrink-0 overflow-hidden rounded-lg"
            style={{
              background: "var(--color-bg-raised)",
              border: "1px solid var(--color-border-default)",
              minWidth: 56,
            }}
            title="Klicka för att byta logotyp"
          >
            {logoUploading ? (
              <div className="flex h-full w-16 items-center justify-center">
                <div
                  className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                  style={{ color: "var(--color-primary)" }}
                />
              </div>
            ) : brand.logoUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  className="h-full w-auto object-contain px-3"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover/logo:opacity-100">
                  <span className="text-[9px] font-medium text-white">
                    Byt logotyp
                  </span>
                </div>
              </>
            ) : (
              <div className="flex h-full w-16 flex-col items-center justify-center gap-0.5 px-2">
                <span
                  className="text-xl font-bold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {brand.name.charAt(0)}
                </span>
                <span
                  className="text-[8px] leading-tight"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Ladda upp
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
              <h3
                className="editable-hint text-text-h2"
                style={{ color: "var(--color-text-primary)" }}
                onClick={() => setIsEditing(true)}
              >
                {brand.name}
              </h3>
            )}
            {/* Industry pill */}
            <span
              className="mt-1.5 inline-block text-[12px] font-medium"
              style={{
                padding: "2px 10px",
                borderRadius: "var(--radius-full)",
                background: "rgba(99, 102, 241, 0.08)",
                color: "var(--color-text-secondary)",
                border: "1px solid rgba(99, 102, 241, 0.15)",
              }}
            >
              {brand.industry}
              {brand.subIndustry && ` · ${brand.subIndustry}`}
            </span>
          </div>

          {/* Edit toggle */}
          <motion.button
            onClick={() => setIsEditing(!isEditing)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="shrink-0 text-[12px] font-medium opacity-60 transition-opacity hover:opacity-100"
            style={{ color: "var(--color-primary)" }}
          >
            {isEditing ? "Klar ✓" : "✎ Redigera"}
          </motion.button>
        </motion.div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: "var(--color-border-subtle)",
            margin: "0 24px",
          }}
        />

        {/* ── Description ─────────────────────────── */}
        <motion.div variants={listItemVariants} className="p-6 py-5">
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
            <p
              className="editable-hint text-text-body italic"
              style={{ color: "var(--color-text-secondary)" }}
              onClick={() => setIsEditing(true)}
            >
              &ldquo;{brand.description}&rdquo;
            </p>
          )}
        </motion.div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: "var(--color-border-subtle)",
            margin: "0 24px",
          }}
        />

        {/* ── Colors ─────────────────────────── */}
        <motion.div variants={listItemVariants} className="p-6 py-5">
          <SectionHeader onEdit={() => setIsEditing(true)}>
            Varumärkesfärger
          </SectionHeader>
          {hasColors ? (
            <div className="mt-3 flex flex-wrap gap-3">
              {colorEntries.map(([name, hex]) => (
                <div key={name} className="flex flex-col items-center gap-1.5">
                  <motion.div
                    className="h-11 w-11 cursor-pointer"
                    whileHover={{
                      scale: 1.1,
                      boxShadow: `0 0 20px ${hex}80`,
                    }}
                    transition={{
                      type: "spring",
                      damping: 20,
                      stiffness: 300,
                    }}
                    style={{
                      backgroundColor: hex as string,
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      boxShadow: `0 0 12px ${hex}30`,
                    }}
                  />
                  <div className="flex flex-col items-center">
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {(hex as string).toUpperCase()}
                    </span>
                    <span
                      className="text-[9px] capitalize"
                      style={{
                        color: "var(--color-text-muted)",
                        opacity: 0.6,
                      }}
                    >
                      {name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p
              className="mt-2 text-[12px] italic"
              style={{ color: "var(--color-text-muted)" }}
            >
              Föreslagna färger —{" "}
              <button
                className="underline"
                onClick={() => setIsEditing(true)}
              >
                anpassa
              </button>
            </p>
          )}
        </motion.div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: "var(--color-border-subtle)",
            margin: "0 24px",
          }}
        />

        {/* ── Typography ─────────────────────────── */}
        <motion.div variants={listItemVariants} className="p-6 py-5">
          <SectionHeader onEdit={() => setIsEditing(true)}>
            Typsnitt
          </SectionHeader>
          {isEditing ? (
            <div className="mt-3 flex gap-3">
              <div className="flex-1">
                <label
                  className="mb-1 block text-[10px] font-medium"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Rubrik
                </label>
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
                <label
                  className="mb-1 block text-[10px] font-medium"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Brödtext
                </label>
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
          ) : hasFonts ? (
            <div className="mt-3 flex flex-col gap-3">
              {brand.fonts?.heading && (
                <div>
                  <p
                    className="text-[24px] font-bold leading-tight"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    AaBbCc 123
                  </p>
                  <p
                    className="mt-0.5 text-[11px]"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {brand.fonts.heading} · Rubrik · Bold
                  </p>
                </div>
              )}
              {brand.fonts?.body &&
                brand.fonts.body !== brand.fonts?.heading && (
                  <div>
                    <p
                      className="text-[16px] leading-snug"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      AaBbCc 123 — {brand.fonts.body}
                    </p>
                    <p
                      className="mt-0.5 text-[11px]"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {brand.fonts.body} · Brödtext · Regular
                    </p>
                  </div>
                )}
            </div>
          ) : (
            <p
              className="mt-2 text-[12px] italic"
              style={{ color: "var(--color-text-muted)" }}
            >
              Standardtypsnitt —{" "}
              <button
                className="underline"
                onClick={() => setIsEditing(true)}
              >
                välj annat
              </button>
            </p>
          )}
        </motion.div>

        {/* ── Products ─────────────────────────── */}
        {brand.products.length > 0 && (
          <>
            <div
              style={{
                height: 1,
                background: "var(--color-border-subtle)",
                margin: "0 24px",
              }}
            />
            <motion.div variants={listItemVariants} className="p-6 py-5">
              <SectionHeader>Produkter</SectionHeader>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <AnimatePresence>
                  {brand.products.map((p, i) => (
                    <motion.span
                      key={p}
                      className="text-text-body-sm"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{
                        type: "spring",
                        damping: 20,
                        stiffness: 300,
                        delay: i * 0.05,
                      }}
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
          </>
        )}

        {/* ── Offers ─────────────────────────── */}
        {brand.offers.length > 0 && (
          <>
            <div
              style={{
                height: 1,
                background: "var(--color-border-subtle)",
                margin: "0 24px",
              }}
            />
            <motion.div variants={listItemVariants} className="p-6 py-5">
              <SectionHeader>Erbjudande</SectionHeader>
              <p
                className="mt-1 text-text-body-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {brand.offers.join(", ")}
              </p>
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Context line — connects data to outcome */}
      <p
        className="text-center text-[13px]"
        style={{ color: "var(--color-text-muted)" }}
      >
        Vi använder detta för att skapa annonser som ser ut som ditt varumärke.
      </p>
    </motion.div>
  );
}
