"use client";

import { animate, motion, useMotionValue } from "motion/react";
import { useCallback, useRef, useState } from "react";

import { transitions } from "@/lib/motion";

import type { AdLayoutProps } from "./types";

const CARD_WIDTH = 220;
const CARD_GAP = 16;

export function FilmstripLayout({ ads, onToggleSelection, onEdit, onRegenerate, renderAdContent }: AdLayoutProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const snapTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, ads.length - 1));
      setActiveIndex(clamped);
      animate(x, -clamped * (CARD_WIDTH + CARD_GAP), { type: "spring", damping: 30, stiffness: 300 });
    },
    [ads.length, x],
  );

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      const currentX = x.get();
      const projected = currentX + info.velocity.x * 0.3;
      const newIndex = Math.round(-projected / (CARD_WIDTH + CARD_GAP));
      snapTo(newIndex);
    },
    [x, snapTo],
  );

  // Sprocket holes
  const sprockets = Array.from({ length: 20 }, (_, i) => i);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Sprocket holes top */}
      <div className="flex w-full justify-center gap-2 overflow-hidden">
        {sprockets.map((i) => (
          <div
            key={`t-${i}`}
            className="h-2 w-3 shrink-0 rounded-sm"
            style={{ background: "var(--color-bg-raised)" }}
          />
        ))}
      </div>

      {/* Filmstrip */}
      <div ref={containerRef} className="w-full overflow-hidden" style={{ padding: "0 calc(50% - 110px)" }}>
        <motion.div
          drag="x"
          dragConstraints={{ left: -(ads.length - 1) * (CARD_WIDTH + CARD_GAP), right: 0 }}
          dragElastic={0.15}
          onDragEnd={handleDragEnd}
          style={{ x }}
          className="flex cursor-grab active:cursor-grabbing"
        >
          {ads.map((ad, i) => {
            const isActive = i === activeIndex;
            return (
              <motion.div
                key={ad.id}
                animate={{
                  scale: isActive ? 1 : 0.85,
                  opacity: isActive ? 1 : 0.5,
                }}
                transition={transitions.spring}
                className="shrink-0 overflow-hidden"
                style={{
                  width: CARD_WIDTH,
                  marginRight: i < ads.length - 1 ? CARD_GAP : 0,
                  borderRadius: 12,
                  aspectRatio: "1/1",
                }}
                onClick={() => isActive ? onEdit(ad.id) : snapTo(i)}
              >
                {renderAdContent(ad)}
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Sprocket holes bottom */}
      <div className="flex w-full justify-center gap-2 overflow-hidden">
        {sprockets.map((i) => (
          <div
            key={`b-${i}`}
            className="h-2 w-3 shrink-0 rounded-sm"
            style={{ background: "var(--color-bg-raised)" }}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <motion.button
          onClick={() => snapTo(activeIndex - 1)}
          disabled={activeIndex <= 0}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="text-[16px] disabled:opacity-20"
          style={{ color: "var(--color-text-muted)" }}
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
                padding: "4px 12px",
                borderRadius: 16,
                background: ads[activeIndex]!.selected ? "var(--color-primary-glow)" : "var(--color-bg-raised)",
                color: ads[activeIndex]!.selected ? "var(--color-primary-light)" : "var(--color-text-muted)",
              }}
            >
              {ads[activeIndex]!.selected ? "✓ Vald" : "Välj"}
            </motion.button>
            <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
              {activeIndex + 1} / {ads.length}
            </span>
          </div>
        )}

        <motion.button
          onClick={() => snapTo(activeIndex + 1)}
          disabled={activeIndex >= ads.length - 1}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="text-[16px] disabled:opacity-20"
          style={{ color: "var(--color-text-muted)" }}
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
