"use client";

import confetti from "canvas-confetti";
import { AnimatePresence,motion } from "motion/react";
import { useCallback,useState } from "react";

import { cardVariants,transitions } from "@/lib/motion";
import { useWizardStore } from "@/lib/stores/wizard-store";

type PublishState = "choose" | "self-connect" | "managed-confirm" | "publishing" | "done";

export function ReviewPublishSlide() {
  const { brand, ads, budget, targeting, selectedPlatforms, projections, setPublishMode } =
    useWizardStore();
  const [publishState, setPublishState] = useState<PublishState>("choose");
  const [publishError, setPublishError] = useState("");

  const selectedAds = ads.filter((a) => a.selected);
  const locationStr = targeting?.locations?.join(", ") || "Hela Sverige";
  const ageStr = targeting ? `${targeting.ageMin}-${targeting.ageMax} år` : "";

  const handlePublish = useCallback(
    async (mode: "self" | "managed") => {
      setPublishMode(mode);
      setPublishState("publishing");
      setPublishError("");

      try {
        for (const ad of selectedAds) {
          const response = await fetch("/api/campaigns/publish", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              brandName: brand?.name,
              brandUrl: brand?.url,
              brandColors: brand?.colors,
              headline: ad.headline,
              bodyText: ad.bodyCopy,
              cta: ad.cta,
              imageUrl: ad.imageUrl || ad.renderedUrl,
              platform: ad.platform,
              dailyBudget: Math.round((budget?.totalBudget || 5000) / (budget?.durationDays || 30)),
              duration: budget?.durationDays || 30,
              regions: targeting?.locations || ["Hela Sverige"],
              channel: ad.platform,
            }),
          });

          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || "Publicering misslyckades");
          }
        }

        setPublishState("done");

        // Confetti!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#6366F1", "#A5B4FC", "#22C55E", "#F59E0B"],
        });
      } catch (err) {
        setPublishError(err instanceof Error ? err.message : "Något gick fel");
        setPublishState("choose");
      }
    },
    [selectedAds, brand, budget, targeting, setPublishMode]
  );

  // Done state
  if (publishState === "done") {
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={transitions.spring}
        className="flex flex-col items-center gap-6 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={transitions.snappy}
          className="flex h-16 w-16 items-center justify-center rounded-full text-3xl"
          style={{ background: "var(--color-success-bg)" }}
        >
          🎉
        </motion.div>

        <div>
          <h2 className="text-text-h1" style={{ color: "var(--color-text-primary)" }}>
            Din kampanj är redo!
          </h2>
          <p className="mt-2 text-text-body" style={{ color: "var(--color-text-secondary)" }}>
            {selectedAds.length} annonser · {selectedPlatforms.join(" + ")} · {budget?.totalBudget?.toLocaleString("sv-SE")} kr
          </p>
        </div>

        {/* LinkedIn share */}
        <div
          className="w-full max-w-sm p-4"
          style={{
            borderRadius: "var(--radius-lg)",
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border-default)",
          }}
        >
          <p className="text-text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
            Jag skapade just mina första AI-annonser med @DoostAI på under 2 minuter!
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => {
                const text = encodeURIComponent("Jag skapade just mina första AI-annonser med @DoostAI på under 2 minuter!");
                window.open(`https://www.linkedin.com/sharing/share-offsite/?text=${text}`, "_blank");
              }}
              className="flex-1 text-text-body-sm font-semibold"
              style={{
                padding: "10px",
                borderRadius: "var(--radius-sm)",
                background: "var(--color-linkedin)",
                color: "#fff",
                border: "none",
              }}
            >
              Dela på LinkedIn
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${brand?.url || ""}`);
              }}
              className="text-text-body-sm font-medium"
              style={{
                padding: "10px 16px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border-default)",
                color: "var(--color-text-secondary)",
                background: "transparent",
              }}
            >
              Kopiera länk
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="text-text-body font-semibold"
            style={{
              padding: "12px 28px",
              borderRadius: "var(--radius-sm)",
              background: "var(--color-primary)",
              color: "var(--color-text-inverse)",
              border: "none",
              boxShadow: "var(--shadow-glow-sm)",
            }}
          >
            Gå till dashboard →
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={transitions.spring}
      className="flex flex-col gap-5"
    >
      <h2 className="text-text-h1" style={{ color: "var(--color-text-primary)" }}>
        Kampanjöversikt
      </h2>

      {/* Summary */}
      <div
        className="flex items-start gap-4 p-4"
        style={{
          borderRadius: "var(--radius-lg)",
          background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border-default)",
        }}
      >
        {brand?.logoUrl ? (
          <img src={brand.logoUrl} alt="" className="h-10 w-10 rounded-lg object-contain" />
        ) : (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold"
            style={{ background: "var(--color-bg-raised)", color: "var(--color-text-primary)" }}
          >
            {brand?.name?.charAt(0) || "D"}
          </div>
        )}
        <div>
          <h3 className="text-text-h3" style={{ color: "var(--color-text-primary)" }}>
            {brand?.name}
          </h3>
          <p className="text-text-body-sm" style={{ color: "var(--color-text-muted)" }}>
            {selectedAds.length} annonser · {selectedPlatforms.join(" + ")} · {budget?.totalBudget?.toLocaleString("sv-SE")} kr · {budget?.durationDays} dagar
          </p>
          <p className="text-text-body-sm" style={{ color: "var(--color-text-muted)" }}>
            {projections ? `${Math.round(projections.reachMin / 1000)}K–${Math.round(projections.reachMax / 1000)}K visn.` : ""} · {locationStr} · {ageStr}
          </p>
        </div>
      </div>

      {publishError && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 p-3"
          style={{
            borderRadius: "var(--radius-md)",
            background: "var(--color-error-bg)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            color: "var(--color-error)",
            fontSize: 14,
          }}
        >
          {publishError}
        </motion.div>
      )}

      {/* Publish options */}
      <AnimatePresence mode="wait">
        {publishState === "choose" && (
          <motion.div
            key="choose"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col gap-3"
          >
            <p className="text-text-body" style={{ color: "var(--color-text-secondary)" }}>
              Hur vill du publicera?
            </p>

            {/* Self-serve */}
            <button
              onClick={() => setPublishState("self-connect")}
              className="flex items-start gap-3 p-4 text-left transition-all"
              style={{
                borderRadius: "var(--radius-lg)",
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border-default)",
              }}
            >
              <span className="text-xl">🔗</span>
              <div className="flex-1">
                <h4 className="text-text-h3" style={{ color: "var(--color-text-primary)" }}>
                  Anslut dina konton
                </h4>
                <p className="text-text-body-sm" style={{ color: "var(--color-text-muted)" }}>
                  Koppla Meta, Google, etc. och publicera direkt.
                </p>
              </div>
              <span style={{ color: "var(--color-text-muted)" }}>→</span>
            </button>

            {/* Managed */}
            <button
              onClick={() => setPublishState("managed-confirm")}
              className="flex items-start gap-3 p-4 text-left transition-all"
              style={{
                borderRadius: "var(--radius-lg)",
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border-default)",
              }}
            >
              <span className="text-xl">🚀</span>
              <div className="flex-1">
                <h4 className="text-text-h3" style={{ color: "var(--color-text-primary)" }}>
                  Vi publicerar åt dig
                </h4>
                <p className="text-text-body-sm" style={{ color: "var(--color-text-muted)" }}>
                  Inga konton? Vi sköter allt. Ingår i din plan.
                </p>
              </div>
              <span style={{ color: "var(--color-text-muted)" }}>→</span>
            </button>

            <p className="text-text-caption text-center" style={{ color: "var(--color-text-muted)" }}>
              Genom att fortsätta godkänner du villkoren
            </p>
          </motion.div>
        )}

        {publishState === "self-connect" && (
          <motion.div
            key="self"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col gap-3"
          >
            {selectedPlatforms.map((platform) => (
              <div
                key={platform}
                className="flex items-center justify-between p-3"
                style={{
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border-default)",
                }}
              >
                <span className="text-text-body font-medium capitalize" style={{ color: "var(--color-text-primary)" }}>
                  {platform}
                </span>
                <button
                  onClick={() => {
                    window.open(`/api/platforms/${platform}/callback`, "_blank");
                  }}
                  className="text-text-body-sm font-medium"
                  style={{
                    padding: "8px 16px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--color-primary)",
                    color: "var(--color-text-inverse)",
                    border: "none",
                  }}
                >
                  Anslut
                </button>
              </div>
            ))}

            <button
              onClick={() => handlePublish("self")}
              className="mt-2 w-full font-semibold"
              style={{
                padding: "12px 28px",
                borderRadius: "var(--radius-sm)",
                background: "var(--color-primary)",
                color: "var(--color-text-inverse)",
                border: "none",
                boxShadow: "var(--shadow-glow-sm)",
                fontSize: 16,
              }}
            >
              🚀 Skapa konto & publicera
            </button>
          </motion.div>
        )}

        {publishState === "managed-confirm" && (
          <motion.div
            key="managed"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col gap-3"
          >
            <p className="text-text-body" style={{ color: "var(--color-text-secondary)" }}>
              Perfekt! Vi sköter publiceringen.
            </p>
            <ol className="flex flex-col gap-2">
              {[
                "Skapa konto (gratis)",
                "Vi granskar din kampanj",
                "Publicering inom 24h",
                "Följ resultaten i dashboarden",
              ].map((step, i) => (
                <li key={i} className="flex items-center gap-2 text-text-body" style={{ color: "var(--color-text-secondary)" }}>
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold"
                    style={{ background: "var(--color-primary-glow)", color: "var(--color-primary-light)" }}
                  >
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>

            <button
              onClick={() => handlePublish("managed")}
              className="mt-2 w-full font-semibold"
              style={{
                padding: "12px 28px",
                borderRadius: "var(--radius-sm)",
                background: "var(--color-primary)",
                color: "var(--color-text-inverse)",
                border: "none",
                boxShadow: "var(--shadow-glow-sm)",
                fontSize: 16,
              }}
            >
              🚀 Skapa konto & skicka kampanj
            </button>
          </motion.div>
        )}

        {publishState === "publishing" && (
          <motion.div
            key="publishing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 py-8"
          >
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" style={{ color: "var(--color-primary)" }} />
            <p className="text-text-body" style={{ color: "var(--color-text-secondary)" }}>
              Publicerar din kampanj...
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
