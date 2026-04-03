"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

type ArtDirectorPanelProps = {
  rationale: string[];
};

export function ArtDirectorPanel({ rationale }: ArtDirectorPanelProps) {
  const [open, setOpen] = useState(false);

  if (!rationale || rationale.length === 0) return null;

  return (
    <div>
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="text-[11px] font-medium"
        style={{ color: "var(--color-primary-light)" }}
      >
        {open ? "Dölj kreativ brief ↑" : "Visa kreativ brief →"}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="overflow-hidden"
          >
            <div className="mt-2 flex flex-col gap-1.5 rounded-lg p-3" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.1)" }}>
              <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-primary-light)" }}>
                AI Art Director
              </span>
              {rationale.map((line, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15, type: "spring", damping: 25, stiffness: 200 }}
                  className="text-[11px] leading-relaxed"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {line}
                </motion.p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
