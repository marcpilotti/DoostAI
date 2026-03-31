"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { AdPreview } from "@/components/ads/ad-preview/AdPreview";
import type { AdData, AdFormat } from "@/components/ads/ad-preview/types";
import { AIMessage } from "./AIMessage";
import type { BrandProfile } from "./OnboardingShell";

// ── Goals & Platforms ───────────────────────────────────────────

const GOALS = [
  { id: "awareness", label: "Fler besökare" },
  { id: "leads", label: "Fler kunder" },
  { id: "sales", label: "Öka försäljningen" },
];

const PLATFORMS: { id: "meta" | "google" | "linkedin"; label: string; format: AdFormat }[] = [
  { id: "meta", label: "Instagram", format: "meta-feed" },
  { id: "google", label: "Google", format: "google-search" },
  { id: "linkedin", label: "LinkedIn", format: "linkedin" },
];

// ── Types ────────────────────────────────────────────────────────

type AdCopy = {
  id: string;
  platform: string;
  variant: string;
  label: string;
  headline: string;
  bodyCopy: string;
  cta: string;
  headlines?: string[];
  descriptions?: string[];
};

type GenerateResult = {
  copies: AdCopy[];
  brand: {
    name: string;
    url: string;
    colors: Record<string, string>;
    fonts?: Record<string, string>;
    industry?: string;
  };
  backgroundUrl?: string;
  backgroundUrlB?: string;
  platform: string;
  strategy?: {
    variantA: { concept: string; hook: string; angle: string; emotionalTrigger: string };
    variantB: { concept: string; hook: string; angle: string; emotionalTrigger: string };
    recommendation: string;
  } | null;
};

type EditorState = "loading" | "ready" | "regenerating";

// ── Component ────────────────────────────────────────────────────

