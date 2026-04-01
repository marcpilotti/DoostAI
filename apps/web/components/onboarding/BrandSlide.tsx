"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  ExternalLink,
  ImagePlus,
  Pencil,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
    img.src = url;
  });
}

function stripSuffix(name: string): string {
  return name.replace(/\s+(AB|HB|KB|Inc\.?|Ltd\.?|LLC|GmbH|Corp\.?|Co\.?)$/i, "").trim();
}

// ── Color dot (clickable, opens color editor) ───────────────────

function ColorDot({ color, label, role, originalColor, onColorChange }: {
  color: string; label: string; role: string; originalColor: string; onColorChange: (c: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex flex-col items-center gap-1.5">
      <button
        onClick={() => setOpen(!open)}
        className="h-11 w-11 rounded-full ring-2 ring-white shadow-sm transition-transform hover:scale-110"
        style={{ backgroundColor: color }}
        aria-label={`Ändra ${label}-färg`}
      />
      <span className="text-[10px] font-medium text-muted-foreground/40">{label}</span>
      {open && <ColorEditor role={role} currentColor={color} originalColor={originalColor} onColorChange={onColorChange} onClose={() => setOpen(false)} />}
    </div>
  );
}

// ── Inline editable field ───────────────────────────────────────

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
        onKeyDown={(e) => { if (e.key === "Enter") handleSave((e.target as HTMLInputElement).value); }}
        onBlur={(e) => handleSave(e.target.value)}
        className="w-full bg-transparent text-[14px] font-semibold text-foreground outline-none border-b border-foreground/20"
      />
    );
  }
  return (
    <div className={saved ? "editable-saved" : ""}>
      <button onClick={() => setEditing(true)} className="group flex w-full items-center gap-1 text-left">
        <span className="text-[14px] font-semibold text-foreground">{value || "—"}</span>
        <Pencil className="h-2.5 w-2.5 shrink-0 text-muted-foreground/20 opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    </div>
  );
}

// ── Platform icon SVGs ──────────────────────────────────────────

function MetaIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 10.2c-1.3-1.8-2.6-3-4.2-3C5.4 7.2 4 9.6 4 12s1.4 4.8 3.8 4.8c1.6 0 2.9-1.2 4.2-3 1.3 1.8 2.6 3 4.2 3 2.4 0 3.8-2.4 3.8-4.8s-1.4-4.8-3.8-4.8c-1.6 0-2.9 1.2-4.2 3z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <div className="flex h-4 w-4 items-center justify-center rounded-[3px] bg-[#0A66C2]">
      <span className="text-[8px] font-bold leading-none text-white">in</span>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────

