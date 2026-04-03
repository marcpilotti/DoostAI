"use client";

import { motion } from "motion/react";
import { useCallback,useState } from "react";
import { z } from "zod";

import { cardVariants,transitions } from "@/lib/motion";
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
  const { url, setUrl, setStep, setBrand, setAudience } = useWizardStore();
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
  }, [input, setUrl, setStep, setBrand, setAudience]);

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={transitions.spring}
      className="flex flex-col items-center text-center"
    >
      <h1
        className="text-text-hero mb-3"
        style={{ color: "var(--color-text-primary)" }}
      >
        Ange din webbadress så skapar vi dina annonser med AI
      </h1>

      <div className="mt-8 flex w-full flex-col items-center" style={{ maxWidth: 440 }}>
        {/* URL input with ai-border gradient */}
        <div
          className="ai-border w-full"
          style={{
            borderRadius: "var(--radius-md)",
            padding: 1,
          }}
        >
          <input
            type="url"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="mittforetag.se"
            disabled={isLoading}
            autoFocus
            className="url-input w-full font-medium outline-none"
            style={{
              background: "var(--color-bg-input)",
              border: "1px solid var(--color-border-default)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-text-primary)",
              padding: "14px 20px",
              fontSize: 18,
            }}
          />
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 self-start text-[13px]"
            style={{ color: "var(--color-error)" }}
          >
            {error}
          </motion.p>
        )}

        {/* CTA — auto-width, centered */}
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading}
          className="cta-primary mt-5"
          style={{ minWidth: 180, padding: "14px 40px" }}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Analyserar...
            </span>
          ) : (
            "Analysera →"
          )}
        </button>
      </div>

      {/* Social proof */}
      <p
        className="mt-8 text-[13px]"
        style={{ color: "var(--color-text-muted)" }}
      >
        Gratis att testa · Inga konton krävs · Klart på 2 min
      </p>
    </motion.div>
  );
}
