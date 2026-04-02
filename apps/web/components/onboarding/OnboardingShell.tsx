"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import type { AdData, AdFormat } from "@/components/ads/ad-preview/types";
import { BrandCard } from "@/components/cards/brand-card";
import { BudgetCard } from "@/components/cards/budget-card";
import { CampaignCard } from "@/components/cards/campaign-card";
import { ReviewCard } from "@/components/cards/review-card";
import { type Step as StepBarStep,StepBar } from "@/components/ui/step-bar";
import { prewarmAdImages } from "@/lib/image-prewarm";

import { DoneSlide } from "./DoneSlide";
import { EditorSlide } from "./EditorSlide";
import { LoadingSlide } from "./LoadingSlide";
import { URLSlide } from "./URLSlide";

// ── Types ────────────────────────────────────────────────────────

export type Step =
  | "url"            // Step 1: URL input
  | "loading"        // Loading (between 1→2)
  | "brand"          // Step 2: Brand confirm (BrandCard)
  | "campaign"       // Step 3: Campaign setup (CampaignCard)
  | "budget"         // Step 4: Budget (BudgetCard)
  | "preview"        // Step 5: Ad preview (EditorSlide)
  | "review"         // Step 6: Review + publish (ReviewCard)
  | "done"           // Success state
  | null;            // Transition gap

/**
 * BrandProfile — flexible type matching the API response shape.
 */
export type BrandProfile = {
  name: string;
  url: string;
  description?: string;
  industry?: string;
  location?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background?: string;
    text?: string;
    palette?: Array<{ hex: string; role: string; confidence: number }>;
  };
  fonts?: { heading: string; body: string };
  logos?: { primary?: string; icon?: string; dark?: string };
  brandVoice?: string;
  targetAudience?: string | { demographic: string; interests: string[]; geography: string };
  valuePropositions?: string[];
  competitors?: string[];
  employeeCount?: number;
  revenue?: string;
  ceo?: string;
  orgNumber?: string;
  logo?: { url: string; source: string; confidence: number };
  voice?: { tone?: string; addressing?: string; register?: string; language?: string; exampleCopy?: string };
  companyData?: { orgNr: string; officialName: string; employees: string; revenue: string; ceo: string; creditRating: string };
  _intelligence?: {
    overallConfidence: number;
    logo: { source: string; confidence: number; status: string };
    colors: { source: string; confidence: number; status: string };
    font: { source: string; confidence: number; status: string };
    industry: { source: string; confidence: number; status: string };
    socialProfiles?: { platform: string; url: string; confidence: number }[];
    visualStyle?: string;
    audit?: { readinessScore: number; hasMetaPixel: boolean; hasGoogleTag: boolean; hasLinkedinTag: boolean; techStack: string[]; issues: { severity: string; title: string; description: string }[] } | null;
  } | null;
  _enrichmentStatus?: string;
  _intelligenceStatus?: string;
  _logoTheme?: string;
  _colorHarmony?: unknown;
  confidence?: { overall: number; perField: Record<string, number> };
  analyzedAt?: string;
  [key: string]: unknown;
};

// ── Step definitions for StepBar ─────────────────────────────────

const STEP_ORDER = ["url", "brand", "campaign", "budget", "preview", "review"] as const;
const STEP_LABELS: Record<string, string> = {
  url: "URL",
  brand: "Varumärke",
  campaign: "Kampanj",
  budget: "Budget",
  preview: "Annons",
  review: "Publicera",
};

function getStepBarSteps(currentStep: Step): StepBarStep[] {
  const currentIdx = currentStep ? STEP_ORDER.indexOf(currentStep as typeof STEP_ORDER[number]) : -1;
  return STEP_ORDER.map((s, i) => ({
    label: STEP_LABELS[s] ?? s,
    state: i < currentIdx ? "completed" as const : i === currentIdx ? "current" as const : "upcoming" as const,
  }));
}

// ── Animation variants (spec: exit left, enter right, 250ms) ────

const slideVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
};

