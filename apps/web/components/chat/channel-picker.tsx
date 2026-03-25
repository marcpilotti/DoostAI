"use client";

import { useState } from "react";
import { Check, ArrowRight, Megaphone } from "lucide-react";

type Channel = {
  id: string;
  label: string;
  description: string;
};

type ChannelPickerData = {
  channels: Channel[];
};

const PLATFORM_CONFIG: Record<
  string,
  { color: string; bg: string; borderActive: string; icon: React.ReactNode; features: string[] }
> = {
  meta: {
    color: "#1877F2",
    bg: "from-[#1877F2]/5 to-[#1877F2]/10",
    borderActive: "border-[#1877F2]/60 ring-[#1877F2]/20",
    features: ["Feed & Stories", "Reels", "Instagram"],
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.563V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
      </svg>
    ),
  },
  google: {
    color: "#4285F4",
    bg: "from-[#4285F4]/5 to-[#34A853]/5",
    borderActive: "border-[#4285F4]/60 ring-[#4285F4]/20",
    features: ["Sök", "Display", "YouTube"],
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.1a6.5 6.5 0 0 1 0-4.2V7.06H2.18A10.96 10.96 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
      </svg>
    ),
  },
  linkedin: {
    color: "#0077B5",
    bg: "from-[#0077B5]/5 to-[#0077B5]/10",
    borderActive: "border-[#0077B5]/60 ring-[#0077B5]/20",
    features: ["Sponsored", "InMail", "B2B"],
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
};

export function ChannelPicker({
  data,
  onSelect,
}: {
  data: ChannelPickerData;
  onSelect?: (channels: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="animate-message-in mt-3 overflow-hidden rounded-2xl border border-border/40 bg-white/70 backdrop-blur-sm">
      <div className="flex items-center gap-2 border-b border-border/30 px-5 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
          <Megaphone className="h-4 w-4 text-indigo-500" />
        </div>
        <div>
          <div className="text-sm font-semibold">Välj annonskanaler</div>
          <div className="text-[11px] text-muted-foreground">
            Välj en eller flera plattformar
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-3">
        {data.channels.map((ch) => {
          const isSelected = selected.has(ch.id);
          const config = PLATFORM_CONFIG[ch.id];
          return (
            <button
              key={ch.id}
              onClick={() => toggle(ch.id)}
              className={`group relative flex flex-col items-center gap-3 rounded-xl border-2 px-4 py-5 text-center transition-all duration-200 ${
                isSelected
                  ? `bg-gradient-to-b ${config?.bg} ${config?.borderActive} shadow-md ring-2`
                  : "border-border/50 bg-white hover:border-border hover:shadow-sm"
              }`}
            >
              {isSelected && (
                <div
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-white shadow-sm"
                  style={{ backgroundColor: config?.color }}
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </div>
              )}

              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-sm transition-transform duration-200 group-hover:scale-105 ${
                  isSelected ? "shadow-md" : ""
                }`}
                style={{ backgroundColor: config?.color ?? "#6366f1" }}
              >
                {config?.icon}
              </div>

              <div>
                <div className="text-sm font-semibold">{ch.label}</div>
                <div className="text-[11px] text-muted-foreground">
                  {ch.description}
                </div>
              </div>

              {config?.features && (
                <div className="flex flex-wrap justify-center gap-1">
                  {config.features.map((f) => (
                    <span
                      key={f}
                      className="rounded-full bg-muted/50 px-2 py-0.5 text-[9px] font-medium text-muted-foreground"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selected.size > 0 && (
        <div className="border-t border-border/30 px-5 py-3">
          <button
            onClick={() => onSelect?.([...selected])}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-indigo-600 hover:to-indigo-700 hover:shadow-md"
          >
            Skapa annonser för {selected.size} {selected.size === 1 ? "kanal" : "kanaler"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
