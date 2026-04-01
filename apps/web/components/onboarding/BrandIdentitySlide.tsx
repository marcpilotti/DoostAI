"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ExternalLink, ImagePlus } from "lucide-react";
import { useEffect, useState } from "react";

import { ColorEditor } from "../brand/color-editor";
import type { BrandProfile } from "./OnboardingShell";

// ── Helpers ─────────────────────────────────────────────────────

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
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
    img.src = url;
  });
}

function ColorDot({ color, label, hex, role, originalColor, onColorChange }: {
  color: string; label: string; hex: string; role: string; originalColor: string; onColorChange: (c: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex flex-col items-center gap-1.5">
      <button
        onClick={() => setOpen(!open)}
        className="h-12 w-12 rounded-full shadow-sm transition-transform hover:scale-110"
        style={{ backgroundColor: color }}
        aria-label={`Ändra ${label}-färg`}
      />
      <span className="text-[11px] font-mono text-muted-foreground/50">{hex}</span>
      <span className="text-[10px] font-medium text-muted-foreground/40">{label}</span>
      {open && <ColorEditor role={role} currentColor={color} originalColor={originalColor} onColorChange={onColorChange} onClose={() => setOpen(false)} />}
    </div>
  );
}

// ── Component ───────────────────────────────────────────────────

export function BrandIdentitySlide({ profile, onConfirm, onBack }: {
  profile: BrandProfile;
  onConfirm: (updated: BrandProfile) => void;
  onBack?: () => void;
}) {
  const prefersReduced = useReducedMotion();
  const [colors, setColors] = useState(profile.colors);
  const [logoUrl, setLogoUrl] = useState<string | null>(profile.logo?.url ?? profile.logos?.primary ?? null);
  const [logoError, setLogoError] = useState<string | null>(null);

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
  const primary = colors.primary ?? "#6366f1";

  function handleConfirm() {
    onConfirm({ ...profile, colors: { ...profile.colors, primary: colors.primary, secondary: colors.secondary, accent: colors.accent }, logos: { ...profile.logos, primary: logoUrl ?? undefined } });
  }

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 pt-[72px] sm:px-6">
      <div className="w-full max-w-lg">
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)]"
        >
          {/* ── Immersive brand header ─────────────────────────── */}
          <div
            className="relative px-6 pb-6 pt-8"
            style={{ background: `linear-gradient(135deg, ${primary}15 0%, ${primary}08 100%)` }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {/* Logo or upload */}
                <label className="group flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm transition-transform hover:scale-105">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt={name} className="h-full w-full object-contain p-1.5" />
                  ) : (
                    <ImagePlus className="h-5 w-5 text-muted-foreground/30" />
                  )}
                  <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    if (f.size > 5 * 1024 * 1024) { setLogoError("Max 5 MB"); return; }
                    setLogoError(null);
                    compressImage(f, 512).then(setLogoUrl).catch(() => setLogoUrl(URL.createObjectURL(f)));
                  }} />
                </label>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight" style={{ color: primary }}>{name}</h2>
                  <p className="text-[13px] text-muted-foreground/50">{domain}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {confidence > 0 && (
                  <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-[10px] font-semibold tabular-nums text-foreground/50 shadow-sm">
                    {confidence}% match
                  </span>
                )}
                <a href={profile.url.startsWith("http") ? profile.url : `https://${profile.url}`} target="_blank" rel="noopener noreferrer" className="rounded-lg p-1.5 text-muted-foreground/25 hover:text-muted-foreground/50">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
            {logoError && <p className="mt-2 text-[11px] text-red-500">{logoError}</p>}
          </div>

          {/* ── Colors ────────────────────────────────────────── */}
          <div className="border-t border-border/8 px-6 py-6">
            <div className="mb-4 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/40">Varumärkesfärger</div>
            <div className="flex justify-center gap-8">
              <ColorDot color={colors.primary} hex={colors.primary} label="Primär" role="primary" originalColor={profile.colors.primary} onColorChange={(c) => setColors((p) => ({ ...p, primary: c }))} />
              <ColorDot color={colors.secondary} hex={colors.secondary} label="Sekundär" role="secondary" originalColor={profile.colors.secondary} onColorChange={(c) => setColors((p) => ({ ...p, secondary: c }))} />
              <ColorDot color={colors.accent} hex={colors.accent} label="Accent" role="accent" originalColor={profile.colors.accent} onColorChange={(c) => setColors((p) => ({ ...p, accent: c }))} />
            </div>
          </div>

          {/* ── Typography ────────────────────────────────────── */}
          <div className="border-t border-border/8 px-6 py-5">
            <div className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/40">Typografi</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-muted/30 px-4 py-3">
                <div className="text-[10px] text-muted-foreground/40">Rubrik</div>
                <div className="mt-0.5 text-[16px] font-bold text-foreground">{profile.fonts?.heading ?? "Inter"}</div>
              </div>
              <div className="rounded-lg bg-muted/30 px-4 py-3">
                <div className="text-[10px] text-muted-foreground/40">Brödtext</div>
                <div className="mt-0.5 text-[16px] text-foreground">{profile.fonts?.body ?? "Inter"}</div>
              </div>
            </div>
          </div>

          {/* ── CTA ───────────────────────────────────────────── */}
          <div className="px-6 pb-6 pt-2">
            <button
              onClick={handleConfirm}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3.5 text-[14px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            >
              Stämmer — gå vidare
              <ArrowRight className="h-4 w-4" />
            </button>
            {onBack && (
              <button onClick={onBack} className="mt-3 block w-full text-center text-[11px] text-muted-foreground/25 hover:text-muted-foreground">
                ← Byt URL
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
