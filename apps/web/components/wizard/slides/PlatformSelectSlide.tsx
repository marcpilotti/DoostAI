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
  { id: "meta", name: "Meta", subtitle: "Facebook & Instagram", color: "#1877F2", formats: ["Feed & Stories", "Reels", "Instagram"] },
  { id: "google", name: "Google", subtitle: "Sök & Display", color: "#4285F4", formats: ["Sök", "Display", "YouTube"] },
  { id: "linkedin", name: "LinkedIn", subtitle: "B2B-fokus", color: "#0A66C2", formats: ["Sponsored", "InMail", "B2B"] },
  { id: "tiktok", name: "TikTok", subtitle: "Kortvideo & Gen Z", color: "#25F4EE", formats: ["In-Feed", "TopView"], comingSoon: true },
  { id: "snapchat", name: "Snapchat", subtitle: "AR & Story Ads", color: "#FFFC00", formats: ["Snap Ads", "AR Lens"], comingSoon: true },
];

const COMING_SOON_PLACEHOLDER: PlatformDef = {
  id: "snapchat" as Platform,
  name: "Pinterest",
  subtitle: "Shopping & Inspiration",
  color: "#E60023",
  formats: ["Pins", "Shopping"],
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
      whileHover={isSoon ? {} : { y: -3 }}
      whileTap={isSoon ? {} : { scale: 0.97 }}
      transition={transitions.snappy}
      className="relative flex flex-col items-center text-center"
      style={{
        padding: "24px 16px 18px",
        borderRadius: 16,
        background: selected
          ? "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.02) 100%)"
          : "rgba(255,255,255,0.03)",
        border: selected
          ? "1.5px solid var(--color-primary)"
          : "1px solid rgba(255,255,255,0.06)",
        boxShadow: selected
          ? "0 0 24px rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,0.05)"
          : "inset 0 1px 0 rgba(255,255,255,0.03)",
        cursor: isSoon ? "default" : "pointer",
        opacity: isSoon ? 0.35 : 1,
        minHeight: isSoon ? 90 : "auto",
      }}
    >
      {/* REKOM badge */}
      {recommended && !isSoon && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap"
          style={{
            padding: "3px 12px",
            borderRadius: 20,
            background: "var(--color-primary)",
            color: "#fff",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.08em",
          }}
        >
          REKOM.
        </span>
      )}

      {/* Snart badge */}
      {isSoon && (
        <span
          className="absolute -top-2 right-3"
          style={{
            padding: "2px 8px",
            borderRadius: 20,
            background: "rgba(255,255,255,0.06)",
            color: "var(--color-text-muted)",
            fontSize: 10,
            fontWeight: 600,
          }}
        >
          Snart
        </span>
      )}

      {/* Checkmark top-right */}
      {!isSoon && (
        <div className="absolute -right-2 -top-2">
          {selected ? (
            <motion.svg width="26" height="26" viewBox="0 0 26 26">
              <motion.circle
                cx="13"
                cy="13"
                r="12"
                fill="var(--color-primary)"
                stroke="var(--color-bg-base)"
                strokeWidth="2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={transitions.snappy}
              />
              <motion.path
                d="M8 13l3.5 3.5 6.5-7"
                fill="none"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                variants={checkmarkVariants}
                initial="hidden"
                animate="visible"
              />
            </motion.svg>
          ) : (
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: "1.5px solid rgba(255,255,255,0.12)",
                background: "var(--color-bg-base)",
              }}
            />
          )}
        </div>
      )}

      {/* Icon */}
      <div
        className="mb-3 flex items-center justify-center"
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: isSoon ? "rgba(255,255,255,0.04)" : platform.color,
          color: isSoon ? "var(--color-text-muted)" : "#fff",
          fontSize: 22,
          fontWeight: 800,
          boxShadow: isSoon ? "none" : `0 4px 16px ${platform.color}40`,
        }}
      >
        {platform.name.charAt(0)}
      </div>

      {/* Name */}
      <span
        className="mb-0.5 text-[15px] font-bold"
        style={{ color: isSoon ? "var(--color-text-muted)" : "var(--color-text-primary)" }}
      >
        {platform.name}
      </span>

      {/* Subtitle */}
      <span
        className="mb-2 text-[12px]"
        style={{ color: "var(--color-text-muted)" }}
      >
        {platform.subtitle}
      </span>

      {/* Format tags */}
      {!isSoon && (
        <div className="flex flex-wrap justify-center gap-1">
          {platform.formats.map((f) => (
            <span
              key={f}
              style={{
                padding: "2px 8px",
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.08)",
                color: selected ? "var(--color-primary-light)" : "var(--color-text-muted)",
                fontSize: 11,
                fontWeight: 500,
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
      className="flex flex-col"
      style={{ gap: 10 }}
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
        className="grid"
        style={{
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
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
        className="cta-primary ml-auto mt-1"
      >
        Skapa annonser →
      </button>
    </motion.div>
  );
}
