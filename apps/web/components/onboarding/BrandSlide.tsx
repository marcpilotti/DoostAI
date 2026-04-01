"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  ChevronDown,
  ExternalLink,
  ImagePlus,
  Pencil,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { AIMessage } from "./AIMessage";
import { ColorEditor } from "../brand/color-editor";
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

// #12 Compress logo image to max dimensions using canvas
function compressImage(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL(file.type || "image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

function stripSuffix(name: string): string {
  return name.replace(/\s+(AB|HB|KB|Inc\.?|Ltd\.?|LLC|GmbH|Corp\.?|Co\.?)$/i, "").trim();
}

function ColorDot({ color, label, role, originalColor, onColorChange }: {
  color: string; label: string; role: string; originalColor: string; onColorChange: (c: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex flex-col items-center gap-1">
      <button onClick={() => setOpen(!open)} className="h-7 w-7 rounded-full ring-2 ring-white transition-transform hover:scale-110" style={{ backgroundColor: color }} />
      <span className="text-[10px] text-muted-foreground/40">{label}</span>
      {open && <ColorEditor role={role} currentColor={color} originalColor={originalColor} onColorChange={onColorChange} onClose={() => setOpen(false)} />}
    </div>
  );
}

function InlineEdit({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave(newValue: string) {
    onSave(newValue);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 500);
  }

  if (editing) {
    return (
      <input
        type="text" defaultValue={value} autoFocus
        onKeyDown={(e) => { if (e.key === "Enter") { handleSave((e.target as HTMLInputElement).value); } }}
        onBlur={(e) => { handleSave(e.target.value); }}
        className="w-full bg-transparent text-[14px] font-medium text-foreground outline-none border-b border-foreground/20"
      />
    );
  }
  return (
    <div className={saved ? "editable-saved" : ""}>
      <button onClick={() => setEditing(true)} className="group flex w-full items-center gap-1 text-left">
        <span className="truncate text-[14px] font-medium text-foreground">{value || "—"}</span>
        <Pencil className="h-2.5 w-2.5 shrink-0 text-muted-foreground/20 opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    </div>
  );
}

export function BrandSlide({ profile, onConfirm, onBack }: { profile: BrandProfile; onConfirm: (approved: BrandProfile) => void; onBack?: () => void }) {
  const [logoError, setLogoError] = useState<string | null>(null);
  const prefersReduced = useReducedMotion();
  const [colors, setColors] = useState(profile.colors);

  // #43 Enter key → confirm (skip when user is typing in an input/textarea/select)
  const confirmRef = useRef<() => void>(() => {});
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Enter") return;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      confirmRef.current();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  const initialIsCustom = !!profile.industry && !INDUSTRIES.includes(profile.industry);
  const [industry, setIndustry] = useState(initialIsCustom ? CUSTOM_INDUSTRY_VALUE : (profile.industry ?? ""));
  const [customIndustry, setCustomIndustry] = useState(initialIsCustom ? (profile.industry ?? "") : "");
  const [location, setLocation] = useState(typeof profile.location === "string" ? profile.location : "");
  const [targetAudience, setTargetAudience] = useState(
    typeof profile.targetAudience === "string" ? profile.targetAudience : profile.targetAudience?.demographic ?? "",
  );
  const [logoUrl, setLogoUrl] = useState<string | null>(profile.logo?.url ?? profile.logos?.primary ?? null);

  // Channel selection — pre-select based on industry
  const isSaaS = /saas|tech|fintech|it|mjukvara/i.test(industry || customIndustry);
  const [channels, setChannels] = useState<Record<string, boolean>>({
    meta: true,
    google: !isSaaS,
    linkedin: isSaaS,
  });
  function toggleChannel(ch: string) {
    setChannels((prev) => ({ ...prev, [ch]: !prev[ch] }));
  }

  // #9 Confidence animation — count up from 0
  const targetConfidence = profile._intelligence?.overallConfidence ?? 0;
  const [displayedConfidence, setDisplayedConfidence] = useState(0);
  useEffect(() => {
    if (!targetConfidence) return;
    let current = 0;
    const step = targetConfidence / 25;
    const interval = setInterval(() => {
      current += step;
      if (current >= targetConfidence) { setDisplayedConfidence(targetConfidence); clearInterval(interval); }
      else setDisplayedConfidence(Math.round(current));
    }, 40);
    return () => clearInterval(interval);
  }, [targetConfidence]);

  const name = stripSuffix(profile.name);
  const domain = profile.url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const resolvedIndustry = industry === CUSTOM_INDUSTRY_VALUE ? customIndustry : industry;

  function handleConfirm() {
    onConfirm({ ...profile, industry: resolvedIndustry, location, targetAudience, colors: { ...profile.colors, primary: colors.primary, secondary: colors.secondary, accent: colors.accent } });
  }
  // Keep confirmRef in sync with latest handleConfirm closure
  confirmRef.current = handleConfirm;

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-lg">
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)]"
        >
          {/* Header */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * 0 }}
            className="flex items-center gap-3 px-6 pt-5 pb-4"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`} alt="" width={24} height={24} className="h-6 w-6 shrink-0 rounded" onError={(e) => { (e.target as HTMLImageElement).src = "/symbol.svg"; }} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-xl font-bold tracking-tight">{name}</h3>
                {displayedConfidence > 0 && (
                  <span title="Baserat på analys av er hemsida, logotyp och företagsdata" className="rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-foreground/40">
                    {displayedConfidence}% match
                  </span>
                )}
              </div>
              <p className="text-[13px] text-muted-foreground/50">{domain}</p>
            </div>
            <a href={profile.url.startsWith("http") ? profile.url : `https://${profile.url}`} target="_blank" rel="noopener noreferrer" className="rounded-lg p-1.5 text-muted-foreground/20 hover:bg-muted/30 hover:text-muted-foreground/50">
              <ExternalLink className="h-4 w-4" />
            </a>
          </motion.div>

          {/* Visual identity row */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * 1 }}
            className="flex overflow-x-auto sm:grid sm:grid-cols-3 border-t border-b border-border/8"
          >
            {/* Logo */}
            <label className="group flex min-w-[200px] sm:min-w-0 cursor-pointer flex-col items-center justify-center gap-1.5 border-r border-border/8 py-5 transition-colors hover:bg-muted/20">
              {logoUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} alt={name} className="h-16 max-w-[90%] object-contain" />
                  <span className="text-[10px] text-muted-foreground/30 opacity-0 group-hover:opacity-100">Byt</span>
                </>
              ) : (
                <>
                  <ImagePlus className="h-5 w-5 text-muted-foreground/20" />
                  <span className="text-[10px] text-muted-foreground/30">Ladda upp</span>
                </>
              )}
              {logoError && <span className="text-[9px] text-red-500">{logoError}</span>}
              <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > 5 * 1024 * 1024) { setLogoError("Max 5 MB"); return; }
                setLogoError(null);
                if (logoUrl?.startsWith("blob:")) URL.revokeObjectURL(logoUrl);
                // #12 Compress to max 512px before displaying
                compressImage(f, 512).then((dataUrl) => {
                  setLogoUrl(dataUrl);
                }).catch(() => {
                  // Fallback to uncompressed blob URL
                  setLogoUrl(URL.createObjectURL(f));
                });
              }} />
            </label>

            {/* Colors */}
            <div className="flex min-w-[200px] sm:min-w-0 items-center justify-center gap-3 border-r border-border/8 py-5">
              <ColorDot color={colors.primary} label="Pri" role="primary" originalColor={profile.colors.primary} onColorChange={(c) => setColors((p) => ({ ...p, primary: c }))} />
              <ColorDot color={colors.secondary} label="Sek" role="secondary" originalColor={profile.colors.secondary} onColorChange={(c) => setColors((p) => ({ ...p, secondary: c }))} />
              <ColorDot color={colors.accent} label="Acc" role="accent" originalColor={profile.colors.accent} onColorChange={(c) => setColors((p) => ({ ...p, accent: c }))} />
            </div>

            {/* Fonts */}
            <div className="flex min-w-[200px] sm:min-w-0 flex-col justify-center px-5 py-5">
              <div className="space-y-2">
                <div>
                  <div className="text-[10px] text-muted-foreground/30">Rubrik</div>
                  <div className="text-[14px] font-semibold">{profile.fonts?.heading ?? "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground/30">Brödtext</div>
                  <div className="text-[14px]">{profile.fonts?.body ?? "—"}</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Details row */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * 2 }}
            className="grid grid-cols-1 sm:grid-cols-3 border-b border-border/8"
          >
            <div className="border-r border-border/8 px-5 py-4">
              <div className="mb-1 text-[10px] text-muted-foreground/30">Bransch</div>
              <div className="flex items-center gap-1">
                <select value={industry} onChange={(e) => { setIndustry(e.target.value); if (e.target.value !== CUSTOM_INDUSTRY_VALUE) setCustomIndustry(""); }} className="w-full appearance-none bg-transparent text-[14px] font-medium text-foreground outline-none cursor-pointer truncate pr-3">
                  {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                  <option value={CUSTOM_INDUSTRY_VALUE}>Annat</option>
                </select>
                <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground/20" />
              </div>
              {industry === CUSTOM_INDUSTRY_VALUE && (
                <input
                  type="text"
                  value={customIndustry}
                  onChange={(e) => setCustomIndustry(e.target.value)}
                  placeholder="Ange bransch..."
                  autoFocus
                  className="mt-1.5 w-full bg-transparent text-[13px] text-foreground outline-none border-b border-foreground/20 placeholder:text-muted-foreground/30"
                />
              )}
            </div>
            <div className="border-r border-border/8 px-5 py-4">
              <div className="mb-1 text-[10px] text-muted-foreground/30">Målgrupp</div>
              <InlineEdit value={targetAudience} onSave={setTargetAudience} />
            </div>
            <div className="px-5 py-4">
              <div className="mb-1 text-[10px] text-muted-foreground/30">Plats</div>
              <InlineEdit value={location} onSave={setLocation} />
            </div>
          </motion.div>

          {/* Confirmation card + channel selection */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * 3 }}
            className="px-6 py-5"
          >
            {/* Summary line */}
            <p className="mb-3 text-center text-[12px] text-muted-foreground/50">
              Målgrupp: <span className="text-foreground/70">{targetAudience || "—"}</span>
              {" · "}
              Bransch: <span className="text-foreground/70">{industry === CUSTOM_INDUSTRY_VALUE ? customIndustry : industry || "—"}</span>
            </p>

            {/* Channel toggles */}
            <div className="mb-4 flex justify-center gap-2">
              {[
                { id: "meta", label: "Meta" },
                { id: "google", label: "Google" },
                { id: "linkedin", label: "LinkedIn" },
              ].map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => toggleChannel(ch.id)}
                  className={`rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-all ${
                    channels[ch.id]
                      ? "bg-foreground text-white"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {ch.label} {channels[ch.id] ? "✓" : ""}
                </button>
              ))}
            </div>

            <button onClick={handleConfirm} className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-[14px] font-semibold text-white transition-all hover:opacity-90 active:scale-95">
              Stämmer — skapa min annons
              <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-3 text-center text-[12px] text-muted-foreground/30">Klicka på valfritt fält ovan för att ändra</p>
            {onBack && (
              <button onClick={onBack} className="mt-2 block w-full text-center text-[11px] text-muted-foreground/25 hover:text-muted-foreground">
                ← Byt URL
              </button>
            )}
          </motion.div>
        </motion.div>

        <div className="mt-5">
          <AIMessage text="Stämmer det här med ert varumärke?" />
        </div>
      </div>
    </div>
  );
}
