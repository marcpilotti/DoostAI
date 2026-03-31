"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Check, PartyPopper } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { AIMessage } from "./AIMessage";

// ── Confetti — more particles, larger spread ────────────────────

function Confetti() {
  const particles = Array.from({ length: 24 }, (_, i) => ({
    angle: (i * 15),
    color: [
      "#6366f1", "#10b981", "#f59e0b", "#ec4899", "#3b82f6",
      "#8b5cf6", "#06b6d4", "#f97316", "#14b8a6", "#e11d48",
      "#a855f7", "#22d3ee",
    ][i % 12],
    delay: Math.random() * 0.3,
    distance: 30 + Math.random() * 40,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p, i) => (
        <div
          key={i}
          className="confetti-dot absolute left-1/2 top-1/2"
          style={{
            "--angle": `${p.angle}deg`,
            "--color": p.color,
            animationDelay: `${p.delay}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// ── Sequential AI messages ──────────────────────────────────────

const DONE_MESSAGES = [
  { text: "Meta granskar din annons — det tar 1-24 timmar", delay: 400 },
  { text: "Vi mejlar dig när den är live", delay: 1400 },
  { text: "Kolla resultaten i dashboarden imorgon", delay: 2400 },
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
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 2000);
    return () => clearTimeout(timer);
  }, []);

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
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-6">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-100/30 blur-[100px]" />
        <div className="absolute left-1/3 top-1/2 h-64 w-64 rounded-full bg-indigo-100/20 blur-[80px]" />
      </div>

      {/* Confetti */}
      {showConfetti && <Confetti />}

      {/* Success icon — animated ring + check */}
      <motion.div
        initial={prefersReduced ? false : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "backOut" }}
        className="relative mb-6"
      >
        {/* Outer glow */}
        <motion.div
          animate={prefersReduced ? {} : { scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -inset-4 rounded-full bg-emerald-200/30 blur-xl"
        />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-200/50">
          <motion.div
            initial={prefersReduced ? false : { scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.4, delay: 0.3, ease: "backOut" }}
          >
            <Check className="h-10 w-10 text-white" strokeWidth={3} />
          </motion.div>
        </div>
      </motion.div>

      {/* Heading */}
      <motion.h2
        initial={prefersReduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-2 text-center text-2xl font-bold tracking-tight"
      >
        Din annons är publicerad!
      </motion.h2>

      {brandName && (
        <motion.p
          initial={prefersReduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-6 text-sm text-muted-foreground"
        >
          {brandName} är redo att nå nya kunder
        </motion.p>
      )}

      {/* Sequential AI messages */}
      <div className="mb-8 flex flex-col items-center gap-2.5">
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
        transition={{ duration: 0.4, delay: 0.8 }}
        onClick={onDashboard}
        className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200/50 transition-all hover:from-indigo-600 hover:to-indigo-700 hover:shadow-xl hover:shadow-indigo-300/50"
      >
        Gå till dashboard
        <ArrowRight className="h-4 w-4" />
      </motion.button>

      {/* Auto-redirect */}
      <motion.p
        initial={prefersReduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-4 text-[11px] text-muted-foreground/30"
      >
        Omdirigeras automatiskt om {countdown}s...
      </motion.p>
    </div>
  );
}
