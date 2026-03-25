"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";

type BudgetEstimatorProps = {
  onConfirm: (budget: { daily: number; duration: number; currency: string }) => void;
};

const DURATIONS = [
  { days: 7, label: "7 dagar" },
  { days: 14, label: "14 dagar" },
  { days: 30, label: "30 dagar" },
  { days: 0, label: "Löpande" },
];

export function BudgetEstimator({ onConfirm }: BudgetEstimatorProps) {
  const [daily, setDaily] = useState(500);
  const [duration, setDuration] = useState(14);

  const total = duration > 0 ? daily * duration : daily * 30;
  const estImpressions = Math.round((daily / 15) * 1000);
  const estClicks = Math.round(estImpressions * 0.025);

  return (
    <div className="mt-2 space-y-4 rounded-xl border border-border/40 bg-white/60 p-5 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Calculator className="h-4 w-4 text-indigo-500" />
        Budgetkalkylator
      </div>

      {/* Daily budget slider */}
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground">Daglig budget</span>
          <span className="text-lg font-bold">{daily} kr/dag</span>
        </div>
        <input
          type="range"
          min={100}
          max={10000}
          step={100}
          value={daily}
          onChange={(e) => setDaily(Number(e.target.value))}
          className="w-full accent-indigo-500"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground/50">
          <span>100 kr</span>
          <span>10 000 kr</span>
        </div>
      </div>

      {/* Duration */}
      <div>
        <span className="mb-2 block text-xs text-muted-foreground">Varaktighet</span>
        <div className="flex gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.days}
              onClick={() => setDuration(d.days)}
              className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
                duration === d.days
                  ? "bg-indigo-500 text-white"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Estimates */}
      <div className="grid grid-cols-3 gap-3 rounded-lg bg-muted/30 p-3">
        <div className="text-center">
          <div className="text-lg font-bold">{total.toLocaleString("sv-SE")} kr</div>
          <div className="text-[10px] text-muted-foreground">Total kostnad</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold">~{estImpressions.toLocaleString("sv-SE")}</div>
          <div className="text-[10px] text-muted-foreground">Visningar/dag</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold">~{estClicks.toLocaleString("sv-SE")}</div>
          <div className="text-[10px] text-muted-foreground">Klick/dag</div>
        </div>
      </div>

      <button
        onClick={() => onConfirm({ daily, duration, currency: "SEK" })}
        className="w-full rounded-xl bg-[#6366f1] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#5558e6]"
      >
        Bekräfta budget — {daily} kr/dag
      </button>
    </div>
  );
}
