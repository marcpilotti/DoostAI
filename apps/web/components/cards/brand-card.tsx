"use client";

import { ChevronDown, ExternalLink, ImagePlus, Pencil } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { HexColorPicker } from "react-colorful";

import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import { FieldLabel } from "@/components/ui/field-label";
import { Input } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import type { BrandProfile } from "../onboarding/OnboardingShell";

// ── Helpers ─────────────────────────────────────────────────────

function adjustColor(hex: string, amount: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, n));
  const h = hex.replace("#", "");
  const r = clamp(parseInt(h.substring(0, 2), 16) + amount);
  const g = clamp(parseInt(h.substring(2, 4), 16) + amount);
  const b = clamp(parseInt(h.substring(4, 6), 16) + amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function stripSuffix(name: string): string {
  return name.replace(/\s+(AB|HB|KB|Inc\.?|Ltd\.?|LLC|GmbH|Corp\.?|Co\.?)$/i, "").trim();
}

function compressImage(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) { height = Math.round((height * maxSize) / width); width = maxSize; }
        else { width = Math.round((width * maxSize) / height); height = maxSize; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL(file.type || "image/png"));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed")); };
    img.src = url;
  });
}

function getMatchPill(score: number): { variant: "green" | "blue" | "amber"; label: string } {
  if (score >= 85) return { variant: "green", label: "Utmärkt matchning" };
  if (score >= 60) return { variant: "blue", label: "Bra start" };
  return { variant: "amber", label: "Hjälp oss förbättra" };
}

// ── Bento Cell wrapper ──────────────────────────────────────────

