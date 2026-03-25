"use client";

import { Check, Search, UserCircle, PenTool, Eye, Rocket, Radio } from "lucide-react";

export type FlowStep = "analys" | "profil" | "skapa" | "granska" | "publicera" | "live";

type StepConfig = {
  id: FlowStep;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const STEPS: StepConfig[] = [
  { id: "analys", label: "Analys", icon: Search },
  { id: "profil", label: "Profil", icon: UserCircle },
  { id: "skapa", label: "Skapa", icon: PenTool },
  { id: "granska", label: "Granska", icon: Eye },
  { id: "publicera", label: "Publicera", icon: Rocket },
  { id: "live", label: "Live", icon: Radio },
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
}: {
  currentStep: FlowStep;
}) {
  return (
    <div className="border-b border-border/30 bg-background/90 backdrop-blur-md">
      {/* Desktop */}
      <div className="mx-auto hidden items-center justify-center gap-1 px-6 py-1 sm:flex">
        {STEPS.map((step, i) => {
          const state = getStepState(step.id, currentStep);
          const Icon = step.icon;
          return (
            <div key={step.id} className="flex items-center">
              {i > 0 && (
                <div
                  className={`mx-1.5 h-px w-8 transition-colors duration-500 ${
                    state === "upcoming" ? "bg-border/30" : "bg-emerald-400/60"
                  }`}
                />
              )}
              <div
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-all duration-300 ${
                  state === "completed"
                    ? "text-emerald-600"
                    : state === "current"
                      ? "text-indigo-600"
                      : "text-muted-foreground/30"
                }`}
              >
                {state === "completed" ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Icon
                    className={`h-3 w-3 ${state === "current" ? "animate-pulse" : ""}`}
                  />
                )}
                <span>{step.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile — compact */}
      <div className="flex flex-col items-center gap-1 py-2 sm:hidden">
        <div className="flex items-center gap-1.5">
          {STEPS.map((step) => {
            const state = getStepState(step.id, currentStep);
            return (
              <div
                key={step.id}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  state === "completed"
                    ? "w-4 bg-emerald-400"
                    : state === "current"
                      ? "w-6 bg-indigo-500"
                      : "w-1.5 bg-border/30"
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
