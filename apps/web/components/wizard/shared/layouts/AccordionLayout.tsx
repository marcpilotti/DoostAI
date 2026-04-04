"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { transitions } from "@/lib/motion";

import type { AdLayoutProps } from "./types";

export function AccordionLayout({ ads, onToggleSelection, onEdit, onRegenerate, renderAdContent }: AdLayoutProps) {
  const [expandedId, setExpandedId] = useState(ads[0]?.id ?? "");

  return (
    <div className="flex flex-col gap-1">
      {ads.map((ad, i) => {
        const isExpanded = ad.id === expandedId;

        return (
          <motion.div
            key={ad.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, ...transitions.spring }}
            style={{
              borderRadius: "var(--radius-lg)",
              border: `1px solid ${isExpanded ? "var(--color-primary)" : "var(--color-border-default)"}`,
              background: isExpanded ? "var(--color-bg-elevated)" : "var(--color-bg-raised)",
              overflow: "hidden",
            }}
          >
            {/* Header strip */}
            <button
              onClick={() => setExpandedId(isExpanded ? "" : ad.id)}
              className="flex w-full items-center gap-3 px-4 text-left"
              style={{ height: 52 }}
            >
              {/* Selection checkbox */}
              <motion.div
                onClick={(e) => { e.stopPropagation(); onToggleSelection(ad.id); }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
                style={{
                  background: ad.selected ? "var(--color-primary)" : "transparent",
                  border: ad.selected ? "none" : "1.5px solid var(--color-border-default)",
                }}
              >
                {ad.selected && <span className="text-[10px] text-white font-bold">✓</span>}
              </motion.div>

              {/* Template badge */}
              <span
                className="shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider"
                style={{
                  background: ad.template === "hero" ? "var(--color-primary-glow)" : "var(--color-bg-raised)",
                  color: ad.template === "hero" ? "var(--color-primary-light)" : "var(--color-text-muted)",
                }}
              >
                {ad.template}
              </span>

              {/* Headline preview */}
              <span
                className="flex-1 truncate text-[12px] font-medium"
                style={{ color: "var(--color-text-primary)" }}
              >
                {ad.headline}
              </span>

              {/* Expand indicator */}
              <motion.span
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={transitions.snappy}
                className="text-[12px]"
                style={{ color: "var(--color-text-muted)" }}
              >
                ▼
              </motion.span>
            </button>

            {/* Expanded content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={transitions.spring}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4">
                    {/* Ad preview */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1, ...transitions.spring }}
                      className="overflow-hidden cursor-pointer"
                      style={{ borderRadius: 12, aspectRatio: "1/1", maxHeight: 280 }}
                      onClick={() => onEdit(ad.id)}
                    >
                      {renderAdContent(ad)}
                    </motion.div>

                    {/* Action row */}
                    <div className="mt-3 flex items-center justify-between">
                      <motion.button
                        onClick={() => onEdit(ad.id)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="text-[10px] font-medium"
                        style={{
                          padding: "5px 14px",
                          borderRadius: 8,
                          background: "var(--color-primary-glow)",
                          color: "var(--color-primary-light)",
                        }}
                      >
                        ✎ Redigera
                      </motion.button>
                      <span className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>
                        Klicka annonsen för att redigera
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      <motion.button
        onClick={onRegenerate}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="mt-2 self-start text-[10px] font-medium"
        style={{ color: "var(--color-text-secondary)" }}
      >
        🔄 Generera om
      </motion.button>
    </div>
  );
}
