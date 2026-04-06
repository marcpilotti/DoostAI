"use client";

import { motion, useReducedMotion } from "motion/react";

export type ProfileCompletionData = {
  score: number;
  sections: Array<{
    name: string;
    filled: boolean;
  }>;
};

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const, delay: 0.6 },
};

export function ProfileCompletion({ data }: { data: ProfileCompletionData }) {
  const prefersReduced = useReducedMotion();
  const variants = prefersReduced ? {} : fadeIn;

  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (data.score / 100) * circumference;

  return (
    <motion.div
      {...variants}
      className="rounded-xl bg-[var(--doost-bg)] p-4"
      style={{ border: "1px solid var(--doost-border)" }}
    >
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0">
          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="var(--doost-bg-secondary)"
              strokeWidth="6"
            />
            <motion.circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="var(--doost-text-positive)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[16px] font-bold text-[var(--doost-text)]">
              {data.score}%
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-[var(--doost-text)]">Profil</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {data.sections.map((s) => (
              <span
                key={s.name}
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  s.filled
                    ? "bg-[var(--doost-bg-badge-ready)] text-[var(--doost-text-positive)]"
                    : "bg-[var(--doost-bg-secondary)] text-[var(--doost-text-muted)]"
                }`}
              >
                {s.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
