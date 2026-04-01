"use client";

import { useState, useCallback, useEffect } from "react";
import { ArrowLeft, ArrowRight, Calendar, Check, Globe, MapPin, Rocket, Save, Shield, Wallet } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@clerk/nextjs";

import { AIMessage } from "./AIMessage";
import { AuthModal } from "./AuthModal";
import type { AdData, AdFormat } from "@/components/ads/ad-preview/types";

const BUDGETS = [
  { daily: 75, label: "Testa", desc: "~500 visningar/dag", icon: "🧪" },
  { daily: 150, label: "Rekommenderad", desc: "~2 000 visningar/dag", icon: "⭐", recommended: true },
  { daily: 300, label: "Fullgas", desc: "~5 000 visningar/dag", icon: "🚀" },
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

export function PublishSlide({
  adData, format, goal, brandName, brandLocation, onBack, onPublish,
}: {
  adData: AdData; format: AdFormat; goal: string; brandName: string; brandLocation?: string;
  onBack: () => void;
  onPublish: (config: { dailyBudget: number; duration: number; regions: string[]; channel: string }) => void;
}) {
  const prefersReduced = useReducedMotion();
  const { isSignedIn } = useAuth();
  const [budget, setBudget] = useState(150);
  const [durationDays, setDurationDays] = useState(14);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(() => {
    if (brandLocation) {
      const l = brandLocation.toLowerCase();
      if (l.includes("stockholm")) return "stockholm";
      if (l.includes("göteborg") || l.includes("gothenburg")) return "gothenburg";
      if (l.includes("malmö") || l.includes("malmo")) return "malmo";
    }
    return "stockholm";
  });

  // #17 Draft save
  const [draftSaved, setDraftSaved] = useState(false);

  function handleSaveDraft() {
    try {
      const draft = {
        adData,
        format,
        goal,
        budget,
        durationDays,
        selectedRegion,
        savedAt: Date.now(),
      };
      localStorage.setItem("doost:draft", JSON.stringify(draft));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
    } catch { /* quota exceeded — ignore */ }
  }

  const platformLabel = format.startsWith("meta") ? "Instagram" : format === "google-search" ? "Google" : "LinkedIn";
  const total = durationDays > 0 ? budget * durationDays : null;
  const regionLabel = REGIONS.find((r) => r.id === selectedRegion)?.label ?? selectedRegion;
  const estimatedReach = total ? Math.round(total * 10) : budget * 10;

  function doPublish() {
    setIsPublishing(true);
    onPublish({
      dailyBudget: budget,
      duration: durationDays,
      regions: [selectedRegion],
      channel: format.startsWith("meta") ? "meta" : format === "google-search" ? "google" : "linkedin",
    });
  }

  function handlePublish() {
    if (isPublishing) return; // Prevent double-click
    if (!isSignedIn) { setShowAuthModal(true); return; }
    doPublish();
  }

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 sm:px-6">
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} onAuthenticated={() => { setShowAuthModal(false); doPublish(); }} />

      <div className="w-full max-w-lg">
        {/* Header with icon */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex flex-col items-center"
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground">
            <Rocket className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-[22px] font-bold tracking-tight">Publicera kampanj</h2>
          <p className="mt-1 text-[13px] text-muted-foreground/50">Sista steget — välj budget och gå live</p>
        </motion.div>

        {/* Main card */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)]"
        >
          {/* Ad summary — compact */}
          <div className="flex items-center gap-3 border-b border-border/8 px-5 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground/5">
              <Globe className="h-4 w-4 text-foreground/40" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-foreground">{adData.headline}</p>
              <p className="text-[11px] text-muted-foreground/40">{adData.brandUrl.replace(/^https?:\/\//, "")} · {platformLabel}</p>
            </div>
          </div>

          {/* Budget selector — visual cards */}
          <div className="px-5 py-4">
            <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/30">
              <Wallet className="h-3 w-3" /> Daglig budget
            </div>
            <div className="flex gap-2" role="radiogroup" aria-label="Daglig budget">
              {BUDGETS.map((b) => (
                <button
                  key={b.daily}
                  role="radio"
                  aria-checked={budget === b.daily}
                  onClick={() => setBudget(b.daily)}
                  className={`relative flex-1 rounded-xl py-3 text-center transition-all ${
                    budget === b.daily
                      ? "bg-foreground text-white shadow-lg shadow-foreground/10"
                      : "bg-muted-foreground/[0.03] text-foreground hover:bg-muted-foreground/[0.06]"
                  }`}
                >
                  {b.recommended && budget !== b.daily && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-2 py-px text-[8px] font-bold text-white">★</span>
                  )}
                  <div className="text-[10px]">{b.icon}</div>
                  <div className="text-[16px] font-bold">{b.daily} kr</div>
                  <div className={`text-[10px] ${budget === b.daily ? "text-white/50" : "text-muted-foreground/30"}`}>{b.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Duration + Region — cleaner layout */}
          <div className="grid grid-cols-2 gap-px border-t border-border/8 bg-border/8">
            <div className="bg-white px-5 py-4">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/30">
                <Calendar className="h-3 w-3" /> Tid
              </div>
              <div className="space-y-1" role="radiogroup" aria-label="Tid">
                {DURATIONS.map((d) => (
                  <button
                    key={d.days}
                    role="radio"
                    aria-checked={durationDays === d.days}
                    onClick={() => setDurationDays(d.days)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${
                      durationDays === d.days ? "bg-foreground text-white" : "text-foreground hover:bg-muted-foreground/[0.04]"
                    }`}
                  >
                    {d.label}
                    {d.recommended && durationDays !== d.days && <span className="text-[9px] text-muted-foreground/30">★</span>}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white px-5 py-4">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/30">
                <MapPin className="h-3 w-3" /> Region
              </div>
              <div className="space-y-1" role="radiogroup" aria-label="Region">
                {REGIONS.map((r) => (
                  <button
                    key={r.id}
                    role="radio"
                    aria-checked={selectedRegion === r.id}
                    onClick={() => setSelectedRegion(r.id)}
                    className={`flex w-full items-center rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${
                      selectedRegion === r.id ? "bg-foreground text-white" : "text-foreground hover:bg-muted-foreground/[0.04]"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary bar */}
          <div className="flex items-center justify-between border-t border-border/8 px-5 py-4">
            <div>
              <div className="text-[10px] text-muted-foreground/30">Kampanjbudget</div>
              <div className="text-[22px] font-bold tracking-tight">{total ? `${total.toLocaleString("sv-SE")} kr` : `${budget} kr/dag`}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground/30">Uppskattad räckvidd*</div>
              <div className="text-[16px] font-bold text-foreground/70">{Math.round(estimatedReach * 0.7).toLocaleString("sv-SE")}–{estimatedReach.toLocaleString("sv-SE")}</div>
            </div>
          </div>
        </motion.div>

        {/* Trust signals */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 flex items-center justify-center gap-4 text-[10px] text-muted-foreground/25"
        >
          <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Krypterad betalning</span>
          <span>·</span>
          <span>Pausa när som helst</span>
          <span>·</span>
          <span>Doost AI: Gratis</span>
        </motion.div>
        <p className="mt-1 text-center text-[9px] text-muted-foreground/15">
          *Uppskattat baserat på genomsnittlig CPM. Faktisk räckvidd varierar.
        </p>

        {/* Publish button */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-5"
        >
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-[14px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
          >
            {isPublishing ? (
              <>
                <div className="h-4 w-4 animate-spin motion-reduce:animate-none rounded-full border-2 border-white/30 border-t-white" />
                Publicerar...
              </>
            ) : (
              <>
                Publicera kampanj
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </motion.div>

        {/* Back + Save draft (#17) */}
        <div className="mt-4 flex items-center justify-center gap-4">
          <button onClick={onBack} aria-label="Tillbaka" className="text-[12px] text-muted-foreground/30 hover:text-muted-foreground">
            <ArrowLeft className="mr-1 inline h-3 w-3" /> Tillbaka
          </button>
          <button onClick={handleSaveDraft} className="text-[12px] text-muted-foreground/30 hover:text-muted-foreground">
            {draftSaved ? "Sparat!" : <><Save className="mr-1 inline h-3 w-3" /> Spara utkast</>}
          </button>
        </div>
      </div>
    </div>
  );
}
