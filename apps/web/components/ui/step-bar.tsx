"use client";

import { Check } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * StepBar — 6-step wizard indicator.
 * Matches spec: 32px circles, 40px connecting lines,
 * completed (green + check), current (dark), upcoming (gray).
 */

type StepState = "completed" | "current" | "upcoming";

type Step = {
  label: string;
  state: StepState;
};

type StepBarProps = {
  steps: Step[];
  /** Allow clicking completed steps to jump back */
  onStepClick?: (index: number) => void;
  className?: string;
};

function StepBar({ steps, onStepClick, className }: StepBarProps) {
  return (
    <nav
      aria-label="Steg i processen"
      className={cn("flex items-center justify-center gap-0", className)}
    >
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          {/* Connecting line (before each step except first) */}
          {i > 0 && (
            <div
              className={cn(
                "h-0.5 w-10 transition-colors duration-300",
                step.state === "upcoming" ? "bg-d-border" : "bg-d-success",
              )}
            />
          )}

          {/* Step circle + label */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              disabled={step.state === "upcoming"}
              onClick={() => step.state === "completed" && onStepClick?.(i)}
              aria-current={step.state === "current" ? "step" : undefined}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-200",
                step.state === "completed" &&
                  "bg-d-success text-white cursor-pointer hover:bg-d-success/90",
                step.state === "current" &&
                  "bg-d-text-primary text-white",
                step.state === "upcoming" &&
                  "bg-surface text-d-text-hint cursor-default",
              )}
            >
              {step.state === "completed" ? (
                <Check className="h-4 w-4" strokeWidth={3} />
              ) : (
                i + 1
              )}
            </button>
            <span
              className={cn(
                "text-[11px] font-medium whitespace-nowrap",
                step.state === "current"
                  ? "text-d-text-primary"
                  : "text-d-text-hint",
              )}
            >
              {step.label}
            </span>
          </div>
        </React.Fragment>
      ))}
    </nav>
  );
}

export { type Step, StepBar, type StepState };