function BentoCell({ children, className, onClick }: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-cell bg-surface p-cell-p transition-all",
        onClick && "cursor-pointer hover:border-accent hover:border",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ── Color swatch with picker ────────────────────────────────────

function ColorSwatch({ color, label, onChange }: {
  color: string;
  label: string;
  onChange: (c: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex flex-col items-center gap-1.5">
      <button
        onClick={() => setOpen(!open)}
        className="h-11 w-11 rounded-[10px] shadow-sm transition-transform hover:scale-110 hover:z-10"
        style={{ backgroundColor: color }}
        aria-label={`Ändra färg ${label}: ${color}`}
      />
      <span className="font-mono text-[10px] text-d-text-hint">{color}</span>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute top-14 z-50 rounded-cell bg-card p-3 shadow-lg border border-d-border"
          >
            <HexColorPicker color={color} onChange={onChange} />
            <button
              onClick={() => setOpen(false)}
              className="mt-2 w-full text-center text-xs text-d-text-hint hover:text-d-text-primary"
            >
              Stäng
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Inline editable text ────────────────────────────────────────

function EditableText({ value, onSave, className }: {
  value: string;
  onSave: (v: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <Input
        defaultValue={value}
        autoFocus
        onKeyDown={(e) => { if (e.key === "Enter") { onSave((e.target as HTMLInputElement).value); setEditing(false); } }}
        onBlur={(e) => { onSave(e.target.value); setEditing(false); }}
        className={cn("h-auto border-0 bg-card px-2 py-1 shadow-sm ring-1 ring-accent/30 text-[15px] font-semibold", className)}
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="group flex w-full items-center gap-1.5 text-left"
    >
      <span className={cn("text-[15px] font-semibold text-d-text-primary", className)}>
        {value || "Klicka för att ange"}
      </span>
      <Pencil className="h-3 w-3 shrink-0 text-d-text-hint opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

// ── Platform chip ───────────────────────────────────────────────

function PlatformChip({ name, selected, onToggle }: {
  name: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "rounded-pill px-4 py-2 text-small font-medium transition-all",
        selected
          ? "bg-accent-light text-accent border border-accent-border"
          : "bg-surface text-d-text-secondary border border-d-border-light hover:border-d-border",
      )}
    >
      {name} {selected && "✓"}
    </button>
  );
}

// ── Industries ──────────────────────────────────────────────────

const INDUSTRIES = [
  "Bygg & Fastigheter", "Detaljhandel", "E-handel", "Finans & Försäkring",
  "Fordon & Transport", "Hälsa & Sjukvård", "Hotell & Restaurang", "IT & Tech",
  "Juridik & Redovisning", "Konsult & Rådgivning", "Livsmedel & Dagligvaror",
  "Marknadsföring & Media", "Mode & Skönhet", "Rekrytering & Bemanning",
  "Tillverkning & Industri", "Träning & Fritid", "Utbildning",
  "Energi & Miljö", "Kultur & Nöje", "SaaS & Molntjänster",
];

// ── Main component ──────────────────────────────────────────────

export function BrandCard({ profile, onConfirm, onBack }: {
  profile: BrandProfile;
  onConfirm: (updated: BrandProfile) => void;
  onBack?: () => void;
}) {
  const prefersReduced = useReducedMotion();
  const [colors, setColors] = useState(() => {
    const primary = profile.colors?.primary ?? "#6366f1";
    const secondary = profile.colors?.secondary ?? "#4f46e5";
    let accent = profile.colors?.accent ?? "#10b981";
    if (accent.toLowerCase() === primary.toLowerCase()) {
      accent = adjustColor(primary, -30);
    }
    return { primary, secondary, accent };
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(profile.logo?.url ?? profile.logos?.primary ?? null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [industry, setIndustry] = useState(profile.industry ?? "");
  const [location, setLocation] = useState(typeof profile.location === "string" ? profile.location : "");
  const [audience, setAudience] = useState(
    typeof profile.targetAudience === "string" ? profile.targetAudience : profile.targetAudience?.demographic ?? "",
  );
  const [channels, setChannels] = useState<Record<string, boolean>>({
    Meta: true,
    Google: true,
    LinkedIn: false,
  });

  // Confidence count-up
  const targetConfidence = profile._intelligence?.overallConfidence ?? 0;
  const [confidence, setConfidence] = useState(0);
  useEffect(() => {
    if (!targetConfidence) return;
    let current = 0;
    const step = targetConfidence / 25;
    const interval = setInterval(() => {
      current += step;
      if (current >= targetConfidence) { setConfidence(targetConfidence); clearInterval(interval); }
      else setConfidence(Math.round(current));
    }, 40);
    return () => clearInterval(interval);
  }, [targetConfidence]);

  const name = stripSuffix(profile.name);
  const domain = profile.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const match = confidence > 0 ? getMatchPill(confidence) : null;

  function handleConfirm() {
    onConfirm({
      ...profile,
      industry,
      location,
      targetAudience: audience,
      colors: { ...profile.colors, ...colors },
    });
  }

  // Bento cell stagger animation
  const cellVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <CardShell noPadding className="overflow-hidden">
      {/* ── Header row ──────────────────────────────────── */}
      <div className="flex items-center gap-3 p-card-p sm:p-card-p-lg">
        {/* Logo */}
        <label className="group flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-cell bg-surface shadow-sm transition-transform hover:scale-105">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={name} className="h-full w-full object-contain p-1.5" />
          ) : (
            <ImagePlus className="h-5 w-5 text-d-text-hint" />
          )}
          <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            if (f.size > 5 * 1024 * 1024) { setLogoError("Max 5 MB"); return; }
            setLogoError(null);
            compressImage(f, 512).then(setLogoUrl).catch(() => setLogoUrl(URL.createObjectURL(f)));
          }} />
        </label>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-card-title" style={{ color: colors.primary }}>{name}</h2>
            {match && (
              <Pill variant={match.variant}>{confidence}% — {match.label}</Pill>
            )}
          </div>
          <p className="text-small text-d-text-secondary">{domain}</p>
        </div>

        <a href={profile.url.startsWith("http") ? profile.url : `https://${profile.url}`} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-btn p-2 text-d-text-hint hover:text-d-text-primary hover:bg-surface">
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
      {logoError && <p className="px-card-p text-xs text-d-danger">{logoError}</p>}

      <Separator className="bg-d-border-light" />

      {/* ── Bento grid ──────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-2 gap-grid-gap p-card-p sm:p-card-p-lg"
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        initial={prefersReduced ? false : "hidden"}
        animate="show"
      >
        {/* Colors — full width */}
        <motion.div variants={cellVariants} className="col-span-2">
          <BentoCell>
            <FieldLabel className="mb-3">Varumärkesfärger</FieldLabel>
            <div className="flex gap-6 justify-center">
              <ColorSwatch color={colors.primary} label="Primär" onChange={(c) => setColors((p) => ({ ...p, primary: c }))} />
              <ColorSwatch color={colors.secondary} label="Sekundär" onChange={(c) => setColors((p) => ({ ...p, secondary: c }))} />
              <ColorSwatch color={colors.accent} label="Accent" onChange={(c) => setColors((p) => ({ ...p, accent: c }))} />
            </div>
          </BentoCell>
        </motion.div>

        {/* Heading font — left column */}
        <motion.div variants={cellVariants}>
          <BentoCell>
            <FieldLabel className="mb-1">Rubrikfont</FieldLabel>
            <p className="text-[16px] font-bold text-d-text-primary">{profile.fonts?.heading ?? "Inter"}</p>
          </BentoCell>
        </motion.div>

        {/* Body font — right column */}
        <motion.div variants={cellVariants}>
          <BentoCell>
            <FieldLabel className="mb-1">Brödtextfont</FieldLabel>
            <p className="text-[16px] text-d-text-primary">{profile.fonts?.body ?? "Inter"}</p>
          </BentoCell>
        </motion.div>

        {/* Industry — left column */}
        <motion.div variants={cellVariants}>
          <BentoCell>
            <FieldLabel className="mb-2">Bransch</FieldLabel>
            <div className="flex items-center gap-1">
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full appearance-none bg-transparent text-[15px] font-semibold text-d-text-primary outline-none cursor-pointer truncate pr-4"
              >
                <option value="">Välj bransch...</option>
                {industry && !INDUSTRIES.includes(industry) && (
                  <option key={industry} value={industry}>{industry} (AI-detekterad)</option>
                )}
                {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
              </select>
              <ChevronDown className="h-4 w-4 shrink-0 text-d-text-hint" />
            </div>
          </BentoCell>
        </motion.div>

        {/* Location — right column */}
        <motion.div variants={cellVariants}>
          <BentoCell>
            <FieldLabel className="mb-2">Plats</FieldLabel>
            <EditableText value={location} onSave={setLocation} />
          </BentoCell>
        </motion.div>

        {/* Target audience — full width */}
        <motion.div variants={cellVariants} className="col-span-2">
          <BentoCell>
            <FieldLabel className="mb-2">Målgrupp</FieldLabel>
            <EditableText value={audience} onSave={setAudience} />
          </BentoCell>
        </motion.div>

        {/* Publish to — full width */}
        <motion.div variants={cellVariants} className="col-span-2">
          <BentoCell>
            <FieldLabel className="mb-3">Publicera till</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {Object.entries(channels).map(([name, selected]) => (
                <PlatformChip
                  key={name}
                  name={name}
                  selected={selected}
                  onToggle={() => setChannels((p) => ({ ...p, [name]: !p[name] }))}
                />
              ))}
            </div>
          </BentoCell>
        </motion.div>
      </motion.div>

      <Separator className="bg-d-border-light" />

      {/* ── Action footer ───────────────────────────────── */}
      <div className="flex items-center gap-3 p-card-p sm:p-card-p-lg">
        <Button
          onClick={handleConfirm}
          className="flex-1 rounded-btn bg-d-text-primary text-white hover:bg-d-text-primary/90"
          size="lg"
        >
          Bekräfta varumärke
          <span className="ml-1">→</span>
        </Button>
        {onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            className="rounded-btn border-d-border text-d-text-primary"
            size="lg"
          >
            ← Tillbaka
          </Button>
        )}
      </div>
    </CardShell>
  );
}
