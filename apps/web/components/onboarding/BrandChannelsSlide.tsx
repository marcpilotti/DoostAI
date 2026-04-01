"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Info, Send } from "lucide-react";
import { useState } from "react";

// ── Platform definitions ────────────────────────────────────────

type Platform = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  color: string;
  icon: React.ReactNode;
  enabled: boolean;
};

function MetaIcon() {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1877F2] text-white">
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.563V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
      </svg>
    </div>
  );
}

function GoogleIcon() {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-border/10">
      <svg className="h-6 w-6" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    </div>
  );
}

function LinkedInIcon() {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0A66C2] text-white">
      <span className="text-[18px] font-bold leading-none">in</span>
    </div>
  );
}

function TikTokIcon() {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white">
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.41a8.16 8.16 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.84z" />
      </svg>
    </div>
  );
}

function SnapchatIcon() {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFFC00]">
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="black">
        <path d="M12 2c-3 0-4.5 2-4.5 4.5v2s-1.5-.5-2 0c-.5.5 0 1.5.5 2-1.5.5-2 1.5-2 2s1 1 2.5 1c-.5 1.5-.5 2.5 0 3 .5.5 1.5.5 2.5 0 1 1.5 2 2.5 3 2.5s2-1 3-2.5c1 .5 2 .5 2.5 0s.5-1.5 0-3c1.5 0 2.5-.5 2.5-1s-.5-1.5-2-2c.5-.5 1-1.5.5-2s-1.5-.5-2 0v-2C18.5 4 17 2 12 2z" />
      </svg>
    </div>
  );
}

function PinterestIcon() {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E60023] text-white">
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.425 1.808-2.425.853 0 1.265.64 1.265 1.408 0 .858-.546 2.14-.828 3.33-.236.995.499 1.806 1.48 1.806 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.176-4.068-2.845 0-4.515 2.134-4.515 4.34 0 .859.331 1.781.745 2.282a.3.3 0 01.069.288l-.278 1.133c-.044.183-.145.222-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.472 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.527-2.291-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.936.29 1.93.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z" />
      </svg>
    </div>
  );
}

const PLATFORMS: Platform[] = [
  { id: "meta", name: "Meta", description: "Facebook & Instagram", tags: ["Feed & Stories", "Reels", "Instagram"], color: "#1877F2", icon: <MetaIcon />, enabled: true },
  { id: "google", name: "Google", description: "Sök & Display", tags: ["Sök", "Display", "YouTube"], color: "#4285F4", icon: <GoogleIcon />, enabled: true },
  { id: "linkedin", name: "LinkedIn", description: "B2B-fokus", tags: ["Sponsored", "InMail", "B2B"], color: "#0A66C2", icon: <LinkedInIcon />, enabled: true },
  { id: "tiktok", name: "TikTok", description: "Kortvideo & Gen Z", tags: ["In-Feed", "TopView", "Spark Ads"], color: "#000000", icon: <TikTokIcon />, enabled: false },
  { id: "snapchat", name: "Snapchat", description: "AR & Story Ads", tags: ["Snap Ads", "Story Ads", "AR Lens"], color: "#FFFC00", icon: <SnapchatIcon />, enabled: false },
  { id: "pinterest", name: "Pinterest", description: "Shopping & Inspiration", tags: ["Pins", "Shopping", "Idea Ads"], color: "#E60023", icon: <PinterestIcon />, enabled: false },
];

// ── Component ───────────────────────────────────────────────────

export function BrandChannelsSlide({ onConfirm, onBack }: {
  onConfirm: (channels: string[]) => void;
  onBack?: () => void;
}) {
  const prefersReduced = useReducedMotion();
  const [selected, setSelected] = useState<Set<string>>(new Set(["meta"]));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleConfirm() {
    onConfirm([...selected]);
  }

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 pt-[72px] sm:px-6">
      <div className="w-full max-w-xl">
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)]"
        >
          {/* ── Header ────────────────────────────────────────── */}
          <div className="flex items-center gap-3 border-b border-border/8 px-6 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Send className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-foreground">Välj annonskanal</h2>
              <p className="text-[13px] text-muted-foreground/50">Välj en plattform att skapa annons för</p>
            </div>
          </div>

          {/* ── Info banner ───────────────────────────────────── */}
          <div className="mx-4 mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2.5">
            <Info className="h-4 w-4 shrink-0 text-emerald-600" />
            <p className="text-[12px] text-emerald-700">Vi sköter kontona åt dig — du behöver inte ha egna annonskonton.</p>
          </div>

          {/* ── Platform grid ─────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
            {PLATFORMS.map((p) => {
              const isSelected = selected.has(p.id);
              const isDisabled = !p.enabled;

              return (
                <button
                  key={p.id}
                  onClick={() => !isDisabled && toggle(p.id)}
                  disabled={isDisabled}
                  className={`relative flex flex-col items-center rounded-xl px-3 py-5 text-center transition-all ${
                    isSelected
                      ? "bg-primary/5 ring-2 ring-primary shadow-sm"
                      : isDisabled
                        ? "bg-muted/20 opacity-50 cursor-not-allowed"
                        : "bg-muted/20 ring-1 ring-border/10 hover:ring-border/30 hover:bg-muted/30"
                  }`}
                >
                  {/* Selection badge */}
                  {isSelected && (
                    <div className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-sm">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </div>
                  )}

                  {/* Coming soon badge */}
                  {isDisabled && (
                    <span className="absolute right-2 top-2 rounded-full bg-muted px-1.5 py-0.5 text-[8px] font-medium text-muted-foreground">
                      Snart
                    </span>
                  )}

                  {p.icon}
                  <h3 className="mt-3 text-[14px] font-bold text-foreground">{p.name}</h3>
                  <p className="text-[11px] text-muted-foreground/50">{p.description}</p>

                  {/* Format tags */}
                  <div className="mt-3 flex flex-wrap justify-center gap-1">
                    {p.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-muted-foreground/60 ring-1 ring-border/10">
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Footer ────────────────────────────────────────── */}
          <div className="border-t border-border/8 px-6 py-2">
            <button className="text-[11px] text-primary/60 hover:text-primary">
              Koppla befintliga annonskonton →
            </button>
          </div>

          {/* ── CTA ───────────────────────────────────────────── */}
          <div className="px-6 pb-6 pt-2">
            <button
              onClick={handleConfirm}
              disabled={selected.size === 0}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-[14px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-30"
            >
              Skapa annons
              <ArrowRight className="h-4 w-4" />
            </button>
            {onBack && (
              <button onClick={onBack} className="mt-3 block w-full text-center text-[11px] text-muted-foreground/25 hover:text-muted-foreground">
                ← Tillbaka
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
