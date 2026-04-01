"use client";

import { Check, Lightbulb } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import { FieldLabel } from "@/components/ui/field-label";
import { Pill } from "@/components/ui/pill";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

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
  const [budget, setBudget] = useState(150);
  const metrics = calcMetrics(budget);

  function handleConfirm() {
    onConfirm({ dailyBudget: budget });
  }

  return (
    <CardShell noPadding>
      {/* ── Header ──────────────────────────────────────── */}
      <div className="p-card-p sm:p-card-p-lg">
        <h2 className="text-card-title text-d-text-primary">Budget</h2>
        <p className="mt-1 text-small text-d-text-secondary">Välj din dagliga annonsbudget</p>
      </div>

      <Separator className="bg-d-border-light" />

      {/* ── Preset tiers ────────────────────────────────── */}
      <div className="p-card-p sm:p-card-p-lg">
        <FieldLabel className="mb-3">Välj budget</FieldLabel>
        <div className="grid grid-cols-3 gap-grid-gap">
          {TIERS.map((tier) => {
            const isSelected = budget === tier.daily;
            return (
              <motion.button
                key={tier.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setBudget(tier.daily)}
                className={cn(
                  "relative rounded-cell p-cell-p text-center transition-all",
                  isSelected
                    ? "bg-accent-light border-[1.5px] border-accent shadow-card-active"
                    : "bg-surface border border-transparent hover:border-d-border",
                )}
              >
                {tier.recommended && (
                  <Pill variant="green" className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] whitespace-nowrap">
                    Bäst värde
                  </Pill>
                )}
                {isSelected && (
                  <div className="absolute -right-1.5 -top-1.5 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-accent text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </div>
                )}
                <p className="text-xs text-d-text-hint">{tier.label}</p>
                <p className="text-metric text-d-text-primary mt-1">{tier.daily} kr</p>
                <p className="text-xs text-d-text-secondary">/dag</p>
                <p className="text-[10px] text-d-text-hint mt-1">{tier.reach}/dag</p>
              </motion.button>
            );
          })}
        </div>
      </div>

      <Separator className="bg-d-border-light" />

      {/* ── Custom slider ───────────────────────────────── */}
      <div className="p-card-p sm:p-card-p-lg">
        <div className="flex items-center justify-between mb-3">
          <FieldLabel>Anpassad budget</FieldLabel>
          <span className="text-metric text-d-text-primary">{budget} kr<span className="text-xs font-normal text-d-text-secondary">/dag</span></span>
        </div>
        <Slider
          value={[budget]}
          onValueChange={([v]) => setBudget(v ?? 150)}
          min={20}
          max={500}
          step={10}
          className="w-full"
        />
        <div className="flex justify-between mt-1 text-[10px] text-d-text-hint">
          <span>20 kr</span>
          <span>500 kr</span>
        </div>
      </div>

      <Separator className="bg-d-border-light" />

      {/* ── Live metrics ────────────────────────────────── */}
      <div className="p-card-p sm:p-card-p-lg">
        <FieldLabel className="mb-3">Uppskattad räckvidd</FieldLabel>
        <div className="grid grid-cols-3 gap-grid-gap">
          <div className="rounded-cell bg-surface p-cell-p text-center">
            <p className="text-metric text-d-text-primary">{metrics.monthlyReach.toLocaleString("sv-SE")}</p>
            <p className="text-[10px] text-d-text-hint mt-1">Räckvidd/mån</p>
          </div>
          <div className="rounded-cell bg-surface p-cell-p text-center">
            <p className="text-metric text-d-text-primary">{metrics.monthlyClicks.toLocaleString("sv-SE")}</p>
            <p className="text-[10px] text-d-text-hint mt-1">Klick/mån</p>
          </div>
          <div className="rounded-cell bg-surface p-cell-p text-center">
            <p className="text-metric text-d-text-primary">{metrics.cpc} kr</p>
            <p className="text-[10px] text-d-text-hint mt-1">Kostnad/klick</p>
          </div>
        </div>
      </div>

      <Separator className="bg-d-border-light" />

      {/* ── Mini bar chart ──────────────────────────────── */}
      <div className="px-card-p sm:px-card-p-lg pb-2">
        <MiniBarChart budget={budget} />
        <div className="flex justify-between mt-1 text-[10px] text-d-text-hint">
          <span>Dag 1</span>
          <span>Dag 30</span>
        </div>
      </div>

      {/* ── Reassurance banner ──────────────────────────── */}
      <div className="mx-card-p sm:mx-card-p-lg mb-4 flex items-center gap-2 rounded-cell bg-d-success-light p-3">
        <Lightbulb className="h-4 w-4 shrink-0 text-d-success" />
        <span className="text-sm font-medium text-d-success">
          Betala bara för resultat. Ändra eller pausa din budget när som helst.
        </span>
      </div>

      <Separator className="bg-d-border-light" />

      {/* ── CTA ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 p-card-p sm:p-card-p-lg">
        <Button
          onClick={handleConfirm}
          className="flex-1 rounded-btn bg-d-text-primary text-white hover:bg-d-text-primary/90"
          size="lg"
        >
          Fortsätt till annonsförhandsgranskning →
        </Button>
        {onBack && (
          <Button variant="outline" onClick={onBack} className="rounded-btn border-d-border" size="lg">
            ← Tillbaka
          </Button>
        )}
      </div>
    </CardShell>
  );
}
