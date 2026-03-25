"use client";

import { Check, Globe, Palette, PenTool, Rocket, Radio, Eye } from "lucide-react";

export type FlowStep = "url" | "profil" | "annonser" | "granska" | "publicera" | "live";

type StepConfig = {
  id: FlowStep;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
};

const STEPS: StepConfig[] = [
  { id: "url", label: "URL", shortLabel: "URL", icon: Globe },
  { id: "profil", label: "Profil", shortLabel: "Profil", icon: Palette },
  { id: "annonser", label: "Annonser", shortLabel: "Ads", icon: PenTool },
  { id: "granska", label: "Granska", shortLabel: "Granska", icon: Eye },
  { id: "publicera", label: "Publicera", shortLabel: "Pub.", icon: Rocket },
  { id: "live", label: "Live", shortLabel: "Live", icon: Radio },
];

function getStepIndex(step: FlowStep): number {
  return STEPS.findIndex((s) => s.id === step);
}

type StepState = "completed" | "current" | "upcoming";

function getStepState(step: FlowStep, currentStep: FlowStep): StepState {
  const stepIdx = getStepIndex(step);
  const currentIdx = getStepIndex(currentStep);
  if (stepIdx < currentIdx) return "completed";
  if (stepIdx === currentIdx) return "current";
  return "upcoming";
}

export function ProgressBreadcrumb({
  currentStep,
  onStepClick,
}: {
  currentStep: FlowStep;
  onStepClick?: (step: FlowStep) => void;
}) {
  return (
    <div className="border-b border-border/30 bg-background/80 backdrop-blur-sm">
      {/* Desktop */}
      <div className="mx-auto hidden max-w-2xl items-center justify-between px-6 py-2 sm:flex">
        {STEPS.map((step, i) => {
          const state = getStepState(step.id, currentStep);
          const Icon = step.icon;
          return (
            <div key={step.id} className="flex items-center">
              {i > 0 && (
                <div
                  className={`mx-2 h-px w-6 transition-colors md:w-10 ${
                    state === "upcoming" ? "bg-border/40" : "bg-emerald-400"
                  }`}
                />
              )}
              <button
                onClick={() => state === "completed" && onStepClick?.(step.id)}
                disabled={state === "upcoming"}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                  state === "completed"
                    ? "cursor-pointer text-emerald-600 hover:bg-emerald-50"
                    : state === "current"
                      ? "progress-pulse text-indigo-600"
                      : "cursor-default text-muted-foreground/40"
                }`}
                title={state === "completed" ? "Klicka för att gå tillbaka" : undefined}
              >
                {state === "completed" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
                <span className="hidden md:inline">{step.label}</span>
                <span className="md:hidden">{step.shortLabel}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Mobile — dots */}
      <div className="flex flex-col items-center gap-1 py-2 sm:hidden">
        <div className="flex items-center gap-2">
          {STEPS.map((step) => {
            const state = getStepState(step.id, currentStep);
            return (
              <div
                key={step.id}
                className={`h-2 w-2 rounded-full transition-all ${
                  state === "completed"
                    ? "bg-emerald-400"
                    : state === "current"
                      ? "progress-pulse h-2.5 w-2.5 bg-indigo-500"
                      : "bg-border/40"
                }`}
              />
            );
          })}
        </div>
        <span className="text-[10px] font-medium text-indigo-600">
          {STEPS[getStepIndex(currentStep)]?.label}
        </span>
      </div>
    </div>
  );
}
