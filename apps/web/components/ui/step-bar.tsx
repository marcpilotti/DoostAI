"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type StepState = "completed" | "current" | "upcoming";

type Step = {
  label: string;
  state: StepState;
};

type StepBarProps = {
  steps: Step[];
  onStepClick?: (index: number) => void;
  className?: string;
};

function StepBar({ steps, onStepClick, className }: StepBarProps) {
  const currentIndex = steps.findIndex((s) => s.state === "current");
  const totalSteps = steps.length;

  return (
    <nav
      aria-label="Steg i processen"
      className={cn("flex flex-col items-center gap-2", className)}
    >
      {/* Dots row */}
      <div className="flex items-center gap-2">
        {steps.map((step, i) => {
          const isDone = step.state === "completed" || step.state === "current";
          return (
            <button
              key={i}
              type="button"
              disabled={step.state === "upcoming"}
              onClick={() => step.state === "completed" && onStepClick?.(i)}
              aria-current={step.state === "current" ? "step" : undefined}
              aria-label={step.label}
              className={cn(
                "rounded-full transition-all duration-300",
                isDone ? "h-2 w-2 bg-[#111111]" : "h-1.5 w-1.5 bg-[#DDDDDD]",
                step.state === "completed" && "cursor-pointer hover:bg-[#333333]",
                step.state === "upcoming" && "cursor-default",
              )}
            />
          );
        })}
      </div>

      {/* Step X av N */}
      {currentIndex >= 0 && (
        <p className="text-xs text-[#999999]">
          Steg {currentIndex + 1} av {totalSteps}
        </p>
      )}
    </nav>
  );
}

export { type Step, StepBar, type StepState };