export function BrandSlide({ profile, onConfirm, onBack }: { profile: BrandProfile; onConfirm: (approved: BrandProfile) => void; onBack?: () => void }) {
  const prefersReduced = useReducedMotion();
  const [colors, setColors] = useState(profile.colors);
  const [logoError, setLogoError] = useState<string | null>(null);

  // Enter key → confirm (skip when user is typing)
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

  // Confidence animation — count up from 0
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
  confirmRef.current = handleConfirm;

  const delay = (i: number) => ({ delay: prefersReduced ? 0 : 0.05 * i });

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 pt-[72px] sm:px-6">
      <div className="w-full max-w-lg">
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-md)]"
        >
          {/* ── Header ──────────────────────────────────────────── */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={delay(0)}
            className="flex items-center gap-3 px-6 pt-5 pb-4"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/symbol.svg" alt="" className="h-6 w-6 shrink-0 opacity-40" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-xl font-bold tracking-tight" style={{ color: colors.primary }}>{name}</h3>
                {displayedConfidence > 0 && (
                  <span className="shrink-0 rounded-full bg-foreground/5 px-2.5 py-0.5 text-[10px] font-semibold tabular-nums text-foreground/40">
                    {displayedConfidence}% match
                  </span>
                )}
              </div>
              <p className="text-[13px] text-muted-foreground/50">{domain}</p>
            </div>
            <a href={profile.url.startsWith("http") ? profile.url : `https://${profile.url}`} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-lg p-1.5 text-muted-foreground/20 hover:bg-muted/30 hover:text-muted-foreground/50">
              <ExternalLink className="h-4 w-4" />
            </a>
          </motion.div>

          {/* ── Visual identity ─────────────────────────────────── */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={delay(1)}
            className="mx-4 mb-3 flex gap-2.5"
          >
            {/* Logo — own white card */}
            <label className="group flex w-[38%] shrink-0 cursor-pointer flex-col items-center justify-center rounded-xl bg-muted/30 py-8 transition-colors hover:bg-muted/40">
              {logoUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} alt={name} className="h-16 max-w-[85%] object-contain" />
                  <span className="mt-2 text-[10px] text-muted-foreground/30 opacity-0 group-hover:opacity-100">Byt</span>
                </>
              ) : (
                <>
                  <ImagePlus className="h-5 w-5 text-muted-foreground/20" />
                  <span className="mt-1 text-[10px] text-muted-foreground/30">Ladda upp</span>
                </>
              )}
              {logoError && <span className="mt-1 text-[9px] text-red-500">{logoError}</span>}
              <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > 5 * 1024 * 1024) { setLogoError("Max 5 MB"); return; }
                setLogoError(null);
                if (logoUrl?.startsWith("blob:")) URL.revokeObjectURL(logoUrl);
                compressImage(f, 512).then((dataUrl) => setLogoUrl(dataUrl)).catch(() => setLogoUrl(URL.createObjectURL(f)));
              }} />
            </label>

            {/* Fonts + Colors — own white card with 2x2 grid */}
            <div className="flex-1 overflow-hidden rounded-xl bg-muted/30">
              {/* Top row: Rubrik | Brödtext */}
              <div className="grid grid-cols-2 border-b border-white/60">
                <div className="border-r border-white/60 px-4 py-3.5">
                  <div className="text-[10px] text-muted-foreground/40">Rubrik</div>
                  <div className="mt-1 text-[15px] font-bold text-foreground">{profile.fonts?.heading ?? "—"}</div>
                </div>
                <div className="px-4 py-3.5">
                  <div className="text-[10px] text-muted-foreground/40">Brödtext</div>
                  <div className="mt-1 text-[15px] font-bold text-foreground">{profile.fonts?.body ?? "—"}</div>
                </div>
              </div>

              {/* Bottom row: Colors | Bransch */}
              <div className="grid grid-cols-[1.3fr_1fr]">
                <div className="flex items-center justify-center gap-3.5 border-r border-white/60 py-3.5">
                  <ColorDot color={colors.primary} label="Pri" role="primary" originalColor={profile.colors.primary} onColorChange={(c) => setColors((p) => ({ ...p, primary: c }))} />
                  <ColorDot color={colors.secondary} label="Sek" role="secondary" originalColor={profile.colors.secondary} onColorChange={(c) => setColors((p) => ({ ...p, secondary: c }))} />
                  <ColorDot color={colors.accent} label="Acc" role="accent" originalColor={profile.colors.accent} onColorChange={(c) => setColors((p) => ({ ...p, accent: c }))} />
                </div>
                <div className="flex flex-col justify-center px-4 py-3.5">
                  <div className="text-[10px] text-muted-foreground/40">Bransch</div>
                  <div className="mt-1 text-[15px] font-bold text-foreground">{resolvedIndustry || "—"}</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Details card (Bransch, Målgrupp, Plats) ──────────── */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={delay(2)}
            className="mx-4 mb-4 grid grid-cols-1 sm:grid-cols-3 overflow-hidden rounded-xl bg-muted/30"
          >
            <div className="border-b sm:border-b-0 sm:border-r border-white/60 px-5 py-4">
              <div className="mb-1 text-[10px] text-muted-foreground/40">Bransch</div>
              <div className="flex items-center gap-1">
                <select
                  value={industry}
                  onChange={(e) => { setIndustry(e.target.value); if (e.target.value !== CUSTOM_INDUSTRY_VALUE) setCustomIndustry(""); }}
                  className="w-full appearance-none bg-transparent text-[14px] font-semibold text-foreground outline-none cursor-pointer truncate pr-3"
                >
                  {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                  <option value={CUSTOM_INDUSTRY_VALUE}>Annat</option>
                </select>
                <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground/30" />
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
            <div className="border-b sm:border-b-0 sm:border-r border-white/60 px-5 py-4">
              <div className="mb-1 text-[10px] text-muted-foreground/40">Målgrupp</div>
              <InlineEdit value={targetAudience} onSave={setTargetAudience} />
            </div>
            <div className="px-5 py-4">
              <div className="mb-1 text-[10px] text-muted-foreground/40">Plats</div>
              <InlineEdit value={location} onSave={setLocation} />
            </div>
          </motion.div>

          {/* ── Channel toggles + CTA ───────────────────────────── */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={delay(3)}
            className="px-6 pb-6 pt-2"
          >
            {/* Channel toggles — outlined pills with platform icons */}
            <div className="mb-4 flex justify-center gap-2.5">
              {[
                { id: "meta", label: "Meta", icon: <MetaIcon /> },
                { id: "google", label: "Google", icon: <GoogleIcon /> },
                { id: "linkedin", label: "LinkedIn", icon: <LinkedInIcon /> },
              ].map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => toggleChannel(ch.id)}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-all ${
                    channels[ch.id]
                      ? "bg-white text-foreground shadow-sm ring-1 ring-foreground/10"
                      : "bg-muted/30 text-muted-foreground/40 hover:bg-muted/50"
                  }`}
                >
                  {ch.icon}
                  {ch.label}
                </button>
              ))}
            </div>

            {/* CTA button */}
            <button
              onClick={handleConfirm}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3.5 text-[14px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            >
              Stämmer — skapa min annons
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Footer text */}
            <p className="mt-4 text-center text-[13px] text-muted-foreground/40">
              Stämmer det här med ert varumärke?
            </p>
            {onBack && (
              <button onClick={onBack} className="mt-1 block w-full text-center text-[11px] text-muted-foreground/40 hover:text-muted-foreground">
                ← Byt URL
              </button>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
