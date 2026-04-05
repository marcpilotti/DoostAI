"use client";

import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useWizardNavigation } from "@/hooks/use-wizard-navigation";
import { cardVariants, transitions } from "@/lib/motion";
import { useWizardStore } from "@/lib/stores/wizard-store";

import { NumberTicker } from "../shared/NumberTicker";

const DURATION_OPTIONS = [
  { days: 7, label: "7 dagar" },
  { days: 14, label: "14 dagar" },
  { days: 30, label: "30 dagar" },
];

function getSmartStartDate(): string {
  const now = new Date();
  const day = now.getDay();
  const daysToAdd = day === 5 ? 3 : day === 6 ? 2 : day === 0 ? 1 : 1;
  const start = new Date(now.getTime() + daysToAdd * 86400000);
  return start.toISOString().split("T")[0] as string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" });
}

function estimateReach(budget: number, days: number): { min: number; max: number } {
  const dailyBudget = budget / days;
  const cpm = 45;
  const min = Math.round((dailyBudget / cpm) * 1000 * days * 0.6);
  const max = Math.round((dailyBudget / cpm) * 1000 * days * 1.4);
  return { min, max };
}

function formatKr(n: number): string {
  return `${Math.round(n).toLocaleString("sv-SE")} kr`;
}

export function BudgetSlide() {
  const { brand, budget, setBudget, setFooterAction } = useWizardStore();
  const { handleNext } = useWizardNavigation();

  const [totalBudget, setTotalBudget] = useState(budget?.totalBudget || 5000);
  const [durationDays, setDurationDays] = useState(budget?.durationDays || 30);
  const [landingUrl, setLandingUrl] = useState(budget?.landingUrl || brand?.url || "");
  const startDate = useMemo(() => getSmartStartDate(), []);

  const endDate = useMemo(() => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + durationDays);
    return d.toISOString().split("T")[0] ?? "";
  }, [startDate, durationDays]);

  const reach = useMemo(() => estimateReach(totalBudget, durationDays), [totalBudget, durationDays]);
  const dailyBudget = Math.round(totalBudget / durationDays);

  const handleContinue = useCallback(() => {
    setBudget({ landingUrl, totalBudget, currency: "SEK", durationDays, startDate });
    handleNext();
  }, [landingUrl, totalBudget, durationDays, startDate, setBudget, handleNext]);

  useEffect(() => {
    setFooterAction(() => handleContinue());
    return () => setFooterAction(null);
  }, [handleContinue, setFooterAction]);

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={transitions.spring}
      className="flex flex-col gap-4">

      {/* ── Budget card ─────────────────────────────────────── */}
      <div style={{ padding: "16px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
            Total budget
          </span>
          <span className="text-[11px] font-medium" style={{ color: "var(--color-text-muted)" }}>SEK</span>
        </div>

        {/* Big number */}
        <div className="text-center mb-4">
          <span className="text-[36px] font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
            <NumberTicker value={totalBudget} format={formatKr} />
          </span>
        </div>

        {/* Slider */}
        <div className="relative mb-3">
          <input
            type="range" min={500} max={50000} step={500}
            value={totalBudget}
            onChange={(e) => setTotalBudget(Number(e.target.value))}
            className="w-full"
            style={{ accentColor: "var(--color-primary)" }}
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>500 kr</span>
            <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>50 000 kr</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-2">
          <div className="flex-1" style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)" }}>
            <div className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: "var(--color-text-muted)" }}>Per dag</div>
            <div className="text-[14px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
              <NumberTicker value={dailyBudget} format={formatKr} />
            </div>
          </div>
          <div className="flex-1" style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)" }}>
            <div className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: "var(--color-text-muted)" }}>Räckvidd</div>
            <div className="text-[14px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
              <NumberTicker value={reach.min} format={(n) => `${Math.round(n / 1000)}K`} />
              {" – "}
              <NumberTicker value={reach.max} format={(n) => `${Math.round(n / 1000)}K`} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Duration card ───────────────────────────────────── */}
      <div style={{ padding: "16px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="text-[11px] font-semibold uppercase tracking-wider block mb-3" style={{ color: "var(--color-text-muted)" }}>
          Kampanjperiod
        </span>

        <div className="flex gap-2 mb-3">
          {DURATION_OPTIONS.map((opt) => (
            <motion.button
              key={opt.days}
              onClick={() => setDurationDays(opt.days)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={transitions.snappy}
              className="relative flex-1 text-[13px] font-medium"
              style={{
                padding: "10px 0",
                borderRadius: 10,
                background: durationDays === opt.days ? "rgba(99,102,241,0.08)" : "transparent",
                color: durationDays === opt.days ? "var(--color-primary-light)" : "var(--color-text-muted)",
                border: durationDays === opt.days ? "1px solid var(--color-primary)" : "1px solid rgba(255,255,255,0.06)",
                textAlign: "center",
              }}
            >
              {opt.label}
            </motion.button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--color-text-muted)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          {formatDate(startDate)} → {formatDate(endDate)}
        </div>
      </div>

      {/* ── Landing URL card ────────────────────────────────── */}
      <div style={{ padding: "16px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="text-[11px] font-semibold uppercase tracking-wider block mb-2" style={{ color: "var(--color-text-muted)" }}>
          Landningssida
        </span>
        <div className="flex items-center gap-2" style={{ padding: "10px 14px", borderRadius: 10, background: "var(--color-bg-input)", border: "1px solid var(--color-border-default)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--color-text-muted)", flexShrink: 0 }}>
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
          </svg>
          <input
            value={landingUrl}
            onChange={(e) => setLandingUrl(e.target.value)}
            placeholder="https://..."
            className="w-full bg-transparent text-[14px] outline-none"
            style={{ color: "var(--color-text-primary)" }}
          />
        </div>
      </div>

      {/* AI optimization note */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, ...transitions.spring }}
        className="flex items-center justify-center gap-2 text-[12px]"
        style={{ color: "var(--color-primary-light)" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
        Vi optimerar budgetfördelningen automatiskt
      </motion.div>
    </motion.div>
  );
}
