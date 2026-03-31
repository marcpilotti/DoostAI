"use client";

import { useState } from "react";
import {
  ArrowRight,
  Building2,
  ChevronDown,
  ExternalLink,
  ImagePlus,
  MapPin,
  Pencil,
  Upload,
  Users,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { AIMessage } from "./AIMessage";
import { ColorEditor } from "../brand/color-editor";
import type { BrandProfile } from "./OnboardingShell";

// ── Swedish industries ──────────────────────────────────────────

const INDUSTRIES = [
  "Bygg & Fastigheter",
  "Detaljhandel",
  "E-handel",
  "Finans & Försäkring",
  "Fordon & Transport",
  "Hälsa & Sjukvård",
  "Hotell & Restaurang",
  "IT & Tech",
  "Juridik & Redovisning",
  "Konsult & Rådgivning",
  "Livsmedel & Dagligvaror",
  "Marknadsföring & Media",
  "Mode & Skönhet",
  "Rekrytering & Bemanning",
  "Tillverkning & Industri",
  "Träning & Fritid",
  "Utbildning",
  "Energi & Miljö",
  "Kultur & Nöje",
  "SaaS & Molntjänster",
];

function stripSuffix(name: string): string {
  return name.replace(/\s+(AB|HB|KB|Inc\.?|Ltd\.?|LLC|GmbH|Corp\.?|Co\.?)$/i, "").trim();
}

// ── Color swatch ────────────────────────────────────────────────

function ColorSwatch({
  color,
  label,
  role,
  originalColor,
  onColorChange,
}: {
  color: string;
  label: string;
  role: string;
  originalColor: string;
  onColorChange: (c: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex flex-col items-center gap-1">
      <button
        onClick={() => setOpen(!open)}
        className="h-8 w-8 rounded-full shadow-sm ring-2 ring-white transition-transform hover:scale-110"
        style={{ backgroundColor: color }}
      />
      <span className="font-mono text-[8px] text-muted-foreground/40">{color}</span>
      <span className="text-[8px] text-muted-foreground/30">{label}</span>
      {open && (
        <ColorEditor
          role={role}
          currentColor={color}
          originalColor={originalColor}
          onColorChange={onColorChange}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

// ── Section header ──────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">
      {children}
    </div>
  );
}

// ── Main BrandSlide ─────────────────────────────────────────────

export function BrandSlide({
  profile,
  onConfirm,
}: {
  profile: BrandProfile;
  onConfirm: (approved: BrandProfile) => void;
}) {
  const prefersReduced = useReducedMotion();
  const [colors, setColors] = useState(profile.colors);
  const [industry, setIndustry] = useState(profile.industry ?? "");
  const [location, setLocation] = useState(
    typeof profile.location === "string" ? profile.location : "",
  );
  const [targetAudience, setTargetAudience] = useState(
    typeof profile.targetAudience === "string"
      ? profile.targetAudience
      : profile.targetAudience?.demographic ?? "",
  );
  const [logoUrl, setLogoUrl] = useState<string | null>(
    profile.logo?.url ?? profile.logos?.primary ?? null,
  );
  const [editingField, setEditingField] = useState<string | null>(null);

  const name = stripSuffix(profile.name);
  const domain = profile.url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  function handleConfirm() {
    onConfirm({
      ...profile,
      industry,
      location,
      targetAudience,
      colors: { ...profile.colors, primary: colors.primary, secondary: colors.secondary, accent: colors.accent },
    });
  }

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-xl">
        {/* Card — white with glow behind */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="brand-card-glow overflow-hidden rounded-2xl border border-border/15 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.03),0_20px_60px_rgba(99,102,241,0.07)]"
        >
          {/* ── Header: Favicon + Name + Domain ─────────────────── */}
          <div className="flex items-center gap-3 px-6 pt-5 pb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
              alt=""
              className="h-7 w-7 shrink-0 rounded-lg"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-xl font-bold tracking-tight">{name}</h3>
              <div className="text-[13px] text-muted-foreground/60">{domain}</div>
            </div>
            <a
              href={profile.url.startsWith("http") ? profile.url : `https://${profile.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground/25 transition-colors hover:bg-muted/30 hover:text-muted-foreground/60"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          <div className="mx-6 h-px bg-border/10" />

          {/* ── Visual identity: Logo + Colors + Fonts ───────────── */}
          <div className="grid grid-cols-3 gap-px bg-border/8 mx-6 my-4 overflow-hidden rounded-xl border border-border/10">
            {/* Logo */}
            <label className="group flex cursor-pointer flex-col items-center justify-center gap-2 bg-white p-4 transition-colors hover:bg-indigo-50/30">
              {logoUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} alt={name} className="h-10 max-w-full object-contain" />
                  <span className="text-[9px] text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100">Byt logotyp</span>
                </>
              ) : (
                <>
                  <ImagePlus className="h-6 w-6 text-muted-foreground/20" />
                  <span className="text-[9px] font-medium text-muted-foreground/35">Ladda upp</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    if (logoUrl?.startsWith("blob:")) URL.revokeObjectURL(logoUrl);
                    setLogoUrl(URL.createObjectURL(f));
                  }
                }}
              />
            </label>

            {/* Colors */}
            <div className="flex flex-col items-center justify-center gap-2 bg-white p-4">
              <div className="flex gap-2.5">
                <ColorSwatch color={colors.primary} label="Pri" role="primary" originalColor={profile.colors.primary} onColorChange={(c) => setColors((p) => ({ ...p, primary: c }))} />
                <ColorSwatch color={colors.secondary} label="Sek" role="secondary" originalColor={profile.colors.secondary} onColorChange={(c) => setColors((p) => ({ ...p, secondary: c }))} />
                <ColorSwatch color={colors.accent} label="Acc" role="accent" originalColor={profile.colors.accent} onColorChange={(c) => setColors((p) => ({ ...p, accent: c }))} />
              </div>
            </div>

            {/* Fonts */}
            <div className="flex flex-col justify-center bg-white p-4">
              <div className="space-y-1.5">
                <div>
                  <div className="text-[8px] uppercase tracking-wider text-muted-foreground/30">Rubrik</div>
                  <div className="text-[12px] font-semibold text-foreground/80">{profile.fonts?.heading ?? "—"}</div>
                </div>
                <div>
                  <div className="text-[8px] uppercase tracking-wider text-muted-foreground/30">Brödtext</div>
                  <div className="text-[12px] text-foreground/70">{profile.fonts?.body ?? "—"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Business details: 3-col row ──────────────────────── */}
          <div className="grid grid-cols-3 gap-px bg-border/8 mx-6 mb-4 overflow-hidden rounded-xl border border-border/10">
            {/* Bransch */}
            <div className="bg-white p-3">
              <div className="text-[8px] uppercase tracking-wider text-muted-foreground/30">Bransch</div>
              <div className="mt-1 flex items-center gap-1">
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full appearance-none bg-transparent text-[12px] font-medium text-foreground outline-none cursor-pointer truncate pr-3"
                >
                  {industry && !INDUSTRIES.includes(industry) && (
                    <option value={industry}>{industry}</option>
                  )}
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
                <ChevronDown className="h-2.5 w-2.5 shrink-0 text-muted-foreground/20" />
              </div>
            </div>

            {/* Målgrupp */}
            <div className="bg-white p-3">
              <div className="text-[8px] uppercase tracking-wider text-muted-foreground/30">Målgrupp</div>
              {editingField === "audience" ? (
                <input
                  type="text"
                  defaultValue={targetAudience}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") { setTargetAudience((e.target as HTMLInputElement).value); setEditingField(null); } }}
                  onBlur={(e) => { setTargetAudience(e.target.value); setEditingField(null); }}
                  className="mt-1 w-full border-b border-indigo-300 bg-transparent text-[12px] font-medium text-foreground outline-none"
                />
              ) : (
                <button onClick={() => setEditingField("audience")} className="group mt-1 flex w-full items-center gap-1 text-left">
                  <span className="truncate text-[12px] font-medium text-foreground">{targetAudience || "—"}</span>
                  <Pencil className="h-2.5 w-2.5 shrink-0 text-muted-foreground/15 opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              )}
            </div>

            {/* Plats */}
            <div className="bg-white p-3">
              <div className="text-[8px] uppercase tracking-wider text-muted-foreground/30">Plats</div>
              {editingField === "location" ? (
                <input
                  type="text"
                  defaultValue={location}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") { setLocation((e.target as HTMLInputElement).value); setEditingField(null); } }}
                  onBlur={(e) => { setLocation(e.target.value); setEditingField(null); }}
                  className="mt-1 w-full border-b border-indigo-300 bg-transparent text-[12px] font-medium text-foreground outline-none"
                />
              ) : (
                <button onClick={() => setEditingField("location")} className="group mt-1 flex w-full items-center gap-1 text-left">
                  <span className="truncate text-[12px] font-medium text-foreground">{location || "—"}</span>
                  <Pencil className="h-2.5 w-2.5 shrink-0 text-muted-foreground/15 opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              )}
            </div>
          </div>

          {/* ── CTA ──────────────────────────────────────────────── */}
          <div className="px-6 pb-5">
            <button
              onClick={handleConfirm}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200/40 transition-all hover:from-indigo-600 hover:to-indigo-700 hover:shadow-xl hover:shadow-indigo-300/40"
            >
              Stämmer — skapa min annons
              <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-2.5 text-center text-[11px] text-muted-foreground/35">
              Klicka på valfritt fält för att ändra
            </p>
          </div>
        </motion.div>

        {/* AI message below */}
        <div className="mt-5">
          <AIMessage text="Stämmer det här med ert varumärke?" />
        </div>
      </div>
    </div>
  );
}
