"use client";

import { useState } from "react";
import { ArrowRight, Phone, Users, Rocket, Eye, Target } from "lucide-react";

type GoalPickerData = {
  industryCategory?: string;
  audiences?: string[];
};

const GOALS = [
  { id: "Fler kunder", label: "Fler kunder", subtitle: "Vi vill att telefonen ringer", icon: Phone },
  { id: "Hitta personal", label: "Hitta personal", subtitle: "Vi behöver anställa", icon: Users },
  { id: "Lansera nytt", label: "Lansera något nytt", subtitle: "Vi har en ny tjänst eller produkt", icon: Rocket },
  { id: "Synas mer", label: "Synas mer", subtitle: "Folk vet inte att vi finns", icon: Eye },
];

const DEFAULT_AUDIENCES = ["Småföretagare", "Privatpersoner 25–55", "Beslutsfattare", "Lokala kunder"];

export function GoalPicker({
  data,
  onSelect,
}: {
  data: GoalPickerData;
  onSelect?: (goal: string, audience: string) => void;
}) {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedAudience, setSelectedAudience] = useState<string | null>(null);

  const audiences = data.audiences && data.audiences.length > 0 ? data.audiences : DEFAULT_AUDIENCES;
  const ready = selectedGoal && selectedAudience;

  return (
    <div className="animate-card-in mt-2 overflow-hidden rounded-2xl border border-border/30 bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/30 px-4 py-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
          <Target className="h-3.5 w-3.5 text-white" />
        </div>
        <div>
          <div className="text-xs font-semibold">Mål & målgrupp</div>
          <div className="text-[9px] text-muted-foreground">Två snabba val — resten sköter vi</div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Section 1: Goal */}
        <div>
          <div className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-foreground/50">
            Vad behöver ni mest?
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {GOALS.map((g) => {
              const Icon = g.icon;
              const active = selectedGoal === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => setSelectedGoal(g.id)}
                  className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 text-left transition-all ${
                    active
                      ? "border-indigo-400 bg-indigo-50/50 ring-1 ring-indigo-200"
                      : "border-border/40 bg-white hover:border-indigo-300 hover:shadow-sm"
                  }`}
                >
                  <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${active ? "text-indigo-500" : "text-muted-foreground/50"}`} />
                  <div>
                    <div className="text-xs font-medium">{g.label}</div>
                    <div className="text-[9px] text-muted-foreground">{g.subtitle}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Audience */}
        {selectedGoal && (
          <div className="animate-message-in">
            <div className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-foreground/50">
              Vilka brukar anlita er?
            </div>
            <div className="flex flex-wrap gap-1.5">
              {audiences.map((a) => {
                const active = selectedAudience === a;
                return (
                  <button
                    key={a}
                    onClick={() => setSelectedAudience(a)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                      active
                        ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                        : "border-border/40 bg-white text-muted-foreground hover:border-indigo-300 hover:text-indigo-600"
                    }`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {ready && (
        <div className="animate-message-in border-t border-border/20 px-4 py-2">
          <button
            onClick={() => onSelect?.(selectedGoal!, selectedAudience!)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:from-indigo-600 hover:to-indigo-700 hover:shadow-md"
          >
            Skapa annons
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
