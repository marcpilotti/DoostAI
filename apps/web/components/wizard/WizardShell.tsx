"use client";

import { AnimatePresence, motion } from "motion/react";

import { useWizardNavigation } from "@/hooks/use-wizard-navigation";
import { slideVariants, transitions } from "@/lib/motion";
import { useWizardStore } from "@/lib/stores/wizard-store";

import { ProgressBar } from "./ProgressBar";
import { AdViewSlide } from "./slides/AdViewSlide";
import { AudienceSlide } from "./slides/AudienceSlide";
import { BrandCardSlide } from "./slides/BrandCardSlide";
import { BudgetSlide } from "./slides/BudgetSlide";
import { PlatformSelectSlide } from "./slides/PlatformSelectSlide";
import { ReviewPublishSlide } from "./slides/ReviewPublishSlide";
import { TargetingSlide } from "./slides/TargetingSlide";
import { UrlInputSlide } from "./slides/UrlInputSlide";

const CTA_LABELS: Record<string, string> = {
  url: "Analysera →",
  brand: "Fortsätt →",
  audience: "Fortsätt →",
  platforms: "Skapa annonser →",
  ads: "Ställ in budget →",
  budget: "Fortsätt →",
  targeting: "Granska kampanj →",
  review: "",
};

function SlideContent({ step }: { step: string }) {
  switch (step) {
    case "url":
      return <UrlInputSlide />;
    case "brand":
      return <BrandCardSlide />;
    case "audience":
      return <AudienceSlide />;
    case "platforms":
      return <PlatformSelectSlide />;
    case "ads":
      return <AdViewSlide />;
    case "budget":
      return <BudgetSlide />;
    case "targeting":
      return <TargetingSlide />;
    case "review":
      return <ReviewPublishSlide />;
    default:
      return null;
  }
}

export function WizardShell() {
  const { step, direction } = useWizardStore();
  const { canGoBack, handleBack, stepIndex } = useWizardNavigation();

  // Hide shell chrome for loading/done states
  const isTransient = step === "loading" || step === "done";
  const ctaLabel = CTA_LABELS[step] || "";

  return (
    <div className="wizard-bg wizard-grain flex h-dvh flex-col overflow-hidden">
      {/* Header */}
      {!isTransient && <ProgressBar />}

      {/* Content area */}
      <main
        id="main"
        className="flex flex-1 items-center justify-center overflow-hidden p-6"
      >
        <div className="w-full" style={{ maxWidth: 640 }}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transitions.step}
            >
              <SlideContent step={step} />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      {!isTransient && stepIndex > 0 && (
        <footer
          className="flex h-[72px] flex-shrink-0 items-center justify-between px-6"
          style={{ borderTop: "1px solid var(--color-border-subtle)" }}
        >
          {/* Back button */}
          {canGoBack ? (
            <button
              onClick={handleBack}
              className="text-text-body-sm font-medium transition-colors"
              style={{
                color: "var(--color-text-secondary)",
                background: "transparent",
                padding: "10px 20px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border-default)",
              }}
            >
              ← Tillbaka
            </button>
          ) : (
            <div />
          )}

          {/* CTA — each slide handles its own submit via the store.
              For slides that need a footer CTA, it's rendered here as a visual anchor.
              The actual click handler is inside each slide. */}
          {ctaLabel && (
            <div id="wizard-footer-cta-portal" />
          )}
        </footer>
      )}
    </div>
  );
}
