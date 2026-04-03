"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WizardStep =
  | "url"
  | "loading"
  | "brand"
  | "audience"
  | "platforms"
  | "ads"
  | "budget"
  | "targeting"
  | "review"
  | "done";

export const WIZARD_STEPS: WizardStep[] = [
  "url",
  "brand",
  "audience",
  "platforms",
  "ads",
  "budget",
  "targeting",
  "review",
];

export const STEP_LABELS: Record<WizardStep, string> = {
  url: "Webbplats",
  loading: "Analyserar",
  brand: "Varumärke",
  audience: "Målgrupp",
  platforms: "Plattformar",
  ads: "Annonser",
  budget: "Budget",
  targeting: "Targeting",
  review: "Publicera",
  done: "Klart",
};

export type BrandColor = {
  hex: string;
  name: string;
};

export type BrandProfile = {
  name: string;
  description: string;
  industry: string;
  subIndustry?: string;
  targetAudience: string;
  valuePropositions: string[];
  logoUrl?: string;
  iconUrl?: string;
  url: string;
  colors: {
    primary: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
  };
  fonts?: {
    heading: string;
    body: string;
  };
  products: string[];
  prices: string[];
  offers: string[];
  detectedLocation?: string;
  recommendedPlatforms?: string[];
  socialProfiles?: Record<string, string>;
};

export type AudienceData = {
  interests: string[];
  challenges: string[];
  usps: string[];
};

export type Platform = "meta" | "google" | "linkedin" | "tiktok" | "snapchat";

export type AdCreative = {
  id: string;
  platform: Platform;
  template: "hero" | "brand";
  headline: string;
  bodyCopy: string;
  cta: string;
  imageUrl?: string;
  renderedUrl?: string;
  selected: boolean;
};

export type BudgetConfig = {
  landingUrl: string;
  totalBudget: number;
  currency: string;
  durationDays: number;
  startDate: string;
};

export type TargetingConfig = {
  locations: string[];
  ageMin: number;
  ageMax: number;
  gender: "all" | "male" | "female";
  linkedinCompanySize?: string[];
  linkedinRoles?: string[];
};

export type ProjectionData = {
  reachMin: number;
  reachMax: number;
  clicksMin: number;
  clicksMax: number;
  ctrMin: number;
  ctrMax: number;
};

type WizardState = {
  step: WizardStep;
  direction: 1 | -1;
  url: string;
  brand: BrandProfile | null;
  audience: AudienceData | null;
  selectedPlatforms: Platform[];
  ads: AdCreative[];
  budget: BudgetConfig | null;
  targeting: TargetingConfig | null;
  projections: ProjectionData | null;
  publishMode: "self" | "managed" | null;
  isGeneratingAds: boolean;
  footerAction: (() => void) | null;
  footerDisabled: boolean;
};

type WizardActions = {
  setStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: WizardStep) => void;
  setUrl: (url: string) => void;
  setBrand: (brand: BrandProfile) => void;
  setAudience: (audience: AudienceData) => void;
  togglePlatform: (platform: Platform) => void;
  setAds: (ads: AdCreative[]) => void;
  toggleAdSelection: (adId: string) => void;
  updateAd: (adId: string, updates: Partial<AdCreative>) => void;
  setBudget: (budget: BudgetConfig) => void;
  setTargeting: (targeting: TargetingConfig) => void;
  setProjections: (projections: ProjectionData) => void;
  setPublishMode: (mode: "self" | "managed") => void;
  setIsGeneratingAds: (val: boolean) => void;
  setFooterAction: (action: (() => void) | null, disabled?: boolean) => void;
  reset: () => void;
};

const initialState: WizardState = {
  step: "url",
  direction: 1,
  url: "",
  brand: null,
  audience: null,
  selectedPlatforms: [],
  ads: [],
  budget: null,
  targeting: null,
  projections: null,
  publishMode: null,
  isGeneratingAds: false,
  footerAction: null,
  footerDisabled: false,
};

function getNextStep(current: WizardStep): WizardStep {
  const idx = WIZARD_STEPS.indexOf(current);
  if (idx === -1 || idx >= WIZARD_STEPS.length - 1) return current;
  return WIZARD_STEPS[idx + 1] ?? current;
}

function getPrevStep(current: WizardStep): WizardStep {
  const idx = WIZARD_STEPS.indexOf(current);
  if (idx <= 0) return current;
  return WIZARD_STEPS[idx - 1] ?? current;
}

export const useWizardStore = create<WizardState & WizardActions>()(
  persist(
    (set) => ({
      ...initialState,

      setStep: (step) => set({ step }),

      nextStep: () =>
        set((s) => {
          const next = getNextStep(s.step);
          return next !== s.step ? { step: next, direction: 1 } : {};
        }),

      prevStep: () =>
        set((s) => {
          const prev = getPrevStep(s.step);
          return prev !== s.step ? { step: prev, direction: -1 } : {};
        }),

      goToStep: (step) =>
        set((s) => {
          const currentIdx = WIZARD_STEPS.indexOf(s.step);
          const targetIdx = WIZARD_STEPS.indexOf(step);
          if (targetIdx === -1) return {};
          return { step, direction: targetIdx > currentIdx ? 1 : -1 };
        }),

      setUrl: (url) => set({ url }),
      setBrand: (brand) => set({ brand }),
      setAudience: (audience) => set({ audience }),

      togglePlatform: (platform) =>
        set((s) => ({
          selectedPlatforms: s.selectedPlatforms.includes(platform)
            ? s.selectedPlatforms.filter((p) => p !== platform)
            : [...s.selectedPlatforms, platform],
        })),

      setAds: (ads) => set({ ads }),

      toggleAdSelection: (adId) =>
        set((s) => ({
          ads: s.ads.map((ad) =>
            ad.id === adId ? { ...ad, selected: !ad.selected } : ad
          ),
        })),

      updateAd: (adId, updates) =>
        set((s) => ({
          ads: s.ads.map((ad) =>
            ad.id === adId ? { ...ad, ...updates } : ad
          ),
        })),

      setBudget: (budget) => set({ budget }),
      setTargeting: (targeting) => set({ targeting }),
      setProjections: (projections) => set({ projections }),
      setPublishMode: (mode) => set({ publishMode: mode }),
      setIsGeneratingAds: (val) => set({ isGeneratingAds: val }),
      setFooterAction: (action, disabled = false) => set({ footerAction: action, footerDisabled: disabled }),
      reset: () => set(initialState),
    }),
    {
      name: "doost:wizard-v2",
      partialize: (state) => ({
        step: state.step,
        url: state.url,
        brand: state.brand,
        audience: state.audience,
        selectedPlatforms: state.selectedPlatforms,
        budget: state.budget,
        targeting: state.targeting,
        publishMode: state.publishMode,
      }),
      onRehydrateStorage: () => (state) => {
        // If user refreshes during transient steps, reset to safe state
        if (state && (state.step === "loading" || state.step === "done")) {
          state.step = state.brand ? "brand" : "url";
        }
      },
    }
  )
);
