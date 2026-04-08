"use client";

/**
 * ConfigureSlide — budget + targeting + duration.
 * Uses the same accent-line + section-dot design language as AudienceSlide.
 */

import { Calendar, Link2, MapPin, Sparkles, Users, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useWizardNavigation } from "@/hooks/use-wizard-navigation";
import { cardVariants, listItemVariants, transitions } from "@/lib/motion";
import { useWizardStore } from "@/lib/stores/wizard-store";

import { ConfigureStepIndicator } from "../shared/ConfigureStepIndicator";
import { NumberTicker } from "../shared/NumberTicker";

// ── Constants ────────────────────────────────────────────────────

const DURATION_OPTIONS = [
  { days: 7, label: "1 vecka" },
  { days: 14, label: "2 veckor" },
  { days: 30, label: "1 månad" },
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
  return date.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
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

// ── Section dot (matches AudienceSlide) ─────────────────────────

function SectionDot() {
  return (
    <div
      className="absolute -left-[19px] top-1.5 h-2 w-2 rounded-full"
      style={{
        background: "var(--color-primary)",
        boxShadow: "0 0 8px var(--color-primary-glow)",
      }}
    />
  );
}

// ── Component ────────────────────────────────────────────────────

export function ConfigureSlide() {
  const { brand, budget, targeting, selectedPlatforms, setBudget, setTargeting, setProjections, setFooterAction } = useWizardStore();
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
  const dailyBudget = Math.round(totalBudget / durationDays);

  const detectedLocation = brand?.detectedLocation || "Hela Sverige";
  const [locations, setLocations] = useState<string[]>(targeting?.locations || [detectedLocation]);
  const [ageMin, setAgeMin] = useState(targeting?.ageMin || 25);
  const [ageMax, setAgeMax] = useState(targeting?.ageMax || 55);
  const [gender, setGender] = useState<"all" | "male" | "female">(targeting?.gender || "all");
  const [showLinkedIn, setShowLinkedIn] = useState(false);
  const [linkedinRoles, setLinkedInRoles] = useState<string[]>(targeting?.linkedinRoles || []);
  const hasLinkedIn = selectedPlatforms.includes("linkedin");

  const projections = useMemo(
    () => estimateProjections(totalBudget, durationDays, locations.length),
    [totalBudget, durationDays, locations.length],
  );

  const addLocation = (loc: string) => { if (!locations.includes(loc)) setLocations([...locations, loc]); };
  const removeLocation = (loc: string) => { setLocations(locations.filter((l) => l !== loc)); };

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
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={transitions.spring}
      className="flex flex-col gap-4"
    >
      {/* Header */}
      <div>
        <h2 className="text-text-h1" style={{ color: "var(--color-text-primary)" }}>
          Konfigurera kampanjen
        </h2>
        <p className="mt-1 text-[13px]" style={{ color: "var(--color-text-muted)" }}>
          Ställ in budget, period och målgrupp.
        </p>
      </div>

      <ConfigureStepIndicator activeStep="configure" />

      {/* Sections with left accent line — same pattern as AudienceSlide */}
      <div className="relative pl-6">
        {/* Vertical accent line */}
        <div
          className="absolute left-[7px] top-2 bottom-2 w-px"
          style={{
            background: "linear-gradient(to bottom, rgba(99,102,241,0.3), rgba(99,102,241,0.05))",
          }}
        />

        <motion.div
          className="flex flex-col gap-8"
          variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
          initial="hidden"
          animate="visible"
        >
          {/* ── Section 1: Budget ── */}
          <motion.div variants={listItemVariants} className="relative">
            <SectionDot />
            <span className="text-[13px] font-medium" style={{ color: "var(--color-text-muted)" }}>
              Budget
            </span>

            <div className="mt-3 text-center">
              <span className="text-[38px] font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
                <NumberTicker value={totalBudget} format={formatKr} />
              </span>
            </div>

            <input
              type="range" min={500} max={50000} step={500} value={totalBudget}
              onChange={(e) => setTotalBudget(Number(e.target.value))}
              className="mt-3 mb-1 w-full"
              style={{ accentColor: "var(--color-primary)" }}
            />
            <div className="flex justify-between text-[10px]" style={{ color: "var(--color-text-muted)" }}>
              <span>500 kr</span>
              <span>50 000 kr</span>
            </div>

            {/* Live stats */}
            <div className="mt-4 flex gap-3">
              {[
                { label: "Per dag", value: formatKr(dailyBudget) },
                { label: "Räckvidd", value: `${Math.round(projections.reachMin / 1000)}K – ${Math.round(projections.reachMax / 1000)}K` },
                { label: "Klick", value: `${Math.round(projections.clicksMin / 100) * 100} – ${Math.round(projections.clicksMax / 100) * 100}` },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex-1 text-center"
                  style={{
                    padding: "10px 8px",
                    borderRadius: 10,
                    background: "rgba(99,102,241,0.04)",
                    border: "1px solid rgba(99,102,241,0.08)",
                  }}
                >
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{stat.label}</div>
                  <div className="mt-0.5 text-[14px] font-semibold" style={{ color: "var(--color-text-primary)" }}>{stat.value}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Section 2: Duration ── */}
          <motion.div variants={listItemVariants} className="relative">
            <SectionDot />
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" style={{ color: "var(--color-primary-light)" }} />
              <span className="text-[13px] font-medium" style={{ color: "var(--color-text-muted)" }}>
                Kampanjperiod
              </span>
            </div>

            <div className="mt-3 flex gap-2">
              {DURATION_OPTIONS.map((opt) => (
                <motion.button
                  key={opt.days}
                  onClick={() => setDurationDays(opt.days)}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 text-center text-[13px] font-semibold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:outline-none"
                  style={{
                    padding: "12px 0",
                    borderRadius: 10,
                    background: durationDays === opt.days ? "rgba(99,102,241,0.08)" : "transparent",
                    color: durationDays === opt.days ? "var(--color-primary-light)" : "var(--color-text-muted)",
                    border: durationDays === opt.days ? "1.5px solid var(--color-primary)" : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {opt.label}
                </motion.button>
              ))}
            </div>
            <p className="mt-2 text-[12px]" style={{ color: "var(--color-text-muted)" }}>
              {formatDate(startDate)} → {formatDate(endDate)}
            </p>
          </motion.div>

          {/* ── Section 3: Location ── */}
          <motion.div variants={listItemVariants} className="relative">
            <SectionDot />
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" style={{ color: "var(--color-primary-light)" }} />
              <span className="text-[13px] font-medium" style={{ color: "var(--color-text-muted)" }}>
                Plats
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <AnimatePresence>
                {locations.map((loc) => (
                  <motion.span
                    key={loc} layout
                    initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="flex items-center gap-1.5 text-[12px] font-medium"
                    style={{ padding: "5px 12px", borderRadius: 99, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", color: "var(--color-primary-light)" }}
                  >
                    {loc}
                    <button onClick={() => removeLocation(loc)} className="transition-colors hover:text-white">
                      <X className="h-3 w-3" />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
              {QUICK_LOCATIONS.filter((l) => !locations.includes(l)).map((loc) => (
                <motion.button
                  key={loc}
                  onClick={() => addLocation(loc)}
                  whileTap={{ scale: 0.97 }}
                  className="text-[12px] font-medium transition-colors hover:text-[var(--color-text-secondary)]"
                  style={{ padding: "5px 12px", borderRadius: 99, border: "1px dashed rgba(255,255,255,0.1)", color: "var(--color-text-muted)" }}
                >
                  + {loc}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* ── Section 4: Demographics ── */}
          <motion.div variants={listItemVariants} className="relative">
            <SectionDot />
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" style={{ color: "var(--color-primary-light)" }} />
              <span className="text-[13px] font-medium" style={{ color: "var(--color-text-muted)" }}>
                Demografi
              </span>
            </div>

            <div className="mt-3 flex items-end gap-4">
              {/* Age */}
              <div>
                <div className="mb-1.5 text-[11px] font-medium" style={{ color: "var(--color-text-muted)" }}>Ålder</div>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min={18} max={65} value={ageMin}
                    onChange={(e) => setAgeMin(Number(e.target.value))}
                    className="w-14 text-center text-[14px] font-semibold outline-none transition-all focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_var(--color-primary-glow)]"
                    style={{ background: "var(--color-bg-raised)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 6px", color: "var(--color-text-primary)" }}
                  />
                  <span className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>–</span>
                  <input
                    type="number" min={18} max={65} value={ageMax}
                    onChange={(e) => setAgeMax(Number(e.target.value))}
                    onBlur={() => { if (ageMin > ageMax) { const tmp = ageMin; setAgeMin(ageMax); setAgeMax(tmp); } }}
                    className="w-14 text-center text-[14px] font-semibold outline-none transition-all focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_var(--color-primary-glow)]"
                    style={{ background: "var(--color-bg-raised)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 6px", color: "var(--color-text-primary)" }}
                  />
                </div>
              </div>
              {/* Gender */}
              <div className="flex-1">
                <div className="mb-1.5 text-[11px] font-medium" style={{ color: "var(--color-text-muted)" }}>Kön</div>
                <div className="flex gap-1.5">
                  {([["all", "Alla"], ["male", "Män"], ["female", "Kvinnor"]] as const).map(([val, label]) => (
                    <motion.button
                      key={val}
                      onClick={() => setGender(val)}
                      whileTap={{ scale: 0.97 }}
                      className="flex-1 text-[12px] font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:outline-none"
                      style={{
                        padding: "10px 0", borderRadius: 10,
                        background: gender === val ? "rgba(99,102,241,0.08)" : "transparent",
                        border: gender === val ? "1.5px solid var(--color-primary)" : "1px solid rgba(255,255,255,0.06)",
                        color: gender === val ? "var(--color-primary-light)" : "var(--color-text-muted)",
                      }}
                    >
                      {label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Section 5: LinkedIn roles (conditional) ── */}
          {hasLinkedIn && (
            <motion.div variants={listItemVariants} className="relative">
              <SectionDot />
              <button
                onClick={() => setShowLinkedIn(!showLinkedIn)}
                className="flex w-full items-center gap-2 text-[13px] font-medium focus-visible:outline-none"
                style={{ color: "var(--color-text-muted)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-linkedin)"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                LinkedIn-roller
                <span className="ml-auto text-[10px]">{showLinkedIn ? "▾" : "▸"}</span>
              </button>
              {showLinkedIn && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  transition={transitions.spring}
                  className="mt-3 flex flex-wrap gap-1.5"
                >
                  <AnimatePresence>
                    {linkedinRoles.map((role) => (
                      <motion.span
                        key={role} layout
                        initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        className="flex items-center gap-1.5 text-[12px] font-medium"
                        style={{ padding: "5px 12px", borderRadius: 99, background: "rgba(10,102,194,0.08)", border: "1px solid rgba(10,102,194,0.2)", color: "var(--color-linkedin)" }}
                      >
                        {role}
                        <button onClick={() => setLinkedInRoles(linkedinRoles.filter((r) => r !== role))}>
                          <X className="h-3 w-3" style={{ color: "var(--color-text-muted)" }} />
                        </button>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                  {["VD", "Marknadschef", "CTO", "CFO"].filter((r) => !linkedinRoles.includes(r)).map((role) => (
                    <motion.button
                      key={role}
                      onClick={() => setLinkedInRoles([...linkedinRoles, role])}
                      whileTap={{ scale: 0.97 }}
                      className="text-[12px] font-medium transition-colors hover:text-[var(--color-text-secondary)]"
                      style={{ padding: "5px 12px", borderRadius: 99, border: "1px dashed rgba(10,102,194,0.15)", color: "var(--color-text-muted)" }}
                    >
                      + {role}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── Section 6: Landing URL ── */}
          <motion.div variants={listItemVariants} className="relative">
            <SectionDot />
            <div className="flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" style={{ color: "var(--color-primary-light)" }} />
              <span className="text-[13px] font-medium" style={{ color: "var(--color-text-muted)" }}>
                Landningssida
              </span>
            </div>
            <div
              className="mt-2 flex items-center"
              style={{
                background: "var(--color-bg-raised)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                transition: "border-color 200ms, box-shadow 200ms",
              }}
            >
              <input
                value={landingUrl}
                onChange={(e) => setLandingUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-transparent text-[13px] outline-none"
                style={{ padding: "10px 14px", color: "var(--color-text-primary)" }}
              />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* AI note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="flex items-center justify-center gap-1.5 text-[12px]"
        style={{ color: "var(--color-primary-light)" }}
      >
        <Sparkles className="h-3 w-3" />
        Vi optimerar budgetfördelningen automatiskt med AI
      </motion.div>
    </motion.div>
  );
}
