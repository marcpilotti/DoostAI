"use client";

import { BarChart3 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

export type CompetitorData = {
  names: string[];
  adCount?: number;
};

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const, delay: 0.3 },
};

export function CompetitorRadar({ data }: { data: CompetitorData }) {
  const prefersReduced = useReducedMotion();
  const variants = prefersReduced ? {} : fadeIn;

  return (
    <motion.div
      {...variants}
      className="rounded-xl bg-[var(--doost-bg)] p-4"
      style={{ border: "1px solid var(--doost-border)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-4 w-4 text-[var(--doost-text-muted)]" />
        <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--doost-text-muted)]">
          Konkurrenter
        </span>
      </div>
      {data.names.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-1.5">
            {data.names.map((name) => (
              <span
                key={name}
                className="rounded-full bg-[var(--doost-bg-secondary)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--doost-text)]"
              >
                {name}
              </span>
            ))}
          </div>
          {data.adCount != null && data.adCount > 0 && (
            <p className="mt-2 text-[12px] text-[var(--doost-text-muted)]">
              {data.adCount} aktiva annonser hittade
            </p>
          )}
        </>
      ) : (
        <p className="text-[12px] text-[var(--doost-text-muted)]">Inga konkurrenter hittade</p>
      )}
    </motion.div>
  );
}
