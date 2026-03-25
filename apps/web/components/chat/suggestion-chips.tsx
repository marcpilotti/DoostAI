"use client";

import type { FlowStep } from "./progress-breadcrumb";

type Suggestion = {
  label: string;
  message: string;
  icon?: string;
};

const SUGGESTIONS: Record<FlowStep, Suggestion[]> = {
  analys: [],
  profil: [
    { label: "Ser bra ut!", message: "Profilen ser bra ut, generera annonser", icon: "✅" },
    { label: "Ändra färger", message: "Jag vill ändra varumärkesfärgerna", icon: "🎨" },
    { label: "Fel bransch", message: "Branschen stämmer inte", icon: "🏢" },
    { label: "Analysera annan URL", message: "Jag vill analysera en annan hemsida", icon: "🔄" },
  ],
  skapa: [
    { label: "Ser bra ut — publicera!", message: "Annonserna ser bra ut, publicera dem", icon: "🚀" },
    { label: "Kortare rubrik", message: "Gör rubriken kortare och punchigare", icon: "✂️" },
    { label: "Annan mall", message: "Prova en annan mall-stil", icon: "🎨" },
    { label: "Mer professionell", message: "Gör texten mer professionell", icon: "👔" },
    { label: "Ändra CTA", message: "Prova en annan CTA-text", icon: "🔘" },
  ],
  granska: [
    { label: "Godkänn alla", message: "Godkänn alla annonser och gå vidare", icon: "✅" },
    { label: "Ändra budget", message: "Jag vill ändra budgeten", icon: "💰" },
    { label: "Ändra målgrupp", message: "Jag vill ändra målgruppen", icon: "🎯" },
  ],
  publicera: [
    { label: "500 kr/dag", message: "Publicera med 500 kr per dag budget", icon: "💰" },
    { label: "1 000 kr/dag", message: "Publicera med 1000 kr per dag budget", icon: "💰" },
    { label: "Bara Meta", message: "Publicera bara på Meta/Instagram", icon: "📱" },
  ],
  live: [
    { label: "Hur går det?", message: "Hur presterar mina annonser?", icon: "📊" },
    { label: "Ny kampanj", message: "Jag vill skapa en ny kampanj", icon: "➕" },
    { label: "Pausa allt", message: "Pausa alla aktiva kampanjer", icon: "⏸️" },
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
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-1 py-2">
      {suggestions.map((s, i) => (
        <button
          key={s.label}
          onClick={() => onSelect(s.message)}
          className="animate-message-in shrink-0 rounded-full border border-border/60 bg-white/80 px-4 py-1.5 text-[13px] font-medium text-muted-foreground opacity-0 transition-all [animation-fill-mode:forwards] hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          {s.icon && <span className="mr-1">{s.icon}</span>}
          {s.label}
        </button>
      ))}
    </div>
  );
}
