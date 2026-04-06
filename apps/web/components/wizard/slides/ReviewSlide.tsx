"use client";

/**
 * ReviewSlide — redesigned review + publish page.
 *
 * 9 components: step indicator, campaign summary, reach estimator,
 * cost breakdown, publish method, trust signals, reassurance,
 * primary CTA, inline success state.
 */

import { useAuth } from "@clerk/nextjs";
import { Check, Lock, Shield, Star } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useState } from "react";

import { cardVariants, transitions } from "@/lib/motion";
import { useWizardStore } from "@/lib/stores/wizard-store";

import { ConfigureStepIndicator } from "../shared/ConfigureStepIndicator";
import { LiveReachEstimator } from "../shared/LiveReachEstimator";

const SIGN_IN_PATH = "/sign-in";
const DOOST_FEE_RATE = 0.10; // 10% — adjust to actual pricing

type PublishState = "idle" | "publishing" | "done";

export function ReviewSlide() {
  const { brand, ads, budget, targeting, selectedPlatforms, projections, publishMode, setPublishMode, goToStep, reset } = useWizardStore();
  const { isSignedIn } = useAuth();
  const [publishState, setPublishState] = useState<PublishState>("idle");
  const [publishError, setPublishError] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<"managed" | "self">(publishMode || "managed");

  const selectedAds = ads.filter((a) => a.selected);
  const locationStr = targeting?.locations?.join(", ") || "Hela Sverige";
  const ageStr = targeting ? `${targeting.ageMin}–${targeting.ageMax} år` : "";
  const totalBudget = budget?.totalBudget || 0;
  const adSpend = Math.round(totalBudget * (1 - DOOST_FEE_RATE));
  const doostFee = totalBudget - adSpend;
  const platformStr = selectedPlatforms.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" + ");

  const startDate = budget?.startDate ? new Date(budget.startDate) : new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + (budget?.durationDays || 30));
  const periodStr = `${startDate.getDate()} ${startDate.toLocaleDateString("sv-SE", { month: "short" })} – ${endDate.getDate()} ${endDate.toLocaleDateString("sv-SE", { month: "short" })}`;

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
      <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={transitions.spring}
        className="flex flex-col items-center gap-5 py-8 text-center">
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 300 }}
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: "var(--color-success-bg)" }}>
          <Check className="h-7 w-7" style={{ color: "var(--color-success)" }} />
        </motion.div>
        <div>
          <h2 className="text-text-h2" style={{ color: "var(--color-text-primary)" }}>Din kampanj granskas nu</h2>
          <p className="mx-auto mt-2 max-w-[280px] text-[13px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            Meta och Google granskar vanligtvis annonser inom 1–24 timmar. Vi meddelar dig via e-post när kampanjen är live.
          </p>
        </div>
        <motion.button onClick={() => (window.location.href = "/dashboard")}
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="mt-2 text-[13px] font-medium" style={{ color: "var(--color-primary-light)" }}>
          Gå till dashboard →
        </motion.button>
        <motion.button onClick={() => reset()}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
          Skapa ny kampanj
        </motion.button>
      </motion.div>
    );
  }

  // ── Review page ───────────────────────────────────────────────
  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={transitions.spring}
      className="flex flex-col gap-4">

      {/* 1. Step indicator */}
      <ConfigureStepIndicator activeStep="review" />

      {/* 2. Campaign summary card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ ...transitions.spring, delay: 0.05 }}
        className="p-4" style={{ borderRadius: 14, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-default)" }}>
        <div className="mb-3 flex items-center gap-3">
          {brand?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logoUrl} alt="" className="h-9 w-9 rounded-lg object-contain" style={{ background: "var(--color-bg-raised)" }} />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg text-[15px] font-bold"
              style={{ background: "var(--color-bg-raised)", color: "var(--color-text-primary)" }}>
              {brand?.name?.charAt(0) || "D"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-medium" style={{ color: "var(--color-text-primary)" }}>{brand?.name}</div>
            <div className="text-[12px]" style={{ color: "var(--color-text-secondary)" }}>
              {selectedAds.length} annons · {platformStr} · {budget?.durationDays}d
            </div>
          </div>
        </div>

        {/* 2x2 summary grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Budget", value: `${totalBudget.toLocaleString("sv-SE")} kr` },
            { label: "Period", value: periodStr },
            { label: "Målgrupp", value: ageStr },
            { label: "Plats", value: locationStr.length > 20 ? locationStr.slice(0, 18) + "..." : locationStr },
          ].map((item) => (
            <button key={item.label} onClick={() => goToStep("configure")}
              className="group cursor-pointer text-left transition-colors"
              style={{ padding: "10px 12px", borderRadius: 10, background: "var(--color-bg-base)", border: "1px solid var(--color-border-subtle)" }}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{item.label}</span>
                <span className="text-[10px] opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--color-text-muted)" }}>✎</span>
              </div>
              <div className="mt-0.5 text-[14px] font-medium" style={{ color: "var(--color-text-primary)" }}>{item.value}</div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* 3. Reach estimator (readonly) */}
      {projections && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transitions.spring, delay: 0.1 }}>
          <LiveReachEstimator projections={projections} variant="readonly" />
        </motion.div>
      )}

      {/* 4. Cost breakdown */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ ...transitions.spring, delay: 0.15 }}
        style={{ padding: "16px 20px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="mb-3 text-[11px] font-semibold uppercase" style={{ letterSpacing: "0.06em", color: "var(--color-text-muted)" }}>
          Kostnadsöversikt
        </p>
        <div className="flex items-center justify-between text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
          <span>Annonsbudget ({platformStr})</span>
          <span>{adSpend.toLocaleString("sv-SE")} kr</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
          <span>Doost AI-optimering</span>
          <span>{doostFee.toLocaleString("sv-SE")} kr</span>
        </div>
        <div className="mt-2 border-t pt-3" style={{ borderColor: "var(--color-border-subtle)" }}>
          <div className="flex items-center justify-between text-[14px] font-medium" style={{ color: "var(--color-text-primary)" }}>
            <span>Totalt</span>
            <span>{totalBudget.toLocaleString("sv-SE")} kr</span>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px]" style={{ color: "var(--color-success)" }}>
          <div className="flex h-3 w-3 items-center justify-center rounded-full" style={{ background: "var(--color-success-bg)" }}>
            <Check className="h-2 w-2" />
          </div>
          Budgetoptimering ingår i din plan
        </div>
      </motion.div>

      {/* 5. Publish method selector */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ ...transitions.spring, delay: 0.2 }}
        style={{ padding: "16px 20px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="mb-3 text-[11px] font-semibold uppercase" style={{ letterSpacing: "0.06em", color: "var(--color-text-muted)" }}>
          Publiceringsmetod
        </p>

        {/* Managed (primary) */}
        <button onClick={() => setSelectedMethod("managed")} className="w-full text-left"
          style={{
            padding: "12px", borderRadius: 10, background: "var(--color-bg-base)",
            border: selectedMethod === "managed" ? "1.5px solid var(--color-primary)" : "1px solid var(--color-border-subtle)",
          }}>
          <div className="flex items-center gap-2">
            <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full"
              style={{ border: selectedMethod === "managed" ? "none" : "1.5px solid var(--color-text-muted)", background: selectedMethod === "managed" ? "var(--color-primary)" : "transparent" }}>
              {selectedMethod === "managed" && <div className="h-2 w-2 rounded-full bg-white" />}
            </div>
            <span className="text-[14px] font-medium" style={{ color: "var(--color-text-primary)" }}>Vi publicerar åt dig</span>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ background: "rgba(99,102,241,0.12)", color: "var(--color-primary-light)" }}>
              Enklast
            </span>
          </div>
          <p className="mt-1 pl-[26px] text-[12px]" style={{ color: "var(--color-text-secondary)" }}>
            Vi sköter allt — konton, publicering, optimering och rapportering.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5 pl-[26px]">
            {["Kontoskapande", "Publicering", "A/B-test", "Optimering"].map((tag) => (
              <span key={tag} className="text-[11px]"
                style={{ padding: "3px 8px", borderRadius: 99, border: "0.5px solid var(--color-border-default)", color: "var(--color-text-secondary)" }}>
                {tag}
              </span>
            ))}
          </div>
        </button>

        {/* Divider */}
        <div className="my-2" style={{ borderTop: "0.5px solid var(--color-border-subtle)" }} />

        {/* Self-serve */}
        <button onClick={() => setSelectedMethod("self")} className="w-full text-left"
          style={{ padding: "10px 12px", borderRadius: 10, opacity: selectedMethod === "self" ? 0.85 : 0.55, transition: "opacity 200ms" }}>
          <div className="flex items-center gap-2">
            <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full"
              style={{ border: selectedMethod === "self" ? "none" : "1.5px solid var(--color-text-muted)", background: selectedMethod === "self" ? "var(--color-primary)" : "transparent" }}>
              {selectedMethod === "self" && <div className="h-2 w-2 rounded-full bg-white" />}
            </div>
            <span className="text-[14px] font-medium" style={{ color: "var(--color-text-secondary)" }}>Anslut egna konton</span>
          </div>
          <p className="mt-0.5 pl-[26px] text-[12px]" style={{ color: "var(--color-text-muted)" }}>
            Har du Meta Business Manager? Koppla och publicera direkt.
          </p>
        </button>
      </motion.div>

      {/* 6. Trust signals */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ ...transitions.spring, delay: 0.25 }}
        className="flex items-center justify-center gap-5 py-1">
        {[
          { icon: <Star className="h-2.5 w-2.5" />, text: "850+ kampanjer skapade" },
          { icon: <Shield className="h-2.5 w-2.5" />, text: "Meta-verifierad partner" },
          { icon: <Lock className="h-2.5 w-2.5" />, text: "Krypterad betalning" },
        ].map(({ icon, text }) => (
          <div key={text} className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--color-text-muted)" }}>
            <div className="flex h-3.5 w-3.5 items-center justify-center rounded" style={{ background: "rgba(99,102,241,0.1)", color: "var(--color-primary-light)" }}>
              {icon}
            </div>
            {text}
          </div>
        ))}
      </motion.div>

      {/* 7. Reassurance line */}
      <p className="text-center text-[12px]" style={{ color: "var(--color-text-muted)" }}>
        Du kan pausa, ändra eller avbryta din kampanj när som helst.
      </p>

      {/* Error */}
      {publishError && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 text-[14px]"
          style={{ borderRadius: 10, background: "var(--color-error-bg)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--color-error)" }}>
          {publishError}
        </motion.div>
      )}

      {/* 8. Primary CTA */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ ...transitions.spring, delay: 0.3 }}>
        <motion.button
          onClick={handlePublish}
          disabled={publishState === "publishing"}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="w-full text-[15px] font-medium disabled:opacity-60"
          style={{
            padding: "14px", borderRadius: 14,
            background: "var(--color-primary)", color: "#fff",
            boxShadow: "var(--shadow-glow-sm)",
          }}>
          {publishState === "publishing" ? "Publicerar..." : "Publicera kampanj →"}
        </motion.button>
        <p className="mt-2 text-center text-[11px]" style={{ color: "var(--color-text-muted)" }}>
          Genom att fortsätta godkänner du <span className="underline cursor-pointer">villkoren</span>
        </p>
      </motion.div>
    </motion.div>
  );
}
