"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Rocket } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { AIMessage } from "./AIMessage";

// ── Confetti ────────────────────────────────────────────────────

function Confetti() {
  const colors = [
    "#6366f1", "#10b981", "#f59e0b", "#ec4899", "#3b82f6",
    "#8b5cf6", "#06b6d4", "#f97316", "#14b8a6", "#e11d48",
    "#a855f7", "#22d3ee",
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {colors.map((color, i) => (
        <div
          key={i}
          className="confetti-dot absolute left-1/2 top-1/2"
          style={{
            "--angle": `${i * 30}deg`,
            "--color": color,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// ── Sequential AI messages ──────────────────────────────────────

const DONE_MESSAGES = [
  { text: "Meta granskar din annons — det tar 1-24 timmar", delay: 0 },
  { text: "Vi mejlar dig när den är live", delay: 1000 },
  { text: "Kolla resultaten i dashboarden imorgon", delay: 2000 },
];

// ── Component ────────────────────────────────────────────────────

export function DoneSlide({
  brandName,
  onDashboard,
}: {
  brandName?: string;
  onDashboard: () => void;
}) {
  const prefersReduced = useReducedMotion();
  const [showConfetti, setShowConfetti] = useState(true);
  const [countdown, setCountdown] = useState(4);

  // Hide confetti after animation
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Auto-redirect countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          onDashboard();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onDashboard]);

  return (
    <div className="relative flex h-full flex-col items-center justify-center px-6">
      {/* Confetti */}
      {showConfetti && <Confetti />}

      {/* Rocket icon */}
      <motion.div
        initial={prefersReduced ? false : { scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "backOut" }}
        className="mb-4"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100">
          <Rocket className="h-8 w-8 text-emerald-600" />
        </div>
      </motion.div>

      {/* Heading */}
      <motion.h2
        initial={prefersReduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mb-6 text-center text-xl font-bold tracking-tight"
      >
        Din annons är publicerad!
      </motion.h2>

      {/* Sequential AI messages */}
      <div className="flex flex-col items-center gap-3 mb-8">
        {DONE_MESSAGES.map((msg) => (
          <AIMessage
            key={msg.text}
            text={msg.text}
            delay={msg.delay}
          />
        ))}
      </div>

      {/* Dashboard CTA */}
      <motion.button
        initial={prefersReduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        onClick={onDashboard}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-indigo-600 hover:to-indigo-700 hover:shadow-md"
      >
        Gå till dashboard
        <ArrowRight className="h-4 w-4" />
      </motion.button>

      {/* Auto-redirect notice */}
      <motion.p
        initial={prefersReduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-3 text-xs text-muted-foreground/40"
      >
        Omdirigeras automatiskt om {countdown}s...
      </motion.p>
    </div>
  );
}
