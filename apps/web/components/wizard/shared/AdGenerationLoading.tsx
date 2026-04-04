"use client";

/**
 * AdGenerationLoading — engaging loading state during ad generation.
 *
 * Shows a progress bar, step checklist with animated checkmarks,
 * rotating sub-messages, and brand identity elements.
 * Never feels "stuck" — always something moving.
 */

import { Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import { transitions } from "@/lib/motion";
import type { BrandProfile } from "@/lib/stores/wizard-store";

// ── Steps shown as a checklist ──────────────────────────────────

const STEPS = [
  { label: "Analyserar din målgrupp", duration: 2500 },
  { label: "Skriver annonstext med AI", duration: 3000 },
  { label: "Genererar annonsbilder", duration: 4000 },
  { label: "Anpassar till plattformar", duration: 2000 },
  { label: "Slutjusterar", duration: 2500 },
];

// Sub-messages that rotate while on each step — keeps it alive
const SUB_MESSAGES: Record<number, string[]> = {
  0: ["Kollar din bransch...", "Kartlägger konkurrenter...", "Identifierar nyckelord..."],
  1: ["Testar olika hooks...", "Optimerar rubrik...", "Skapar CTA..."],
  2: ["Bygger bakgrund med AI...", "Verifierar bildkvalitet...", "Renderar i rätt format..."],
  3: ["Instagram — klar", "Facebook — klar", "Google — klar"],
  4: ["Polerar detaljerna...", "Allt ser bra ut!", "Snart redo..."],
};

const PARTICLE_COUNT = 6;

type Props = {
  brand: BrandProfile | null;
};

export function AdGenerationLoading({ brand }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const totalDuration = STEPS.reduce((sum, s) => sum + s.duration, 0);

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        angle: (360 / PARTICLE_COUNT) * i,
        radius: 52 + Math.random() * 16,
        size: 3 + Math.random() * 3,
        duration: 4 + Math.random() * 2,
        delay: i * 0.3,
      })),
    [],
  );

  // Advance steps
  useEffect(() => {
    if (stepIndex >= STEPS.length) return;
    const step = STEPS[stepIndex];
    if (!step) return;
    const timer = setTimeout(() => {
      setStepIndex((i) => Math.min(i + 1, STEPS.length));
      setSubIndex(0);
    }, step.duration);
    return () => clearTimeout(timer);
  }, [stepIndex]);

  // Rotate sub-messages within current step
  useEffect(() => {
    if (stepIndex >= STEPS.length) return;
    const interval = setInterval(() => {
      const msgs = SUB_MESSAGES[stepIndex] ?? [];
      setSubIndex((i) => (i + 1) % Math.max(msgs.length, 1));
    }, 1200);
    return () => clearInterval(interval);
  }, [stepIndex]);

  // Track elapsed for progress bar
  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 100), 100);
    return () => clearInterval(interval);
  }, []);

  const progress = Math.min((elapsed / totalDuration) * 100, stepIndex >= STEPS.length ? 100 : 95);
  const currentSub = (SUB_MESSAGES[stepIndex] ?? SUB_MESSAGES[4]!)[subIndex % (SUB_MESSAGES[stepIndex]?.length ?? 1)] ?? "";

  const colors = brand?.colors
    ? Object.values(brand.colors).filter(Boolean)
    : [];

  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center">
      {/* Pulsing glow with logo + floating particles */}
      <motion.div
        className="relative flex h-24 w-24 items-center justify-center"
        animate={{
          boxShadow: [
            "0 0 40px 10px rgba(99, 102, 241, 0.15)",
            "0 0 60px 20px rgba(99, 102, 241, 0.25)",
            "0 0 40px 10px rgba(99, 102, 241, 0.15)",
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{ borderRadius: "50%" }}
      >
        {particles.map((p) => {
          const rad1 = (p.angle * Math.PI) / 180;
          const rad2 = ((p.angle + 120) * Math.PI) / 180;
          const rad3 = ((p.angle + 240) * Math.PI) / 180;
          return (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{ width: p.size, height: p.size, background: "var(--color-primary)", opacity: 0.4 }}
              animate={{
                x: [Math.cos(rad1) * p.radius, Math.cos(rad2) * p.radius, Math.cos(rad3) * p.radius, Math.cos(rad1) * p.radius],
                y: [Math.sin(rad1) * p.radius, Math.sin(rad2) * p.radius, Math.sin(rad3) * p.radius, Math.sin(rad1) * p.radius],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{ duration: p.duration, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
            />
          );
        })}

        {brand?.logoUrl ? (
          <motion.img
            src={brand.logoUrl}
            alt=""
            className="h-16 w-16 rounded-full object-contain"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={transitions.spring}
          />
        ) : (
          <motion.div
            className="h-10 w-10 rounded-full"
            style={{ background: brand?.colors.primary || "var(--color-primary)" }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </motion.div>

      {/* Brand color dots */}
      {colors.length > 0 && (
        <motion.div className="flex gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          {colors.map((color, i) => (
            <motion.div
              key={i}
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: color }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, ...transitions.snappy }}
            />
          ))}
        </motion.div>
      )}

      {/* Progress bar */}
      <div className="w-56">
        <div className="h-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: brand?.colors.primary || "var(--color-primary)" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Step checklist */}
      <div className="flex flex-col items-start gap-1.5">
        {STEPS.map((step, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex && stepIndex < STEPS.length;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: done || active ? 1 : 0.3, x: 0 }}
              transition={{ delay: i * 0.15, ...transitions.spring }}
              className="flex items-center gap-2"
            >
              {done ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={transitions.snappy}
                  className="flex h-4 w-4 items-center justify-center rounded-full"
                  style={{ background: "#22c55e" }}
                >
                  <Check className="h-2.5 w-2.5 text-white" />
                </motion.div>
              ) : active ? (
                <motion.div
                  className="h-4 w-4 rounded-full border-2"
                  style={{ borderColor: brand?.colors.primary || "var(--color-primary)" }}
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                />
              ) : (
                <div className="h-4 w-4 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
              )}
              <span
                className={`text-[12px] ${active ? "font-medium" : "font-normal"}`}
                style={{ color: done ? "#22c55e" : active ? "var(--color-text-primary)" : "var(--color-text-muted)" }}
              >
                {step.label}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Rotating sub-message — always moving */}
      <AnimatePresence mode="wait">
        <motion.p
          key={`${stepIndex}-${subIndex}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 0.6, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="text-[13px]"
          style={{ color: "var(--color-text-muted)" }}
        >
          {currentSub}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
