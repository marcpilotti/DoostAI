"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ExternalLink, ImagePlus } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
        className="h-12 w-12 rounded-full shadow-sm transition-transform hover:scale-110 hover:z-10"
        style={{ backgroundColor: color }}
        aria-label={`Ändra ${label}-färg`}
      />
      <span className="font-mono text-xs text-muted-foreground">{hex}</span>
      <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
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
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden border-0 shadow-lg">
            {/* ── Brand header with gradient ────────────────────── */}
            <CardHeader
              className="relative pb-4"
              style={{ background: `linear-gradient(135deg, ${primary}12 0%, ${primary}06 100%)` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
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
                    <p className="text-sm text-muted-foreground">{domain}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {confidence > 0 && (
                    <Badge variant="secondary" className="tabular-nums">
                      {confidence}% match
                    </Badge>
                  )}
                  <a href={profile.url.startsWith("http") ? profile.url : `https://${profile.url}`} target="_blank" rel="noopener noreferrer" className="rounded-lg p-1.5 text-muted-foreground/40 hover:text-muted-foreground">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
              {logoError && <p className="mt-2 text-xs text-destructive">{logoError}</p>}
            </CardHeader>

            <Separator />

            {/* ── Colors ────────────────────────────────────────── */}
            <CardContent className="py-6">
              <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Varumärkesfärger</p>
              <div className="flex justify-center gap-8">
                <ColorDot color={colors.primary} hex={colors.primary} label="Primär" role="primary" originalColor={profile.colors.primary} onColorChange={(c) => setColors((p) => ({ ...p, primary: c }))} />
                <ColorDot color={colors.secondary} hex={colors.secondary} label="Sekundär" role="secondary" originalColor={profile.colors.secondary} onColorChange={(c) => setColors((p) => ({ ...p, secondary: c }))} />
                <ColorDot color={colors.accent} hex={colors.accent} label="Accent" role="accent" originalColor={profile.colors.accent} onColorChange={(c) => setColors((p) => ({ ...p, accent: c }))} />
              </div>
            </CardContent>

            <Separator />

            {/* ── Typography ────────────────────────────────────── */}
            <CardContent className="py-5">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Typografi</p>
              <div className="grid grid-cols-2 gap-3">
                <Card className="border-0 bg-muted/40 shadow-none">
                  <CardContent className="p-3">
                    <p className="text-[10px] text-muted-foreground">Rubrik</p>
                    <p className="mt-0.5 text-base font-bold">{profile.fonts?.heading ?? "Inter"}</p>
                  </CardContent>
                </Card>
                <Card className="border-0 bg-muted/40 shadow-none">
                  <CardContent className="p-3">
                    <p className="text-[10px] text-muted-foreground">Brödtext</p>
                    <p className="mt-0.5 text-base">{profile.fonts?.body ?? "Inter"}</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>

            {/* ── CTA ───────────────────────────────────────────── */}
            <CardFooter className="flex-col gap-3 pb-6">
              <Button onClick={handleConfirm} size="lg" className="w-full rounded-full">
                Allt ser bra ut
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              {onBack && (
                <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground">
                  ← Byt URL
                </button>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
