"use client";

import { motion } from "motion/react";
import { useCallback, useState } from "react";
import { z } from "zod";

import { useWizardStore } from "@/lib/stores/wizard-store";

const urlSchema = z.string().min(3).refine(
  (val) => {
    try {
      new URL(val.startsWith("http") ? val : `https://${val}`);
      return true;
    } catch {
      return false;
    }
  },
  { message: "Ange en giltig webbadress" }
);

export function UrlInputSlide() {
  const { url, setUrl, setStep, setBrand, setAudience, setPreGeneratedImageUrl } = useWizardStore();
  const [input, setInput] = useState(url || "");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    const cleanUrl = input.startsWith("http") ? input : `https://${input}`;
    const result = urlSchema.safeParse(cleanUrl);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Ogiltig webbadress");
      return;
    }

    setError("");
    setUrl(cleanUrl);
    setIsLoading(true);
    setStep("loading");

    try {
      const response = await fetch("/api/brand/analyze/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cleanUrl }),
      });

      if (!response.ok) throw new Error("Analys misslyckades");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Ingen stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") continue;

          try {
            const data = JSON.parse(raw);

            if (data.event === "complete" && data.profile) {
              const p = data.profile;
              setBrand({
                name: p.name || "",
                description: p.description || "",
                industry: p.industry || "",
                subIndustry: p.subIndustry,
                targetAudience: p.targetAudience || "",
                valuePropositions: p.valuePropositions || [],
                logoUrl: p.logos?.primary || p.logoUrl,
                iconUrl: p.logos?.icon,
                url: cleanUrl,
                colors: p.colors || { primary: "#6366F1" },
                fonts: p.fonts,
                products: p.products || [],
                prices: p.prices || [],
                offers: p.offers || [],
                detectedLocation: p.detectedLocation || p.location,
                recommendedPlatforms: p.recommendedPlatforms || p.competitors ? ["meta", "google"] : [],
                socialProfiles: p.socialProfiles,
              });

              // Pre-generate ad image with GPT-4o in background.
              // Runs while user browses brand card → audience → platform (~15-30s).
              // By the time they click "Skapa annonser", the image is ready.
              if (p.industry && p.colors?.primary) {
                fetch("/api/ad/pregenerate-image", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    brandName: p.name,
                    brandColor: p.colors.primary,
                    brandAccent: p.colors.accent ?? p.colors.secondary,
                    industry: p.industry,
                    description: p.description,
                    brandVoice: p.brandVoice,
                    targetAudience: p.targetAudience,
                  }),
                }).then(async (res) => {
                  if (res.ok) {
                    const { imageUrl } = await res.json();
                    if (imageUrl) setPreGeneratedImageUrl(imageUrl);
                  }
                }).catch(() => { /* non-critical */ });
              }

              if (p.targetAudience || p.valuePropositions?.length) {
                setAudience({
                  interests: [],
                  challenges: [],
                  usps: p.valuePropositions || [],
                });
              }

              setStep("brand");
            }
          } catch {
            // ignore parse errors for partial chunks
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel");
      setStep("url");
    } finally {
      setIsLoading(false);
    }
  }, [input, setUrl, setStep, setBrand, setAudience, setPreGeneratedImageUrl]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {/* Centered content */}
      <div
        className="flex flex-1 flex-col items-center justify-center text-center"
        style={{ padding: "0 24px 72px" }}
      >
        {/* Hero headline */}
        <motion.h1
          className="mb-3 font-sketch"
          style={{
            color: "var(--color-text-primary)",
            fontSize: "clamp(40px, 7vw, 64px)",
            lineHeight: 1.1,
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          Skippa byrån.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="mb-8 text-[16px]"
          style={{ color: "var(--color-text-muted)", maxWidth: 480 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
        >
          Klistra in din URL. Få färdiga annonser för Meta, Google och LinkedIn
          på 60 sekunder.
        </motion.p>

        {/* Input + button — unified search bar */}
        <motion.div
          className="url-input-container flex w-full items-stretch gap-0 overflow-hidden"
          style={{
            maxWidth: 520,
            minHeight: 56,
            borderRadius: 14,
            background: "var(--color-bg-elevated)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
        >
          <input
            type="url"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Klistra in din hemsida, t.ex. företag.se"
            disabled={isLoading}
            autoFocus
            className="url-input min-w-0 flex-1 bg-transparent font-medium outline-none"
            style={{
              color: "var(--color-text-primary)",
              padding: "16px 20px",
              fontSize: 15,
              border: "none",
            }}
          />
          <motion.button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            whileHover={{ scale: 1.02, filter: "brightness(1.15)" }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="flex flex-shrink-0 items-center justify-center gap-2 font-semibold transition-all disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, #818CF8, #6366F1)",
              color: "#fff",
              padding: "12px 24px",
              margin: "6px",
              borderRadius: 10,
              fontSize: 14,
              border: "none",
              cursor: !input.trim() || isLoading ? "not-allowed" : "pointer",
              boxShadow: "0 2px 16px rgba(99, 102, 241, 0.35)",
            }}
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Skapar...
              </>
            ) : (
              "Skapa min annons"
            )}
          </motion.button>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 text-[13px]"
            style={{ color: "var(--color-error)" }}
          >
            {error}
          </motion.p>
        )}

        {/* Example URL — clickable to auto-fill */}
        <motion.p
          className="mt-6 text-[13px]"
          style={{ color: "var(--color-text-muted)" }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
        >
          Testa med en riktig sajt:{" "}
          <button
            type="button"
            onClick={() => {
              setInput("idewerksbeauty.se");
              setError("");
            }}
            className="cursor-pointer underline underline-offset-2 transition-colors hover:text-[var(--color-text-secondary)]"
            style={{
              color: "inherit",
              background: "none",
              border: "none",
              font: "inherit",
              padding: 0,
            }}
          >
            idewerksbeauty.se
          </button>
        </motion.p>
      </div>
    </div>
  );
}
