"use client";

import { motion } from "motion/react";

import { useWizardNavigation } from "@/hooks/use-wizard-navigation";
import { cardVariants, checkmarkVariants, listItemVariants, transitions } from "@/lib/motion";
import { type Platform, useWizardStore } from "@/lib/stores/wizard-store";

type PlatformDef = {
  id: Platform;
  name: string;
  subtitle: string;
  icon: React.ReactNode;
  formats: string[];
  comingSoon?: boolean;
};

/* ── Platform SVG icons ─────────────────────────────────── */

const MetaIcon = () => (
  <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "#1877F2" }}>
    <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
      <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
    </svg>
  </div>
);

const GoogleIcon = () => (
  <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "#fff" }}>
    <svg width="28" height="28" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10 10 0 001 12c0 1.61.39 3.14 1.07 4.5l3.66-2.84.11.43z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  </div>
);

const LinkedInIcon = () => (
  <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "#0A66C2" }}>
    <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 110-4.12 2.06 2.06 0 010 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  </div>
);

const TikTokIcon = () => (
  <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "#555" }}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.4a8.16 8.16 0 004.77 1.53V7.49a4.85 4.85 0 01-1.01-.8z" />
    </svg>
  </div>
);

const SnapchatIcon = () => (
  <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "#FFFC00" }}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#333">
      <path d="M12.21 2c3.28 0 4.95 2.32 5.2 5.04.04.46.01.93-.03 1.4.69.25 1.34.34 1.6.38.47.06.79.38.79.76 0 .46-.46.72-.88.82-.2.05-1.22.27-1.48.34-.03.15-.04.3-.04.46 0 .22.04.44.13.65.61 1.38 2.02 3.2 4.2 3.63.27.05.44.28.4.55-.05.3-.34.52-.63.6-.59.17-1.24.27-1.93.5-.22.08-.36.28-.44.5-.09.27-.14.6-.54.67-.34.06-.71-.07-1.21-.24-.73-.24-1.63-.54-2.87-.07-.97.37-1.68 1.2-2.46 2.12-.58.68-1.24 1.36-2.14 1.36-.9 0-1.56-.68-2.14-1.36-.78-.92-1.49-1.75-2.46-2.12-1.24-.47-2.14-.17-2.87.07-.5.17-.87.3-1.21.24-.4-.07-.45-.4-.54-.67-.08-.22-.22-.42-.44-.5-.69-.23-1.34-.33-1.93-.5-.29-.08-.58-.3-.63-.6-.04-.27.13-.5.4-.55 2.18-.43 3.59-2.25 4.2-3.63.09-.21.13-.43.13-.65 0-.16-.01-.31-.04-.46-.26-.07-1.28-.29-1.48-.34-.42-.1-.88-.36-.88-.82 0-.38.32-.7.79-.76.26-.04.91-.13 1.6-.38a10 10 0 01-.03-1.4C6.84 4.32 8.51 2 11.79 2h.42z" />
    </svg>
  </div>
);

const PinterestIcon = () => (
  <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "#E68A9E" }}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.08 2.42 7.58 5.91 9.15-.08-.72-.16-1.84.03-2.63.17-.72 1.11-4.7 1.11-4.7s-.28-.57-.28-1.41c0-1.32.76-2.31 1.71-2.31.81 0 1.2.61 1.2 1.33 0 .81-.51 2.02-.78 3.14-.22.94.47 1.71 1.4 1.71 1.68 0 2.97-1.77 2.97-4.33 0-2.27-1.63-3.85-3.96-3.85-2.7 0-4.28 2.02-4.28 4.11 0 .81.31 1.68.7 2.16.08.09.09.17.07.27-.07.3-.24.94-.27 1.07-.04.18-.15.22-.34.13-1.25-.58-2.03-2.41-2.03-3.88 0-3.16 2.3-6.06 6.63-6.06 3.48 0 6.19 2.48 6.19 5.79 0 3.46-2.18 6.24-5.21 6.24-1.02 0-1.97-.53-2.3-1.15l-.63 2.38c-.23.87-.84 1.96-1.26 2.63A10 10 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
    </svg>
  </div>
);

/* ── Platform data ──────────────────────────────────────── */

const PLATFORMS: PlatformDef[] = [
  { id: "meta", name: "Meta", subtitle: "Facebook & Instagram", icon: <MetaIcon />, formats: ["Feed & Stories", "Reels", "Instagram"] },
  { id: "google", name: "Google", subtitle: "Sök & Display", icon: <GoogleIcon />, formats: ["Sök", "Display", "YouTube"] },
  { id: "linkedin", name: "LinkedIn", subtitle: "B2B-fokus", icon: <LinkedInIcon />, formats: ["Sponsored", "InMail", "B2B"] },
  { id: "tiktok", name: "TikTok", subtitle: "Kortvideo & Gen Z", icon: <TikTokIcon />, formats: ["In-Feed", "TopView", "Spark Ads"], comingSoon: true },
  { id: "snapchat", name: "Snapchat", subtitle: "AR & Story Ads", icon: <SnapchatIcon />, formats: ["Snap Ads", "Story Ads", "AR Lens"], comingSoon: true },
];

const COMING_SOON_EXTRA: PlatformDef = {
  id: "snapchat" as Platform,
  name: "Pinterest",
  subtitle: "Shopping & Inspiration",
  icon: <PinterestIcon />,
  formats: ["Pins", "Shopping", "Idea Ads"],
  comingSoon: true,
};

/* ── Card component ─────────────────────────────────────── */

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
      className="relative flex w-full flex-col items-center text-center"
      style={{
        padding: "20px 12px 14px",
        borderRadius: 16,
        background: selected
          ? "linear-gradient(135deg, rgba(99,102,241,0.10) 0%, rgba(99,102,241,0.03) 100%)"
          : "rgba(255,255,255,0.025)",
        border: selected
          ? "2px solid var(--color-primary)"
          : "1px solid rgba(255,255,255,0.06)",
        boxShadow: selected
          ? "0 0 20px rgba(99,102,241,0.12)"
          : "none",
        cursor: isSoon ? "default" : "pointer",
        opacity: isSoon ? 0.4 : 1,
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
      <div className="mb-2">{platform.icon}</div>

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
    </motion.button>
  );
}

/* ── Main slide ─────────────────────────────────────────── */

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

      {/* 3×2 grid — all cards equal height */}
      <motion.div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(3, 1fr)",
          gridAutoRows: "1fr",
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
            platform={COMING_SOON_EXTRA}
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
