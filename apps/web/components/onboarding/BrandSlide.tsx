"use client";

import { useState } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  ExternalLink,
  Globe,
  MapPin,
  Palette,
  Pencil,
  Type,
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

// ── Compact color swatch ────────────────────────────────────────

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
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="group flex flex-col items-center gap-0.5"
      >
        <div
          className="h-7 w-7 rounded-full border-2 border-white shadow-sm transition-all hover:scale-105"
          style={{ backgroundColor: color }}
        />
        <span className="font-mono text-[8px] text-muted-foreground/50">{color}</span>
        <span className="text-[8px] text-muted-foreground/40">{label}</span>
      </button>
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

// ── Inline editable field ───────────────────────────────────────

function EditableField({
  icon: Icon,
  label,
  value,
  onSave,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onSave?: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-white/50 px-2 py-1.5">
      <Icon className="h-2.5 w-2.5 shrink-0 text-muted-foreground/40" />
      <div className="min-w-0 flex-1">
        <div className="text-[7px] font-medium uppercase tracking-widest text-muted-foreground/40">
          {label}
        </div>
        {editing ? (
          <input
            type="text"
            defaultValue={value}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSave?.((e.target as HTMLInputElement).value);
                setEditing(false);
              }
            }}
            onBlur={(e) => {
              onSave?.(e.target.value);
              setEditing(false);
            }}
            className="w-full border-b border-indigo-300 bg-transparent text-[11px] font-medium text-foreground outline-none"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="group flex w-full items-center gap-1 text-left"
          >
            <span className="truncate text-[11px] font-medium text-foreground">
              {value || "—"}
            </span>
            <Pencil className="h-2 w-2 shrink-0 text-muted-foreground/20 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        )}
      </div>
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
  const [industry, setIndustry] = useState(
    profile.industry ?? "",
  );
  const [location, setLocation] = useState(
    profile.location ?? "",
  );
  const [targetAudience, setTargetAudience] = useState(
    typeof profile.targetAudience === "string"
      ? profile.targetAudience
      : profile.targetAudience?.demographic ?? "",
  );

  const name = stripSuffix(profile.name);
  const domain = profile.url
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  const logoUrl =
    profile.logo?.url ??
    profile.logos?.primary ??
    null;

  function handleConfirm() {
    onConfirm({
      ...profile,
      industry,
      location,
      targetAudience,
      colors: {
        ...profile.colors,
        primary: colors.primary,
        secondary: colors.secondary,
        accent: colors.accent,
      },
    });
  }

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-2xl">
        {/* Card */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="overflow-hidden rounded-2xl border border-border/30 bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] backdrop-blur-xl"
        >
          {/* Row 1: Logo + Name + Domain + Favicon */}
          <div className="flex items-center gap-4 px-5 py-4">
            {logoUrl && (
              <div className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl as string}
                  alt={name}
                  className="h-16 w-16 rounded-2xl border border-border/30 bg-white object-contain p-2 shadow-sm"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-bold tracking-tight">
                {name}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {/* Favicon from Google */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                  alt=""
                  className="h-4 w-4 rounded-sm"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                {domain}
              </div>
            </div>
            <a
              href={profile.url.startsWith("http") ? profile.url : `https://${profile.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-muted-foreground/30 transition-colors hover:text-muted-foreground"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

          {/* Row 2: Colors + Fonts (side by side) */}
          <div className="grid grid-cols-2 gap-3 px-4 py-3">
            {/* Colors */}
            <div className="rounded-lg border border-border/30 bg-muted/5 p-2">
              <div className="mb-2 flex items-center gap-1 text-[10px] font-semibold text-foreground/60">
                <Palette className="h-3 w-3" />
                Färger
              </div>
              <div className="flex items-center justify-center gap-4">
                <ColorSwatch
                  color={colors.primary}
                  label="Primär"
                  role="primary"
                  originalColor={profile.colors.primary}
                  onColorChange={(c) =>
                    setColors((prev) => ({ ...prev, primary: c }))
                  }
                />
                <ColorSwatch
                  color={colors.secondary}
                  label="Sekundär"
                  role="secondary"
                  originalColor={profile.colors.secondary}
                  onColorChange={(c) =>
                    setColors((prev) => ({ ...prev, secondary: c }))
                  }
                />
                <ColorSwatch
                  color={colors.accent}
                  label="Accent"
                  role="accent"
                  originalColor={profile.colors.accent}
                  onColorChange={(c) =>
                    setColors((prev) => ({ ...prev, accent: c }))
                  }
                />
              </div>
            </div>

            {/* Fonts */}
            <div className="rounded-lg border border-border/30 bg-muted/5 p-2">
              <div className="mb-2 flex items-center gap-1 text-[10px] font-semibold text-foreground/60">
                <Type className="h-3 w-3" />
                Typsnitt
              </div>
              <div className="space-y-1">
                <div className="text-[11px]">
                  <span className="text-muted-foreground/50">Rubrik: </span>
                  <span className="font-medium">{profile.fonts?.heading ?? "—"}</span>
                </div>
                <div className="text-[11px]">
                  <span className="text-muted-foreground/50">Brödtext: </span>
                  <span className="font-medium">{profile.fonts?.body ?? "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Tonalitet (full width) */}
          {profile.voice && (
            <div className="px-4 pb-3">
              <div className="rounded-lg border border-border/30 bg-muted/5 p-2">
                <div className="mb-1 text-[10px] font-semibold text-foreground/60">
                  Tonalitet
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {profile.voice.tone ?? profile.voice.addressing ?? "—"}
                  {profile.voice.language ? ` · ${profile.voice.language}` : ""}
                </p>
                {profile.voice.exampleCopy && (
                  <p className="mt-1 text-[10px] italic text-muted-foreground/60">
                    &ldquo;{profile.voice.exampleCopy.slice(0, 80)}
                    {profile.voice.exampleCopy.length > 80 ? "..." : ""}
                    &rdquo;
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Row 4: Målgrupp + Företagsdata (side by side) */}
          <div className="grid grid-cols-2 gap-3 px-4 pb-3">
            <EditableField
              icon={Users}
              label="Målgrupp"
              value={targetAudience}
              onSave={setTargetAudience}
            />

            {/* Industry dropdown */}
            <div className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-white/50 px-2 py-1.5">
              <Building2 className="h-2.5 w-2.5 shrink-0 text-muted-foreground/40" />
              <div className="min-w-0 flex-1">
                <div className="text-[7px] font-medium uppercase tracking-widest text-muted-foreground/40">
                  Bransch
                </div>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="h-5 w-full appearance-none bg-transparent text-[11px] font-medium leading-tight text-foreground outline-none cursor-pointer truncate pr-4"
                >
                  {industry && !INDUSTRIES.includes(industry) && (
                    <option value={industry}>{industry}</option>
                  )}
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
              <ChevronDown className="h-2.5 w-2.5 shrink-0 text-muted-foreground/30" />
            </div>
          </div>

          {/* Row 5: Location + Company data */}
          <div className="grid grid-cols-2 gap-3 px-4 pb-3">
            <EditableField
              icon={MapPin}
              label="Plats"
              value={location}
              onSave={setLocation}
            />
            {profile.companyData && (
              <div className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-white/50 px-2 py-1.5">
                <Building2 className="h-2.5 w-2.5 shrink-0 text-muted-foreground/40" />
                <div className="min-w-0 flex-1">
                  <div className="text-[7px] font-medium uppercase tracking-widest text-muted-foreground/40">
                    Företag
                  </div>
                  <div className="truncate text-[11px] font-medium text-foreground">
                    {profile.companyData.orgNr ?? "—"}
                    {profile.companyData.employees
                      ? ` · ${profile.companyData.employees} anst.`
                      : ""}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CTA footer */}
          <div className="border-t border-border/20 px-4 py-3">
            <button
              onClick={handleConfirm}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-indigo-600 hover:to-indigo-700 hover:shadow-md"
            >
              Stämmer — skapa min annons
              <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-2 text-center text-[11px] text-muted-foreground/50">
              Något stämmer inte? Klicka på valfritt fält för att ändra.
            </p>
          </div>
        </motion.div>

        {/* AI message below card */}
        <div className="mt-4">
          <AIMessage text="Stämmer det här med ert varumärke?" />
        </div>
      </div>
    </div>
  );
}
