"use client";

import { useState, useCallback, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { URLSlide } from "./URLSlide";
import { LoadingSlide } from "./LoadingSlide";
import { BrandSlide } from "./BrandSlide";
import { EditorSlide } from "./EditorSlide";
import { PublishSlide } from "./PublishSlide";
import { DoneSlide } from "./DoneSlide";

import type { AdData, AdFormat } from "@/components/ads/ad-preview/types";

// ── Types ────────────────────────────────────────────────────────

export type Step =
  | "url"
  | "loading"
  | "brand"
  | "editor"
  | "publish"
  | "done"
  | null; // null = transition gap between slides

/**
 * BrandProfile — flexible type matching the API response shape.
 * The SSE endpoint returns flat colors/fonts (from @doost/brand),
 * enriched with intelligence metadata.
 */
export type BrandProfile = {
  name: string;
  url: string;
  description?: string;
  industry?: string;
  location?: string;
  // Flat color object from AI analysis
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background?: string;
    text?: string;
    // Also accept SPEC palette format
    palette?: Array<{ hex: string; role: string; confidence: number }>;
  };
  fonts?: { heading: string; body: string };
  logos?: { primary?: string; icon?: string; dark?: string };
  // Flat brand profile fields
  brandVoice?: string;
  targetAudience?: string | { demographic: string; interests: string[]; geography: string };
  valuePropositions?: string[];
  competitors?: string[];
  employeeCount?: number;
  revenue?: string;
  ceo?: string;
  orgNumber?: string;
  // SPEC structured fields (optional, used in BrandSlide)
  logo?: { url: string; source: string; confidence: number };
  voice?: {
    tone?: string;
    addressing?: string;
    register?: string;
    language?: string;
    exampleCopy?: string;
  };
  companyData?: {
    orgNr: string;
    officialName: string;
    employees: string;
    revenue: string;
    ceo: string;
    creditRating: string;
  };
  // Intelligence metadata
  _intelligence?: {
    overallConfidence: number;
    logo: { source: string; confidence: number; status: string };
    colors: { source: string; confidence: number; status: string };
    font: { source: string; confidence: number; status: string };
    industry: { source: string; confidence: number; status: string };
    socialProfiles?: { platform: string; url: string; confidence: number }[];
    visualStyle?: string;
    audit?: {
      readinessScore: number;
      hasMetaPixel: boolean;
      hasGoogleTag: boolean;
      hasLinkedinTag: boolean;
      techStack: string[];
      issues: { severity: string; title: string; description: string }[];
    } | null;
  } | null;
  _enrichmentStatus?: string;
  _intelligenceStatus?: string;
  _logoTheme?: string;
  _colorHarmony?: unknown;
  confidence?: { overall: number; perField: Record<string, number> };
  analyzedAt?: string;
  [key: string]: unknown;
};

// ── Slide animation variants ─────────────────────────────────────

const slideVariants = {
  enter: {
    opacity: 0,
    y: 30,
    scale: 0.98,
  },
  center: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
  },
  exit: {
    opacity: 0,
    y: -15,
    scale: 0.99,
    transition: { duration: 0.25 },
  },
} satisfies import("framer-motion").Variants;

// ── Transition message (between slides) ──────────────────────────

function TransitionMessage({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex h-screen items-center justify-center"
    >
      <p className="text-center text-sm text-muted-foreground">{text}</p>
    </motion.div>
  );
}

// ── Shell ────────────────────────────────────────────────────────

