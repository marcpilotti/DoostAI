"use client";

import { motion } from "motion/react";
import { useState } from "react";

import type { AdLayoutProps } from "./types";

export function CarouselWheelLayout({ ads, onToggleSelection, onEdit, onRegenerate, renderAdContent }: AdLayoutProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const angleStep = 360 / Math.max(ads.length, 1);
  const radius = 280;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 3D Carousel */}
      <div className="relative" style={{ width: "100%", height: 340, perspective: 900, perspectiveOrigin: "50% 50%" }}>
        <motion.div
          animate={{ rotateY: -activeIndex * angleStep }}
          transition={{ type: "spring", damping: 25, stiffness: 150 }}
          className="relative h-full w-full"
          style={{ transformStyle: "preserve-3d" }}
        >
          {ads.map((ad, i) => {
            const angle = i * angleStep;
            const isActive = i === activeIndex;

            return (
              <motion.div
                key={ad.id}
                className="absolute left-1/2 top-1/2 cursor-pointer overflow-hidden"
                style={{
                  width: 200,
                  height: 200,
                  marginLeft: -100,
                  marginTop: -100,
                  borderRadius: 14,
                  transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                  backfaceVisibility: "hidden",
                  boxShadow: isActive ? "0 8px 32px rgba(99,102,241,0.3)" : "0 4px 16px rgba(0,0,0,0.3)",
                }}
                onClick={() => isActive ? onEdit(ad.id) : setActiveIndex(i)}
              >
                {renderAdContent(ad)}

                {/* Selection indicator */}
                {ad.selected && (
                  <div
                    className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold"
                    style={{ background: "var(--color-primary)", color: "#fff" }}
                  >
                    ✓
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4">
        <motion.button
          onClick={() => setActiveIndex((i) => (i - 1 + ads.length) % ads.length)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[14px]"
          style={{ background: "var(--color-bg-raised)", color: "var(--color-text-muted)", border: "1px solid var(--color-border-default)" }}
        >
          ◄
        </motion.button>

        {ads[activeIndex] && (
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => onToggleSelection(ads[activeIndex]!.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-[10px] font-medium"
              style={{
                padding: "5px 14px",
                borderRadius: 16,
                background: ads[activeIndex]!.selected ? "var(--color-primary)" : "var(--color-bg-raised)",
                color: ads[activeIndex]!.selected ? "#fff" : "var(--color-text-muted)",
              }}
            >
              {ads[activeIndex]!.selected ? "✓ Vald" : "Välj"}
            </motion.button>
            <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
              {activeIndex + 1}/{ads.length}
            </span>
          </div>
        )}

        <motion.button
          onClick={() => setActiveIndex((i) => (i + 1) % ads.length)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[14px]"
          style={{ background: "var(--color-bg-raised)", color: "var(--color-text-muted)", border: "1px solid var(--color-border-default)" }}
        >
          ►
        </motion.button>
      </div>

      <motion.button onClick={onRegenerate} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="text-[10px] font-medium" style={{ color: "var(--color-text-secondary)" }}>
        🔄 Generera om
      </motion.button>
    </div>
  );
}
