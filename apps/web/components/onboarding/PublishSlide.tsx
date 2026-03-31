"use client";

import { useState, useCallback, useEffect } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { AIMessage } from "./AIMessage";
import type { AdData, AdFormat } from "@/components/ads/ad-preview/types";

const BUDGETS = [
  { daily: 75, label: "Testa" },
  { daily: 150, label: "Rekommenderad", recommended: true },
  { daily: 300, label: "Fullgas" },
];

const DURATIONS = [
  { days: 14, label: "2 veckor", recommended: true },
  { days: 30, label: "1 månad" },
  { days: 0, label: "Löpande" },
];

const REGIONS = [
  { id: "stockholm", label: "Stockholm" },
  { id: "gothenburg", label: "Göteborg" },
  { id: "malmo", label: "Malmö" },
  { id: "sweden", label: "Hela Sverige" },
];

// #7 One-tap publish with countdown
function CountdownPublish({ onConfirm }: { onConfirm: () => void }) {
  const [counting, setCounting] = useState(false);
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (!counting) return;
    if (count <= 0) { onConfirm(); return; }
    const timer = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [counting, count, onConfirm]);

  if (counting) {
    return (
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={() => { setCounting(false); setCount(3); }}
          className="flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-[14px] font-semibold text-white tabular-nums active:scale-[0.98]"
        >
          Publicerar om {count}... — Avbryt
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setCounting(true)}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-[14px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
    >
      Publicera nu
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}

export function PublishSlide({
  adData, format, goal, brandName, brandLocation, onBack, onPublish,
}: {
  adData: AdData; format: AdFormat; goal: string; brandName: string; brandLocation?: string;
  onBack: () => void;
  onPublish: (config: { dailyBudget: number; duration: number; regions: string[]; channel: string }) => void;
}) {
  const [budget, setBudget] = useState(150);
  const [durationDays, setDurationDays] = useState(14);
  const [selectedRegion, setSelectedRegion] = useState(() => {
    if (brandLocation) {
      const l = brandLocation.toLowerCase();
      if (l.includes("stockholm")) return "stockholm";
      if (l.includes("göteborg") || l.includes("gothenburg")) return "gothenburg";
      if (l.includes("malmö") || l.includes("malmo")) return "malmo";
    }
    return "stockholm";
  });

  const platformLabel = format.startsWith("meta") ? "Instagram" : format === "google-search" ? "Google" : "LinkedIn";
  const total = durationDays > 0 ? budget * durationDays : null;

  function handlePublish() {
    onPublish({
      dailyBudget: budget,
      duration: durationDays,
      regions: [selectedRegion],
      channel: format.startsWith("meta") ? "meta" : format === "google-search" ? "google" : "linkedin",
    });
  }

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-md">
        {/* Title */}
        <h2 className="mb-6 text-center text-2xl font-bold tracking-tight">Publicera kampanj</h2>

        {/* Card */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)]">
          {/* Ad summary */}
          <div className="px-6 pt-5 pb-4">
            <p className="text-[14px] font-semibold text-foreground">&ldquo;{adData.headline}&rdquo;</p>
            <p className="mt-1 text-[12px] text-muted-foreground/50">→ {adData.brandUrl.replace(/^https?:\/\//, "")} · {platformLabel}</p>
          </div>

          {/* Budget */}
          <div className="border-t border-border/8 px-6 py-4">
            <div className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/30">Budget</div>
            <div className="flex gap-2">
              {BUDGETS.map((b) => (
                <button key={b.daily} onClick={() => setBudget(b.daily)} className={`relative flex-1 rounded-xl py-3 text-center transition-all ${budget === b.daily ? "bg-foreground text-white" : "bg-muted-foreground/5 text-foreground hover:bg-muted-foreground/8"}`}>
                  {b.recommended && budget !== b.daily && <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-2 py-px text-[9px] font-semibold text-white">★</span>}
                  <div className="text-[16px] font-bold">{b.daily} kr</div>
                  <div className={`text-[11px] ${budget === b.daily ? "text-white/60" : "text-muted-foreground/40"}`}>/dag</div>
                </button>
              ))}
            </div>
          </div>

          {/* Duration + Region */}
          <div className="grid grid-cols-2 border-t border-border/8">
            <div className="border-r border-border/8 px-6 py-4">
              <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/30">Tid</div>
              <div className="flex flex-col gap-1">
                {DURATIONS.map((d) => (
                  <button key={d.days} onClick={() => setDurationDays(d.days)} className={`rounded-lg px-3 py-1.5 text-left text-[13px] font-medium transition-all ${durationDays === d.days ? "bg-foreground text-white" : "text-foreground hover:bg-muted-foreground/5"}`}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-6 py-4">
              <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/30">Region</div>
              <div className="flex flex-col gap-1">
                {REGIONS.map((r) => (
                  <button key={r.id} onClick={() => setSelectedRegion(r.id)} className={`rounded-lg px-3 py-1.5 text-left text-[13px] font-medium transition-all ${selectedRegion === r.id ? "bg-foreground text-white" : "text-foreground hover:bg-muted-foreground/5"}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between border-t border-border/8 px-6 py-4">
            <div>
              <div className="text-[11px] text-muted-foreground/40">Total</div>
              <div className="text-xl font-bold">{total ? `${total.toLocaleString("sv-SE")} kr` : `${budget} kr/dag`}</div>
            </div>
            <div className="rounded-full bg-muted-foreground/5 px-3 py-1 text-[11px] font-medium text-muted-foreground/50">
              Doost AI: Gratis
            </div>
          </div>
        </div>

        {/* #8 AI summary */}
        <div className="mt-4 rounded-xl bg-white px-5 py-3 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <p className="text-[12px] leading-relaxed text-muted-foreground/50">
            {platformLabel}-annons för <span className="font-medium text-foreground/60">{brandName}</span>,{" "}
            {budget} kr/dag i {durationDays > 0 ? `${durationDays} dagar` : "löpande"},{" "}
            {REGIONS.find((r) => r.id === selectedRegion)?.label}
            {total ? ` — beräknad räckvidd: ${Math.round(total * 10).toLocaleString("sv-SE")} visningar` : ""}
          </p>
        </div>

        {/* #7 Countdown publish */}
        <div className="mt-5">
          <CountdownPublish onConfirm={handlePublish} />
        </div>

        {/* Back */}
        <div className="mt-4 text-center">
          <button onClick={onBack} className="text-[12px] text-muted-foreground/40 hover:text-muted-foreground">
            <ArrowLeft className="mr-1 inline h-3 w-3" /> Tillbaka
          </button>
        </div>
      </div>
    </div>
  );
}
