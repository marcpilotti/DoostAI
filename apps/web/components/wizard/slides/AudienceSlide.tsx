"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useWizardNavigation } from "@/hooks/use-wizard-navigation";
import { cardVariants, listItemVariants, transitions } from "@/lib/motion";
import { useWizardStore } from "@/lib/stores/wizard-store";

/* ── Industry list ───────────────────────────────────────── */
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

const MAX_TARGETS = 5;

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

/* ── Small components ─────────────────────────────────────── */
function AiBadge() {
  return (
    <span
      className="ml-1 inline-flex items-center gap-0.5 rounded-full text-[10px] font-medium"
      style={{
        padding: "1px 8px",
        background: "rgba(99,102,241,0.08)",
        color: "var(--color-primary-light)",
        border: "1px solid rgba(99,102,241,0.15)",
      }}
      title="Baserat på din hemsida — redigera fritt"
    >
      ✦ AI-förslag
    </span>
  );
}

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

  // Combobox state
  const [comboOpen, setComboOpen] = useState(false);
  const [comboSearch, setComboSearch] = useState("");
  const comboRef = useRef<HTMLDivElement>(null);

  const [targets, setTargets] = useState<string[]>(() => {
    if (audience?.interests && audience.interests.length > 0) return audience.interests;
    return getSuggestedAudiences(brand?.industry || "");
  });
  const [adding, setAdding] = useState(false);
  const [newTarget, setNewTarget] = useState("");

  // Editable USPs
  const [localUsps, setLocalUsps] = useState<string[]>(() =>
    audience?.usps?.length ? audience.usps : brand?.valuePropositions || [],
  );
  const [editingUsp, setEditingUsp] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [addingUsp, setAddingUsp] = useState(false);
  const [newUspValue, setNewUspValue] = useState("");

  useEffect(() => {
    setFooterAction(() => handleNext());
    return () => setFooterAction(null);
  }, [handleNext, setFooterAction]);

  // Close combobox on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setComboOpen(false);
        setComboSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleIndustryChange = useCallback(
    (value: string) => {
      setIndustry(value);
      if (brand) setBrand({ ...brand, industry: value });
      const suggestions = getSuggestedAudiences(value);
      setTargets(suggestions);
    },
    [brand, setBrand],
  );

  // Sync targets and USPs to audience store
  useEffect(() => {
    setAudience({
      interests: targets,
      challenges: audience?.challenges || [],
      usps: localUsps,
    });
  }, [targets, localUsps]); // eslint-disable-line react-hooks/exhaustive-deps

  const addTarget = (t: string) => {
    if (t.trim() && !targets.includes(t.trim()) && targets.length < MAX_TARGETS) {
      setTargets([...targets, t.trim()]);
    }
    setNewTarget("");
    setAdding(false);
  };

  const removeTarget = (t: string) => {
    setTargets(targets.filter((x) => x !== t));
  };

  const updateUsp = (index: number, value: string) => {
    if (value.trim()) {
      setLocalUsps(localUsps.map((u, i) => (i === index ? value.trim() : u)));
    }
    setEditingUsp(null);
    setEditValue("");
  };

  const removeUsp = (index: number) => {
    setLocalUsps(localUsps.filter((_, i) => i !== index));
  };

  const addUsp = (text: string) => {
    if (text.trim()) {
      setLocalUsps([...localUsps, text.trim()]);
    }
    setNewUspValue("");
    setAddingUsp(false);
  };

  // Combobox helpers
  const filteredIndustries = INDUSTRIES.filter((ind) =>
    ind.toLowerCase().includes(comboSearch.toLowerCase()),
  );

  const handleComboSelect = (value: string) => {
    handleIndustryChange(value);
    setComboOpen(false);
    setComboSearch("");
  };

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
        <h2
          className="text-text-h1"
          style={{ color: "var(--color-text-primary)" }}
        >
          Vem vill du nå?
        </h2>
        <p
          className="mt-0.5 text-[13px]"
          style={{ color: "var(--color-text-muted)" }}
        >
          Vi anpassar dina annonser utifrån din bransch och målgrupp.
        </p>
      </div>

      {/* Sections with left accent line */}
      <div className="relative pl-6">
        {/* Vertical accent line */}
        <div
          className="absolute left-[7px] top-2 bottom-2 w-px"
          style={{
            background:
              "linear-gradient(to bottom, rgba(99,102,241,0.3), rgba(99,102,241,0.05))",
          }}
        />

        <div className="flex flex-col gap-7">
          {/* ── Section 1: Industry ── */}
          <div className="relative">
            <SectionDot />
            <div className="flex items-center gap-2">
              <span
                className="text-[13px] font-medium"
                style={{ color: "var(--color-text-muted)" }}
              >
                Bransch
              </span>
              {detectedIndustry && <AiBadge />}
            </div>

            {/* Searchable combobox */}
            <div ref={comboRef} className="relative mt-2">
              <div
                className="flex items-center"
                style={{
                  background: "var(--color-bg-raised)",
                  border: comboOpen
                    ? "1px solid var(--color-border-focus)"
                    : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  boxShadow: comboOpen
                    ? "0 0 0 3px var(--color-primary-glow)"
                    : "none",
                  transition: "border-color 200ms, box-shadow 200ms",
                }}
              >
                <input
                  role="combobox"
                  aria-expanded={comboOpen}
                  aria-autocomplete="list"
                  value={comboOpen ? comboSearch : industry}
                  onChange={(e) => {
                    setComboSearch(e.target.value);
                    if (!comboOpen) setComboOpen(true);
                  }}
                  onFocus={() => {
                    setComboOpen(true);
                    setComboSearch("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (filteredIndustries.length === 1 && filteredIndustries[0]) {
                        handleComboSelect(filteredIndustries[0]);
                      } else if (comboSearch.trim()) {
                        const match = INDUSTRIES.find(
                          (ind) =>
                            ind.toLowerCase() ===
                            comboSearch.toLowerCase(),
                        );
                        if (match) {
                          handleComboSelect(match);
                        } else {
                          handleIndustryChange(comboSearch.trim());
                          setComboOpen(false);
                          setComboSearch("");
                        }
                      }
                    }
                    if (e.key === "Escape") {
                      setComboOpen(false);
                      setComboSearch("");
                    }
                  }}
                  placeholder="Sök eller välj bransch..."
                  className="flex-1 bg-transparent outline-none"
                  style={{
                    padding: "10px 14px",
                    color: "var(--color-text-primary)",
                    fontSize: 14,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setComboOpen(!comboOpen)}
                  className="px-3 transition-transform"
                  style={{
                    color: "var(--color-text-muted)",
                    transform: comboOpen
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>

              <AnimatePresence>
                {comboOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-10 mt-1 w-full overflow-y-auto"
                    style={{
                      maxHeight: 200,
                      background: "var(--color-bg-elevated)",
                      border: "1px solid var(--color-border-default)",
                      borderRadius: 10,
                      boxShadow: "var(--shadow-lg)",
                    }}
                  >
                    {/* Detected industry at top if not in standard list */}
                    {detectedIndustry &&
                      !isInList &&
                      !comboSearch && (
                        <button
                          onClick={() =>
                            handleComboSelect(detectedIndustry)
                          }
                          className="flex w-full items-center gap-2 text-left text-[14px] transition-colors hover:bg-[var(--color-bg-hover)]"
                          style={{
                            padding: "8px 14px",
                            color:
                              industry === detectedIndustry
                                ? "var(--color-primary-light)"
                                : "var(--color-text-primary)",
                            borderBottom:
                              "1px solid var(--color-border-subtle)",
                          }}
                        >
                          {detectedIndustry}
                          <AiBadge />
                          {industry === detectedIndustry && (
                            <span className="ml-auto">✓</span>
                          )}
                        </button>
                      )}
                    {filteredIndustries.map((ind) => (
                      <button
                        key={ind}
                        onClick={() => handleComboSelect(ind)}
                        className="flex w-full items-center text-left text-[14px] transition-colors hover:bg-[var(--color-bg-hover)]"
                        style={{
                          padding: "8px 14px",
                          color:
                            industry === ind
                              ? "var(--color-primary-light)"
                              : "var(--color-text-secondary)",
                        }}
                      >
                        {ind}
                        {ind === detectedIndustry && isInList && (
                          <span className="ml-1">
                            <AiBadge />
                          </span>
                        )}
                        {industry === ind && (
                          <span className="ml-auto">✓</span>
                        )}
                      </button>
                    ))}
                    {filteredIndustries.length === 0 &&
                      comboSearch.trim() && (
                        <button
                          onClick={() => {
                            handleIndustryChange(comboSearch.trim());
                            setComboOpen(false);
                            setComboSearch("");
                          }}
                          className="w-full p-3 text-left text-[13px] transition-colors hover:bg-[var(--color-bg-hover)]"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          Använd &ldquo;{comboSearch.trim()}&rdquo; som
                          bransch
                        </button>
                      )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Section 2: Target audience ── */}
          <div className="relative">
            <SectionDot />
            <div className="flex items-center gap-2">
              <span
                className="text-[13px] font-medium"
                style={{ color: "var(--color-text-muted)" }}
              >
                Målgrupp
              </span>
              {targets.length > 0 && <AiBadge />}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <AnimatePresence>
                {targets.map((t) => (
                  <PillTag
                    key={t}
                    label={t}
                    onRemove={() => removeTarget(t)}
                  />
                ))}
              </AnimatePresence>

              {targets.length < MAX_TARGETS &&
                (adding ? (
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
                    placeholder="Skriv en målgrupp..."
                    className="text-[13px] font-medium outline-none"
                    style={{
                      padding: "5px 12px",
                      borderRadius: 20,
                      background: "var(--color-bg-input)",
                      border: "1px solid var(--color-border-focus)",
                      color: "var(--color-text-primary)",
                      boxShadow:
                        "0 0 0 3px var(--color-primary-glow)",
                      width: 180,
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
                    + Lägg till målgrupp
                  </motion.button>
                ))}
            </div>
            <p
              className="mt-2 text-[11px]"
              style={{ color: "var(--color-text-muted)" }}
            >
              Välj 1–{MAX_TARGETS} målgrupper. Färre = mer fokuserade
              annonser.
              {targets.length === 0 && (
                <>
                  {" "}
                  <button className="underline" onClick={handleNext}>
                    Hoppa över — AI väljer åt dig
                  </button>
                </>
              )}
            </p>
          </div>

          {/* ── Section 3: USPs ── */}
          <div className="relative">
            <SectionDot />
            <div className="flex items-center gap-2">
              <span
                className="text-[13px] font-medium"
                style={{ color: "var(--color-text-muted)" }}
              >
                Dina unika fördelar
              </span>
              {localUsps.length > 0 && <AiBadge />}
            </div>
            <p
              className="mt-0.5 text-[11px]"
              style={{ color: "var(--color-text-muted)" }}
            >
              Dessa lyfts fram i dina annonstexter.
            </p>
            <motion.ol
              variants={{
                visible: { transition: transitions.stagger },
              }}
              initial="hidden"
              animate="visible"
              className="mt-2 flex flex-col gap-1.5"
            >
              {localUsps.map((usp, i) => (
                <motion.li
                  key={i}
                  variants={listItemVariants}
                  className="group/usp flex items-start gap-2 text-[14px]"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  <motion.span
                    className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      damping: 20,
                      stiffness: 300,
                      delay: i * 0.08,
                    }}
                    style={{
                      background: "var(--color-primary-glow)",
                      color: "var(--color-primary-light)",
                    }}
                  >
                    {i + 1}
                  </motion.span>
                  {editingUsp === i ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          updateUsp(i, editValue);
                        if (e.key === "Escape") {
                          setEditingUsp(null);
                          setEditValue("");
                        }
                      }}
                      onBlur={() => {
                        if (editValue.trim())
                          updateUsp(i, editValue);
                        else {
                          setEditingUsp(null);
                          setEditValue("");
                        }
                      }}
                      className="flex-1 bg-transparent text-[14px] outline-none"
                      style={{
                        color: "var(--color-text-secondary)",
                        borderBottom:
                          "1px solid var(--color-border-focus)",
                      }}
                    />
                  ) : (
                    <>
                      <span
                        className="editable-hint flex-1"
                        onClick={() => {
                          setEditingUsp(i);
                          setEditValue(usp);
                        }}
                      >
                        {usp}
                      </span>
                      <button
                        onClick={() => removeUsp(i)}
                        className="ml-1 text-[12px] opacity-0 transition-opacity group-hover/usp:opacity-60 hover:!opacity-100"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        ×
                      </button>
                    </>
                  )}
                </motion.li>
              ))}
            </motion.ol>

            {/* Add USP */}
            {addingUsp ? (
              <div className="mt-2 flex items-center gap-2">
                <span
                  className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{
                    background: "var(--color-primary-glow)",
                    color: "var(--color-primary-light)",
                  }}
                >
                  {localUsps.length + 1}
                </span>
                <input
                  autoFocus
                  value={newUspValue}
                  onChange={(e) => setNewUspValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addUsp(newUspValue);
                    if (e.key === "Escape") {
                      setAddingUsp(false);
                      setNewUspValue("");
                    }
                  }}
                  onBlur={() => {
                    if (newUspValue.trim()) addUsp(newUspValue);
                    else {
                      setAddingUsp(false);
                      setNewUspValue("");
                    }
                  }}
                  placeholder="Ny fördel..."
                  className="flex-1 bg-transparent text-[14px] outline-none"
                  style={{
                    color: "var(--color-text-secondary)",
                    borderBottom:
                      "1px solid var(--color-border-focus)",
                  }}
                />
              </div>
            ) : (
              <motion.button
                onClick={() => setAddingUsp(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="mt-2 text-[12px] font-medium"
                style={{ color: "var(--color-text-muted)" }}
              >
                + Lägg till fördel
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
