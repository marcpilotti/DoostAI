"use client";

import { motion } from "motion/react";
import { useCallback, useState } from "react";

import { transitions } from "@/lib/motion";

type ExportPackageProps = {
  brandName: string;
  headline: string;
  bodyCopy: string;
  cta: string;
  primaryColor: string;
  logoUrl?: string;
};

type LineItem = {
  label: string;
  dimensions: string;
  type: "image" | "text" | "brief";
};

const LINE_ITEMS: LineItem[] = [
  { label: "Instagram Feed", dimensions: "1080 × 1080", type: "image" },
  { label: "Instagram Story", dimensions: "1080 × 1920", type: "image" },
  { label: "Google Display", dimensions: "728 × 90", type: "image" },
  { label: "Annonstext", dimensions: "kopierbara fält", type: "text" },
  { label: "Kreativ brief", dimensions: "", type: "brief" },
];

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [value]);

  return (
    <div
      className="flex items-start justify-between gap-2 rounded-lg px-2.5 py-1.5"
      style={{
        background: "var(--color-bg-raised)",
        border: "1px solid var(--color-border-subtle)",
      }}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span
          className="text-[8px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--color-text-muted)" }}
        >
          {label}
        </span>
        <span
          className="select-all text-[11px] leading-snug"
          style={{ color: "var(--color-text-primary)" }}
        >
          {value}
        </span>
      </div>
      <motion.button
        onClick={handleCopy}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={transitions.snappy}
        className="mt-0.5 flex-shrink-0 text-[10px]"
        style={{ color: "var(--color-text-muted)" }}
        aria-label={`Kopiera ${label}`}
      >
        {copied ? "✓" : "⎘"}
      </motion.button>
    </div>
  );
}

export function ExportPackage({
  brandName,
  headline,
  bodyCopy,
  cta,
  primaryColor,
  logoUrl,
}: ExportPackageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitions.spring}
      className="flex flex-col gap-3 rounded-xl p-4"
      style={{
        background: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border-default)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[14px]"
          style={{ background: `${primaryColor}20` }}
        >
          📦
        </div>
        <span
          className="text-[13px] font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Ditt kreativa paket
        </span>
      </div>

      {/* Line items */}
      <div className="flex flex-col gap-1">
        {LINE_ITEMS.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 0.1 + i * 0.08,
              type: "spring",
              damping: 25,
              stiffness: 220,
            }}
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
            style={{
              background: "var(--color-bg-raised)",
              border: "1px solid var(--color-border-subtle)",
            }}
          >
            {/* Preview thumbnail */}
            <div
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded"
              style={{ background: `${primaryColor}15` }}
            >
              {item.type === "image" && logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt=""
                  className="h-4 w-4 rounded-sm object-contain"
                />
              ) : (
                <span className="text-[9px]" style={{ color: primaryColor }}>
                  {item.type === "image"
                    ? "🖼"
                    : item.type === "text"
                      ? "✏️"
                      : "📋"}
                </span>
              )}
            </div>

            {/* Label and dimensions */}
            <div className="flex min-w-0 flex-1 flex-col">
              <span
                className="text-[11px] font-medium"
                style={{ color: "var(--color-text-primary)" }}
              >
                {item.label}
              </span>
              {item.dimensions && (
                <span
                  className="text-[9px]"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {item.dimensions}
                </span>
              )}
            </div>

            {/* Checkmark */}
            <motion.svg
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.3 }}
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className="flex-shrink-0"
            >
              <motion.path
                d="M3 7.5L5.5 10L11 4"
                stroke={primaryColor}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.35 }}
              />
            </motion.svg>
          </motion.div>
        ))}
      </div>

      {/* Copyable text fields */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col gap-1.5"
      >
        <CopyField label="Rubrik" value={headline} />
        <CopyField label="Brödtext" value={bodyCopy} />
        <CopyField label="CTA" value={cta} />
      </motion.div>

      {/* Download CTA */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75, type: "spring", damping: 20, stiffness: 200 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold text-white"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}CC 100%)`,
          boxShadow: `0 4px 14px ${primaryColor}40`,
        }}
      >
        📥 Ladda ner allt
      </motion.button>

      {/* Footer watermark */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 0.9 }}
        className="text-center text-[9px]"
        style={{ color: "var(--color-text-muted)" }}
      >
        Producerat av Doost AI för {brandName}
      </motion.p>
    </motion.div>
  );
}
