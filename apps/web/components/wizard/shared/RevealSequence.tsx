"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

type RevealSequenceProps = {
  brandName: string;
  industry: string;
  strategies: string[];
  onComplete: () => void;
};

const ANALYSIS_LINES = [
  "Vi har analyserat ert varumärke...",
  "Er bransch. Era färger. Er röst.",
];

export function RevealSequence({
  brandName,
  industry,
  strategies,
  onComplete,
}: RevealSequenceProps) {
  const [phase, setPhase] = useState<"typing" | "strategy" | "dissolve" | "done">("typing");
  const [visibleLines, setVisibleLines] = useState(0);
  const [visibleCards, setVisibleCards] = useState(0);

  // Phase 1: Type analysis lines
  useEffect(() => {
    if (phase !== "typing") return;
    const t1 = setTimeout(() => setVisibleLines(1), 400);
    const t2 = setTimeout(() => setVisibleLines(2), 1200);
    const t3 = setTimeout(() => setPhase("strategy"), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [phase]);

  // Phase 2: Show strategy cards
  useEffect(() => {
    if (phase !== "strategy") return;
    const timers = strategies.map((_, i) =>
      setTimeout(() => setVisibleCards(i + 1), i * 400)
    );
    const done = setTimeout(() => setPhase("dissolve"), strategies.length * 400 + 1200);
    return () => { timers.forEach(clearTimeout); clearTimeout(done); };
  }, [phase, strategies]);

  // Phase 3: Dissolve and complete
  useEffect(() => {
    if (phase !== "dissolve") return;
    const t = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 800);
    return () => clearTimeout(t);
  }, [phase, onComplete]);

  if (phase === "done") return null;

  const strategyIcons = ["🎯", "🎨", "✍️"];

  return (
    <motion.div
      className="flex h-full flex-col items-center justify-center text-center"
      initial={{ opacity: 1 }}
      animate={phase === "dissolve" ? { opacity: 0, scale: 0.95, filter: "blur(8px)" } : { opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      {/* Phase 1: Analysis text */}
      <AnimatePresence>
        {phase === "typing" && (
          <motion.div
            className="flex flex-col gap-2"
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {ANALYSIS_LINES.map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={i < visibleLines ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="text-[16px]"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {line}
              </motion.p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 2: Strategy cards */}
      {(phase === "strategy" || phase === "dissolve") && (
        <div className="flex flex-col items-center gap-4">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-2 text-[13px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--color-text-muted)" }}
          >
            Kreativ strategi för {brandName}
          </motion.p>

          <div className="flex gap-3">
            {strategies.slice(0, 3).map((strategy, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={
                  i < visibleCards
                    ? { opacity: 1, y: 0, scale: 1 }
                    : { opacity: 0, y: 20, scale: 0.9 }
                }
                transition={{
                  type: "spring",
                  damping: 20,
                  stiffness: 250,
                }}
                className="flex flex-col items-center gap-2 rounded-xl px-5 py-4"
                style={{
                  background: "rgba(99, 102, 241, 0.08)",
                  border: "1px solid rgba(99, 102, 241, 0.15)",
                  minWidth: 140,
                }}
              >
                <span className="text-xl">{strategyIcons[i] || "✨"}</span>
                <span
                  className="text-[13px] font-medium"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {strategy}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Industry badge */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: visibleCards >= strategies.length ? 0.6 : 0 }}
            className="mt-2 text-[11px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            Optimerat för {industry}
          </motion.span>
        </div>
      )}
    </motion.div>
  );
}
