"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useCallback, useState } from "react";

import type { AdLayoutProps } from "./types";

export function TinderSwipeLayout({ ads, onToggleSelection, onEdit, onRegenerate, renderAdContent }: AdLayoutProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 0, 250], [-12, 0, 12]);
  const selectOpacity = useTransform(x, [0, 80, 150], [0, 0.4, 1]);
  const skipOpacity = useTransform(x, [-150, -80, 0], [1, 0.4, 0]);

  const advanceCard = useCallback(() => {
    x.set(0);
    setCurrentIndex((i) => Math.min(i + 1, ads.length - 1));
  }, [ads.length, x]);

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      const threshold = 100;
      if (info.offset.x > threshold || info.velocity.x > 400) {
        const ad = ads[currentIndex];
        if (ad && !ad.selected) onToggleSelection(ad.id);
        animate(x, 500, { type: "spring", damping: 25, stiffness: 200, onComplete: advanceCard });
      } else if (info.offset.x < -threshold || info.velocity.x < -400) {
        const ad = ads[currentIndex];
        if (ad?.selected) onToggleSelection(ad.id);
        animate(x, -500, { type: "spring", damping: 25, stiffness: 200, onComplete: advanceCard });
      } else {
        animate(x, 0, { type: "spring", damping: 30, stiffness: 400 });
      }
    },
    [ads, currentIndex, onToggleSelection, x, advanceCard],
  );

  const current = ads[currentIndex];
  const next = ads[currentIndex + 1];

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Card area */}
      <div className="relative" style={{ width: 320, height: 360 }}>
        {/* Next card (behind) */}
        {next && (
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ borderRadius: 16, transform: "scale(0.95)", opacity: 0.5, filter: "blur(1px)" }}
          >
            {renderAdContent(next)}
          </div>
        )}

        {/* Stamp overlays */}
        {current && (
          <>
            <motion.div
              className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
              style={{ opacity: selectOpacity }}
            >
              <span
                className="rotate-[-15deg] rounded-lg px-6 py-2 text-[24px] font-black uppercase tracking-wider"
                style={{ border: "4px solid var(--color-success)", color: "var(--color-success)" }}
              >
                Vald!
              </span>
            </motion.div>
            <motion.div
              className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
              style={{ opacity: skipOpacity }}
            >
              <span
                className="rotate-[15deg] rounded-lg px-6 py-2 text-[24px] font-black uppercase tracking-wider"
                style={{ border: "4px solid var(--color-error)", color: "var(--color-error)" }}
              >
                Skip
              </span>
            </motion.div>
          </>
        )}

        {/* Active card */}
        {current && (
          <motion.div
            key={current.id}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.8}
            onDragEnd={handleDragEnd}
            style={{ x, rotate, borderRadius: 16, zIndex: 20 }}
            className="absolute inset-0 cursor-grab overflow-hidden active:cursor-grabbing"
          >
            <div onClick={() => onEdit(current.id)}>
              {renderAdContent(current)}
            </div>
          </motion.div>
        )}
      </div>

      {/* Ad chips */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {ads.map((ad, i) => (
          <motion.button
            key={ad.id}
            onClick={() => { x.set(0); setCurrentIndex(i); }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-[10px] font-medium"
            style={{
              padding: "4px 12px",
              borderRadius: 20,
              background: i === currentIndex ? "var(--color-primary-glow)" : "var(--color-bg-raised)",
              color: ad.selected
                ? "var(--color-primary-light)"
                : i === currentIndex
                  ? "var(--color-text-primary)"
                  : "var(--color-text-muted)",
              border: ad.selected ? "1px solid var(--color-primary)" : "1px solid transparent",
            }}
          >
            {ad.selected ? "✓ " : ""}Ad {i + 1}
          </motion.button>
        ))}
      </div>

      <motion.button
        onClick={onRegenerate}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="text-[10px] font-medium"
        style={{ color: "var(--color-text-secondary)" }}
      >
        🔄 Generera om
      </motion.button>
    </div>
  );
}
