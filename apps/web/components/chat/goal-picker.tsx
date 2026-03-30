"use client";

import React, { useState } from "react";
import { ArrowRight, Phone, Users, Eye, Target } from "lucide-react";

type GoalPickerData = {
  industryCategory?: string;
  audiences?: string[];
  targetAudience?: string;
};

const GOALS = [
  { id: "Fler kunder", label: "Fler kunder", subtitle: "Vi vill att telefonen ringer", icon: Phone },
  { id: "Hitta personal", label: "Hitta personal", subtitle: "Vi behöver anställa", icon: Users },
  { id: "Synas mer", label: "Synas mer", subtitle: "Folk vet inte att vi finns", icon: Eye },
];

const DEFAULT_AUDIENCES = [
  "Småföretagare",
  "Privatpersoner 25–55",
  "Beslutsfattare",
  "Lokala kunder",
  "Unga vuxna 18–30",
  "Familjer med barn",
  "Företagsledare & VD",
  "Teknikintresserade",
];

type PlatformOption = {
  id: string;
  label: string;
  subtitle: string;
  color: string;
  icon: () => React.ReactElement;
  formats: string[];
};

const PLATFORMS: PlatformOption[] = [
  {
    id: "meta",
    label: "Meta",
    subtitle: "Facebook & Instagram",
    color: "#1877F2",
    icon: () => (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="#1877F2">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.563V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
      </svg>
    ),
    formats: ["Feed", "Stories", "Reels"],
  },
  {
    id: "google",
    label: "Google",
    subtitle: "Sök & Display",
    color: "#4285F4",
    icon: () => (
      <svg className="h-6 w-6" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    ),
    formats: ["Sök", "Display"],
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    subtitle: "B2B-fokus",
    color: "#0A66C2",
    icon: () => (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="#0A66C2">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    formats: ["Sponsored", "InMail"],
  },
];

export function GoalPicker({
  data,
  onSelect,
}: {
  data: GoalPickerData;
  onSelect?: (goal: string, audience: string, platform: string) => void;
}) {
  const [submitted, setSubmitted] = useState(false);

  const filteredAudiences = data.audiences?.filter((a) => a.trim()) ?? [];
  const audiences = filteredAudiences.length > 0
    ? [...filteredAudiences, ...DEFAULT_AUDIENCES.filter((d) => !filteredAudiences.includes(d))].slice(0, 8)
    : DEFAULT_AUDIENCES;

  const [selectedGoal, setSelectedGoal] = useState<string | null>("Fler kunder");
  const [selectedAudience, setSelectedAudience] = useState<string | null>(() => {
    if (data.targetAudience && audiences.length > 0) return audiences[0] ?? null;
    return null;
  });
  const [selectedPlatform, setSelectedPlatform] = useState<string>("meta");

  const ready = selectedGoal && selectedAudience && selectedPlatform;

  return (
    <div className="animate-card-in mt-2 overflow-hidden rounded-2xl border border-border/30 bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/30 px-4 py-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
          <Target className="h-3.5 w-3.5 text-white" />
        </div>
        <div>
          <div className="text-xs font-semibold">Mål, målgrupp & kanal</div>
          <div className="text-[9px] text-muted-foreground">Tre snabba val — resten sköter vi</div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Section 1: Goal */}
        <div>
          <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-foreground/50">
            Vad behöver ni mest?
          </div>
          <div className="grid grid-cols-3 gap-1.5">
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
        <div>
          <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-foreground/50">
            Vem vill ni nå?
          </div>
          <div className="flex flex-wrap gap-1.5">
            {audiences.map((a) => {
              const active = selectedAudience === a;
              return (
                <button
                  key={a}
                  onClick={() => setSelectedAudience(a)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
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

        {/* Section 3: Platform */}
        <div>
          <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-foreground/50">
            Var vill ni annonsera?
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {PLATFORMS.map((p) => {
              const active = selectedPlatform === p.id;
              const PIcon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlatform(p.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-center transition-all ${
                    active
                      ? "border-indigo-400 bg-indigo-50/50 ring-1 ring-indigo-200"
                      : "border-border/40 bg-white hover:border-indigo-300 hover:shadow-sm"
                  }`}
                >
                  <PIcon />
                  <div>
                    <div className="text-xs font-semibold">{p.label}</div>
                    <div className="text-[8px] text-muted-foreground">{p.subtitle}</div>
                  </div>
                  <div className="flex flex-wrap justify-center gap-1">
                    {p.formats.map((f) => (
                      <span key={f} className="rounded bg-muted/40 px-1.5 py-0.5 text-[7px] font-medium text-muted-foreground">
                        {f}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      {ready && (
        <div className="animate-message-in border-t border-border/20 px-4 py-2">
          <button
            onClick={() => {
              if (submitted) return;
              setSubmitted(true);
              onSelect?.(selectedGoal!, selectedAudience!, selectedPlatform);
            }}
            disabled={submitted}
            className={`flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold shadow-sm transition-all ${
              submitted
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 hover:shadow-md"
            }`}
          >
            {submitted ? "Skapar annons..." : "Skapa annons"}
            {!submitted && <ArrowRight className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}
