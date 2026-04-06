"use client";

/**
 * ConfigureSlide — merged budget + targeting page.
 * Single scrollable page with live reach estimator pinned at bottom.
 */

import { MapPin, Users, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useWizardNavigation } from "@/hooks/use-wizard-navigation";
import { cardVariants, transitions } from "@/lib/motion";
import { useWizardStore } from "@/lib/stores/wizard-store";

import { ConfigureStepIndicator } from "../shared/ConfigureStepIndicator";
import { LiveReachEstimator } from "../shared/LiveReachEstimator";
import { NumberTicker } from "../shared/NumberTicker";

// ── Constants ────────────────────────────────────────────────────

const DURATION_OPTIONS = [
  { days: 7, label: "7 dagar" },
  { days: 14, label: "14 dagar" },
  { days: 30, label: "30 dagar" },
];

const QUICK_LOCATIONS = ["Stockholm", "Göteborg", "Malmö", "Hela Sverige"];

// ── Utilities ────────────────────────────────────────────────────

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

function formatKr(n: number): string {
  return `${Math.round(n).toLocaleString("sv-SE")} kr`;
}

function estimateProjections(budget: number, days: number, locationCount: number) {
  if (days <= 0) return { reachMin: 0, reachMax: 0, clicksMin: 0, clicksMax: 0, ctrMin: 0, ctrMax: 0 };
  const dailyBudget = budget / days;
  const cpm = 45;
  const base = (dailyBudget / cpm) * 1000 * days;
  const locationMultiplier = Math.max(1, locationCount * 0.8);
  const reachMin = Math.round(base * 0.6 * locationMultiplier);
  const reachMax = Math.round(base * 1.4 * locationMultiplier);
  return {
    reachMin, reachMax,
    clicksMin: Math.round(reachMin * 0.025),
    clicksMax: Math.round(reachMax * 0.035),
    ctrMin: 2.1, ctrMax: 3.2,
  };
}

// ── Card wrapper ─────────────────────────────────────────────────

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: 16, borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
      {children}
    </div>
  );
}

