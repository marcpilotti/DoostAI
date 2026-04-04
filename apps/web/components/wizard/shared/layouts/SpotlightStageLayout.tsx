"use client";

import { motion } from "motion/react";
import { useState } from "react";

import { transitions } from "@/lib/motion";

import type { AdLayoutProps } from "./types";

export function SpotlightStageLayout({ ads, onToggleSelection, onEdit, onRegenerate, renderAdContent }: AdLayoutProps) {
  const [spotlitIndex, setSpotlitIndex] = useState(0);
  const spotlitAd = ads[spotlitIndex];

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Stage */}
      <div
        className="relative flex w-full items-center justify-center overflow-hidden"
        style={{
          height: 380,
          borderRadius: "var(--radius-xl)",
          background: "radial-gradient(ellipse 50% 60% at 50% 35%, rgba(99,102,241,0.08) 0%, rgba(0,0,0,0) 70%), var(--color-bg-base)",
        }}
      >
        {/* Spotlight cone */}
        <motion.div
          className="pointer-events-none absolute"
          animate={{
            x: [0, 3, -2, 0],
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          style={{
            top: -40,
            width: 300,
            height: 200,
            background: "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 70%)",
          }}
        />

        {/* Shadow thumbnails */}
        {ads.map((ad, i) => {
          if (i === spotlitIndex) return null;
          const offset = i < spotlitIndex ? -1 : 1;
          const distance = Math.abs(i - spotlitIndex);

          return (
            <motion.div
              key={ad.id}
              animate={{
                x: offset * (100 + distance * 30),
                scale: 0.35,
                opacity: 0.35,
              }}
              transition={transitions.spring}
              whileHover={{ opacity: 0.6, scale: 0.38 }}
              className="absolute cursor-pointer overflow-hidden"
              style={{
                width: 200,
                height: 200,
                borderRadius: 12,
                filter: "brightness(0.5)",
              }}
              onClick={() => setSpotlitIndex(i)}
            >
              {renderAdContent(ad)}
              {ad.selected && (
                <div
                  className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full text-[7px] font-bold"
                  style={{ background: "var(--color-primary)", color: "#fff" }}
                >
                  ✓
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Spotlit ad */}
        {spotlitAd && (
          <motion.div
            key={spotlitAd.id}
            layoutId={`spotlight-${spotlitAd.id}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={transitions.spring}
            className="relative z-10 cursor-pointer overflow-hidden"
            style={{
              width: 240,
              height: 240,
              borderRadius: 16,
              boxShadow: "0 0 60px rgba(99,102,241,0.15), 0 16px 40px rgba(0,0,0,0.3)",
            }}
            onClick={() => onEdit(spotlitAd.id)}
          >
            {renderAdContent(spotlitAd)}
          </motion.div>
        )}

        {/* Reflection */}
        {spotlitAd && (
          <div
            className="absolute bottom-0 z-0 overflow-hidden"
            style={{
              width: 240,
              height: 60,
              borderRadius: "0 0 16px 16px",
              transform: "scaleY(-1) translateY(-1px)",
              opacity: 0.15,
              filter: "blur(4px)",
              maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)",
            }}
          >
            {renderAdContent(spotlitAd)}
          </div>
        )}
      </div>

      {/* Controls */}
      {spotlitAd && (
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => onToggleSelection(spotlitAd.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-[10px] font-medium"
            style={{
              padding: "5px 16px",
              borderRadius: 16,
              background: spotlitAd.selected ? "var(--color-primary)" : "var(--color-bg-raised)",
              color: spotlitAd.selected ? "#fff" : "var(--color-text-muted)",
              border: `1px solid ${spotlitAd.selected ? "var(--color-primary)" : "var(--color-border-default)"}`,
            }}
          >
            {spotlitAd.selected ? "✓ Vald" : "Välj"}
          </motion.button>

          <motion.button
            onClick={() => onEdit(spotlitAd.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-[10px] font-medium"
            style={{
              padding: "5px 14px",
              borderRadius: 16,
              background: "var(--color-bg-raised)",
              color: "var(--color-text-secondary)",
              border: "1px solid var(--color-border-default)",
            }}
          >
            ✎ Redigera
          </motion.button>

          <motion.button onClick={onRegenerate} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="text-[10px] font-medium" style={{ color: "var(--color-text-secondary)" }}>
            🔄 Generera om
          </motion.button>
        </div>
      )}
    </div>
  );
}
