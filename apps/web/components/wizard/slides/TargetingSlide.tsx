"use client";

import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useWizardNavigation } from "@/hooks/use-wizard-navigation";
import { cardVariants,transitions } from "@/lib/motion";
import { useWizardStore } from "@/lib/stores/wizard-store";

import { NumberTicker } from "../shared/NumberTicker";

const QUICK_LOCATIONS = ["Stockholm", "Göteborg", "Hela Sverige"];

function estimateProjections(
  budget: number,
  days: number,
  locationCount: number
): { reachMin: number; reachMax: number; clicksMin: number; clicksMax: number; ctrMin: number; ctrMax: number } {
  const dailyBudget = budget / days;
  const cpm = 45;
  const base = (dailyBudget / cpm) * 1000 * days;
  const locationMultiplier = Math.max(1, locationCount * 0.8);
  const reachMin = Math.round(base * 0.6 * locationMultiplier);
  const reachMax = Math.round(base * 1.4 * locationMultiplier);
  const clicksMin = Math.round(reachMin * 0.025);
  const clicksMax = Math.round(reachMax * 0.035);
  return {
    reachMin,
    reachMax,
    clicksMin,
    clicksMax,
    ctrMin: 2.1,
    ctrMax: 3.2,
  };
}

export function TargetingSlide() {
  const { brand, budget, targeting, setTargeting, setProjections, selectedPlatforms, setFooterAction } = useWizardStore();
  const { handleNext } = useWizardNavigation();

  const detectedLocation = brand?.detectedLocation || "Hela Sverige";
  const [locations, setLocations] = useState<string[]>(
    targeting?.locations || [detectedLocation]
  );
  const [ageMin, setAgeMin] = useState(targeting?.ageMin || 25);
  const [ageMax, setAgeMax] = useState(targeting?.ageMax || 55);
  const [gender, setGender] = useState<"all" | "male" | "female">(targeting?.gender || "all");
  const [showLinkedIn, setShowLinkedIn] = useState(false);
  const [linkedinRoles, setLinkedInRoles] = useState<string[]>(targeting?.linkedinRoles || []);

  const hasLinkedIn = selectedPlatforms.includes("linkedin");

  const projections = useMemo(
    () => estimateProjections(budget?.totalBudget || 5000, budget?.durationDays || 30, locations.length),
    [budget, locations.length]
  );

  const addLocation = (loc: string) => {
    if (!locations.includes(loc)) setLocations([...locations, loc]);
  };

  const removeLocation = (loc: string) => {
    setLocations(locations.filter((l) => l !== loc));
  };

  const handleContinue = useCallback(() => {
    setTargeting({
      locations,
      ageMin,
      ageMax,
      gender,
      linkedinRoles: hasLinkedIn ? linkedinRoles : undefined,
    });
    setProjections({
      reachMin: projections.reachMin,
      reachMax: projections.reachMax,
      clicksMin: projections.clicksMin,
      clicksMax: projections.clicksMax,
      ctrMin: projections.ctrMin,
      ctrMax: projections.ctrMax,
    });
    handleNext();
  }, [locations, ageMin, ageMax, gender, linkedinRoles, hasLinkedIn, projections, setTargeting, setProjections, handleNext]);

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
      <div>
        <h2 className="text-text-h1" style={{ color: "var(--color-text-primary)" }}>
          Vem ska se dina annonser?
        </h2>
        <p className="mt-1 text-text-body-sm" style={{ color: "var(--color-text-muted)" }}>
          Ju mer specifik, desto bättre resultat.
        </p>
      </div>

      {/* Location */}
      <div>
        <label className="text-text-caption mb-1.5 block" style={{ color: "var(--color-text-muted)" }}>
          Plats
        </label>
        <div className="flex flex-wrap gap-1.5">
          {locations.map((loc) => (
            <span
              key={loc}
              className="flex items-center gap-1.5 text-text-body-sm font-medium"
              style={{
                padding: "6px 12px",
                borderRadius: "var(--radius-sm)",
                background: "var(--color-bg-raised)",
                border: "1px solid var(--color-border-default)",
                color: "var(--color-text-secondary)",
              }}
            >
              {loc}
              <button onClick={() => removeLocation(loc)} className="text-[14px]" style={{ color: "var(--color-text-muted)" }}>
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          {QUICK_LOCATIONS.filter((l) => !locations.includes(l)).map((loc) => (
            <button
              key={loc}
              onClick={() => addLocation(loc)}
              className="text-text-body-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              + {loc}
            </button>
          ))}
        </div>
      </div>

      {/* Age + Gender */}
      <div className="flex items-end gap-6">
        <div className="flex-1">
          <label className="text-text-caption mb-1.5 block" style={{ color: "var(--color-text-muted)" }}>
            Ålder
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={18}
              max={65}
              value={ageMin}
              onChange={(e) => setAgeMin(Number(e.target.value))}
              className="w-16 text-center outline-none"
              style={{
                background: "var(--color-bg-input)",
                border: "1px solid var(--color-border-default)",
                borderRadius: "var(--radius-sm)",
                padding: "8px",
                color: "var(--color-text-primary)",
              }}
            />
            <span style={{ color: "var(--color-text-muted)" }}>–</span>
            <input
              type="number"
              min={18}
              max={65}
              value={ageMax}
              onChange={(e) => setAgeMax(Number(e.target.value))}
              className="w-16 text-center outline-none"
              style={{
                background: "var(--color-bg-input)",
                border: "1px solid var(--color-border-default)",
                borderRadius: "var(--radius-sm)",
                padding: "8px",
                color: "var(--color-text-primary)",
              }}
            />
          </div>
        </div>
        <div>
          <label className="text-text-caption mb-1.5 block" style={{ color: "var(--color-text-muted)" }}>
            Kön
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as "all" | "male" | "female")}
            className="outline-none"
            style={{
              background: "var(--color-bg-input)",
              border: "1px solid var(--color-border-default)",
              borderRadius: "var(--radius-sm)",
              padding: "8px 12px",
              color: "var(--color-text-primary)",
            }}
          >
            <option value="all">Alla</option>
            <option value="male">Män</option>
            <option value="female">Kvinnor</option>
          </select>
        </div>
      </div>

      {/* LinkedIn targeting (collapsible) */}
      {hasLinkedIn && (
        <div>
          <button
            onClick={() => setShowLinkedIn(!showLinkedIn)}
            className="text-text-body-sm font-medium"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {showLinkedIn ? "▾" : "▸"} LinkedIn-targeting (valfritt)
          </button>
          {showLinkedIn && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              transition={transitions.spring}
              className="mt-2 flex flex-wrap gap-1.5"
            >
              {linkedinRoles.map((role) => (
                <span
                  key={role}
                  className="flex items-center gap-1.5 text-text-body-sm"
                  style={{
                    padding: "6px 12px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--color-bg-raised)",
                    border: "1px solid var(--color-border-default)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {role}
                  <button
                    onClick={() => setLinkedInRoles(linkedinRoles.filter((r) => r !== role))}
                    className="text-[14px]"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    ×
                  </button>
                </span>
              ))}
              {["VD", "Marknadschef", "CTO"].filter((r) => !linkedinRoles.includes(r)).map((role) => (
                <button
                  key={role}
                  onClick={() => setLinkedInRoles([...linkedinRoles, role])}
                  className="text-text-body-sm"
                  style={{
                    padding: "6px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px dashed var(--color-border-default)",
                    color: "var(--color-text-muted)",
                    background: "transparent",
                  }}
                >
                  + {role}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      )}

      {/* Projections */}
      <div
        className="mt-1 rounded-lg p-4"
        style={{
          background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border-subtle)",
        }}
      >
        <p className="text-text-caption mb-3 text-center uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
          Beräknad räckvidd (±40%)
        </p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-text-h2 font-bold" style={{ color: "var(--color-text-primary)" }}>
              <NumberTicker value={projections.reachMin} format={(n) => `${Math.round(n / 1000)}K`} />
              {" – "}
              <NumberTicker value={projections.reachMax} format={(n) => `${Math.round(n / 1000)}K`} />
            </div>
            <span className="text-text-caption" style={{ color: "var(--color-text-muted)" }}>visningar</span>
          </div>
          <div>
            <div className="text-text-h2 font-bold" style={{ color: "var(--color-text-primary)" }}>
              <NumberTicker value={projections.clicksMin} />
              {" – "}
              <NumberTicker value={projections.clicksMax} />
            </div>
            <span className="text-text-caption" style={{ color: "var(--color-text-muted)" }}>klick</span>
          </div>
          <div>
            <div className="text-text-h2 font-bold" style={{ color: "var(--color-text-primary)" }}>
              {projections.ctrMin}% – {projections.ctrMax}%
            </div>
            <span className="text-text-caption" style={{ color: "var(--color-text-muted)" }}>CTR</span>
          </div>
        </div>
        <p className="mt-2 text-center text-text-caption" style={{ color: "var(--color-text-muted)" }}>
          ⓘ Uppskattning baserad på branschdata
        </p>
      </div>
    </motion.div>
  );
}