function SectionLabel({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      {icon}
      <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
        {children}
      </span>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────

export function ConfigureSlide() {
  const { brand, budget, targeting, selectedPlatforms, setBudget, setTargeting, setProjections, setFooterAction } = useWizardStore();
  const { handleNext } = useWizardNavigation();

  // Budget state
  const [totalBudget, setTotalBudget] = useState(budget?.totalBudget || 5000);
  const [durationDays, setDurationDays] = useState(budget?.durationDays || 30);
  const [landingUrl, setLandingUrl] = useState(budget?.landingUrl || brand?.url || "");
  const startDate = useMemo(() => getSmartStartDate(), []);
  const endDate = useMemo(() => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + durationDays);
    return d.toISOString().split("T")[0] ?? "";
  }, [startDate, durationDays]);
  const dailyBudget = Math.round(totalBudget / durationDays);

  // Targeting state
  const detectedLocation = brand?.detectedLocation || "Hela Sverige";
  const [locations, setLocations] = useState<string[]>(targeting?.locations || [detectedLocation]);
  const [ageMin, setAgeMin] = useState(targeting?.ageMin || 25);
  const [ageMax, setAgeMax] = useState(targeting?.ageMax || 55);
  const [gender, setGender] = useState<"all" | "male" | "female">(targeting?.gender || "all");
  const [showLinkedIn, setShowLinkedIn] = useState(false);
  const [linkedinRoles, setLinkedInRoles] = useState<string[]>(targeting?.linkedinRoles || []);
  const hasLinkedIn = selectedPlatforms.includes("linkedin");

  // Live projections — updates on ANY input change
  const projections = useMemo(
    () => estimateProjections(totalBudget, durationDays, locations.length),
    [totalBudget, durationDays, locations.length],
  );

  const addLocation = (loc: string) => { if (!locations.includes(loc)) setLocations([...locations, loc]); };
  const removeLocation = (loc: string) => { setLocations(locations.filter((l) => l !== loc)); };

  // Save all state and advance
  const handleContinue = useCallback(() => {
    setBudget({ landingUrl, totalBudget, currency: "SEK", durationDays, startDate });
    setTargeting({ locations, ageMin, ageMax, gender, linkedinRoles: hasLinkedIn ? linkedinRoles : undefined });
    setProjections(projections);
    handleNext();
  }, [landingUrl, totalBudget, durationDays, startDate, locations, ageMin, ageMax, gender, linkedinRoles, hasLinkedIn, projections, setBudget, setTargeting, setProjections, handleNext]);

  useEffect(() => {
    setFooterAction(() => handleContinue());
    return () => setFooterAction(null);
  }, [handleContinue, setFooterAction]);

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={transitions.spring}
      className="flex flex-col gap-4">

      <ConfigureStepIndicator activeStep="configure" />

      {/* ── Budget section ─────────────────────────── */}
      <SectionCard>
        <div className="mb-4 flex items-center justify-between">
          <SectionLabel>Total budget</SectionLabel>
          <span className="text-[11px] font-medium" style={{ color: "var(--color-text-muted)" }}>SEK</span>
        </div>

        <div className="mb-4 text-center">
          <span className="text-[36px] font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
            <NumberTicker value={totalBudget} format={formatKr} />
          </span>
        </div>

        <div className="relative mb-3">
          <input type="range" min={500} max={50000} step={500} value={totalBudget}
            onChange={(e) => setTotalBudget(Number(e.target.value))}
            className="w-full" style={{ accentColor: "var(--color-primary)" }} />
          <div className="mt-1 flex justify-between">
            <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>500 kr</span>
            <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>50 000 kr</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)" }}>
            <div className="mb-0.5 text-[9px] uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Per dag</div>
            <div className="text-[14px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
              <NumberTicker value={dailyBudget} format={formatKr} />
            </div>
          </div>
          <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)" }}>
            <div className="mb-0.5 text-[9px] uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Räckvidd</div>
            <div className="text-[14px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
              <NumberTicker value={projections.reachMin} format={(n) => `${Math.round(n / 1000)}K`} />
              {" – "}
              <NumberTicker value={projections.reachMax} format={(n) => `${Math.round(n / 1000)}K`} />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── Duration section ───────────────────────── */}
      <SectionCard>
        <SectionLabel>Kampanjperiod</SectionLabel>
        <div className="mb-3 flex gap-2">
          {DURATION_OPTIONS.map((opt) => (
            <motion.button key={opt.days} onClick={() => setDurationDays(opt.days)}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={transitions.snappy}
              className="relative flex-1 text-center text-[13px] font-medium"
              style={{
                padding: "10px 0", borderRadius: 10,
                background: durationDays === opt.days ? "rgba(99,102,241,0.08)" : "transparent",
                color: durationDays === opt.days ? "var(--color-primary-light)" : "var(--color-text-muted)",
                border: durationDays === opt.days ? "1px solid var(--color-primary)" : "1px solid rgba(255,255,255,0.06)",
              }}>
              {opt.label}
            </motion.button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--color-text-muted)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
          {formatDate(startDate)} → {formatDate(endDate)}
        </div>
      </SectionCard>

      {/* ── Landing URL ────────────────────────────── */}
      <SectionCard>
        <SectionLabel>Landningssida</SectionLabel>
        <div className="flex items-center gap-2" style={{ padding: "10px 14px", borderRadius: 10, background: "var(--color-bg-input)", border: "1px solid var(--color-border-default)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--color-text-muted)", flexShrink: 0 }}>
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
          </svg>
          <input value={landingUrl} onChange={(e) => setLandingUrl(e.target.value)} placeholder="https://..."
            className="w-full bg-transparent text-[14px] outline-none" style={{ color: "var(--color-text-primary)" }} />
        </div>
      </SectionCard>

      {/* ── Location section ───────────────────────── */}
      <SectionCard>
        <SectionLabel icon={<MapPin className="h-3.5 w-3.5" style={{ color: "var(--color-primary-light)" }} />}>Plats</SectionLabel>
        <div className="mb-3 flex flex-wrap gap-2">
          <AnimatePresence>
            {locations.map((loc) => (
              <motion.span key={loc} layout initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={transitions.snappy}
                className="flex items-center gap-1.5 text-[12px] font-medium"
                style={{ padding: "6px 10px", borderRadius: 8, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", color: "var(--color-primary-light)" }}>
                {loc}
                <button onClick={() => removeLocation(loc)}><X className="h-3 w-3" style={{ color: "var(--color-text-muted)" }} /></button>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_LOCATIONS.filter((l) => !locations.includes(l)).map((loc) => (
            <motion.button key={loc} onClick={() => addLocation(loc)}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={transitions.snappy}
              className="text-[12px] font-medium"
              style={{ padding: "6px 10px", borderRadius: 8, border: "1px dashed rgba(255,255,255,0.1)", color: "var(--color-text-muted)", background: "transparent" }}>
              + {loc}
            </motion.button>
          ))}
        </div>
      </SectionCard>

      {/* ── Demographics section ───────────────────── */}
      <SectionCard>
        <SectionLabel icon={<Users className="h-3.5 w-3.5" style={{ color: "var(--color-primary-light)" }} />}>Demografi</SectionLabel>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="mb-1.5 block text-[10px] uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Ålder</label>
            <div className="flex items-center gap-2">
              <input type="number" min={18} max={65} value={ageMin} onChange={(e) => setAgeMin(Number(e.target.value))}
                className="w-16 text-center text-[15px] font-semibold outline-none focus:border-[var(--color-border-focus)] focus:ring-2 focus:ring-[rgba(99,102,241,0.15)]"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 8px", color: "var(--color-text-primary)", transition: "border-color 200ms, box-shadow 200ms" }} />
              <span className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>–</span>
              <input type="number" min={18} max={65} value={ageMax} onChange={(e) => setAgeMax(Number(e.target.value))}
                onBlur={() => { if (ageMin > ageMax) { const tmp = ageMin; setAgeMin(ageMax); setAgeMax(tmp); } }}
                className="w-16 text-center text-[15px] font-semibold outline-none focus:border-[var(--color-border-focus)] focus:ring-2 focus:ring-[rgba(99,102,241,0.15)]"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 8px", color: "var(--color-text-primary)", transition: "border-color 200ms, box-shadow 200ms" }} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Kön</label>
            <div className="flex gap-1">
              {([["all", "Alla"], ["male", "Män"], ["female", "Kvinnor"]] as const).map(([val, label]) => (
                <motion.button key={val} onClick={() => setGender(val)}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={transitions.snappy}
                  className="text-[12px] font-medium"
                  style={{
                    padding: "10px 12px", borderRadius: 10,
                    background: gender === val ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.04)",
                    border: gender === val ? "1px solid var(--color-primary)" : "1px solid rgba(255,255,255,0.08)",
                    color: gender === val ? "var(--color-primary-light)" : "var(--color-text-muted)",
                  }}>
                  {label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── LinkedIn targeting (conditional) ────────── */}
      {hasLinkedIn && (
        <SectionCard>
          <button onClick={() => setShowLinkedIn(!showLinkedIn)}
            className="flex w-full items-center gap-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
            LinkedIn-roller
            <span className="ml-auto text-[10px]">{showLinkedIn ? "▾" : "▸"}</span>
          </button>
          {showLinkedIn && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} transition={transitions.spring}
              className="mt-3 flex flex-wrap gap-1.5">
              <AnimatePresence>
                {linkedinRoles.map((role) => (
                  <motion.span key={role} layout initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={transitions.snappy}
                    className="flex items-center gap-1.5 text-[12px] font-medium"
                    style={{ padding: "6px 10px", borderRadius: 8, background: "rgba(10,102,194,0.08)", border: "1px solid rgba(10,102,194,0.2)", color: "#0A66C2" }}>
                    {role}
                    <button onClick={() => setLinkedInRoles(linkedinRoles.filter((r) => r !== role))}><X className="h-3 w-3" style={{ color: "var(--color-text-muted)" }} /></button>
                  </motion.span>
                ))}
              </AnimatePresence>
              {["VD", "Marknadschef", "CTO", "CFO"].filter((r) => !linkedinRoles.includes(r)).map((role) => (
                <motion.button key={role} onClick={() => setLinkedInRoles([...linkedinRoles, role])}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={transitions.snappy}
                  className="text-[12px]"
                  style={{ padding: "6px 10px", borderRadius: 8, border: "1px dashed rgba(10,102,194,0.2)", color: "var(--color-text-muted)", background: "transparent" }}>
                  + {role}
                </motion.button>
              ))}
            </motion.div>
          )}
        </SectionCard>
      )}

      {/* ── Live reach estimator ───────────────────── */}
      <LiveReachEstimator projections={projections} variant="live" />

      {/* AI note */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, ...transitions.spring }}
        className="flex items-center justify-center gap-2 text-[12px]" style={{ color: "var(--color-primary-light)" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
        Vi optimerar budgetfördelningen automatiskt
      </motion.div>
    </motion.div>
  );
}
