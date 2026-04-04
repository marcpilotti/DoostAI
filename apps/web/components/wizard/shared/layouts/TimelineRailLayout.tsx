"use client";

import { motion } from "motion/react";

import { transitions } from "@/lib/motion";

import type { AdLayoutProps } from "./types";

export function TimelineRailLayout({ ads, onToggleSelection, onEdit, onRegenerate, renderAdContent }: AdLayoutProps) {
  return (
    <div className="flex flex-col gap-1">
      {ads.map((ad, i) => {
        const isHero = ad.template === "hero";
        const isLast = i === ads.length - 1;

        return (
          <motion.div
            key={ad.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12, ...transitions.spring }}
            className="flex gap-4"
          >
            {/* Rail */}
            <div className="flex flex-col items-center" style={{ width: 24 }}>
              {/* Dot */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.12 + 0.1, type: "spring", damping: 15, stiffness: 400 }}
                className="relative z-10 flex shrink-0 items-center justify-center rounded-full"
                style={{
                  width: isHero ? 20 : 14,
                  height: isHero ? 20 : 14,
                  background: ad.selected ? "var(--color-primary)" : "var(--color-bg-raised)",
                  border: `2px solid ${ad.selected ? "var(--color-primary)" : "var(--color-border-default)"}`,
                  boxShadow: ad.selected ? "0 0 12px rgba(99,102,241,0.3)" : "none",
                }}
              >
                {ad.selected && <span className="text-[7px] text-white font-bold">✓</span>}
              </motion.div>

              {/* Line */}
              {!isLast && (
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: i * 0.12 + 0.2, duration: 0.4 }}
                  className="w-px flex-1"
                  style={{
                    background: `linear-gradient(to bottom, ${ad.selected ? "var(--color-primary)" : "var(--color-border-default)"}, var(--color-border-default))`,
                    transformOrigin: "top",
                  }}
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              {/* Label */}
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="text-[9px] font-bold uppercase tracking-wider"
                  style={{ color: isHero ? "var(--color-primary-light)" : "var(--color-text-muted)" }}
                >
                  {isHero ? "Hero" : `Variant ${i}`}
                </span>
                <span className="text-[9px] capitalize" style={{ color: "var(--color-text-muted)" }}>
                  {ad.platform}
                </span>
              </div>

              {/* Ad preview */}
              <motion.div
                className="overflow-hidden cursor-pointer"
                style={{
                  borderRadius: 12,
                  aspectRatio: "1/1",
                  maxWidth: isHero ? "100%" : "75%",
                }}
                onClick={() => onEdit(ad.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {renderAdContent(ad)}
              </motion.div>

              {/* Actions */}
              <div className="mt-2 flex items-center gap-2">
                <motion.button
                  onClick={() => onToggleSelection(ad.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-[10px] font-medium"
                  style={{
                    padding: "3px 10px",
                    borderRadius: 14,
                    background: ad.selected ? "var(--color-primary-glow)" : "transparent",
                    color: ad.selected ? "var(--color-primary-light)" : "var(--color-text-muted)",
                    border: `1px solid ${ad.selected ? "var(--color-primary)" : "rgba(255,255,255,0.08)"}`,
                  }}
                >
                  {ad.selected ? "✓ Vald" : "Välj"}
                </motion.button>
                <motion.button
                  onClick={() => onEdit(ad.id)}
                  whileHover={{ scale: 1.05 }}
                  className="text-[10px]"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  ✎ Redigera
                </motion.button>
              </div>
            </div>
          </motion.div>
        );
      })}

      <motion.button onClick={onRegenerate} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="ml-10 self-start text-[10px] font-medium" style={{ color: "var(--color-text-secondary)" }}>
        🔄 Generera om
      </motion.button>
    </div>
  );
}
