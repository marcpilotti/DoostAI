"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

import { useWizardNavigation } from "@/hooks/use-wizard-navigation";
import { cardVariants, listItemVariants, transitions } from "@/lib/motion";
import { useWizardStore } from "@/lib/stores/wizard-store";

/* ── Industry list (~30 options) ───────────────────────── */
const INDUSTRIES = [
  "Skönhet & Kosmetik", "Frisör & Salong", "Restaurang & Café", "E-handel",
  "SaaS & Tech", "Hälsa & Wellness", "Fastigheter", "Bygg & Renovering",
  "Juridik & Redovisning", "Marknadsföring & Reklam", "Utbildning",
  "Tandvård", "Veterinär", "Bilverkstad & Motor", "Träning & Gym",
  "Mode & Kläder", "Inredning & Design", "Fotografi", "Konsult",
  "Livsmedel & Dagligvaror", "Blommor & Trädgård", "Resor & Turism",
  "Musik & Underhållning", "IT & Support", "Finans & Försäkring",
  "Transport & Logistik", "Barnverksamhet", "Djurvård & Husdjur",
  "Sport & Fritid", "Övrigt",
];

/* ── Suggested audiences per industry ──────────────────── */
function getSuggestedAudiences(industry: string): string[] {
  const map: Record<string, string[]> = {
    "Skönhet & Kosmetik": ["Kvinnor 25-45", "Hudvårdsintresserade", "Ekologiskt medvetna"],
    "Frisör & Salong": ["Modemedvetna 20-40", "Lokala invånare", "Bröllopsplanering"],
    "Restaurang & Café": ["Foodies 25-50", "Lunchgäster", "Helgbesökare"],
    "E-handel": ["Online-shoppare 18-55", "Deal-sökare", "Mobilanvändare"],
    "SaaS & Tech": ["Småföretagare", "Startup-grundare", "IT-chefer"],
    "Hälsa & Wellness": ["Hälsomedvetna 30-55", "Stressade yrkesverksamma", "Yoga-utövare"],
    "Fastigheter": ["Förstagångsköpare", "Familjer", "Investerare"],
    "Träning & Gym": ["Aktiva 18-40", "Nybörjare", "Prestation & styrka"],
    "Mode & Kläder": ["Trendmedvetna 18-35", "Hållbar mode", "Streetwear-fans"],
  };
  return map[industry] || ["Lokala kunder", "Onlinebesökare", "Återkommande kunder"];
}

/* ── Pill Tag component ────────────────────────────────── */
function PillTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <motion.span
      layout
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className="flex items-center gap-1 text-[13px] font-medium"
      style={{
        padding: "5px 12px",
        borderRadius: 20,
        background: "rgba(99,102,241,0.1)",
        border: "1px solid rgba(99,102,241,0.2)",
        color: "var(--color-primary-light)",
      }}
    >
      {label}
      <button
        onClick={onRemove}
        className="ml-0.5 text-[12px] transition-colors hover:text-white"
        style={{ color: "var(--color-text-muted)" }}
      >
        ×
      </button>
    </motion.span>
  );
}

