"use client";

import { motion } from "motion/react";

import { useWizardNavigation } from "@/hooks/use-wizard-navigation";
import { cardVariants, checkmarkVariants,listItemVariants, transitions } from "@/lib/motion";
import { type Platform,useWizardStore } from "@/lib/stores/wizard-store";

type PlatformDef = {
  id: Platform;
  name: string;
  subtitle: string;
  color: string;
  comingSoon?: boolean;
};

const PLATFORMS: PlatformDef[] = [
  { id: "meta", name: "Meta", subtitle: "Facebook & Instagram", color: "var(--color-meta)" },
  { id: "google", name: "Google", subtitle: "Sök & Display", color: "var(--color-google)" },
  { id: "linkedin", name: "LinkedIn", subtitle: "B2B & företag", color: "var(--color-linkedin)" },
  { id: "tiktok", name: "TikTok", subtitle: "Video & Reels", color: "var(--color-tiktok)" },
  { id: "snapchat", name: "Snapchat", subtitle: "Stories & Spotlight", color: "var(--color-snapchat)" },
  // 6th slot: coming soon placeholder
];

function PlatformCard({
  platform,
  selected,
  recommended,
  onToggle,
}: {
  platform: PlatformDef;
  selected: boolean;
  recommended: boolean;
  onToggle: () => void;
}) {
  if (platform.comingSoon) {
    return (
      <div
        className="relative flex flex-col items-start gap-2"
        style={{
          padding: "var(--space-4)",
          borderRadius: "var(--radius-lg)",
          background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border-default)",
          minHeight: 110,
          opacity: 0.4,
          pointerEvents: "none" as const,
        }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            backdropFilter: "blur(6px)",
            background: "rgba(9, 9, 11, 0.4)",
            borderRadius: "inherit",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "var(--color-text-muted)",
          }}
        >
          KOMMER SNART
        </div>
        <div className="h-8 w-8 rounded" style={{ background: "var(--color-bg-raised)" }} />
        <span className="text-text-h3" style={{ color: "var(--color-text-primary)" }}>
          &nbsp;
        </span>
      </div>
    );
  }

  return (
    <motion.button
      onClick={onToggle}
      whileHover={{ y: -2, boxShadow: "var(--shadow-md)" }}
      whileTap={{ scale: 0.98 }}
      transition={transitions.snappy}
      className="relative flex flex-col items-start gap-2 text-left transition-colors"
      style={{
        padding: "var(--space-4)",
        borderRadius: "var(--radius-lg)",
        background: "var(--color-bg-elevated)",
        border: selected
          ? "1px solid var(--color-primary)"
          : "1px solid var(--color-border-default)",
        boxShadow: selected ? "var(--shadow-glow-sm)" : "none",
        cursor: "pointer",
      }}
    >
      {/* Recommended badge */}
      {recommended && (
        <span
          className="absolute -top-2 right-3 text-text-overline"
          style={{
            padding: "2px 8px",
            borderRadius: "var(--radius-full)",
            background: "var(--color-primary-glow)",
            color: "var(--color-primary-light)",
          }}
        >
          REKOM.
        </span>
      )}

      <div
        className="flex h-9 w-9 items-center justify-center rounded text-sm font-bold"
        style={{ background: platform.color, color: "#fff" }}
      >
        {platform.name.charAt(0)}
      </div>

      <div>
        <span className="text-text-h3 block" style={{ color: "var(--color-text-primary)" }}>
          {platform.name}
        </span>
        <span className="text-text-caption" style={{ color: "var(--color-text-muted)" }}>
          {platform.subtitle}
        </span>
      </div>

      {/* Checkmark */}
      <div className="absolute bottom-3 right-3">
        {selected ? (
          <motion.svg width="20" height="20" viewBox="0 0 20 20">
            <motion.circle
              cx="10"
              cy="10"
              r="9"
              fill="var(--color-primary)"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={transitions.snappy}
            />
            <motion.path
              d="M6 10l3 3 5-6"
              fill="none"
              stroke="var(--color-text-inverse)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              variants={checkmarkVariants}
              initial="hidden"
              animate="visible"
            />
          </motion.svg>
        ) : (
          <div
            className="h-5 w-5 rounded-full"
            style={{ border: "2px solid var(--color-border-default)" }}
          />
        )}
      </div>
    </motion.button>
  );
}

