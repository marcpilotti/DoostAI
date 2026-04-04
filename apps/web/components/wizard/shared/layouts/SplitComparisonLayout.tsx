"use client";

import { motion } from "motion/react";
import { useState } from "react";

import { transitions } from "@/lib/motion";

import type { AdLayoutProps } from "./types";

export function SplitComparisonLayout({ ads, onToggleSelection, onEdit, onRegenerate, renderAdContent }: AdLayoutProps) {
  const [pairIndex, setPairIndex] = useState(0);

  const leftAd = ads[pairIndex * 2];
  const rightAd = ads[pairIndex * 2 + 1];
  const totalPairs = Math.ceil(ads.length / 2);

  const renderSide = (ad: typeof ads[0] | undefined, side: "left" | "right") => {
    if (!ad) return <div className="flex-1" />;

    return (
      <motion.div
        key={ad.id}
        initial={{ opacity: 0, x: side === "left" ? -20 : 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={transitions.spring}
        className="flex flex-1 flex-col gap-2"
      >
        <motion.div
          className="overflow-hidden cursor-pointer"
          style={{ borderRadius: 12, aspectRatio: "1/1" }}
          onClick={() => onEdit(ad.id)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {renderAdContent(ad)}
        </motion.div>

        <div className="flex items-center justify-between px-1">
          <motion.button
            onClick={() => onToggleSelection(ad.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 text-[10px] font-medium"
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
            ✎
          </motion.button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Split view */}
      <div className="flex gap-3">
        {renderSide(leftAd, "left")}

        {/* VS divider */}
        {rightAd && (
          <div className="flex flex-col items-center justify-center" style={{ width: 32 }}>
            <div className="h-full w-px" style={{ background: "var(--color-border-default)" }} />
            <motion.span
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="my-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
              style={{
                background: "var(--color-bg-raised)",
                border: "1px solid var(--color-border-default)",
                color: "var(--color-text-muted)",
              }}
            >
              vs
            </motion.span>
            <div className="h-full w-px" style={{ background: "var(--color-border-default)" }} />
          </div>
        )}

        {renderSide(rightAd, "right")}
      </div>

      {/* Pair navigation */}
      {totalPairs > 1 && (
        <div className="flex items-center justify-center gap-3">
          <motion.button
            onClick={() => setPairIndex((i) => Math.max(0, i - 1))}
            disabled={pairIndex <= 0}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="text-[14px] disabled:opacity-20"
            style={{ color: "var(--color-text-muted)" }}
          >
            ◄
          </motion.button>
          <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
            {pairIndex + 1} / {totalPairs}
          </span>
          <motion.button
            onClick={() => setPairIndex((i) => Math.min(totalPairs - 1, i + 1))}
            disabled={pairIndex >= totalPairs - 1}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="text-[14px] disabled:opacity-20"
            style={{ color: "var(--color-text-muted)" }}
          >
            ►
          </motion.button>
        </div>
      )}

      <motion.button onClick={onRegenerate} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="self-center text-[10px] font-medium" style={{ color: "var(--color-text-secondary)" }}>
        🔄 Generera om
      </motion.button>
    </div>
  );
}