export function EditorSlide({
  profile,
  onBack,
  onPublish,
}: {
  profile: BrandProfile;
  onBack: () => void;
  onPublish: (data: { adData: AdData; format: AdFormat; goal: string }) => void;
}) {
  const prefersReduced = useReducedMotion();
  const [state, setState] = useState<EditorState>("loading");
  const [goal, setGoal] = useState("leads");
  const [platformIdx, setPlatformIdx] = useState(0);
  const [aiMessages, setAiMessages] = useState<string[]>([]);
  const [result, setResult] = useState<GenerateResult | null>(null);

  // Editable ad data (user can modify inline)
  const [editedA, setEditedA] = useState<AdData | null>(null);
  const [editedB, setEditedB] = useState<AdData | null>(null);

  const platform = PLATFORMS[platformIdx]!;
  const abortRef = useRef<AbortController | null>(null);

  // ── Map profile → brand context for API ──────────────────────

  const getBrandPayload = useCallback(() => {
    const ta = typeof profile.targetAudience === "string"
      ? profile.targetAudience
      : profile.targetAudience?.demographic ?? "";
    return {
      name: profile.name,
      description: profile.description,
      industry: profile.industry,
      brandVoice: profile.brandVoice ?? "Professional and approachable",
      targetAudience: ta,
      valuePropositions: profile.valuePropositions ?? [],
      url: profile.url,
      colors: {
        primary: profile.colors.primary,
        secondary: profile.colors.secondary,
        accent: profile.colors.accent,
        background: profile.colors.background,
        text: profile.colors.text,
      },
      fonts: profile.fonts ?? { heading: "Inter", body: "Inter" },
    };
  }, [profile]);

  // ── Generate ads via SSE ─────────────────────────────────────

  const generate = useCallback(async (isRegeneration = false) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState(isRegeneration ? "regenerating" : "loading");
    setAiMessages(["Bygger din annons..."]);
    setEditedA(null);
    setEditedB(null);

    try {
      const res = await fetch("/api/ad/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: getBrandPayload(),
          platform: platform.id,
          objective: goal,
          language: "sv",
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error("Generation failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalResult: GenerateResult | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.event === "progress" && data.message) {
              setAiMessages((prev) => [...prev, data.message]);
            }

            if (data.event === "copy" && data.copies) {
              // Show copy immediately — partial result
              setAiMessages((prev) => [...prev, "Skriver klart texten..."]);
            }

            if (data.event === "image_a") {
              setAiMessages((prev) => [...prev, "AI-bakgrund klar!"]);
            }

            if (data.event === "complete" && data.result) {
              finalResult = data.result as GenerateResult;
            }

            if (data.event === "error") {
              setAiMessages((prev) => [...prev, data.message ?? "Något gick fel."]);
              setState("ready");
              return;
            }
          } catch {
            // Skip malformed SSE
          }
        }
      }

      if (finalResult) {
        setResult(finalResult);
        setAiMessages(["Här är ert annonsförslag — redigera direkt i texten"]);
        setState("ready");
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setAiMessages(["Något gick fel vid genereringen. Försök igen."]);
      setState("ready");
    }
  }, [getBrandPayload, platform.id, goal]);

  // Auto-generate on mount
  useEffect(() => {
    generate();
    return () => abortRef.current?.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Regenerate when goal or platform changes (after initial load)
  const hasGeneratedRef = useRef(false);
  useEffect(() => {
    if (!hasGeneratedRef.current) {
      hasGeneratedRef.current = true;
      return;
    }
    generate(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal, platformIdx]);

  // ── Map result → AdData ──────────────────────────────────────

  function mapCopyToAdData(copy: AdCopy, bgUrl?: string | null): AdData {
    return {
      id: copy.id,
      headline: copy.headline,
      primaryText: copy.bodyCopy,
      cta: copy.cta,
      brandName: result?.brand.name ?? profile.name,
      brandUrl: result?.brand.url ?? profile.url,
      brandColor: result?.brand.colors.primary ?? profile.colors.primary,
      brandAccent: result?.brand.colors.accent ?? profile.colors.accent,
      imageUrl: bgUrl ?? null,
      headlines: copy.headlines,
      descriptions: copy.descriptions,
    };
  }

  const copies = result?.copies ?? [];
  const copyA = copies[0];
  const copyB = copies[1];

  const variantA = editedA ?? (copyA ? mapCopyToAdData(copyA, result?.backgroundUrl) : null);
  const variantB = editedB ?? (copyB ? mapCopyToAdData(copyB, result?.backgroundUrlB ?? result?.backgroundUrl) : null);

  // ── Handle publish ───────────────────────────────────────────

  function handlePublish(adData: AdData) {
    onPublish({
      adData,
      format: platform.format,
      goal,
    });
  }

  // ── Render ────────────────────────────────────────────────────

  const hasError = state === "ready" && !variantA;

  return (
    <div className="flex h-full flex-col px-4 py-4 sm:px-6">
      {/* ── Card container ─────────────────────────────────────── */}
      <div className="relative mx-auto w-full max-w-2xl min-h-0 flex-1 overflow-hidden">
        {state === "loading" && !variantA ? (
          <LoadingSkeleton platformLabel={platform.label} />
        ) : variantA ? (
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)]"
          >
            {/* Ad preview — fills available space */}
            <div className="min-h-0 flex-1 overflow-hidden">
              <AdPreview
                variantA={variantA}
                variantB={variantB ?? undefined}
                format={platform.format}
                strategy={result?.strategy}
                autoGenerateImage
                editable
                hideHeader
              />
            </div>

            {/* Platform tabs */}
            <div className="shrink-0 border-t border-border/8 px-5 py-2.5">
              <div className="flex items-center justify-center gap-1">
                {PLATFORMS.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => setPlatformIdx(idx)}
                    className={`rounded-lg px-4 py-1.5 text-[12px] font-medium transition-all ${
                      idx === platformIdx
                        ? "bg-foreground text-white"
                        : "text-muted-foreground/40 hover:text-muted-foreground"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Publish */}
            <div className="shrink-0 border-t border-border/8 px-5 py-4">
              <button
                onClick={() => { if (variantA) handlePublish(variantA); }}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-[14px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
              >
                Publicera
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ) : (
          /* Error state with retry */
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-50 to-orange-50">
              <Sparkles className="h-6 w-6 text-red-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground/70">Kunde inte generera annons</p>
              <p className="mt-1 text-xs text-muted-foreground/50">AI:n kunde inte skapa annonstext just nu</p>
            </div>
            <button
              onClick={() => generate()}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:from-indigo-600 hover:to-indigo-700 hover:shadow-md"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              Försök igen
            </button>
          </div>
        )}

        {/* Regenerating overlay */}
        {state === "regenerating" && variantA && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
              <p className="text-xs font-medium text-muted-foreground">Anpassar din annons...</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── AI message — only when ready ────────────────────────── */}
      {state !== "loading" && aiMessages.length > 0 && (
        <div className="mx-auto w-full max-w-2xl shrink-0 py-2">
          <AIMessage text={aiMessages[aiMessages.length - 1]!} isLatest />
        </div>
      )}

      {/* Back */}
      <div className={`mx-auto w-full max-w-2xl shrink-0 pb-2 text-center transition-opacity ${state === "loading" ? "pointer-events-none opacity-0" : "opacity-100"}`}>
        <button onClick={onBack} className="text-[12px] text-muted-foreground/40 hover:text-muted-foreground">
          <ArrowLeft className="mr-1 inline h-3 w-3" /> Tillbaka
        </button>
      </div>
    </div>
  );
}

// ── Loading skeleton ────────────────────────────────────────────

function LoadingSkeleton({ platformLabel }: { platformLabel: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      {/* Phone-shaped mockup skeleton */}
      <div className="w-72 overflow-hidden rounded-2xl border border-border/30 bg-white/80 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="h-8 w-8 animate-shimmer rounded-full bg-gradient-to-r from-indigo-100 via-purple-50 to-indigo-100 bg-[length:200%_100%]" />
          <div className="space-y-1.5">
            <div className="h-2.5 w-20 animate-shimmer rounded bg-gradient-to-r from-muted via-muted/40 to-muted bg-[length:200%_100%]" />
            <div className="h-2 w-14 animate-shimmer rounded bg-gradient-to-r from-muted/60 via-muted/20 to-muted/60 bg-[length:200%_100%]" />
          </div>
        </div>
        {/* Creative area */}
        <div className="aspect-square animate-shimmer bg-gradient-to-br from-indigo-50 via-purple-50/50 to-indigo-50 bg-[length:200%_100%]">
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-500" />
            <div className="h-3 w-32 animate-shimmer rounded bg-gradient-to-r from-indigo-100 via-white to-indigo-100 bg-[length:200%_100%]" />
            <div className="h-2 w-40 animate-shimmer rounded bg-gradient-to-r from-indigo-50 via-white to-indigo-50 bg-[length:200%_100%]" />
          </div>
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="space-y-1">
            <div className="h-2 w-16 animate-shimmer rounded bg-gradient-to-r from-muted/50 via-muted/20 to-muted/50 bg-[length:200%_100%]" />
            <div className="h-2.5 w-24 animate-shimmer rounded bg-gradient-to-r from-muted via-muted/40 to-muted bg-[length:200%_100%]" />
          </div>
          <div className="h-7 w-16 animate-shimmer rounded-full bg-gradient-to-r from-indigo-100 via-indigo-50 to-indigo-100 bg-[length:200%_100%]" />
        </div>
      </div>

      {/* Status text */}
      <div className="flex items-center gap-2">
        <div className="relative h-2 w-2">
          <div className="absolute inset-0 animate-ping rounded-full bg-indigo-400/40" />
          <div className="relative h-2 w-2 rounded-full bg-indigo-500" />
        </div>
        <p className="text-xs font-medium text-muted-foreground/60">
          Genererar {platformLabel}-annons med AI...
        </p>
      </div>
    </div>
  );
}
