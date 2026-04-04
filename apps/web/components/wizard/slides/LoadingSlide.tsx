"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import { transitions } from "@/lib/motion";
import { useWizardStore } from "@/lib/stores/wizard-store";

const PHASES = [
  { label: "Hämtar din webbplats...", detail: "Läser innehåll och struktur" },
  { label: "Analyserar varumärke...", detail: "Färger, typsnitt och logotyp" },
  { label: "Identifierar målgrupp...", detail: "Bransch och konkurrenter" },
  { label: "Bygger din profil...", detail: "Skapar din varumärkesprofil" },
];

const PARTICLE_COUNT = 6;

export function LoadingSlide() {
  const { brand } = useWizardStore();
  const [phaseIndex, setPhaseIndex] = useState(0);

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
    []
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setPhaseIndex((i) => (i < PHASES.length - 1 ? i + 1 : i));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Brand colors extracted so far (show as they come in)
  const colors = brand?.colors
    ? Object.values(brand.colors).filter(Boolean)
    : [];

  return (
    <div className="flex flex-col items-center justify-center gap-8 text-center">
      {/* Pulsing glow */}
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
        {/* Floating particles */}
        {particles.map((p) => {
          const rad1 = (p.angle * Math.PI) / 180;
          const rad2 = ((p.angle + 120) * Math.PI) / 180;
          const rad3 = ((p.angle + 240) * Math.PI) / 180;
          return (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                width: p.size,
                height: p.size,
                background: "var(--color-primary)",
                opacity: 0.4,
              }}
              animate={{
                x: [
                  Math.cos(rad1) * p.radius,
                  Math.cos(rad2) * p.radius,
                  Math.cos(rad3) * p.radius,
                  Math.cos(rad1) * p.radius,
                ],
                y: [
                  Math.sin(rad1) * p.radius,
                  Math.sin(rad2) * p.radius,
                  Math.sin(rad3) * p.radius,
                  Math.sin(rad1) * p.radius,
                ],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: p.delay,
              }}
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
            style={{ background: "var(--color-primary)" }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </motion.div>

      {/* Color dots */}
      {colors.length > 0 && (
        <motion.div
          className="flex gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
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

      {/* Phase steps */}
      <div className="flex flex-col items-start gap-2 w-56">
        {PHASES.map((phase, i) => {
          const isDone = i < phaseIndex;
          const isCurrent = i === phaseIndex;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15, ...transitions.spring }}
              className="flex items-center gap-3 w-full"
            >
              {/* Step indicator */}
              <motion.div
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                style={{
                  background: isDone
                    ? "var(--color-success)"
                    : isCurrent
                      ? "var(--color-primary)"
                      : "var(--color-bg-raised)",
                  color: isDone || isCurrent ? "#fff" : "var(--color-text-muted)",
                }}
                animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
                transition={isCurrent ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : {}}
              >
                {isDone ? "\u2713" : i + 1}
              </motion.div>

              <div className="flex-1 min-w-0">
                <p
                  className="text-[13px] font-medium truncate"
                  style={{
                    color: isCurrent
                      ? "var(--color-text-primary)"
                      : isDone
                        ? "var(--color-text-secondary)"
                        : "var(--color-text-muted)",
                  }}
                >
                  {phase.label}
                </p>
                {isCurrent && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-[11px] truncate"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {phase.detail}
                  </motion.p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
