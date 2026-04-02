"use client";

import { Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { NumberTicker } from "@/components/ui/number-ticker";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

// ── Helpers ─────────────────────────────────────────────────────

function Divider() {
  return <div className="my-4 h-px bg-[#f1f5f9]" />;
}

// ── Preset tiers ────────────────────────────────────────────────

const TIERS = [
  { id: "starter", label: "Starter", daily: 50, reach: "~1 200", recommended: false },
  { id: "recommended", label: "Rekommenderad", daily: 150, reach: "~4 500", recommended: true },
  { id: "growth", label: "Growth", daily: 300, reach: "~9 800", recommended: false },
] as const;

// ── Live metrics ────────────────────────────────────────────────

function calcMetrics(daily: number) {
  const monthlyReach = daily * 30;
  const monthlyClicks = Math.round(daily * 2.8);
  const cpc = monthlyClicks > 0 ? ((daily * 30) / monthlyClicks).toFixed(1) : "0";
  return { monthlyReach, monthlyClicks, cpc };
}

// ── Mini bar chart ──────────────────────────────────────────────

function MiniBarChart({ budget }: { budget: number }) {
  return (
    <div className="flex items-end justify-between gap-[2px] h-14">
      {Array.from({ length: 30 }).map((_, i) => {
        const height = Math.max(8, Math.min(56, (budget / 500) * 56 * (0.6 + Math.sin(i * 0.4) * 0.4)));
        const opacity = 0.22 + (i / 30) * 0.44;
        return (
          <div
            key={i}
            className="flex-1 rounded-t-sm transition-all duration-300"
            style={{
              height: `${height}px`,
              backgroundColor: `rgba(37, 99, 235, ${opacity})`,
            }}
          />
        );
      })}
    </div>
  );
}

// ── Component ───────────────────────────────────────────────────

export function BudgetCard({ onConfirm, onBack }: {
  onConfirm: (data: { dailyBudget: number }) => void;
  onBack?: () => void;
}) {
  const prefersReduced = useReducedMotion();
  const [budget, setBudget] = useState(150);
  const metrics = calcMetrics(budget);

  function handleConfirm() {
    onConfirm({ dailyBudget: budget });
  }

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto w-full max-w-[480px] rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
    >
      {/* 1. Header */}
      <h2 className="text-2xl font-bold text-[#0f172a]">Budget</h2>
      <p className="mt-1 text-sm text-[#64748b]">Välj din dagliga annonsbudget</p>

      {/* 2. Divider */}
      <Divider />

      {/* 3. Tier cards */}
      <div className="grid grid-cols-3 gap-3">
        {TIERS.map((tier) => {
          const isSelected = budget === tier.daily;
          return (
            <button
              key={tier.id}
              onClick={() => setBudget(tier.daily)}
              className={cn(
                "relative rounded-xl p-4 text-center transition-all",
                isSelected
                  ? "border-[1.5px] border-[#3B82F6] bg-[#F0F7FF]"
                  : "border border-[#e2e8f0] bg-white hover:border-[#cbd5e1]",
              )}
            >
              {tier.recommended && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#F0FDF4] border border-[#86EFAC] px-2 py-0.5 text-[9px] font-medium text-[#059669]">
                  Bäst värde
                </span>
              )}
              {isSelected && (
                <div className="absolute -right-1.5 -top-1.5 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#3B82F6] text-white">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </div>
              )}
              <p className="text-xs text-[#94a3b8]">{tier.label}</p>
              <p className="mt-1 text-[28px] font-extrabold text-[#0f172a]">{tier.daily} kr</p>
              <p className="text-xs text-[#64748b]">/dag</p>
              <p className="mt-1 text-[10px] text-[#94a3b8]">{tier.reach}/dag</p>
            </button>
          );
        })}
      </div>

      {/* 4. Divider */}
      <Divider />

      {/* 5. Slider */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px] font-medium text-[#94a3b8]">Anpassad budget</p>
        <span className="text-[28px] font-extrabold text-[#0f172a]">{budget} kr<span className="text-xs font-normal text-[#64748b]">/dag</span></span>
      </div>
      <Slider
        value={[budget]}
        onValueChange={([v]) => setBudget(v ?? 150)}
        min={20}
        max={500}
        step={10}
        className="w-full"
      />
      <div className="flex justify-between mt-1 text-[10px] text-[#94a3b8]">
        <span>20 kr</span>
        <span>500 kr</span>
      </div>

      {/* 6. Divider */}
      <Divider />

      {/* 7. Metric numbers */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-[28px] font-extrabold text-[#0f172a]">
            <NumberTicker value={metrics.monthlyReach} className="text-[28px] font-extrabold text-[#0f172a]" />
          </p>
          <p className="text-[10px] text-[#94a3b8] mt-1">Räckvidd/mån</p>
        </div>
        <div className="text-center">
          <p className="text-[28px] font-extrabold text-[#0f172a]">
            <NumberTicker value={metrics.monthlyClicks} className="text-[28px] font-extrabold text-[#0f172a]" />
          </p>
          <p className="text-[10px] text-[#94a3b8] mt-1">Klick/mån</p>
        </div>
        <div className="text-center">
          <p className="text-[28px] font-extrabold text-[#0f172a]">
            <NumberTicker value={parseFloat(metrics.cpc)} decimalPlaces={1} className="text-[28px] font-extrabold text-[#0f172a]" /> kr
          </p>
          <p className="text-[10px] text-[#94a3b8] mt-1">Kostnad/klick</p>
        </div>
      </div>

      {/* 8. Mini bar chart */}
      <div className="mt-4">
        <MiniBarChart budget={budget} />
        <div className="flex justify-between mt-1 text-[10px] text-[#94a3b8]">
          <span>Dag 1</span>
          <span>Dag 30</span>
        </div>
      </div>

      {/* 9. Reassurance text (green, no card bg) */}
      <p className="mt-4 text-sm font-medium text-[#059669]">
        Betala bara för resultat. Ändra eller pausa din budget när som helst.
      </p>

      {/* 10. Divider */}
      <Divider />

      {/* 11. CTA */}
      <button
        onClick={handleConfirm}
        className="w-full rounded-md bg-[#0f172a] py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#1e293b]"
      >
        Fortsätt till annonsförhandsgranskning →
      </button>

      {onBack && (
        <button
          onClick={onBack}
          className="mt-4 w-full text-center text-sm text-[#94a3b8] hover:text-[#0f172a] transition-colors"
        >
          ← Tillbaka
        </button>
      )}
    </motion.div>
  );
}
