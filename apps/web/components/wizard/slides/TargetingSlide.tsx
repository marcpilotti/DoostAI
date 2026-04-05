"use client";

import { MapPin, Users, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useWizardNavigation } from "@/hooks/use-wizard-navigation";
import { cardVariants, transitions } from "@/lib/motion";
import { useWizardStore } from "@/lib/stores/wizard-store";

import { NumberTicker } from "../shared/NumberTicker";

const QUICK_LOCATIONS = ["Stockholm", "Göteborg", "Malmö", "Hela Sverige"];

function estimateProjections(budget: number, days: number, locationCount: number) {
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

export function TargetingSlide() {
  const { brand, budget, targeting, setTargeting, setProjections, selectedPlatforms, setFooterAction } = useWizardStore();
  const { handleNext } = useWizardNavigation();

  const detectedLocation = brand?.detectedLocation || "Hela Sverige";
  const [locations, setLocations] = useState<string[]>(targeting?.locations || [detectedLocation]);
  const [ageMin, setAgeMin] = useState(targeting?.ageMin || 25);
  const [ageMax, setAgeMax] = useState(targeting?.ageMax || 55);
  const [gender, setGender] = useState<"all" | "male" | "female">(targeting?.gender || "all");
  const [showLinkedIn, setShowLinkedIn] = useState(false);
  const [linkedinRoles, setLinkedInRoles] = useState<string[]>(targeting?.linkedinRoles || []);
  const hasLinkedIn = selectedPlatforms.includes("linkedin");

  const projections = useMemo(
    () => estimateProjections(budget?.totalBudget || 5000, budget?.durationDays || 30, locations.length),
    [budget, locations.length],
  );

  const addLocation = (loc: string) => { if (!locations.includes(loc)) setLocations([...locations, loc]); };
  const removeLocation = (loc: string) => { setLocations(locations.filter((l) => l !== loc)); };

  const handleContinue = useCallback(() => {
    setTargeting({ locations, ageMin, ageMax, gender, linkedinRoles: hasLinkedIn ? linkedinRoles : undefined });
    setProjections({ reachMin: projections.reachMin, reachMax: projections.reachMax, clicksMin: projections.clicksMin, clicksMax: projections.clicksMax, ctrMin: projections.ctrMin, ctrMax: projections.ctrMax });
    handleNext();
  }, [locations, ageMin, ageMax, gender, linkedinRoles, hasLinkedIn, projections, setTargeting, setProjections, handleNext]);

  useEffect(() => {
    setFooterAction(() => handleContinue());
    return () => setFooterAction(null);
  }, [handleContinue, setFooterAction]);

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={transitions.spring}
      className="flex flex-col gap-4">

      {/* ── Location card ───────────────────────────────────── */}
      <div style={{ padding: "16px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-3.5 w-3.5" style={{ color: "var(--color-primary-light)" }} />
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Plats</span>
        </div>

        {/* Selected locations */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <AnimatePresence>
            {locations.map((loc) => (
              <motion.span key={loc} layout
                initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                transition={transitions.snappy}
                className="flex items-center gap-1.5 text-[12px] font-medium"
                style={{ padding: "6px 10px", borderRadius: 8, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", color: "var(--color-primary-light)" }}>
                {loc}
                <button onClick={() => removeLocation(loc)}>
                  <X className="h-3 w-3" style={{ color: "var(--color-text-muted)" }} />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>

        {/* Quick add */}
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
      </div>

      {/* ── Demographics card ───────────────────────────────── */}
      <div style={{ padding: "16px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-3.5 w-3.5" style={{ color: "var(--color-primary-light)" }} />
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Demografi</span>
        </div>

        <div className="flex items-end gap-4">
          {/* Age */}
          <div className="flex-1">
            <label className="text-[10px] uppercase tracking-wider mb-1.5 block" style={{ color: "var(--color-text-muted)" }}>Ålder</label>
            <div className="flex items-center gap-2">
              <input type="number" min={18} max={65} value={ageMin} onChange={(e) => setAgeMin(Number(e.target.value))}
                className="w-16 text-center text-[15px] font-semibold outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 8px", color: "var(--color-text-primary)" }} />
              <span className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>–</span>
              <input type="number" min={18} max={65} value={ageMax} onChange={(e) => setAgeMax(Number(e.target.value))}
                className="w-16 text-center text-[15px] font-semibold outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 8px", color: "var(--color-text-primary)" }} />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="text-[10px] uppercase tracking-wider mb-1.5 block" style={{ color: "var(--color-text-muted)" }}>Kön</label>
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
      </div>

      {/* ── LinkedIn targeting (collapsible) ─────────────────── */}
      {hasLinkedIn && (
        <div style={{ padding: "16px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={() => setShowLinkedIn(!showLinkedIn)}
            className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider w-full"
            style={{ color: "var(--color-text-muted)" }}>
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
                    <button onClick={() => setLinkedInRoles(linkedinRoles.filter((r) => r !== role))}>
                      <X className="h-3 w-3" style={{ color: "var(--color-text-muted)" }} />
                    </button>
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
        </div>
      )}

      {/* ── Projections card with glow ───────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, ...transitions.spring }}
        className="relative overflow-hidden"
        style={{ padding: "20px", borderRadius: 14, background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.15)" }}>
        {/* Glow effect */}
        <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-80 -translate-x-1/2"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)" }} />

        <p className="relative text-[10px] font-semibold uppercase tracking-widest text-center mb-4" style={{ color: "rgba(165,165,195,0.6)" }}>
          Beräknad räckvidd
        </p>

        <div className="relative grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-[20px] font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
              <NumberTicker value={projections.reachMin} format={(n) => `${Math.round(n / 1000)}K`} />
              <span className="text-[14px] font-normal" style={{ color: "var(--color-text-muted)" }}> – </span>
              <NumberTicker value={projections.reachMax} format={(n) => `${Math.round(n / 1000)}K`} />
            </div>
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>visningar</span>
          </div>
          <div>
            <div className="text-[20px] font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
              <NumberTicker value={projections.clicksMin} format={(n) => n.toLocaleString("sv-SE")} />
              <span className="text-[14px] font-normal" style={{ color: "var(--color-text-muted)" }}> – </span>
              <NumberTicker value={projections.clicksMax} format={(n) => n.toLocaleString("sv-SE")} />
            </div>
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>klick</span>
          </div>
          <div>
            <div className="text-[20px] font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
              {projections.ctrMin}%
              <span className="text-[14px] font-normal" style={{ color: "var(--color-text-muted)" }}> – </span>
              {projections.ctrMax}%
            </div>
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>CTR</span>
          </div>
        </div>

        <p className="relative mt-3 text-center text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          Uppskattning baserad på branschdata
        </p>
      </motion.div>
    </motion.div>
  );
}
