"use client";

import { motion } from "motion/react";
import { useState } from "react";

import { checkmarkVariants, transitions } from "@/lib/motion";

import type { AdLayoutProps } from "./types";

export function MagazineSpreadLayout({ ads, onToggleSelection, onEdit, onRegenerate, renderAdContent }: AdLayoutProps) {
  const [featuredId, setFeaturedId] = useState(ads[0]?.id ?? "");
  const featured = ads.find((a) => a.id === featuredId) ?? ads[0];
  const others = ads.filter((a) => a.id !== featured?.id);

  if (!featured) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3" style={{ minHeight: 320 }}>
        {/* Featured (large) */}
        <motion.div
          layoutId={`magazine-${featured.id}`}
          className="flex-[3] overflow-hidden cursor-pointer"
          style={{ borderRadius: 14 }}
          onClick={() => onEdit(featured.id)}
          transition={transitions.spring}
        >
          {renderAdContent(featured)}
        </motion.div>

        {/* Side stack */}
        <div className="flex flex-[2] flex-col gap-2">
          {others.map((ad, i) => (
            <motion.div
              key={ad.id}
              layoutId={`magazine-${ad.id}`}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, ...transitions.spring }}
              className="flex-1 cursor-pointer overflow-hidden"
              style={{ borderRadius: 10, minHeight: 0 }}
              onClick={() => setFeaturedId(ad.id)}
            >
              {renderAdContent(ad)}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-2">
        {ads.map((ad) => (
          <motion.button
            key={ad.id}
            onClick={() => onToggleSelection(ad.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1 text-[10px] font-medium"
            style={{
              padding: "4px 10px",
              borderRadius: 16,
              background: ad.selected ? "var(--color-primary-glow)" : "transparent",
              color: ad.selected ? "var(--color-primary-light)" : "var(--color-text-muted)",
              border: `1px solid ${ad.selected ? "var(--color-primary)" : "rgba(255,255,255,0.08)"}`,
            }}
          >
            {ad.selected ? (
              <motion.svg width="12" height="12" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="9" fill="var(--color-primary)" />
                <motion.path d="M6 10l3 3 5-6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" variants={checkmarkVariants} initial="hidden" animate="visible" />
              </motion.svg>
            ) : (
              <div className="h-3 w-3 rounded-full" style={{ border: "1.5px solid rgba(255,255,255,0.15)" }} />
            )}
            {ad.id === featured.id ? "Featured" : `Ad ${ads.indexOf(ad) + 1}`}
          </motion.button>
        ))}
        <div className="flex-1" />
        <motion.button onClick={onRegenerate} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="text-[10px] font-medium" style={{ color: "var(--color-text-secondary)" }}>
          🔄 Generera om
        </motion.button>
      </div>
    </div>
  );
}