export function OnboardingShell() {
  const [step, setStep] = useState<Step>("url");
  const [transitionMessage, setTransitionMessage] = useState<string | null>(
    null,
  );
  const prefersReduced = useReducedMotion();

  // ── Shared state between slides ─────────────────────────────

  const urlRef = useRef<string>("");
  const brandRef = useRef<BrandProfile | null>(null);
  const selectedAdRef = useRef<{
    adData: AdData;
    format: AdFormat;
    goal: string;
  } | null>(null);

  // ── Transition helper ───────────────────────────────────────

  const transitionWithMessage = useCallback(
    async (message: string, nextStep: Step) => {
      setStep(null);
      await sleep(200);
      setTransitionMessage(message);
      await sleep(800);
      setTransitionMessage(null);
      setStep(nextStep);
    },
    [],
  );

  // ── Slide 1 → 2: URL submitted ─────────────────────────────

  const handleURLSubmit = useCallback((url: string) => {
    urlRef.current = url;
    setStep("loading");
  }, []);

  // ── Slide 2 → 3: Analysis complete ─────────────────────────

  const handleAnalysisComplete = useCallback(
    (profile: BrandProfile) => {
      brandRef.current = profile;
      setStep("brand");
    },
    [],
  );

  // ── Slide 3 → 4: Brand confirmed ───────────────────────────

  const handleBrandConfirm = useCallback(
    (approved: BrandProfile) => {
      brandRef.current = approved;
      transitionWithMessage("Bra! Nu bygger vi er annons", "editor");
    },
    [transitionWithMessage],
  );

  // ── Slide 4 → 5: Editor → Publish ──────────────────────────

  const handleEditorPublish = useCallback(
    (data: { adData: AdData; format: AdFormat; goal: string }) => {
      selectedAdRef.current = data;
      transitionWithMessage("Redo att publicera!", "publish");
    },
    [transitionWithMessage],
  );

  const handleEditorBack = useCallback(() => {
    setStep("brand");
  }, []);

  // ── Slide 5 → 6: Publish confirmed ─────────────────────────

  const handlePublishConfirm = useCallback(
    (config: { dailyBudget: number; duration: number; regions: string[]; channel: string }) => {
      // TODO: Call /api/publish endpoint to deploy campaign
      console.log("[OnboardingShell] Publishing campaign:", config);
      transitionWithMessage("Publicerar din kampanj...", "done");
    },
    [transitionWithMessage],
  );

  const handlePublishBack = useCallback(() => {
    setStep("editor");
  }, []);

  // ── Slide 6: Done → Dashboard ───────────────────────────────

  const handleDashboard = useCallback(() => {
    // Navigate to dashboard
    if (typeof window !== "undefined") {
      window.location.href = "/campaigns";
    }
  }, []);

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="h-screen overflow-hidden bg-background">
      <AnimatePresence mode="wait">
        {transitionMessage && (
          <TransitionMessage
            key="transition"
            text={transitionMessage}
          />
        )}

        {step === "url" && (
          <motion.div
            key="url"
            variants={prefersReduced ? undefined : slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="h-screen"
          >
            <URLSlide onSubmit={handleURLSubmit} />
          </motion.div>
        )}

        {step === "loading" && (
          <motion.div
            key="loading"
            variants={prefersReduced ? undefined : slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="h-screen"
          >
            <LoadingSlide
              url={urlRef.current}
              onComplete={handleAnalysisComplete}
            />
          </motion.div>
        )}

        {step === "brand" && brandRef.current && (
          <motion.div
            key="brand"
            variants={prefersReduced ? undefined : slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="h-screen"
          >
            <BrandSlide
              profile={brandRef.current}
              onConfirm={handleBrandConfirm}
            />
          </motion.div>
        )}

        {step === "editor" && brandRef.current && (
          <motion.div
            key="editor"
            variants={prefersReduced ? undefined : slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="h-screen"
          >
            <EditorSlide
              profile={brandRef.current}
              onBack={handleEditorBack}
              onPublish={handleEditorPublish}
            />
          </motion.div>
        )}

        {step === "publish" && selectedAdRef.current && (
          <motion.div
            key="publish"
            variants={prefersReduced ? undefined : slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="h-screen"
          >
            <PublishSlide
              adData={selectedAdRef.current.adData}
              format={selectedAdRef.current.format}
              goal={selectedAdRef.current.goal}
              brandName={brandRef.current?.name ?? ""}
              brandLocation={
                typeof brandRef.current?.location === "string"
                  ? brandRef.current.location
                  : undefined
              }
              onBack={handlePublishBack}
              onPublish={handlePublishConfirm}
            />
          </motion.div>
        )}

        {step === "done" && (
          <motion.div
            key="done"
            variants={prefersReduced ? undefined : slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="h-screen"
          >
            <DoneSlide
              brandName={brandRef.current?.name}
              onDashboard={handleDashboard}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
