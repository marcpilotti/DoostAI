"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { AIMessage } from "./AIMessage";

const DONE_MESSAGES = [
  { text: "Meta granskar din annons — det tar 1-24 timmar", delay: 400 },
  { text: "Vi mejlar dig när den är live", delay: 1400 },
  { text: "Kolla resultaten i dashboarden imorgon", delay: 2400 },
];

export function DoneSlide({ brandName, onDashboard }: { brandName?: string; onDashboard: () => void }) {
  const prefersReduced = useReducedMotion();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => { if (c <= 1) { clearInterval(interval); onDashboard(); return 0; } return c - 1; });
    }, 1000);
    return () => clearInterval(interval);
  }, [onDashboard]);

  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      {/* Check icon */}
      <motion.div
        initial={prefersReduced ? false : { scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "backOut" }}
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-foreground"
      >
        <Check className="h-8 w-8 text-white" strokeWidth={3} />
      </motion.div>

      <motion.h2
        initial={prefersReduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mb-2 text-2xl font-bold tracking-tight"
      >
        Din annons är publicerad!
      </motion.h2>

      {brandName && (
        <motion.p initial={prefersReduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mb-6 text-[14px] text-muted-foreground/50">
          {brandName} är redo att nå nya kunder
        </motion.p>
      )}

      <div className="mb-8 flex flex-col items-center gap-2">
        {DONE_MESSAGES.map((msg) => <AIMessage key={msg.text} text={msg.text} delay={msg.delay} />)}
      </div>

      <motion.button
        initial={prefersReduced ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
        onClick={onDashboard}
        className="flex items-center gap-2 rounded-full bg-foreground px-8 py-3 text-[14px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
      >
        Gå till dashboard
        <ArrowRight className="h-4 w-4" />
      </motion.button>

      <motion.p initial={prefersReduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-4 text-[11px] text-muted-foreground/25">
        Omdirigeras om {countdown}s...
      </motion.p>
    </div>
  );
}
