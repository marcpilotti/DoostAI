"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef } from "react";

import { useWizardNavigation } from "@/hooks/use-wizard-navigation";
import { slideVariants, transitions } from "@/lib/motion";
import { useWizardStore } from "@/lib/stores/wizard-store";

import { ProgressBar } from "./ProgressBar";
import { AdViewSlide } from "./slides/AdViewSlide";
import { AudienceSlide } from "./slides/AudienceSlide";
import { BrandCardSlide } from "./slides/BrandCardSlide";
import { BudgetSlide } from "./slides/BudgetSlide";
import { LoadingSlide } from "./slides/LoadingSlide";
import { PlatformSelectSlide } from "./slides/PlatformSelectSlide";
import { ReviewPublishSlide } from "./slides/ReviewPublishSlide";
import { TargetingSlide } from "./slides/TargetingSlide";
import { UrlInputSlide } from "./slides/UrlInputSlide";

const CTA_LABELS: Record<string, string> = {
  url: "",
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
    case "loading":
      return <LoadingSlide />;
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
  const { step, direction, footerAction, footerDisabled } = useWizardStore();
  const { canGoBack, handleBack } = useWizardNavigation();
  const ctaRef = useRef<HTMLButtonElement>(null);

  const isTransient = step === "loading" || step === "done";
  const showProgressBar = !isTransient && step !== "url";
  const ctaLabel = CTA_LABELS[step] || "";
  const showFooter = !isTransient && step !== "url";

  return (
    <div className="wizard-bg wizard-grain flex h-dvh flex-col overflow-hidden">
      {showProgressBar && <ProgressBar />}

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

      {/* Footer — back left, CTA right */}
      {showFooter && (
        <footer
          className="flex h-[72px] flex-shrink-0 items-center justify-between px-6"
          style={{ borderTop: "1px solid var(--color-border-subtle)" }}
        >
          {canGoBack ? (
            <motion.button
              onClick={handleBack}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="ghost-back"
            >
              ← Tillbaka
            </motion.button>
          ) : (
            <div />
          )}

          {ctaLabel && (
            <motion.button
              ref={ctaRef}
              onClick={() => footerAction?.()}
              disabled={footerDisabled}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              animate={{
                boxShadow: [
                  "0 0 12px rgba(99,102,241,0.15)",
                  "0 0 20px rgba(99,102,241,0.3)",
                  "0 0 12px rgba(99,102,241,0.15)",
                ],
              }}
              transition={{
                boxShadow: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
                scale: { type: "spring", damping: 20, stiffness: 300 },
              }}
              className="cta-primary"
            >
              {ctaLabel}
            </motion.button>
          )}
        </footer>
      )}
    </div>
  );
}
