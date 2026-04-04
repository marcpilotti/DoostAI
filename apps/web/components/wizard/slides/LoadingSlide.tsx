"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import { transitions } from "@/lib/motion";
import { useWizardStore } from "@/lib/stores/wizard-store";

const PHASES = [
  "Hämtar din webbplats...",
  "Analyserar varumärke...",
  "Identifierar målgrupp...",
  "Bygger din profil...",
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

      {/* Phase text */}
      <motion.p
        key={phaseIndex}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={transitions.spring}
        className="text-text-body"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {PHASES[phaseIndex]}
      </motion.p>
    </div>
  );
}
