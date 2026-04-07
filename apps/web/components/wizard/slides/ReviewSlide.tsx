"use client";

/**
 * ReviewSlide — final review page before publishing.
 * Clean, focused: cost breakdown + publishing method + CTA.
 */

import { useAuth } from "@clerk/nextjs";
import { Check, ChevronRight, Lock, Sparkles, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useState } from "react";

import { useWizardStore } from "@/lib/stores/wizard-store";

const SIGN_IN_PATH = "/sign-in";
const DOOST_FEE_RATE = 0.10;

type PublishState = "idle" | "publishing" | "done";

export function ReviewSlide() {
  const { brand, ads, budget, targeting, selectedPlatforms, publishMode, setPublishMode, reset } = useWizardStore();
  const { isSignedIn } = useAuth();
  const [publishState, setPublishState] = useState<PublishState>("idle");
  const [publishError, setPublishError] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<"managed" | "self">(publishMode || "managed");

  const selectedAds = ads.filter((a) => a.selected);
  const totalBudget = budget?.totalBudget || 0;
  const adSpend = Math.round(totalBudget * (1 - DOOST_FEE_RATE));
  const doostFee = totalBudget - adSpend;
  const platformStr = selectedPlatforms.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" + ");

  const handlePublish = useCallback(async () => {
    if (!isSignedIn) {
      const returnUrl = encodeURIComponent(window.location.href);
      window.location.href = `${SIGN_IN_PATH}?redirect_url=${returnUrl}`;
      return;
    }
    setPublishMode(selectedMethod);
    setPublishState("publishing");
    setPublishError("");

    try {
      const results = await Promise.all(
        selectedAds.map(async (ad) => {
          const response = await fetch("/api/campaigns/publish", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              brandName: brand?.name, brandUrl: brand?.url, brandColors: brand?.colors,
              headline: ad.headline, bodyText: ad.bodyCopy, cta: ad.cta,
              imageUrl: ad.imageUrl || ad.renderedUrl, platform: ad.platform,
              dailyBudget: Math.round(totalBudget / (budget?.durationDays || 30)),
              duration: budget?.durationDays || 30,
              regions: targeting?.locations || ["Hela Sverige"],
              channel: ad.platform,
            }),
          });
          if (!response.ok) {
            if (response.status === 401) {
              const returnUrl = encodeURIComponent(window.location.href);
              window.location.href = `${SIGN_IN_PATH}?redirect_url=${returnUrl}`;
              return null;
            }
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || "Publicering misslyckades");
          }
          return response;
        }),
      );
      if (results.some((r) => r === null)) { setPublishState("idle"); return; }
      if (results.length === 0) throw new Error("Inga annonser valda");
      setPublishState("done");
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "Något gick fel");
      setPublishState("idle");
    }
  }, [isSignedIn, selectedAds, brand, budget, targeting, totalBudget, selectedMethod, setPublishMode]);

  // ── Success state ─────────────────────────────────────────────
  if (publishState === "done") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 12, stiffness: 200 }}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl"
          style={{ background: "linear-gradient(135deg, var(--color-success), #10B981)" }}
        >
          <Check className="h-10 w-10 text-white" strokeWidth={3} />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-[22px] font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Din kampanj granskas nu
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mx-auto mt-3 max-w-[300px] text-[14px] leading-relaxed"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Meta och Google granskar vanligtvis annonser inom 1–24 timmar. Vi meddelar dig via e-post.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex flex-col gap-3"
        >
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="rounded-xl px-8 py-3 text-[14px] font-medium text-white"
            style={{ background: "var(--color-primary)", boxShadow: "var(--shadow-glow-sm)" }}
          >
            Gå till dashboard
          </button>
          <button
            onClick={() => reset()}
            className="text-[13px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            Skapa ny kampanj
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Review page ───────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-[20px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Sista steget
        </h2>
        <p className="mt-1 text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
          Granska kostnad och välj hur du vill publicera.
        </p>
      </motion.div>

      {/* ── Cost breakdown ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{
          padding: "20px 24px",
          borderRadius: 16,
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <p
          className="mb-4 text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--color-text-muted)" }}
        >
          Kostnadsöversikt
        </p>

        {/* Line items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[14px]" style={{ color: "var(--color-text-secondary)" }}>
              Annonsbudget ({platformStr})
            </span>
            <span className="text-[14px] tabular-nums" style={{ color: "var(--color-text-secondary)" }}>
              {adSpend.toLocaleString("sv-SE")} kr
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px]" style={{ color: "var(--color-text-secondary)" }}>
              Doost AI-optimering
            </span>
            <span className="text-[14px] tabular-nums" style={{ color: "var(--color-text-secondary)" }}>
              {doostFee.toLocaleString("sv-SE")} kr
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="my-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="text-[16px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Totalt
          </span>
          <span className="text-[20px] font-bold tabular-nums" style={{ color: "var(--color-text-primary)" }}>
            {totalBudget.toLocaleString("sv-SE")} kr
          </span>
        </div>

        {/* Included badge */}
        <div className="mt-3 flex items-center gap-2">
          <div
            className="flex h-4 w-4 items-center justify-center rounded-full"
            style={{ background: "var(--color-success-bg)" }}
          >
            <Check className="h-2.5 w-2.5" style={{ color: "var(--color-success)" }} />
          </div>
          <span className="text-[12px] font-medium" style={{ color: "var(--color-success)" }}>
            Budgetoptimering ingår i din plan
          </span>
        </div>
      </motion.div>

      {/* ── Publishing method ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          padding: "20px 24px",
          borderRadius: 16,
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <p
          className="mb-4 text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--color-text-muted)" }}
        >
          Publiceringsmetod
        </p>

        {/* Managed (primary) */}
        <motion.button
          onClick={() => setSelectedMethod("managed")}
          whileTap={{ scale: 0.99 }}
          className="w-full text-left transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:outline-none"
          style={{
            padding: "16px",
            borderRadius: 12,
            background: selectedMethod === "managed" ? "rgba(99,102,241,0.06)" : "var(--color-bg-base)",
            border: selectedMethod === "managed"
              ? "1.5px solid var(--color-primary)"
              : "1px solid var(--color-border-subtle)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors"
              style={{
                background: selectedMethod === "managed" ? "var(--color-primary)" : "transparent",
                border: selectedMethod === "managed" ? "none" : "2px solid var(--color-text-muted)",
              }}
            >
              {selectedMethod === "managed" && <div className="h-2 w-2 rounded-full bg-white" />}
            </div>
            <span className="text-[15px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Vi publicerar åt dig
            </span>
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{ background: "rgba(99,102,241,0.15)", color: "var(--color-primary-light)" }}
            >
              Enklast
            </span>
          </div>
          <p className="mt-2 pl-8 text-[13px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            Vi sköter allt — konton, publicering, optimering och rapportering.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 pl-8">
            {["Kontoskapande", "Publicering", "A/B-test", "Optimering"].map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-medium"
                style={{
                  padding: "4px 10px",
                  borderRadius: 99,
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "var(--color-text-secondary)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.button>

        {/* Self-serve */}
        <motion.button
          onClick={() => setSelectedMethod("self")}
          whileTap={{ scale: 0.99 }}
          className="mt-3 w-full text-left transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:outline-none"
          style={{
            padding: "14px 16px",
            borderRadius: 12,
            background: selectedMethod === "self" ? "rgba(99,102,241,0.06)" : "transparent",
            border: selectedMethod === "self"
              ? "1.5px solid var(--color-primary)"
              : "1px solid transparent",
            opacity: selectedMethod === "self" ? 1 : 0.5,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors"
              style={{
                background: selectedMethod === "self" ? "var(--color-primary)" : "transparent",
                border: selectedMethod === "self" ? "none" : "2px solid var(--color-text-muted)",
              }}
            >
              {selectedMethod === "self" && <div className="h-2 w-2 rounded-full bg-white" />}
            </div>
            <span className="text-[14px] font-medium" style={{ color: "var(--color-text-secondary)" }}>
              Anslut egna konton
            </span>
          </div>
          <p className="mt-1 pl-8 text-[12px]" style={{ color: "var(--color-text-muted)" }}>
            Har du Meta Business Manager? Koppla och publicera direkt.
          </p>
        </motion.button>
      </motion.div>

      {/* ── Error ──────────────────────────────────────────────── */}
      {publishError && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 text-[13px]"
          style={{
            borderRadius: 12,
            background: "var(--color-error-bg)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "var(--color-error)",
          }}
        >
          {publishError}
        </motion.div>
      )}

      {/* ── CTA ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="pt-1"
      >
        <motion.button
          onClick={handlePublish}
          disabled={publishState === "publishing"}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          className="group relative w-full overflow-hidden text-[15px] font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:outline-none"
          style={{
            padding: "16px",
            borderRadius: 14,
            background: "linear-gradient(135deg, var(--color-primary), #7C3AED)",
            boxShadow: "0 4px 24px -4px rgba(99,102,241,0.4)",
          }}
        >
          {/* Shimmer effect */}
          <div
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full"
          />
          <span className="relative flex items-center justify-center gap-2">
            {publishState === "publishing" ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Publicerar...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Publicera kampanj
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </span>
        </motion.button>

        {/* Terms + security */}
        <div className="mt-3 flex items-center justify-center gap-4">
          <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--color-text-muted)" }}>
            <Lock className="h-3 w-3" />
            Krypterad betalning
          </span>
          <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--color-text-muted)" }}>
            <Sparkles className="h-3 w-3" />
            Avbryt när som helst
          </span>
        </div>
      </motion.div>
    </div>
  );
}
