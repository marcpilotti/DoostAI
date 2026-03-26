"use client";

import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Wallet,
  Zap,
  TrendingUp,
  Target,
} from "lucide-react";

type CampaignConfigData = {
  brandName: string;
  platform: string;
  suggestedBudgets: { daily: number; label: string; reach: string; recommended?: boolean }[];
  currency: string;
};

const DURATIONS = [
  { days: 7, label: "1 vecka", sublabel: "Test" },
  { days: 14, label: "2 veckor", sublabel: "Rekommenderat" },
  { days: 30, label: "1 månad", sublabel: "Optimal" },
  { days: 90, label: "3 månader", sublabel: "Långsiktig" },
];

const REGIONS = [
  { id: "stockholm", label: "Stockholm", radius: "Stockholms län" },
  { id: "gothenburg", label: "Göteborg", radius: "Västra Götaland" },
  { id: "malmo", label: "Malmö", radius: "Skåne" },
  { id: "sweden", label: "Hela Sverige", radius: "Nationellt" },
  { id: "nordics", label: "Norden", radius: "SE, NO, DK, FI" },
];

export function CampaignConfigCard({
  data,
  onSubmit,
}: {
  data: CampaignConfigData;
  onSubmit?: (config: {
    dailyBudget: number;
    duration: number;
    regions: string[];
    currency: string;
  }) => void;
}) {
  const [budget, setBudget] = useState<number | null>(
    data.suggestedBudgets.find((b) => b.recommended)?.daily ?? null,
  );
  const [customBudget, setCustomBudget] = useState("");
  const [duration, setDuration] = useState<number>(14);
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(
    new Set(["sweden"]),
  );

  const activeBudget = budget ?? (customBudget ? parseInt(customBudget, 10) : null);
  const totalBudget = activeBudget && duration ? activeBudget * duration : null;

  function toggleRegion(id: string) {
    setSelectedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleSubmit() {
    if (!activeBudget) return;
    onSubmit?.({
      dailyBudget: activeBudget,
      duration,
      regions: [...selectedRegions],
      currency: data.currency,
    });
  }

  return (
    <div className="animate-message-in mt-3 overflow-hidden rounded-2xl border border-border/40 bg-white/70 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/30 px-5 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold">Kampanjinställningar</div>
          <div className="text-[11px] text-muted-foreground">
            Ställ in budget, tid och räckvidd
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        {/* Budget */}
        <div>
          <div className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
            <Wallet className="h-3.5 w-3.5" />
            Daglig budget
          </div>
          <div className="grid grid-cols-3 gap-2">
            {data.suggestedBudgets.map((b) => (
              <button
                key={b.daily}
                onClick={() => {
                  setBudget(b.daily);
                  setCustomBudget("");
                }}
                className={`relative rounded-xl border-2 px-3 py-3 text-center transition-all ${
                  budget === b.daily
                    ? "border-indigo-400 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-200"
                    : "border-border/50 bg-white hover:border-indigo-300 hover:shadow-sm"
                }`}
              >
                {b.recommended && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 px-2 py-0.5 text-[8px] font-semibold text-white">
                    Rekommenderad
                  </span>
                )}
                <div className="text-base font-bold text-foreground">
                  {b.daily.toLocaleString("sv-SE")} {data.currency}
                </div>
                <div className="text-[10px] font-medium text-muted-foreground">
                  {b.label}
                </div>
                <div className="mt-1 flex items-center justify-center gap-1 text-[9px] text-indigo-500">
                  <TrendingUp className="h-2.5 w-2.5" />
                  {b.reach}
                </div>
              </button>
            ))}
          </div>
          {/* Custom amount */}
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              value={customBudget}
              onChange={(e) => {
                setCustomBudget(e.target.value);
                setBudget(null);
              }}
              placeholder="Egen summa"
              className="h-9 w-full rounded-lg border border-border/60 bg-white px-3 text-xs outline-none transition-colors focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
            />
            <span className="shrink-0 text-xs text-muted-foreground">
              {data.currency}/dag
            </span>
          </div>
        </div>

        {/* Duration */}
        <div>
          <div className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
            <CalendarDays className="h-3.5 w-3.5" />
            Hur länge?
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {DURATIONS.map((d) => (
              <button
                key={d.days}
                onClick={() => setDuration(d.days)}
                className={`rounded-xl border-2 px-3 py-2.5 text-center transition-all ${
                  duration === d.days
                    ? "border-indigo-400 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-200"
                    : "border-border/50 bg-white hover:border-indigo-300 hover:shadow-sm"
                }`}
              >
                <div className="text-sm font-semibold text-foreground">
                  {d.label}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {d.sublabel}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Regions */}
        <div>
          <div className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
            <MapPin className="h-3.5 w-3.5" />
            Var ska annonsen visas?
          </div>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((r) => {
              const active = selectedRegions.has(r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => toggleRegion(r.id)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                    active
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                      : "border-border/50 bg-white text-muted-foreground hover:border-indigo-300 hover:text-indigo-600"
                  }`}
                >
                  <Target className="h-3 w-3" />
                  {r.label}
                  <span className="text-[9px] font-normal opacity-60">
                    {r.radius}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        {totalBudget && totalBudget > 0 ? (
          <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total kostnad</span>
              <span className="text-sm font-bold text-foreground">
                {totalBudget.toLocaleString("sv-SE")} {data.currency}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>
                {activeBudget?.toLocaleString("sv-SE")} {data.currency}/dag
                {" "}× {duration} dagar
              </span>
              <span>
                {[...selectedRegions]
                  .map((id) => REGIONS.find((r) => r.id === id)?.label)
                  .join(", ")}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border/30 px-5 py-3">
        <span className="text-[10px] text-muted-foreground/50">
          Du kan pausa kampanjen när som helst
        </span>
        <button
          onClick={handleSubmit}
          disabled={!activeBudget || activeBudget <= 0}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:from-emerald-600 hover:to-teal-600 hover:shadow-md disabled:opacity-40"
        >
          Publicera kampanj
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
