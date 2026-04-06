"use client";

import { TrendingUp } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

export type ReadinessData = {
  score: number;
  breakdown?: {
    tracking: number;
    content: number;
    social: number;
    reviews: number;
    speed: number;
  };
};

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const, delay: 0.45 },
};

const BREAKDOWN_LABELS: Record<string, string> = {
  tracking: "Spårning",
  content: "Innehåll",
  social: "Social närvaro",
  reviews: "Omdömen",
  speed: "Hastighet",
};

export function ReadinessScore({ data }: { data: ReadinessData }) {
  const prefersReduced = useReducedMotion();
  const variants = prefersReduced ? {} : fadeIn;

  return (
    <motion.div
      {...variants}
      className="rounded-xl bg-[var(--doost-bg)] p-4"
      style={{ border: "1px solid var(--doost-border)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-[var(--doost-text-muted)]" />
        <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--doost-text-muted)]">
          Marknadsföringsberedskap
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[28px] font-bold text-[var(--doost-text)]">{data.score}</span>
        <span className="text-[14px] text-[var(--doost-text-muted)]">/ 100</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--doost-bg-secondary)]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${data.score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${
            data.score >= 70
              ? "bg-[var(--doost-text-positive)]"
              : data.score >= 40
                ? "bg-[var(--color-warning,#F59E0B)]"
                : "bg-[var(--color-error,#DC2626)]"
          }`}
        />
      </div>
      {data.breakdown && (
        <div className="mt-3 space-y-1.5">
          {Object.entries(data.breakdown).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-[11px] text-[var(--doost-text-muted)] w-20">
                {BREAKDOWN_LABELS[key] ?? key}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-[var(--doost-bg-secondary)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--doost-text-positive)]"
                  style={{ width: `${value}%` }}
                />
              </div>
              <span className="text-[10px] text-[var(--doost-text-muted)] w-6 text-right">{value}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