export function PlatformSelectSlide() {
  const { selectedPlatforms, togglePlatform, brand, setIsGeneratingAds } =
    useWizardStore();
  const { handleNext } = useWizardNavigation();

  const recommended = brand?.recommendedPlatforms || ["meta", "google"];

  const handleContinue = async () => {
    if (selectedPlatforms.length === 0) return;
    setIsGeneratingAds(true);
    handleNext(); // goes to "ads" slide

    // Trigger ad generation in background
    try {
      const response = await fetch("/api/ad/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: {
            name: brand?.name,
            description: brand?.description,
            industry: brand?.industry,
            targetAudience: brand?.targetAudience,
            valuePropositions: brand?.valuePropositions,
            url: brand?.url,
            colors: brand?.colors,
            fonts: brand?.fonts,
          },
          platform: selectedPlatforms[0],
          language: "sv",
        }),
      });

      if (!response.ok) throw new Error("Generation failed");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No stream");

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

            if (data.event === "complete" && data.result) {
              const { copies, backgroundUrl } = data.result;
              const ads = (copies || []).map(
                (c: Record<string, string>, i: number) => ({
                  id: `ad-${i}`,
                  platform: c.platform || selectedPlatforms[0],
                  template: i === 0 ? "hero" : "brand",
                  headline: c.headline || c.headlines?.[0] || "",
                  bodyCopy: c.bodyCopy || c.descriptions?.[0] || "",
                  cta: c.cta || "Läs mer",
                  imageUrl: backgroundUrl,
                  selected: i === 0,
                })
              );
              useWizardStore.getState().setAds(ads);
            }
          } catch {
            // ignore partial
          }
        }
      }
    } catch (err) {
      console.error("Ad generation failed:", err);
    } finally {
      useWizardStore.getState().setIsGeneratingAds(false);
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={transitions.spring}
      className="flex flex-col gap-4"
    >
      <div>
        <h2 className="text-text-h1" style={{ color: "var(--color-text-primary)" }}>
          Var vill du synas?
        </h2>
        <p className="mt-1 text-text-body-sm" style={{ color: "var(--color-text-muted)" }}>
          Välj de plattformar där dina kunder finns.
        </p>
      </div>

      {recommended.length > 0 && (
        <p className="text-text-body-sm" style={{ color: "var(--color-primary-light)" }}>
          Vi rekommenderar {recommended.join(" + ")} för din bransch
        </p>
      )}

      {/* 3×2 grid */}
      <motion.div
        className="grid gap-3"
        style={{
          gridTemplateColumns: "repeat(3, 1fr)",
          maxWidth: 580,
        }}
        variants={{ visible: { transition: transitions.stagger } }}
        initial="hidden"
        animate="visible"
      >
        {PLATFORMS.map((p) => (
          <motion.div key={p.id} variants={listItemVariants}>
            <PlatformCard
              platform={p}
              selected={selectedPlatforms.includes(p.id)}
              recommended={recommended.includes(p.id)}
              onToggle={() => togglePlatform(p.id)}
            />
          </motion.div>
        ))}
        {/* Coming soon placeholder */}
        <motion.div variants={listItemVariants}>
          <PlatformCard
            platform={{ id: "meta" as Platform, name: "", subtitle: "", color: "var(--color-bg-raised)", comingSoon: true }}
            selected={false}
            recommended={false}
            onToggle={() => {}}
          />
        </motion.div>
      </motion.div>

      <button
        onClick={handleContinue}
        disabled={selectedPlatforms.length === 0}
        className="ai-breathe ml-auto mt-2 font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        style={{
          background: "var(--color-primary)",
          color: "var(--color-text-inverse)",
          padding: "12px 28px",
          borderRadius: "var(--radius-sm)",
          fontSize: 16,
          border: "none",
          boxShadow: "var(--shadow-glow-sm)",
        }}
      >
        Skapa annonser →
      </button>
    </motion.div>
  );
}
