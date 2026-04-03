"use client";

import { motion } from "motion/react";

import { useWizardNavigation } from "@/hooks/use-wizard-navigation";
import { cardVariants, checkmarkVariants, listItemVariants, transitions } from "@/lib/motion";
import { type Platform, useWizardStore } from "@/lib/stores/wizard-store";

type PlatformDef = {
  id: Platform;
  name: string;
  subtitle: string;
  color: string;
  formats: string[];
  comingSoon?: boolean;
};

const PLATFORMS: PlatformDef[] = [
  { id: "meta", name: "Meta", subtitle: "Facebook & Instagram", color: "var(--color-meta)", formats: ["Feed & Stories", "Reels", "Instagram"] },
  { id: "google", name: "Google", subtitle: "Sök & Display", color: "var(--color-google)", formats: ["Sök", "Display", "YouTube"] },
  { id: "linkedin", name: "LinkedIn", subtitle: "B2B & företag", color: "var(--color-linkedin)", formats: ["Sponsored", "InMail", "B2B"] },
  { id: "tiktok", name: "TikTok", subtitle: "Video & Reels", color: "#000000", formats: ["In-Feed", "TopView", "Spark Ads"], comingSoon: true },
  { id: "snapchat", name: "Snapchat", subtitle: "AR & Story Ads", color: "#FFFC00", formats: ["Snap Ads", "Story Ads", "AR Lens"], comingSoon: true },
];

// 6th slot placeholder
const COMING_SOON_PLACEHOLDER: PlatformDef = {
  id: "snapchat" as Platform,
  name: "Pinterest",
  subtitle: "Shopping & Inspiration",
  color: "#E60023",
  formats: ["Pins", "Shopping", "Idea Ads"],
  comingSoon: true,
};

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
  const isSoon = platform.comingSoon;

  return (
    <motion.button
      onClick={isSoon ? undefined : onToggle}
      whileHover={isSoon ? {} : { y: -2, boxShadow: "var(--shadow-md)" }}
      whileTap={isSoon ? {} : { scale: 0.98 }}
      transition={transitions.snappy}
      className="relative flex flex-col items-center gap-2 text-center"
      style={{
        padding: "16px 12px 12px",
        borderRadius: "var(--radius-lg)",
        background: "var(--color-bg-elevated)",
        border: selected
          ? "2px solid var(--color-primary)"
          : "1px solid var(--color-border-default)",
        boxShadow: selected ? "var(--shadow-glow-sm)" : "none",
        cursor: isSoon ? "default" : "pointer",
        opacity: isSoon ? 0.45 : 1,
      }}
    >
      {/* Recommended badge */}
      {recommended && !isSoon && (
        <span
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-text-overline"
          style={{
            padding: "2px 10px",
            borderRadius: "var(--radius-full)",
            background: "var(--color-primary-glow)",
            color: "var(--color-primary-light)",
          }}
        >
          REKOM.
        </span>
      )}

      {/* "Snart" badge for coming soon */}
      {isSoon && (
        <span
          className="absolute -top-2 right-3 text-text-overline"
          style={{
            padding: "2px 8px",
            borderRadius: "var(--radius-full)",
            background: "var(--color-bg-raised)",
            color: "var(--color-text-muted)",
          }}
        >
          Snart
        </span>
      )}

      {/* Checkmark — top right */}
      {!isSoon && (
        <div className="absolute -right-1.5 -top-1.5">
          {selected ? (
            <motion.svg width="24" height="24" viewBox="0 0 24 24">
              <motion.circle
                cx="12"
                cy="12"
                r="11"
                fill="var(--color-primary)"
                stroke="var(--color-bg-base)"
                strokeWidth="2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={transitions.snappy}
              />
              <motion.path
                d="M7 12l3.5 3.5 6-7"
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
              style={{
                border: "2px solid var(--color-border-default)",
                background: "var(--color-bg-base)",
              }}
            />
          )}
        </div>
      )}

      {/* Large icon */}
      <div
        className="flex h-11 w-11 items-center justify-center rounded-lg text-lg font-bold"
        style={{
          background: isSoon ? "var(--color-bg-raised)" : platform.color,
          color: platform.color === "#FFFC00" || platform.color === "#000000" ? (isSoon ? "var(--color-text-muted)" : platform.color === "#FFFC00" ? "#000" : "#fff") : "#fff",
        }}
      >
        {platform.name.charAt(0)}
      </div>

      {/* Name + subtitle */}
      <div>
        <span className="text-text-h3 block font-bold" style={{ color: isSoon ? "var(--color-text-muted)" : "var(--color-text-primary)" }}>
          {platform.name}
        </span>
        <span className="text-text-caption" style={{ color: "var(--color-text-muted)" }}>
          {platform.subtitle}
        </span>
      </div>

      {/* Format tags — hide on coming soon to save space */}
      {!isSoon && (
        <div className="flex flex-wrap justify-center gap-1">
          {platform.formats.map((f) => (
            <span
              key={f}
              className="text-[11px] font-medium"
              style={{
                padding: "1px 7px",
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--color-border-default)",
                color: "var(--color-text-secondary)",
              }}
            >
              {f}
            </span>
          ))}
        </div>
      )}
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
    handleNext();

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
      className="flex flex-col gap-2"
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
        className="grid gap-2.5"
        style={{
          gridTemplateColumns: "repeat(3, 1fr)",
          maxWidth: 640,
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
        <motion.div variants={listItemVariants}>
          <PlatformCard
            platform={COMING_SOON_PLACEHOLDER}
            selected={false}
            recommended={false}
            onToggle={() => {}}
          />
        </motion.div>
      </motion.div>

      <button
        onClick={handleContinue}
        disabled={selectedPlatforms.length === 0}
        className="cta-primary ml-auto mt-2"
      >
        Skapa annonser →
      </button>
    </motion.div>
  );
}
