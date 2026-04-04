"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useCallback, useState } from "react";

import { checkmarkVariants, transitions } from "@/lib/motion";

import type { AdLayoutProps } from "./types";

export function CardStackLayout({ ads, onToggleSelection, onEdit, onRegenerate, renderAdContent }: AdLayoutProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-8, 0, 8]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      const threshold = 80;
      if (Math.abs(info.offset.x) > threshold || Math.abs(info.velocity.x) > 500) {
        const direction = info.offset.x > 0 ? 1 : -1;
        const ad = ads[currentIndex];
        if (ad && direction > 0 && !ad.selected) onToggleSelection(ad.id);
        if (ad && direction < 0 && ad.selected) onToggleSelection(ad.id);

        animate(x, direction * 400, {
          type: "spring",
          damping: 30,
          stiffness: 300,
          onComplete: () => {
            x.set(0);
            setCurrentIndex((i) => (i + 1) % ads.length);
          },
        });
      } else {
        animate(x, 0, { type: "spring", damping: 25, stiffness: 400 });
      }
    },
    [ads, currentIndex, onToggleSelection, x],
  );

  if (ads.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Stack area */}
      <div className="relative" style={{ width: 300, height: 340 }}>
        {/* Background cards (peeking) */}
        {ads.map((ad, i) => {
          const offset = i - currentIndex;
          if (offset < 0 || offset > 2) return null;
          if (offset === 0) return null;
          return (
            <div
              key={ad.id}
              className="absolute inset-0 overflow-hidden"
              style={{
                borderRadius: 14,
                transform: `translateY(${offset * 8}px) scale(${1 - offset * 0.04})`,
                opacity: 1 - offset * 0.3,
                zIndex: 10 - offset,
              }}
            >
              {renderAdContent(ad)}
            </div>
          );
        })}

        {/* Active card (draggable) */}
        {ads[currentIndex] && (
          <motion.div
            key={ads[currentIndex]!.id}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.9}
            onDragEnd={handleDragEnd}
            style={{ x, rotate, opacity, borderRadius: 14, zIndex: 20 }}
            className="absolute inset-0 cursor-grab overflow-hidden active:cursor-grabbing"
            whileTap={{ scale: 1.02 }}
          >
            <div onClick={() => onEdit(ads[currentIndex]!.id)}>
              {renderAdContent(ads[currentIndex]!)}
            </div>
          </motion.div>
        )}
      </div>

      {/* Dot indicators */}
      <div className="flex items-center gap-2">
        {ads.map((ad, i) => (
          <button
            key={ad.id}
            onClick={() => { x.set(0); setCurrentIndex(i); }}
            className="relative flex h-5 w-5 items-center justify-center"
          >
            <motion.div
              className="rounded-full"
              animate={{
                width: i === currentIndex ? 10 : 6,
                height: i === currentIndex ? 10 : 6,
                background: ad.selected ? "var(--color-primary)" : "var(--color-bg-raised)",
              }}
              transition={transitions.snappy}
            />
            {ad.selected && i !== currentIndex && (
              <motion.svg
                width="12" height="12" viewBox="0 0 20 20"
                className="absolute"
              >
                <motion.path
                  d="M6 10l3 3 5-6"
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  variants={checkmarkVariants}
                  initial="hidden"
                  animate="visible"
                />
              </motion.svg>
            )}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          ← skippa · välj →
        </span>
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
    </div>
  );
}
