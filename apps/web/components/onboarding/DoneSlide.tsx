"use client";

import { ArrowRight, BarChart3, Bell, Check, Eye, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect,useState } from "react";

import { CardShell } from "@/components/ui/card-shell";
import { Pill } from "@/components/ui/pill";

import { AIMessage } from "./AIMessage";

const DONE_MESSAGES = [
  { text: "Annonsplattformen granskar din annons — det tar 1-24 timmar", delay: 500 },
  { text: "Vi skickar en notis när den är live", delay: 1500 },
];

const CONFETTI_COLORS = ["#6366f1", "#ec4899", "#f97316", "#10b981", "#3b82f6", "#8b5cf6", "#06b6d4", "#f59e0b"];
const CONFETTI_COUNT = 24;

function ConfettiBurst() {
  const dots = Array.from({ length: CONFETTI_COUNT }, (_, i) => {
    const angle = (360 / CONFETTI_COUNT) * i;
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length]!;
    const distance = 30 + Math.random() * 30;
    return { angle, color, distance };
  });

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {dots.map((dot, i) => (
        <span
          key={i}
          className="confetti-dot absolute left-1/2 top-1/2"
          style={{
            "--angle": `${dot.angle}deg`,
            "--color": dot.color,
            color: dot.color,
            background: dot.color,
            animationDuration: "1.5s",
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

export function DoneSlide({ brandName, onDashboard, onRestart }: { brandName?: string; onDashboard: () => void; onRestart?: () => void }) {
  const prefersReduced = useReducedMotion();
  const [countdown, setCountdown] = useState(15);
  const [paused, setPaused] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Fire confetti on every campaign publish
  useEffect(() => {
    if (prefersReduced) return;
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 2000);
    return () => clearTimeout(timer);
  }, [prefersReduced]);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setCountdown((c) => { if (c <= 1) { clearInterval(interval); onDashboard(); return 0; } return c - 1; });
    }, 1000);
    return () => clearInterval(interval);
  }, [onDashboard, paused]);

  return (
    <div className="relative flex h-full flex-col items-center justify-center px-6 pt-[72px]">
      {showConfetti && <ConfettiBurst />}
      {/* Success animation */}
      <motion.div
        initial={prefersReduced ? false : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "backOut" }}
        className="relative mb-6"
      >
        {/* Outer ring pulse */}
        <motion.div
          animate={prefersReduced ? {} : { scale: [1, 1.3, 1], opacity: [0.15, 0, 0.15] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -inset-3 rounded-full bg-foreground/10"
        />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-d-text-primary">
          <motion.div
            initial={prefersReduced ? false : { scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, duration: 0.3, ease: "backOut" }}
          >
            <Check className="h-8 w-8 text-white" strokeWidth={3} />
          </motion.div>
        </div>
      </motion.div>

      {/* Heading */}
      <motion.h2
        initial={prefersReduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-1 text-[24px] font-bold tracking-tight"
      >
        Din kampanj är live!
      </motion.h2>

      {brandName && (
        <motion.p
          initial={prefersReduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-6 text-[14px] text-d-text-secondary"
        >
          {brandName} når nu nya kunder
        </motion.p>
      )}

      {/* AI messages */}
      <div className="mb-6 flex flex-col items-center gap-2">
        {DONE_MESSAGES.map((msg) => <AIMessage key={msg.text} text={msg.text} delay={msg.delay} />)}
      </div>

      {/* What happens next card */}
      <motion.div
        initial={prefersReduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="mb-6 w-full max-w-sm"
      >
        <CardShell noPadding className="overflow-hidden">
          <div className="px-5 py-4">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-d-text-hint">Vad händer nu</p>
            <div className="space-y-3">
              {[
                { icon: Eye, title: "Granskning", desc: "Annonsplattformen granskar din annons (1-24h)", time: "Nu" },
                { icon: Bell, title: "Notis", desc: "Du får ett mejl när annonsen är godkänd", time: "Idag" },
                { icon: BarChart3, title: "Resultat", desc: "Klick, visningar och ROAS i din dashboard", time: "Imorgon" },
                { icon: Sparkles, title: "AI-optimering", desc: "Doost AI analyserar och föreslår förbättringar", time: "Löpande" },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={prefersReduced ? false : { opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 + i * 0.15 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface">
                    <item.icon className="h-4 w-4 text-d-text-hint" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-d-text-primary">{item.title}</p>
                    <p className="text-[11px] text-d-text-hint">{item.desc}</p>
                  </div>
                  <Pill variant="gray">{item.time}</Pill>
                </motion.div>
              ))}
            </div>
          </div>
        </CardShell>
      </motion.div>

      {/* CTA */}
      <motion.button
        initial={prefersReduced ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        onClick={onDashboard}
        className="flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-[14px] font-semibold text-white transition-all hover:opacity-90 active:scale-95"
      >
        Gå till dashboard
        <ArrowRight className="h-4 w-4" />
      </motion.button>

      {/* #20 Create new ad button */}
      {onRestart && (
        <motion.button
          initial={prefersReduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          onClick={onRestart}
          className="mt-3 rounded-full border border-d-border px-6 py-2.5 text-[13px] font-medium text-d-text-secondary transition-all hover:border-d-text-hint hover:text-d-text-primary active:scale-95"
        >
          Skapa ny annons
        </motion.button>
      )}

      <motion.p
        initial={prefersReduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-3 text-[11px] text-d-text-hint"
      >
        {paused ? (
          <span>Automatisk omdirigering pausad</span>
        ) : (
          <>
            Omdirigeras om {countdown}s...{" "}
            <button onClick={() => setPaused(true)} className="underline hover:text-d-text-secondary">Stanna kvar</button>
          </>
        )}
      </motion.p>
    </div>
  );
}
