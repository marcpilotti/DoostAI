"use client";

import { AnimatePresence,motion } from "motion/react";
import { useState } from "react";

import { useWizardNavigation } from "@/hooks/use-wizard-navigation";
import {
  STEP_LABELS,
  WIZARD_STEPS,
} from "@/lib/stores/wizard-store";

export function ProgressBar() {
  const { stepIndex, totalSteps, handleGoTo, step } = useWizardNavigation();
  const [showTooltip, setShowTooltip] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const progress = ((stepIndex + 1) / totalSteps) * 100;

  // "Sparat" indicator — expose via ref or event
  const triggerSaved = () => {
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  // Expose triggerSaved globally for slides to call
  if (typeof window !== "undefined") {
    (window as unknown as Record<string, unknown>).__wizardTriggerSaved = triggerSaved;
  }

  return (
    <header
      className="flex h-14 flex-shrink-0 items-center gap-4 border-b px-6"
      style={{ borderColor: "var(--color-border-subtle)" }}
    >
      {/* Logo — left */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="Doost AI" className="h-7" />

      {/* Spacer pushes progress bar to the right */}
      <div className="flex-1" />

      {/* Progress bar — right aligned */}
      <div
        className="relative"
        style={{ width: 200 }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div
          className="h-1.5 overflow-hidden"
          style={{
            borderRadius: "var(--radius-full)",
            background: "var(--color-bg-raised)",
          }}
          role="progressbar"
          aria-valuenow={stepIndex + 1}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
        >
          <motion.div
            className="ai-breathe h-full"
            style={{
              borderRadius: "var(--radius-full)",
              background: "linear-gradient(90deg, var(--color-primary), var(--color-primary-light))",
            }}
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
          />
        </div>

        {/* Step tooltip on hover */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute left-0 top-full z-[60] mt-2 min-w-[180px] p-3"
              style={{
                borderRadius: "var(--radius-md)",
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border-default)",
                boxShadow: "var(--shadow-lg)",
              }}
            >
              {WIZARD_STEPS.map((s, i) => {
                const isCompleted = i < stepIndex;
                const isCurrent = s === step;
                return (
                  <button
                    key={s}
                    onClick={() => isCompleted && handleGoTo(s)}
                    disabled={!isCompleted}
                    className="flex w-full items-center gap-2 py-1 text-left text-[13px] disabled:cursor-default"
                    style={{
                      color: isCurrent
                        ? "var(--color-text-primary)"
                        : isCompleted
                          ? "var(--color-text-secondary)"
                          : "var(--color-text-muted)",
                    }}
                  >
                    <span className="w-4 text-center">
                      {isCompleted ? "✓" : isCurrent ? "●" : "○"}
                    </span>
                    <span>{STEP_LABELS[s]}</span>
                    {isCurrent && (
                      <span
                        className="ml-auto text-[11px]"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        ← du är här
                      </span>
                    )}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Step counter */}
      <span
        className="text-text-caption whitespace-nowrap"
        style={{ color: "var(--color-text-muted)" }}
      >
        Steg {stepIndex + 1} av {totalSteps}
      </span>

      {/* Saved indicator */}
      <AnimatePresence>
        {showSaved && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-text-caption whitespace-nowrap"
            style={{ color: "var(--color-success)" }}
          >
            ✓ Sparat
          </motion.span>
        )}
      </AnimatePresence>
    </header>
  );
}
