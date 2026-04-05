"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useRef } from "react";

import { useWizardNavigation } from "@/hooks/use-wizard-navigation";
import { slideVariants, transitions } from "@/lib/motion";
import { useWizardStore, WIZARD_STEPS } from "@/lib/stores/wizard-store";

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
  brand: "Välj plattformar →",
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

  const { isGeneratingAds } = useWizardStore();
  const isTransient = step === "loading" || step === "done";
  const isLoading = isTransient || isGeneratingAds;
  const ctaLabel = CTA_LABELS[step] || "";
  const showFooter = !isTransient && step !== "url";

  // Parallax offset based on step progress (0 to 1)
  const stepIndex = WIZARD_STEPS.indexOf(step as typeof WIZARD_STEPS[number]);
  const progress = stepIndex >= 0 ? stepIndex / (WIZARD_STEPS.length - 1) : 0;

  const orbs = useMemo(
    () => [
      { x: 15, y: 25, size: 280, color: "rgba(99, 102, 241, 0.04)", speed: 1.2 },
      { x: 80, y: 60, size: 200, color: "rgba(168, 85, 247, 0.03)", speed: -0.8 },
      { x: 50, y: 80, size: 320, color: "rgba(99, 102, 241, 0.025)", speed: 0.6 },
    ],
    []
  );

  return (
    <div className="wizard-bg wizard-grain flex h-dvh flex-col overflow-hidden relative">
      {/* Navbar — logo left, nav items right on landing */}
      {!isLoading && (
        <motion.header
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Doost AI" className="h-7" />
          {step === "url" && (
            <nav className="hidden sm:flex items-center gap-6">
              <a
                href="#"
                className="text-[13px] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
              >
                Så funkar det
              </a>
              <a
                href="#"
                className="text-[13px] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
              >
                Priser
              </a>
              <a
                href="/sign-in"
                className="text-[13px] font-medium text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-primary-light)]"
              >
                Logga in
              </a>
            </nav>
          )}
        </motion.header>
      )}

      {/* Parallax background orbs */}
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            x: progress * orb.speed * 60,
            y: progress * orb.speed * -40,
          }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      ))}

      <main
        id="main"
        className="flex flex-1 items-center justify-center overflow-hidden p-6 relative z-10"
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
          className="flex h-[72px] flex-shrink-0 items-center justify-center px-6"
          style={{ borderTop: "1px solid var(--color-border-subtle)" }}
        >
          <div className="flex w-full items-center justify-between" style={{ maxWidth: 640 }}>
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
              transition={{
                scale: { type: "spring", damping: 20, stiffness: 300 },
              }}
              className="cta-primary"
            >
              {ctaLabel}
            </motion.button>
          )}
          </div>
        </footer>
      )}

      {/* Landing footer — minimal legal line */}
      {step === "url" && (
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.4 }}
          className="flex-shrink-0 py-4 px-6 text-center"
        >
          <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
            © 2026 Doost AI ·{" "}
            <a href="#" className="transition-colors hover:text-[var(--color-text-secondary)]">
              Integritetspolicy
            </a>{" "}
            ·{" "}
            <a href="#" className="transition-colors hover:text-[var(--color-text-secondary)]">
              Kontakt
            </a>
          </p>
        </motion.footer>
      )}
    </div>
  );
}
