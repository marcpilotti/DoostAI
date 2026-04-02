"use client";

import { ChevronDown, ExternalLink, ImagePlus, Pencil } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { HexColorPicker } from "react-colorful";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import type { BrandProfile } from "../onboarding/OnboardingShell";
import { PlatformChip } from "./platform-chip";

// ── Helpers ─────────────────────────────────────────────────────

function Divider() {
  return <div className="my-6 h-px bg-[#F0F0F0]" />;
}

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

// ── Color swatch with picker ────────────────────────────────────

function ColorSwatch({ color, label, onChange }: {
  color: string;
  label: string;
  onChange: (c: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex flex-col items-center gap-2">
      <button
        onClick={() => setOpen(!open)}
        className="h-12 w-12 rounded-full shadow-sm transition-transform hover:scale-110"
        style={{ backgroundColor: color }}
        aria-label={`Ändra färg ${label}: ${color}`}
      />
      <span className="font-mono text-xs text-[#999999]">{color}</span>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute top-16 z-50 rounded-xl bg-white p-3 shadow-lg border border-[#EEEEEE]"
          >
            <HexColorPicker color={color} onChange={onChange} />
            <button
              onClick={() => setOpen(false)}
              className="mt-2 w-full text-center text-xs text-[#999999] hover:text-[#111111]"
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
        className={cn("h-auto border border-[#E5E5E5] bg-white px-2 py-1 text-base font-semibold text-[#111111] shadow-sm ring-0 focus-visible:ring-1 focus-visible:ring-[#3B82F6]", className)}
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="group flex w-full items-center gap-1.5 text-left"
    >
      <span className={cn("text-base font-semibold text-[#111111]", className)}>
        {value || "Klicka för att ange"}
      </span>
      <Pencil className="h-3 w-3 shrink-0 text-[#AAAAAA] opacity-0 transition-opacity group-hover:opacity-100" />
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

  function handleConfirm() {
    onConfirm({
      ...profile,
      industry,
      location,
      targetAudience: audience,
      colors: { ...profile.colors, ...colors },
    });
  }

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto w-full max-w-[480px] rounded-2xl border border-[#EEEEEE] bg-white p-8 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.05)]"
    >
      {/* 1. Brand name + domain + match + logo upload */}
      <div className="flex items-start gap-3">
        <label className="group flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-[#FAFAFA] transition-transform hover:scale-105">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={name} className="h-full w-full object-contain p-1.5" />
          ) : (
            <ImagePlus className="h-5 w-5 text-[#AAAAAA]" />
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
            <h2 className="truncate text-[28px] font-bold leading-tight" style={{ color: colors.primary }}>{name}</h2>
            <a href={profile.url.startsWith("http") ? profile.url : `https://${profile.url}`} target="_blank" rel="noopener noreferrer" className="shrink-0 p-1 text-[#AAAAAA] hover:text-[#111111]">
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
          <p className="text-sm text-[#999999]">{domain}</p>
          {confidence > 0 && (
            <p className="mt-0.5 text-[13px] font-medium text-[#CC8800]">{confidence}% matchning</p>
          )}
        </div>
      </div>
      {logoError && <p className="mt-1 text-xs text-red-500">{logoError}</p>}

      {/* 2. Divider */}
      <Divider />

      {/* 3. Färger */}
      <p className="mb-3 text-[13px] font-medium text-[#999999]">Färger</p>
      <div className="flex justify-center gap-8">
        <ColorSwatch color={colors.primary} label="Primär" onChange={(c) => setColors((p) => ({ ...p, primary: c }))} />
        <ColorSwatch color={colors.secondary} label="Sekundär" onChange={(c) => setColors((p) => ({ ...p, secondary: c }))} />
        <ColorSwatch color={colors.accent} label="Accent" onChange={(c) => setColors((p) => ({ ...p, accent: c }))} />
      </div>

      {/* 4. Divider */}
      <Divider />

      {/* 5. Typsnitt */}
      <p className="mb-3 text-[13px] font-medium text-[#999999]">Typsnitt</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-[#AAAAAA]">Rubrik</p>
          <p className="text-base font-semibold text-[#111111]">{profile.fonts?.heading ?? "Inter"} <span className="font-normal text-[#999999]">Semi Bold</span></p>
        </div>
        <div>
          <p className="text-xs text-[#AAAAAA]">Brödtext</p>
          <p className="text-base text-[#111111]">{profile.fonts?.body ?? "Inter"} <span className="text-[#999999]">Regular</span></p>
        </div>
      </div>

      {/* 6. Divider */}
      <Divider />

      {/* 7. Detail rows: Bransch, Målgrupp, Plats */}
      <div>
        <p className="text-xs text-[#AAAAAA]">Bransch</p>
        <div className="mt-1 flex items-center gap-1">
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full appearance-none bg-transparent text-base font-semibold text-[#111111] outline-none cursor-pointer truncate pr-4"
          >
            <option value="">Välj bransch...</option>
            {industry && !INDUSTRIES.includes(industry) && (
              <option key={industry} value={industry}>{industry} (AI-detekterad)</option>
            )}
            {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
          </select>
          <ChevronDown className="h-4 w-4 shrink-0 text-[#AAAAAA]" />
        </div>
      </div>

      <Divider />

      <div>
        <p className="text-xs text-[#AAAAAA]">Målgrupp</p>
        <div className="mt-1">
          <EditableText value={audience} onSave={setAudience} />
        </div>
      </div>

      <Divider />

      <div>
        <p className="text-xs text-[#AAAAAA]">Plats</p>
        <div className="mt-1">
          <EditableText value={location} onSave={setLocation} />
        </div>
      </div>

      {/* 8. Divider */}
      <Divider />

      {/* 9. Annonskanaler */}
      <p className="mb-3 text-[13px] font-medium text-[#999999]">Annonskanaler</p>
      <div className="flex flex-wrap gap-2">
        {Object.entries(channels).map(([channelName, selected]) => (
          <PlatformChip
            key={channelName}
            name={channelName}
            selected={selected}
            onToggle={() => setChannels((p) => ({ ...p, [channelName]: !p[channelName] }))}
          />
        ))}
      </div>

      {/* 10. Divider */}
      <Divider />

      {/* 11. CTA */}
      <button
        onClick={handleConfirm}
        className="w-full rounded-xl bg-[#111111] py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#222222]"
      >
        Ser bra ut — fortsätt →
      </button>

      {/* 12. Back link */}
      {onBack && (
        <button
          onClick={onBack}
          className="mt-4 w-full text-center text-sm text-[#999999] hover:text-[#111111] transition-colors"
        >
          ← Ändra URL
        </button>
      )}
    </motion.div>
  );
}
