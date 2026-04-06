"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useMemo, useRef } from "react";

import { useWizardNavigation } from "@/hooks/use-wizard-navigation";
import { slideVariants, transitions } from "@/lib/motion";
import { useWizardStore, WIZARD_STEPS } from "@/lib/stores/wizard-store";

import { AdViewSlide } from "./slides/AdViewSlide";
import { AudienceSlide } from "./slides/AudienceSlide";
import { BrandCardSlide } from "./slides/BrandCardSlide";
import { ConfigureSlide } from "./slides/ConfigureSlide";
import { LoadingSlide } from "./slides/LoadingSlide";
import { PlatformSelectSlide } from "./slides/PlatformSelectSlide";
import { ReviewSlide } from "./slides/ReviewSlide";
import { UrlInputSlide } from "./slides/UrlInputSlide";

const CTA_LABELS: Record<string, string> = {
  url: "",
  brand: "Definiera målgrupp →",
  audience: "Välj plattformar →",
  platforms: "Skapa annonser →",
  ads: "Nästa: konfigurera kampanj →",
  configure: "Granska kampanj →",
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
    case "configure":
      return <ConfigureSlide />;
    case "review":
      return <ReviewSlide />;
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
  const showFooter = !isTransient && !isGeneratingAds && step !== "url";

  // Parallax offset based on step progress (0 to 1)
  const stepIndex = WIZARD_STEPS.indexOf(step as typeof WIZARD_STEPS[number]);
  const progress = stepIndex >= 0 ? stepIndex / (WIZARD_STEPS.length - 1) : 0;

  const orbs = useMemo(
    () => [
      { x: 15, y: 25, size: 280, color: "rgba(99, 102, 241, 0.07)", speed: 1.2 },
      { x: 80, y: 60, size: 200, color: "rgba(168, 85, 247, 0.05)", speed: -0.8 },
      { x: 50, y: 80, size: 320, color: "rgba(99, 102, 241, 0.05)", speed: 0.6 },
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
          className={`absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 ${step === "url" ? "" : "hidden md:flex"}`}
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
              <Link
                href="/sign-in"
                className="text-[13px] font-medium text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-primary-light)]"
              >
                Logga in
              </Link>
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

      {/* Progress bar — fixed position, consistent across all slides */}
      {!isTransient && !isGeneratingAds && (
        <div className="absolute top-0 left-0 right-0 z-20 h-[2px]" style={{ background: "rgba(255,255,255,0.06)" }}>
          <motion.div
            className="h-full"
            style={{ background: "var(--color-primary)" }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
        </div>
      )}

      <main
        id="main"
        className="flex flex-1 items-center justify-center overflow-hidden px-4 pt-16 pb-20 md:p-6 md:pt-6 relative z-10"
      >
        <motion.div
          className="w-full"
          animate={{ maxWidth: step === "ads" ? 1080 : 640 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
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
        </motion.div>
      </main>

      {/* Floating navigation pills */}
      {showFooter && canGoBack && (
        <motion.button
          onClick={handleBack}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          aria-label="Tillbaka"
          className="floating-back absolute bottom-4 left-4 md:bottom-6 md:left-6 z-30"
        >
          ←
        </motion.button>
      )}
      {showFooter && ctaLabel && (
        <motion.button
          ref={ctaRef}
          onClick={() => footerAction?.()}
          disabled={footerDisabled}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="cta-primary absolute bottom-4 right-4 md:bottom-6 md:right-6 z-30"
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={ctaLabel}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              {ctaLabel}
            </motion.span>
          </AnimatePresence>
        </motion.button>
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