// ── Transition message ──────────────────────────────────────────

function TransitionMessage({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex h-full items-center justify-center"
    >
      <p className="text-center text-sm text-[#64748b]">{text}</p>
    </motion.div>
  );
}

// ── Session persistence ─────────────────────────────────────────

const SESSION_KEY = "doost:onboarding";
const SESSION_MAX_AGE = 2 * 60 * 60 * 1000;

type SavedSession = { step: Step; url: string; brand: BrandProfile | null; savedAt: number };

function loadSession(): SavedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SavedSession;
    if (Date.now() - data.savedAt > SESSION_MAX_AGE) { localStorage.removeItem(SESSION_KEY); return null; }
    const restorable: Step[] = ["brand", "campaign", "budget", "preview", "review"];
    if (restorable.includes(data.step)) return data;
    return null;
  } catch { return null; }
}

function saveSession(step: Step, url: string, brand: BrandProfile | null) {
  if (typeof window === "undefined") return;
  if (!step || step === "loading" || step === "done") return;
  try { localStorage.setItem(SESSION_KEY, JSON.stringify({ step, url, brand, savedAt: Date.now() } satisfies SavedSession)); }
  catch { /* quota exceeded */ }
}

function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

// ── Shell ────────────────────────────────────────────────────────

export function OnboardingShell() {
  const [saved] = useState(() => loadSession());
  const [step, setStep] = useState<Step>(saved?.step ?? "url");
  const [transitionMessage, setTransitionMessage] = useState<string | null>(null);
  const prefersReduced = useReducedMotion();
  const [announcement, setAnnouncement] = useState("");

  // ── Shared state ──────────────────────────────────────────
  const urlRef = useRef<string>(saved?.url ?? "");
  const brandRef = useRef<BrandProfile | null>(saved?.brand ?? null);
  const campaignRef = useRef<{ objective: string; campaignName: string; platforms: string[] } | null>(null);
  const budgetRef = useRef<{ dailyBudget: number } | null>(null);
  const selectedAdRef = useRef<{ adData: AdData; format: AdFormat; goal: string } | null>(null);

  // Persist + history
  useEffect(() => { saveSession(step, urlRef.current, brandRef.current); }, [step]);
  useEffect(() => { if (step) window.history.pushState({ step }, "", ""); }, [step]);
  useEffect(() => {
    function handlePopState(e: PopStateEvent) {
      const prev = (e.state as { step?: Step } | null)?.step;
      setStep(prev ?? "url");
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  useEffect(() => { if (step) setAnnouncement(STEP_LABELS[step] ?? ""); }, [step]);

  const transitionWithMessage = useCallback(async (msg: string, next: Step) => {
    setStep(null); await sleep(200); setTransitionMessage(msg); await sleep(800); setTransitionMessage(null); setStep(next);
  }, []);

  function trackStep(name: string, props?: Record<string, unknown>) {
    try {
      const ph = typeof window !== "undefined" ? (window as unknown as Record<string, unknown>).posthog as { capture?: (name: string, props?: Record<string, unknown>) => void } | undefined : undefined;
      ph?.capture?.(`onboarding_${name}`, props);
    } catch { /* non-critical */ }
  }

  // ── Step 1: URL → Loading ─────────────────────────────────
  const handleURLSubmit = useCallback((url: string) => {
    urlRef.current = url;
    trackStep("url_submitted", { url });
    setStep("loading");
  }, []);

  // ── Loading → Step 2: Brand ───────────────────────────────
  const handleAnalysisComplete = useCallback((profile: BrandProfile) => {
    brandRef.current = profile;
    trackStep("analysis_complete", { brand: profile.name });
    if (profile.colors?.primary) {
      prewarmAdImages({ name: profile.name, industry: profile.industry, primaryColor: profile.colors.primary });
    }
    setStep("brand");
  }, []);

  // ── Step 2: Brand → Step 3: Campaign ──────────────────────
  const handleBrandConfirm = useCallback((updated: BrandProfile) => {
    brandRef.current = updated;
    trackStep("brand_confirmed", { brand: updated.name });
    setStep("campaign");
  }, []);

  // ── Step 3: Campaign → Step 4: Budget ─────────────────────
  const handleCampaignConfirm = useCallback((data: { objective: string; campaignName: string; platforms: string[] }) => {
    campaignRef.current = data;
    trackStep("campaign_confirmed", { objective: data.objective });
    setStep("budget");
  }, []);

  // ── Step 4: Budget → Step 5: Preview ──────────────────────
  const handleBudgetConfirm = useCallback((data: { dailyBudget: number }) => {
    budgetRef.current = data;
    trackStep("budget_confirmed", { budget: data.dailyBudget });
    transitionWithMessage("Skapar din annons...", "preview");
  }, [transitionWithMessage]);

  // ── Step 5: Preview → Step 6: Review ──────────────────────
  const handlePreviewConfirm = useCallback((data: { adData: AdData; format: AdFormat; goal: string }) => {
    selectedAdRef.current = data;
    trackStep("preview_confirmed", { format: data.format });
    setStep("review");
  }, []);

  // ── Step 6: Review → Publish → Done ───────────────────────
  const handlePublish = useCallback(async () => {
    trackStep("publish_clicked");
    const ad = selectedAdRef.current;
    const budget = budgetRef.current;
    try {
      await fetch("/api/campaigns/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: brandRef.current?.name ?? "",
          brandUrl: brandRef.current?.url ?? "",
          brandColors: brandRef.current?.colors ? { primary: brandRef.current.colors.primary, secondary: brandRef.current.colors.secondary, accent: brandRef.current.colors.accent } : undefined,
          headline: ad?.adData.headline ?? "",
          bodyText: ad?.adData.primaryText ?? "",
          cta: ad?.adData.cta ?? "",
          imageUrl: ad?.adData.imageUrl ?? undefined,
          platform: ad?.format ?? "meta-feed",
          dailyBudget: budget?.dailyBudget ?? 150,
          duration: 30,
          regions: ["SE"],
          channel: campaignRef.current?.platforms[0] ?? "meta",
        }),
      });
    } catch { /* non-blocking */ }
    transitionWithMessage("Publicerar din kampanj...", "done");
  }, [transitionWithMessage]);

  // ── Navigation: jump to step ──────────────────────────────
  const jumpToStep = useCallback((stepIndex: number) => {
    const target = STEP_ORDER[stepIndex];
    if (target) setStep(target);
  }, []);

  // ── Back handlers ─────────────────────────────────────────
  const handleLoadingError = useCallback(() => setStep("url"), []);
  const handleDashboard = useCallback(() => { trackStep("done"); clearSession(); if (typeof window !== "undefined") window.location.href = "/dashboard"; }, []);
  const handleRestart = useCallback(() => { clearSession(); urlRef.current = ""; brandRef.current = null; selectedAdRef.current = null; campaignRef.current = null; budgetRef.current = null; setStep("url"); }, []);

  // ── Determine if StepBar should show ──────────────────────
  const showStepBar = step && step !== "url" && step !== "loading" && step !== "done" && step !== null;

  return (
    <div id="main" className="h-[100dvh] overflow-y-auto bg-[#fafafa] pb-[env(safe-area-inset-bottom)]">
      <div aria-live="assertive" className="sr-only">{announcement}</div>

      {/* ── Header — compact ─────────────────────────────────── */}
      <div className="sticky top-0 z-50 flex items-center justify-between bg-[#fafafa]/95 px-5 py-2.5 backdrop-blur-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Doost AI" className="h-5" />
        <Link
          href="/sign-in"
          className="rounded-md bg-white px-3 py-1 text-xs font-medium text-[#0f172a] border border-[#e2e8f0] hover:bg-[#f8fafc]"
        >
          Logga in
        </Link>
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      <div className={`mx-auto w-full px-4 py-4 sm:px-6 ${step === "url" || step === "loading" || step === "done" ? "max-w-2xl" : "max-w-md"}`}>
        <AnimatePresence mode="wait">
          {transitionMessage && (
            <TransitionMessage key="transition" text={transitionMessage} />
          )}

          {/* Step 1: URL input */}
          {step === "url" && (
            <motion.div key="url" variants={prefersReduced ? undefined : slideVariants} initial="enter" animate="center" exit="exit" className="flex min-h-[70vh] items-center justify-center">
              <URLSlide onSubmit={handleURLSubmit} />
            </motion.div>
          )}

          {/* Loading */}
          {step === "loading" && (
            <motion.div key="loading" variants={prefersReduced ? undefined : slideVariants} initial="enter" animate="center" exit="exit" className="flex min-h-[70vh] items-center justify-center">
              <LoadingSlide url={urlRef.current} onComplete={handleAnalysisComplete} onError={handleLoadingError} />
            </motion.div>
          )}

          {/* Step 2: Brand confirm */}
          {step === "brand" && brandRef.current && (
            <motion.div key="brand" variants={prefersReduced ? undefined : slideVariants} initial="enter" animate="center" exit="exit">
              <BrandCard
                profile={brandRef.current}
                onConfirm={handleBrandConfirm}
                onBack={() => setStep("url")}
              />
            </motion.div>
          )}

          {/* Step 3: Campaign setup */}
          {step === "campaign" && (
            <motion.div key="campaign" variants={prefersReduced ? undefined : slideVariants} initial="enter" animate="center" exit="exit">
              <CampaignCard
                brandName={brandRef.current?.name ?? ""}
                aiRecommendedObjective="sales"
                onConfirm={handleCampaignConfirm}
                onBack={() => setStep("brand")}
              />
            </motion.div>
          )}

          {/* Step 4: Budget */}
          {step === "budget" && (
            <motion.div key="budget" variants={prefersReduced ? undefined : slideVariants} initial="enter" animate="center" exit="exit">
              <BudgetCard
                onConfirm={handleBudgetConfirm}
                onBack={() => setStep("campaign")}
              />
            </motion.div>
          )}

          {/* Step 5: Ad preview */}
          {step === "preview" && brandRef.current && (
            <motion.div key="preview" variants={prefersReduced ? undefined : slideVariants} initial="enter" animate="center" exit="exit">
              <EditorSlide
                profile={brandRef.current}
                onBack={() => setStep("budget")}
                onPublish={handlePreviewConfirm}
              />
            </motion.div>
          )}

          {/* Step 6: Review + publish */}
          {step === "review" && (
            <motion.div key="review" variants={prefersReduced ? undefined : slideVariants} initial="enter" animate="center" exit="exit">
              <ReviewCard
                data={{
                  brandName: brandRef.current?.name ?? "",
                  brandUrl: (brandRef.current?.url ?? "").replace(/^https?:\/\//, "").replace(/\/$/, ""),
                  objective: { awareness: "Synlighet", traffic: "Webbplatsbesök", sales: "Försäljning", leads: "Leads" }[campaignRef.current?.objective ?? "sales"] ?? campaignRef.current?.objective ?? "Försäljning",
                  platforms: campaignRef.current?.platforms ?? ["Meta"],
                  dailyBudget: budgetRef.current?.dailyBudget ?? 150,
                  variantLabel: "Variant A",
                  variantScore: 84,
                }}
                onPublish={handlePublish}
                onEdit={jumpToStep}
                onBack={() => setStep("preview")}
              />
            </motion.div>
          )}

          {/* Done */}
          {step === "done" && (
            <motion.div key="done" variants={prefersReduced ? undefined : slideVariants} initial="enter" animate="center" exit="exit">
              <DoneSlide
                brandName={brandRef.current?.name}
                onDashboard={handleDashboard}
                onRestart={handleRestart}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step indicator — below the card */}
        {showStepBar && (
          <div className="mt-6 pb-4">
            <StepBar
              steps={getStepBarSteps(step)}
              onStepClick={jumpToStep}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
