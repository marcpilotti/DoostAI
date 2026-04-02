"use client";

import { useCallback, useEffect } from "react";

import { useWizardStore, WIZARD_STEPS, type WizardStep } from "@/lib/stores/wizard-store";

export function useWizardNavigation() {
  const { step, nextStep, prevStep, goToStep } = useWizardStore();

  const canGoBack = WIZARD_STEPS.indexOf(step) > 0;
  const canGoForward = WIZARD_STEPS.indexOf(step) < WIZARD_STEPS.length - 1;
  const stepIndex = WIZARD_STEPS.indexOf(step);
  const totalSteps = WIZARD_STEPS.length;

  const handleBack = useCallback(() => {
    if (canGoBack) prevStep();
  }, [canGoBack, prevStep]);

  const handleNext = useCallback(() => {
    if (canGoForward) nextStep();
  }, [canGoForward, nextStep]);

  const handleGoTo = useCallback(
    (target: WizardStep) => {
      const targetIdx = WIZARD_STEPS.indexOf(target);
      const currentIdx = WIZARD_STEPS.indexOf(step);
      if (targetIdx <= currentIdx) {
        goToStep(target);
      }
    },
    [step, goToStep]
  );

  // Browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace("#", "") as WizardStep;
      if (WIZARD_STEPS.includes(hash)) {
        goToStep(hash);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [goToStep]);

  // Push hash on step change
  useEffect(() => {
    if (step && typeof window !== "undefined") {
      const currentHash = window.location.hash.replace("#", "");
      if (currentHash !== step) {
        window.history.pushState(null, "", `#${step}`);
      }
    }
  }, [step]);

  return {
    step,
    stepIndex,
    totalSteps,
    canGoBack,
    canGoForward,
    handleBack,
    handleNext,
    handleGoTo,
  };
}
