"use client";

import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useWizardNavigation } from "@/hooks/use-wizard-navigation";
import { cardVariants,transitions } from "@/lib/motion";
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
  return date.toLocaleDateString("sv-SE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function estimateReach(budget: number, days: number): { min: number; max: number } {
  const dailyBudget = budget / days;
  const cpm = 45; // avg SEK CPM
  const min = Math.round((dailyBudget / cpm) * 1000 * days * 0.6);
  const max = Math.round((dailyBudget / cpm) * 1000 * days * 1.4);
  return { min, max };
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

  const handleContinue = useCallback(() => {
    setBudget({
      landingUrl,
      totalBudget,
      currency: "SEK",
      durationDays,
      startDate,
    });
    handleNext();
  }, [landingUrl, totalBudget, durationDays, startDate, setBudget, handleNext]);

  useEffect(() => {
    setFooterAction(() => handleContinue());
    return () => setFooterAction(null);
  }, [handleContinue, setFooterAction]);

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={transitions.spring}
      className="flex flex-col gap-5"
    >
      <div>
        <h2 className="text-text-h1" style={{ color: "var(--color-text-primary)" }}>
          Budget & schema
        </h2>
        <p className="mt-1 text-text-body-sm" style={{ color: "var(--color-text-muted)" }}>
          Du betalar aldrig mer. Ingen bindningstid.
        </p>
      </div>

      {/* Landing URL */}
      <div>
        <label className="text-text-caption mb-1.5 block" style={{ color: "var(--color-text-muted)" }}>
          Vart ska annonsen länka?
        </label>
        <input
          value={landingUrl}
          onChange={(e) => setLandingUrl(e.target.value)}
          className="w-full outline-none"
          style={{
            background: "var(--color-bg-input)",
            border: "1px solid var(--color-border-default)",
            borderRadius: "var(--radius-md)",
            padding: "12px 16px",
            color: "var(--color-text-primary)",
            fontSize: 16,
          }}
        />
      </div>

      {/* Budget slider */}
      <div>
        <label className="text-text-caption mb-1.5 block" style={{ color: "var(--color-text-muted)" }}>
          Total budget
        </label>
        <input
          type="range"
          min={500}
          max={50000}
          step={500}
          value={totalBudget}
          onChange={(e) => setTotalBudget(Number(e.target.value))}
          className="w-full"
          style={{
            accentColor: "var(--color-primary)",
          }}
        />
        <div className="mt-1 flex items-center justify-between">
          <span className="text-text-h2 font-bold" style={{ color: "var(--color-text-primary)" }}>
            <NumberTicker value={totalBudget} format={(n) => `${Math.round(n).toLocaleString("sv-SE")} kr`} />
          </span>
          <span className="text-text-body-sm" style={{ color: "var(--color-text-muted)" }}>
            SEK
          </span>
        </div>
        <p className="mt-1 text-text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
          → Beräknad räckvidd:{" "}
          <span style={{ color: "var(--color-text-primary)" }}>
            <NumberTicker value={reach.min} format={(n) => `${Math.round(n / 1000)}K`} />
            {" – "}
            <NumberTicker value={reach.max} format={(n) => `${Math.round(n / 1000)}K`} />
          </span>
          {" "}visningar
        </p>
      </div>

      {/* Duration picker */}
      <div>
        <label className="text-text-caption mb-1.5 block" style={{ color: "var(--color-text-muted)" }}>
          Kampanjperiod
        </label>
        <div className="relative flex gap-2">
          {DURATION_OPTIONS.map((opt) => (
            <motion.button
              key={opt.days}
              onClick={() => setDurationDays(opt.days)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="relative text-text-body-sm font-medium"
              style={{
                padding: "8px 16px",
                borderRadius: "var(--radius-full)",
                background: "transparent",
                color: durationDays === opt.days ? "var(--color-primary-light)" : "var(--color-text-muted)",
                border: durationDays === opt.days ? "none" : "1px solid var(--color-border-default)",
              }}
            >
              {durationDays === opt.days && (
                <motion.div
                  layoutId="budget-duration-bg"
                  className="absolute inset-0"
                  style={{
                    borderRadius: "var(--radius-full)",
                    background: "var(--color-primary-glow)",
                  }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                />
              )}
              <span className="relative z-10">
                {durationDays === opt.days ? "● " : ""}
                {opt.label}
              </span>
            </motion.button>
          ))}
        </div>
        <p className="mt-2 text-text-body-sm" style={{ color: "var(--color-text-muted)" }}>
          {formatDate(startDate)} → {formatDate(endDate)}
        </p>
      </div>

      {/* AI note */}
      <motion.p
        className="text-text-body-sm"
        style={{ color: "var(--color-primary-light)" }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200, delay: 0.4 }}
      >
        Vi optimerar budgetfördelningen automatiskt
      </motion.p>
    </motion.div>
  );
}
