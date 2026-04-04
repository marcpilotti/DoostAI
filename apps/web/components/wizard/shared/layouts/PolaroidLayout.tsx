"use client";

import { motion } from "motion/react";
import { useMemo } from "react";

import { transitions } from "@/lib/motion";

import type { AdLayoutProps } from "./types";

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function PolaroidLayout({ ads, onToggleSelection, onEdit, onRegenerate, renderAdContent }: AdLayoutProps) {
  const positions = useMemo(
    () =>
      ads.map((_, i) => ({
        rotation: (seededRandom(i * 31) - 0.5) * 12,
        x: (seededRandom(i * 47) - 0.5) * 40,
        y: (seededRandom(i * 73) - 0.5) * 20,
        floatDelay: i * 0.6,
      })),
    [ads.length],
  );

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Polaroid scatter area */}
      <div className="relative" style={{ width: "100%", height: 380, perspective: 800 }}>
        {ads.map((ad, i) => {
          const pos = positions[i]!;
          const col = i % 3;
          const row = Math.floor(i / 3);
          const baseX = col * 180 + 30;
          const baseY = row * 200 + 10;

          return (
            <motion.div
              key={ad.id}
              initial={{ opacity: 0, scale: 0.7, rotate: pos.rotation * 2 }}
              animate={{
                opacity: 1,
                scale: 1,
                rotate: pos.rotation,
                y: [0, -3, 0],
              }}
              transition={{
                opacity: { duration: 0.3, delay: i * 0.1 },
                scale: { ...transitions.spring, delay: i * 0.1 },
                rotate: { ...transitions.spring, delay: i * 0.1 },
                y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: pos.floatDelay },
              }}
              whileHover={{ scale: 1.08, rotate: 0, zIndex: 30, boxShadow: "0 16px 40px rgba(0,0,0,0.4)" }}
              whileTap={{ scale: 0.98 }}
              className="absolute cursor-pointer"
              style={{
                left: baseX + pos.x,
                top: baseY + pos.y,
                width: 160,
                zIndex: 10 + i,
              }}
              onDoubleClick={() => onEdit(ad.id)}
            >
              {/* Polaroid frame */}
              <div
                className="overflow-hidden"
                style={{
                  background: "#FAFAFA",
                  padding: "8px 8px 32px",
                  borderRadius: 4,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)",
                }}
              >
                <div className="overflow-hidden" style={{ borderRadius: 2, aspectRatio: "1/1" }}>
                  {renderAdContent(ad)}
                </div>

                {/* Headline caption (handwritten feel) */}
                <p
                  className="mt-2 text-center text-[10px] font-medium leading-tight truncate"
                  style={{ color: "#333", fontStyle: "italic" }}
                >
                  {ad.headline}
                </p>
              </div>

              {/* Selection pin */}
              {ad.selected && (
                <motion.div
                  initial={{ y: -20, scale: 0 }}
                  animate={{ y: 0, scale: 1 }}
                  transition={transitions.snappy}
                  className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full text-[9px]"
                  style={{ background: "var(--color-primary)", color: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }}
                >
                  ✓
                </motion.div>
              )}

              {/* Click to toggle */}
              <button
                onClick={(e) => { e.stopPropagation(); onToggleSelection(ad.id); }}
                className="absolute bottom-1 right-2 text-[9px] font-medium"
                style={{ color: "#999" }}
              >
                {ad.selected ? "Avmarkera" : "Välj"}
              </button>
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          Dubbelklicka för att redigera
        </span>
        <motion.button onClick={onRegenerate} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="text-[10px] font-medium" style={{ color: "var(--color-text-secondary)" }}>
          🔄 Generera om
        </motion.button>
      </div>
    </div>
  );
}
