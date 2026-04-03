"use client";

import { motion, useMotionValue, useTransform } from "motion/react";
import { useRef } from "react";

type ParallaxPhoneProps = {
  children: React.ReactNode;
  brandName: string;
};

export function ParallaxPhone({ children, brandName }: ParallaxPhoneProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-200, 200], [5, -5]);
  const rotateY = useTransform(mouseX, [-200, 200], [-5, 5]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 800 }}
      className="flex justify-center"
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        transition={{ type: "spring", damping: 30, stiffness: 200 }}
        className="relative"
      >
        {/* Phone frame */}
        <div
          className="relative overflow-hidden"
          style={{
            width: 260,
            borderRadius: 32,
            background: "#1C1C1E",
            padding: "8px 4px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)",
          }}
        >
          {/* Notch */}
          <div
            className="absolute left-1/2 top-2 z-30 -translate-x-1/2"
            style={{
              width: 80,
              height: 22,
              borderRadius: 12,
              background: "#1C1C1E",
            }}
          />

          {/* Screen */}
          <div
            className="overflow-hidden"
            style={{
              borderRadius: 26,
              background: "var(--color-bg-base)",
            }}
          >
            {/* Status bar */}
            <div className="flex items-center justify-between px-6 py-1" style={{ height: 32 }}>
              <span className="text-[10px] font-semibold" style={{ color: "var(--color-text-primary)" }}>9:41</span>
              <div className="flex gap-1">
                <div className="h-2 w-3 rounded-sm" style={{ background: "var(--color-text-muted)" }} />
                <div className="h-2.5 w-4 rounded-sm" style={{ background: "var(--color-text-muted)" }} />
              </div>
            </div>

            {/* Instagram header */}
            <div className="flex items-center justify-between px-3 py-1">
              <span className="text-[13px] font-bold" style={{ color: "var(--color-text-primary)", fontFamily: "serif" }}>
                Instagram
              </span>
              <div className="flex gap-3">
                <span className="text-[14px]" style={{ color: "var(--color-text-primary)" }}>♡</span>
                <span className="text-[14px]" style={{ color: "var(--color-text-primary)" }}>✉</span>
              </div>
            </div>

            {/* Ad post */}
            <div>
              <div className="flex items-center gap-2 px-3 py-1.5">
                <div className="h-6 w-6 rounded-full" style={{ background: "var(--color-primary)" }} />
                <span className="text-[11px] font-semibold" style={{ color: "var(--color-text-primary)" }}>{brandName}</span>
                <span className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>Sponsrad</span>
              </div>
              <div style={{ aspectRatio: "1/1" }}>
                {children}
              </div>
              <div className="flex gap-3 px-3 py-1.5">
                <span className="text-[14px]">♡</span>
                <span className="text-[14px]">💬</span>
                <span className="text-[14px]">↗</span>
              </div>
            </div>

            {/* Bottom nav */}
            <div className="flex items-center justify-around py-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              {["🏠", "🔍", "➕", "🎬", "👤"].map((icon, i) => (
                <span key={i} className="text-[16px]" style={{ opacity: i === 0 ? 1 : 0.4 }}>{icon}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Reflection */}
        <div
          className="absolute -bottom-2 left-4 right-4 h-8"
          style={{
            background: "linear-gradient(to bottom, rgba(99,102,241,0.05), transparent)",
            borderRadius: "0 0 20px 20px",
            filter: "blur(8px)",
          }}
        />
      </motion.div>
    </div>
  );
}
