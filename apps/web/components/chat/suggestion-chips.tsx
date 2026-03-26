"use client";

import {
  Check,
  Palette,
  Building2,
  RefreshCw,
  Rocket,
  Scissors,
  Wand2,
  Briefcase,
  MousePointer,
  Wallet,
  Target,
  Smartphone,
  BarChart3,
  Plus,
  Pause,
} from "lucide-react";
import type { FlowStep } from "./progress-breadcrumb";

type Suggestion = {
  label: string;
  message: string;
  icon: React.ComponentType<{ className?: string }>;
};

const SUGGESTIONS: Record<FlowStep, Suggestion[]> = {
  analys: [],
  profil: [
    { label: "Ser bra ut!", message: "Profilen ser bra ut, generera annonser", icon: Check },
    { label: "Ändra färger", message: "Jag vill ändra varumärkesfärgerna", icon: Palette },
    { label: "Fel bransch", message: "Branschen stämmer inte", icon: Building2 },
    { label: "Analysera annan URL", message: "Jag vill analysera en annan hemsida", icon: RefreshCw },
  ],
  skapa: [
    { label: "Ser bra ut — publicera!", message: "Annonserna ser bra ut, publicera dem", icon: Rocket },
    { label: "Kortare rubrik", message: "Gör rubriken kortare och punchigare", icon: Scissors },
    { label: "Annan stil", message: "Prova en annan kreativ stil", icon: Wand2 },
    { label: "Mer professionell", message: "Gör texten mer professionell", icon: Briefcase },
    { label: "Ändra CTA", message: "Prova en annan CTA-text", icon: MousePointer },
  ],
  granska: [
    { label: "Godkänn alla", message: "Godkänn alla annonser och gå vidare", icon: Check },
    { label: "Ändra budget", message: "Jag vill ändra budgeten", icon: Wallet },
    { label: "Ändra målgrupp", message: "Jag vill ändra målgruppen", icon: Target },
  ],
  publicera: [
    { label: "500 kr/dag", message: "Publicera med 500 kr per dag budget", icon: Wallet },
    { label: "1 000 kr/dag", message: "Publicera med 1000 kr per dag budget", icon: Wallet },
    { label: "Bara Meta", message: "Publicera bara på Meta/Instagram", icon: Smartphone },
  ],
  live: [
    { label: "Hur går det?", message: "Hur presterar mina annonser?", icon: BarChart3 },
    { label: "Ny kampanj", message: "Jag vill skapa en ny kampanj", icon: Plus },
    { label: "Pausa allt", message: "Pausa alla aktiva kampanjer", icon: Pause },
  ],
};

export function getSuggestionsForStep(step: FlowStep): Suggestion[] {
  return SUGGESTIONS[step] ?? [];
}

export function SuggestionChips({
  suggestions,
  onSelect,
}: {
  suggestions: Suggestion[];
  onSelect: (message: string) => void;
}) {
  if (suggestions.length === 0) return null;

  return (
    <div className="relative">
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-1 py-3">
      {suggestions.map((s, i) => {
        const Icon = s.icon;
        return (
          <button
            key={s.label}
            onClick={() => onSelect(s.message)}
            className="animate-message-in flex shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-white/80 px-4 py-1.5 text-[13px] font-medium text-muted-foreground opacity-0 transition-all [animation-fill-mode:forwards] hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <Icon className="h-3.5 w-3.5 shrink-0 opacity-60" />
            {s.label}
          </button>
        );
      })}
    </div>
    <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}
