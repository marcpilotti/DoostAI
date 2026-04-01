"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronDown, Pencil, Users } from "lucide-react";
import { useState } from "react";

import type { BrandProfile } from "./OnboardingShell";

const INDUSTRIES = [
  "Bygg & Fastigheter", "Detaljhandel", "E-handel", "Finans & Försäkring",
  "Fordon & Transport", "Hälsa & Sjukvård", "Hotell & Restaurang", "IT & Tech",
  "Juridik & Redovisning", "Konsult & Rådgivning", "Livsmedel & Dagligvaror",
  "Marknadsföring & Media", "Mode & Skönhet", "Rekrytering & Bemanning",
  "Tillverkning & Industri", "Träning & Fritid", "Utbildning",
  "Energi & Miljö", "Kultur & Nöje", "SaaS & Molntjänster",
];

const CUSTOM_INDUSTRY_VALUE = "__annat__";

function InlineEdit({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);

  function handleSave(newValue: string) {
    onSave(newValue);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        type="text" defaultValue={value} autoFocus
        onKeyDown={(e) => { if (e.key === "Enter") handleSave((e.target as HTMLInputElement).value); }}
        onBlur={(e) => handleSave(e.target.value)}
        className="w-full bg-transparent text-[15px] font-semibold text-foreground outline-none border-b border-foreground/20"
      />
    );
  }
  return (
    <button onClick={() => setEditing(true)} className="group flex w-full items-center gap-1.5 text-left">
      <span className="text-[15px] font-semibold text-foreground">{value || "—"}</span>
      <Pencil className="h-3 w-3 shrink-0 text-muted-foreground/20 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

export function BrandAudienceSlide({ profile, onConfirm, onBack }: {
  profile: BrandProfile;
  onConfirm: (updated: BrandProfile) => void;
  onBack?: () => void;
}) {
  const prefersReduced = useReducedMotion();
  const initialIsCustom = !!profile.industry && !INDUSTRIES.includes(profile.industry);
  const [industry, setIndustry] = useState(initialIsCustom ? CUSTOM_INDUSTRY_VALUE : (profile.industry ?? ""));
  const [customIndustry, setCustomIndustry] = useState(initialIsCustom ? (profile.industry ?? "") : "");
  const [location, setLocation] = useState(typeof profile.location === "string" ? profile.location : "");
  const [targetAudience, setTargetAudience] = useState(
    typeof profile.targetAudience === "string" ? profile.targetAudience : profile.targetAudience?.demographic ?? "",
  );

  const resolvedIndustry = industry === CUSTOM_INDUSTRY_VALUE ? customIndustry : industry;

  function handleConfirm() {
    onConfirm({ ...profile, industry: resolvedIndustry, location, targetAudience });
  }

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 pt-[72px] sm:px-6">
      <div className="w-full max-w-lg">
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-md)]"
        >
          {/* ── Header ────────────────────────────────────────── */}
          <div className="flex items-center gap-3 border-b border-border/20 px-6 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-foreground">Målgrupp & bransch</h2>
              <p className="text-[13px] text-muted-foreground/50">Bekräfta eller ändra era uppgifter</p>
            </div>
          </div>

          {/* ── Fields ────────────────────────────────────────── */}
          <div className="divide-y divide-border/20">
            {/* Bransch */}
            <div className="px-6 py-5">
              <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/40">Bransch</div>
              <div className="flex items-center gap-1.5">
                <select
                  value={industry}
                  onChange={(e) => { setIndustry(e.target.value); if (e.target.value !== CUSTOM_INDUSTRY_VALUE) setCustomIndustry(""); }}
                  className="w-full appearance-none bg-transparent text-[15px] font-semibold text-foreground outline-none cursor-pointer truncate pr-4"
                >
                  {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                  <option value={CUSTOM_INDUSTRY_VALUE}>Annat</option>
                </select>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground/30" />
              </div>
              {industry === CUSTOM_INDUSTRY_VALUE && (
                <input
                  type="text"
                  value={customIndustry}
                  onChange={(e) => setCustomIndustry(e.target.value)}
                  placeholder="Ange bransch..."
                  autoFocus
                  className="mt-2 w-full bg-transparent text-[14px] text-foreground outline-none border-b border-foreground/20 placeholder:text-muted-foreground/30"
                />
              )}
            </div>

            {/* Målgrupp */}
            <div className="px-6 py-5">
              <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/40">Målgrupp</div>
              <InlineEdit value={targetAudience} onSave={setTargetAudience} />
            </div>

            {/* Plats */}
            <div className="px-6 py-5">
              <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/40">Plats</div>
              <InlineEdit value={location} onSave={setLocation} />
            </div>
          </div>

          {/* ── CTA ───────────────────────────────────────────── */}
          <div className="px-6 pb-6 pt-3">
            <button
              onClick={handleConfirm}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-[14px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            >
              Gå vidare
              <ArrowRight className="h-4 w-4" />
            </button>
            {onBack && (
              <button onClick={onBack} className="mt-3 block w-full text-center text-[11px] text-muted-foreground/40 hover:text-muted-foreground">
                ← Tillbaka
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
