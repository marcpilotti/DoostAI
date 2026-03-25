"use client";

type SuggestionChipsProps = {
  suggestions: string[];
  onSelect: (text: string) => void;
};

export function SuggestionChips({ suggestions, onSelect }: SuggestionChipsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-1 pt-2">
      {suggestions.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className="rounded-full border border-border/60 bg-white/80 px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
