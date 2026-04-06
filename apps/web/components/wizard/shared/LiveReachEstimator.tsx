"use client";

import { motion } from "motion/react";

import { transitions } from "@/lib/motion";
import type { ProjectionData } from "@/lib/stores/wizard-store";

import { NumberTicker } from "./NumberTicker";

function formatK(n: number): string {
  return `${Math.round(n / 1000)}K`;
}

function formatNum(n: number): string {
  return n.toLocaleString("sv-SE");
}

export function LiveReachEstimator({
  projections,
  variant = "live",
  className = "",
}: {
  projections: ProjectionData;
  variant?: "live" | "readonly";
  className?: string;
}) {
  const isLive = variant === "live";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, ...transitions.spring }}
      className={`relative overflow-hidden ${className}`}
      style={{
        padding: "16px 20px",
        borderRadius: 14,
        background: isLive ? "rgba(99,102,241,0.04)" : "rgba(255,255,255,0.02)",
        border: isLive ? "1px solid rgba(99,102,241,0.15)" : "1px solid rgba(255,255,255,0.06)",
        ...(isLive
          ? { backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }
          : {}),
      }}
    >
      {/* Glow effect (live only) */}
      {isLive && (
        <div
          className="pointer-events-none absolute -top-20 left-1/2 h-40 w-80 -translate-x-1/2"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)" }}
        />
      )}

      <p
        className="relative mb-3 text-center text-[11px] font-semibold uppercase"
        style={{ letterSpacing: "0.06em", color: "rgba(165,165,195,0.6)" }}
      >
        Beräknad räckvidd
      </p>

      <div className="relative grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-[18px] font-medium tracking-tight" style={{ color: "var(--color-text-primary)" }}>
            <NumberTicker value={projections.reachMin} format={formatK} />
            <span className="text-[13px] font-normal" style={{ color: "var(--color-text-muted)" }}> – </span>
            <NumberTicker value={projections.reachMax} format={formatK} />
          </div>
          <span className="text-[10px] uppercase" style={{ letterSpacing: "0.04em", color: "var(--color-text-muted)" }}>
            Visningar
          </span>
        </div>
        <div>
          <div className="text-[18px] font-medium tracking-tight" style={{ color: "var(--color-text-primary)" }}>
            <NumberTicker value={projections.clicksMin} format={formatNum} />
            <span className="text-[13px] font-normal" style={{ color: "var(--color-text-muted)" }}> – </span>
            <NumberTicker value={projections.clicksMax} format={formatNum} />
          </div>
          <span className="text-[10px] uppercase" style={{ letterSpacing: "0.04em", color: "var(--color-text-muted)" }}>
            Klick
          </span>
        </div>
        <div>
          <div className="text-[18px] font-medium tracking-tight" style={{ color: "var(--color-text-primary)" }}>
            {projections.ctrMin}%
            <span className="text-[13px] font-normal" style={{ color: "var(--color-text-muted)" }}> – </span>
            {projections.ctrMax}%
          </div>
          <span className="text-[10px] uppercase" style={{ letterSpacing: "0.04em", color: "var(--color-text-muted)" }}>
            CTR
          </span>
        </div>
      </div>
    </motion.div>
  );
}
