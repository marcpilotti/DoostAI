"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Lock,
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

  return (
    <div className="flex h-full flex-col px-4 py-3 sm:px-6">
      {/* ── Toolbar: Goal, Channel, Audience ───────────────────── */}
      <div className="mx-auto flex w-full max-w-2xl shrink-0 items-center gap-2 pb-2">
        {/* Goal dropdown */}
        <div className="relative">
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            disabled={state === "loading"}
            className="appearance-none rounded-lg border border-border/40 bg-white/60 py-1.5 pl-3 pr-7 text-xs font-medium text-foreground backdrop-blur-sm transition-all hover:border-border/60 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200 disabled:opacity-50"
          >
            {GOALS.map((g) => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground/50" />
        </div>

        {/* Platform tabs */}
        <div className="flex rounded-lg border border-border/30 bg-white/50 p-0.5 backdrop-blur-sm">
          {PLATFORMS.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setPlatformIdx(idx)}
              disabled={state === "loading"}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all disabled:opacity-50 ${
                idx === platformIdx
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Pro badges (locked features) */}
        <button
          className="flex items-center gap-1 rounded-lg border border-border/30 bg-white/50 px-2 py-1.5 text-[10px] text-muted-foreground/60 backdrop-blur-sm"
          title="Variant B — Pro"
        >
          <Lock className="h-2.5 w-2.5" />
          B
        </button>
      </div>

      {/* ── Preview area — max 45vh ─────────────────────────────── */}
      <div className="mx-auto w-full max-w-2xl min-h-0 flex-1 overflow-hidden">
        {state === "loading" && !variantA ? (
          <LoadingSkeleton platformLabel={platform.label} />
        ) : variantA ? (
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="h-full"
            style={{ maxHeight: "45vh" }}
          >
            <AdPreview
              variantA={variantA}
              variantB={variantB ?? undefined}
              format={platform.format}
              strategy={result?.strategy}
              autoGenerateImage={false}
              onPublish={handlePublish}
              editable
            />
          </motion.div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Kunde inte generera annons. Försök igen.
            </p>
          </div>
        )}

        {/* Regenerating overlay */}
        {state === "regenerating" && variantA && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/60 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-600" />
              Anpassar din annons...
            </div>
          </div>
        )}
      </div>

      {/* ── AI message ──────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-2xl shrink-0 py-2">
        {aiMessages.length > 0 && (
          <AIMessage
            text={aiMessages[aiMessages.length - 1]!}
            isLatest
          />
        )}
      </div>

      {/* ── Action bar ──────────────────────────────────────────── */}
      <div className="mx-auto flex w-full max-w-2xl shrink-0 items-center justify-between gap-3 pb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-xl border border-border/40 px-4 py-2 text-xs font-medium text-muted-foreground transition-all hover:bg-muted/40"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Tillbaka
        </button>

        <div className="flex items-center gap-2">
          {/* Locked features */}
          <button
            className="flex items-center gap-1 rounded-lg border border-border/30 px-2.5 py-1.5 text-[10px] text-muted-foreground/50"
            title="Ladda ner — Pro"
          >
            <Lock className="h-2.5 w-2.5" />
            PNG
          </button>
          <button
            className="flex items-center gap-1 rounded-lg border border-border/30 px-2.5 py-1.5 text-[10px] text-muted-foreground/50"
            title="Dela — Pro"
          >
            <Lock className="h-2.5 w-2.5" />
            Dela
          </button>

          {/* Main CTA */}
          <button
            onClick={() => {
              if (variantA) handlePublish(variantA);
            }}
            disabled={!variantA || state === "loading"}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:from-indigo-600 hover:to-indigo-700 hover:shadow-md disabled:opacity-50"
          >
            Publicera
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Loading skeleton ────────────────────────────────────────────

function LoadingSkeleton({ platformLabel }: { platformLabel: string }) {
  return (
    <div className="animate-pulse rounded-2xl border border-border/40 bg-white/70 p-5 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-200 to-purple-200" />
        <div className="space-y-1">
          <div className="h-3 w-28 rounded bg-muted/60" />
          <div className="h-2 w-40 rounded bg-muted/40" />
        </div>
      </div>
      <div className="mt-4 aspect-square max-h-[35vh] rounded-xl bg-muted/30" />
      <div className="mt-3 space-y-2">
        <div className="h-3 w-3/4 rounded bg-muted/40" />
        <div className="h-2 w-full rounded bg-muted/30" />
        <div className="h-2 w-2/3 rounded bg-muted/30" />
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-500" />
        Genererar {platformLabel}-annons med AI...
      </div>
    </div>
  );
}