/* ── Main slide ────────────────────────────────────────── */
export function AudienceSlide() {
  const { audience, setAudience, brand, setBrand, setFooterAction } = useWizardStore();
  const { handleNext } = useWizardNavigation();

  const detectedIndustry = brand?.industry || "";
  const isInList = INDUSTRIES.includes(detectedIndustry);
  const [industry, setIndustry] = useState(detectedIndustry);
  const [customIndustry, setCustomIndustry] = useState("");
  const [targets, setTargets] = useState<string[]>(() => {
    if (audience?.interests && audience.interests.length > 0) return audience.interests;
    return getSuggestedAudiences(brand?.industry || "");
  });
  const [adding, setAdding] = useState(false);
  const [newTarget, setNewTarget] = useState("");

  const usps = audience?.usps || brand?.valuePropositions || [];

  useEffect(() => {
    setFooterAction(() => handleNext());
    return () => setFooterAction(null);
  }, [handleNext, setFooterAction]);

  // Sync industry back to brand
  const handleIndustryChange = useCallback((value: string) => {
    setIndustry(value);
    if (value === "Övrigt") {
      setCustomIndustry("");
      // Don't update brand yet — wait for custom input
    } else {
      setCustomIndustry("");
      if (brand) setBrand({ ...brand, industry: value });
      const suggestions = getSuggestedAudiences(value);
      setTargets(suggestions);
    }
  }, [brand, setBrand]);

  const handleCustomIndustryChange = useCallback((value: string) => {
    setCustomIndustry(value);
    if (brand && value.trim()) {
      setBrand({ ...brand, industry: value.trim() });
    }
  }, [brand, setBrand]);

  // Sync targets to audience store
  useEffect(() => {
    setAudience({
      interests: targets,
      challenges: audience?.challenges || [],
      usps: usps,
    });
  }, [targets]); // eslint-disable-line react-hooks/exhaustive-deps

  const addTarget = (t: string) => {
    if (t.trim() && !targets.includes(t.trim())) {
      setTargets([...targets, t.trim()]);
    }
    setNewTarget("");
    setAdding(false);
  };

  const removeTarget = (t: string) => {
    setTargets(targets.filter((x) => x !== t));
  };

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
          Bransch & Målgrupp
        </h2>
        <p className="mt-0.5 text-[13px]" style={{ color: "var(--color-text-muted)" }}>
          Dessa påverkar dina annonstexter och targeting.
        </p>
      </div>

      {/* ── Industry dropdown ── */}
      <div>
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
          Bransch
        </span>
        <select
          value={industry === "Övrigt" ? "Övrigt" : industry}
          onChange={(e) => handleIndustryChange(e.target.value)}
          className="mt-1 w-full outline-none"
          style={{
            background: "var(--color-bg-input)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            padding: "10px 14px",
            color: "var(--color-text-primary)",
            fontSize: 14,
          }}
        >
          <option value="">Välj bransch...</option>
          {/* Show detected industry first if not in standard list */}
          {detectedIndustry && !isInList && detectedIndustry !== "Övrigt" && (
            <option value={detectedIndustry}>{detectedIndustry} (identifierad)</option>
          )}
          {INDUSTRIES.map((ind) => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>
        {industry === "Övrigt" && (
          <motion.input
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            value={customIndustry}
            onChange={(e) => handleCustomIndustryChange(e.target.value)}
            placeholder="Skriv din bransch..."
            autoFocus
            className="mt-2 w-full outline-none"
            style={{
              background: "var(--color-bg-input)",
              border: "1px solid var(--color-border-focus)",
              borderRadius: 10,
              padding: "10px 14px",
              color: "var(--color-text-primary)",
              fontSize: 14,
              boxShadow: "0 0 0 3px var(--color-primary-glow)",
            }}
          />
        )}
      </div>

      {/* ── Target audience pills ── */}
      <div>
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
          Målgrupp
        </span>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <AnimatePresence>
            {targets.map((t) => (
              <PillTag key={t} label={t} onRemove={() => removeTarget(t)} />
            ))}
          </AnimatePresence>

          {adding ? (
            <input
              autoFocus
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addTarget(newTarget);
                if (e.key === "Escape") setAdding(false);
              }}
              onBlur={() => {
                if (newTarget.trim()) addTarget(newTarget);
                else setAdding(false);
              }}
              placeholder="Ny målgrupp..."
              className="text-[13px] font-medium outline-none"
              style={{
                padding: "5px 12px",
                borderRadius: 20,
                background: "var(--color-bg-input)",
                border: "1px solid var(--color-border-focus)",
                color: "var(--color-text-primary)",
                boxShadow: "0 0 0 3px var(--color-primary-glow)",
                width: 150,
              }}
            />
          ) : (
            <motion.button
              onClick={() => setAdding(true)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="text-[13px] font-medium"
              style={{
                padding: "5px 12px",
                borderRadius: 20,
                border: "1px dashed rgba(255,255,255,0.12)",
                color: "var(--color-text-muted)",
                background: "transparent",
              }}
            >
              + Lägg till
            </motion.button>
          )}
        </div>
      </div>

      {/* ── Separator ── */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

      {/* ── USPs ── */}
      <div>
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
          Dina unika fördelar
        </span>
        <motion.ol
          variants={{ visible: { transition: transitions.stagger } }}
          initial="hidden"
          animate="visible"
          className="mt-1.5 flex flex-col gap-1.5"
        >
          {usps.map((usp, i) => (
            <motion.li
              key={i}
              variants={listItemVariants}
              className="flex items-start gap-2 text-[14px]"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <motion.span
                className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 20, stiffness: 300, delay: i * 0.08 }}
                style={{ background: "var(--color-primary-glow)", color: "var(--color-primary-light)" }}
              >
                {i + 1}
              </motion.span>
              <span>{usp}</span>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </motion.div>
  );
}
