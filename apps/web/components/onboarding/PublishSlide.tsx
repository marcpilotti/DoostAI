"use client";

import { useState, useRef, useCallback } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  MapPin,
  Wallet,
  Zap,
} from "lucide-react";
import { motion, useMotionValue, useTransform, useReducedMotion } from "framer-motion";

import { AIMessage } from "./AIMessage";
import type { AdData, AdFormat } from "@/components/ads/ad-preview/types";

// ── Budget tiers ────────────────────────────────────────────────

const BUDGETS = [
  { daily: 75, label: "Testa", reach: "500-1 500 visningar/dag" },
  { daily: 150, label: "Rekommenderad", reach: "1 500-4 000 visningar/dag", recommended: true },
  { daily: 300, label: "Fullgas", reach: "4 000-10 000 visningar/dag" },
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

// ── Slide-to-publish gesture ────────────────────────────────────

function SlideToPublish({ onConfirm, disabled }: { onConfirm: () => void; disabled?: boolean }) {
  const prefersReduced = useReducedMotion();
  const x = useMotionValue(0);
  const trackWidth = 260;
  const thumbSize = 48;
  const maxDrag = trackWidth - thumbSize;

  const bgOpacity = useTransform(x, [0, maxDrag], [0, 1]);
  const textOpacity = useTransform(x, [0, maxDrag * 0.4], [1, 0]);
  const checkScale = useTransform(x, [maxDrag * 0.8, maxDrag], [0, 1]);

  const handleDragEnd = useCallback(() => {
    if (x.get() >= maxDrag * 0.85) {
      onConfirm();
    }
  }, [x, maxDrag, onConfirm]);

  if (disabled) {
    return (
      <div className="relative mx-auto h-12 w-[260px] overflow-hidden rounded-full bg-muted/30">
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground/40">
          Fyll i alla fält för att publicera
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto h-12 w-[260px] overflow-hidden rounded-full bg-gradient-to-r from-indigo-100 to-emerald-100">
      {/* Filled background */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"
        style={{ opacity: bgOpacity }}
      />

      {/* Text hint */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-indigo-600"
        style={{ opacity: textOpacity }}
      >
        Dra för att publicera →
      </motion.div>

      {/* Check icon at end */}
      <motion.div
        className="absolute right-3 top-1/2 -translate-y-1/2"
        style={{ scale: checkScale }}
      >
        <Check className="h-5 w-5 text-white" strokeWidth={3} />
      </motion.div>

      {/* Draggable thumb */}
      <motion.div
        drag={prefersReduced ? false : "x"}
        dragConstraints={{ left: 0, right: maxDrag }}
        dragElastic={0}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="absolute left-0 top-0 flex h-12 w-12 cursor-grab items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 shadow-lg active:cursor-grabbing"
      >
        <ArrowRight className="h-5 w-5 text-white" />
      </motion.div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────

export function PublishSlide({
  adData,
  format,
  goal,
  brandName,
  brandLocation,
  onBack,
  onPublish,
}: {
  adData: AdData;
  format: AdFormat;
  goal: string;
  brandName: string;
  brandLocation?: string;
  onBack: () => void;
  onPublish: (config: {
    dailyBudget: number;
    duration: number;
    regions: string[];
    channel: string;
  }) => void;
}) {
  const [budget, setBudget] = useState(150);
  const [durationDays, setDurationDays] = useState(14);
  const [selectedRegion, setSelectedRegion] = useState(() => {
    // Pre-select based on brand location
    if (brandLocation) {
      const lower = brandLocation.toLowerCase();
      if (lower.includes("stockholm")) return "stockholm";
      if (lower.includes("göteborg") || lower.includes("gothenburg")) return "gothenburg";
      if (lower.includes("malmö") || lower.includes("malmo")) return "malmo";
    }
    return "stockholm";
  });

  const platformLabel = format.startsWith("meta")
    ? "Instagram"
    : format === "google-search"
      ? "Google"
      : "LinkedIn";

  const total = durationDays > 0 ? budget * durationDays : null;
  const regionLabel = REGIONS.find((r) => r.id === selectedRegion)?.label ?? selectedRegion;

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
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-5 flex flex-col items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-200/40">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Publicera kampanj</h2>
        </div>

        {/* Card container */}
        <div className="overflow-hidden rounded-2xl border border-border/20 bg-white/80 shadow-[0_2px_8px_rgba(0,0,0,0.03),0_16px_48px_rgba(0,0,0,0.05)] backdrop-blur-xl">
          {/* Ad summary */}
          <div className="border-b border-border/10 px-5 py-3">
            <div className="text-sm font-semibold text-foreground">
              &ldquo;{adData.headline}&rdquo;
            </div>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>→ {adData.brandUrl.replace(/^https?:\/\//, "")}</span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
              <span>{platformLabel}</span>
            </div>
          </div>

          {/* Budget */}
          <div className="border-b border-border/10 px-5 py-4">
            <div className="mb-2.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
              <Wallet className="h-3 w-3" />
              Budget
            </div>
            <div className="flex gap-2">
              {BUDGETS.map((b) => (
                <button
                  key={b.daily}
                  onClick={() => setBudget(b.daily)}
                  className={`relative flex-1 rounded-xl border px-3 py-3 text-center transition-all ${
                    budget === b.daily
                      ? "border-indigo-300 bg-gradient-to-b from-indigo-50/80 to-white shadow-sm ring-1 ring-indigo-200/60"
                      : "border-border/30 bg-white hover:border-indigo-200 hover:shadow-sm"
                  }`}
                >
                  {b.recommended && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-2.5 py-0.5 text-[8px] font-bold text-white shadow-sm">
                      Rekommenderad
                    </span>
                  )}
                  <div className="text-base font-bold text-foreground">{b.daily} kr</div>
                  <div className="text-[10px] text-muted-foreground/60">/dag</div>
                </button>
              ))}
            </div>
          </div>

          {/* Duration + Region */}
          <div className="grid grid-cols-2 divide-x divide-border/10 border-b border-border/10">
            <div className="px-5 py-4">
              <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
                <CalendarDays className="h-3 w-3" />
                Tid
              </div>
              <div className="flex gap-1.5">
                {DURATIONS.map((d) => (
                  <button
                    key={d.days}
                    onClick={() => setDurationDays(d.days)}
                    className={`flex-1 rounded-lg border px-2 py-2 text-[11px] font-medium transition-all ${
                      durationDays === d.days
                        ? "border-indigo-300 bg-indigo-50/60 text-indigo-700 shadow-sm"
                        : "border-border/30 text-muted-foreground hover:border-indigo-200"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-5 py-4">
              <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
                <MapPin className="h-3 w-3" />
                Region
              </div>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full appearance-none rounded-lg border border-border/30 bg-white px-3 py-2 text-xs font-medium text-foreground outline-none transition-all hover:border-indigo-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              >
                {REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cost summary */}
          <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50/40 to-purple-50/30 px-5 py-3">
            <div>
              <div className="text-[10px] font-medium text-muted-foreground/50">Total kampanjbudget</div>
              <div className="text-lg font-bold tracking-tight text-foreground">
                {total
                  ? `${total.toLocaleString("sv-SE")} kr`
                  : `${budget} kr/dag`}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-medium text-muted-foreground/50">
                {total ? `${budget} kr/dag × ${durationDays} dagar` : "Löpande"}
              </div>
              <div className="mt-0.5 rounded-full bg-emerald-100/60 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                Doost AI: Gratis
              </div>
            </div>
          </div>
        </div>

        {/* AI message */}
        <div className="my-5">
          <AIMessage text="Redo att nå tusentals nya kunder?" />
        </div>

        {/* Slide to publish */}
        <SlideToPublish onConfirm={handlePublish} />

        {/* Back */}
        <div className="mt-5 text-center">
          <button
            onClick={onBack}
            className="text-xs font-medium text-muted-foreground/50 transition-colors hover:text-muted-foreground"
          >
            <ArrowLeft className="mr-1 inline h-3 w-3" />
            Tillbaka till editorn
          </button>
        </div>
      </div>
    </div>
  );
}
