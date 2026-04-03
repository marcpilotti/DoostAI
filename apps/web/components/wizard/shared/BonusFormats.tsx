"use client";

import { motion } from "motion/react";
import { useState } from "react";

import { transitions } from "@/lib/motion";

type BonusFormatsProps = {
  headline: string;
  bodyCopy: string;
  cta: string;
  brandName: string;
  primaryColor: string;
  logoUrl?: string;
};

const FORMATS = [
  { label: "Instagram Story", ratio: "9/16", width: 130, height: 231 },
  { label: "Google Display", ratio: "728/90", width: 260, height: 32 },
  { label: "LinkedIn Post", ratio: "1.91/1", width: 220, height: 115 },
] as const;

function StoryCard({
  headline,
  cta,
  primaryColor,
  logoUrl,
}: Pick<BonusFormatsProps, "headline" | "cta" | "primaryColor" | "logoUrl">) {
  return (
    <div
      className="relative flex h-full w-full flex-col justify-between overflow-hidden p-3"
      style={{ background: `linear-gradient(180deg, ${primaryColor} 0%, ${primaryColor}CC 100%)` }}
    >
      <div
        className="absolute -right-6 -top-6 h-20 w-20 rounded-full"
        style={{ background: "rgba(255,255,255,0.08)" }}
      />
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          className="h-5 w-5 rounded object-contain"
          style={{ background: "rgba(255,255,255,0.15)", padding: 2 }}
        />
      ) : (
        <div className="h-5 w-5" />
      )}
      <div className="flex flex-col gap-1.5">
        <p className="text-[8px] font-bold leading-tight text-white">{headline}</p>
        <span
          className="self-start rounded-md px-2 py-0.5 text-[7px] font-bold"
          style={{ background: "rgba(255,255,255,0.95)", color: primaryColor }}
        >
          {cta}
        </span>
      </div>
    </div>
  );
}

function BannerCard({
  headline,
  cta,
  brandName,
  primaryColor,
  logoUrl,
}: Pick<BonusFormatsProps, "headline" | "cta" | "brandName" | "primaryColor" | "logoUrl">) {
  return (
    <div
      className="flex h-full w-full items-center justify-between overflow-hidden px-3"
      style={{ background: primaryColor }}
    >
      <div className="flex items-center gap-2">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            className="h-4 w-4 rounded-sm object-contain"
            style={{ background: "rgba(255,255,255,0.15)", padding: 1 }}
          />
        ) : (
          <span className="text-[6px] font-bold text-white/60">{brandName}</span>
        )}
        <p className="text-[7px] font-bold leading-tight text-white">{headline}</p>
      </div>
      <span
        className="flex-shrink-0 rounded px-2 py-0.5 text-[6px] font-bold"
        style={{ background: "rgba(255,255,255,0.95)", color: primaryColor }}
      >
        {cta}
      </span>
    </div>
  );
}

function LinkedInCard({
  headline,
  bodyCopy,
  cta,
  primaryColor,
}: Pick<BonusFormatsProps, "headline" | "bodyCopy" | "cta" | "primaryColor">) {
  return (
    <div
      className="flex h-full w-full flex-col justify-end overflow-hidden p-3"
      style={{ background: `linear-gradient(145deg, ${primaryColor} 0%, ${primaryColor}DD 100%)` }}
    >
      <div
        className="absolute -right-4 top-2 h-14 w-14 rounded-full"
        style={{ background: "rgba(255,255,255,0.06)" }}
      />
      <p className="text-[9px] font-bold leading-tight text-white">{headline}</p>
      <p className="mt-0.5 text-[7px] leading-snug text-white/70">
        {bodyCopy.length > 60 ? bodyCopy.slice(0, 60) + "..." : bodyCopy}
      </p>
      <span
        className="mt-1.5 self-start rounded-md px-2 py-0.5 text-[7px] font-bold"
        style={{ background: "rgba(255,255,255,0.95)", color: primaryColor }}
      >
        {cta}
      </span>
    </div>
  );
}

export function BonusFormats({
  headline,
  bodyCopy,
  cta,
  brandName,
  primaryColor,
  logoUrl,
}: BonusFormatsProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      {!revealed && (
        <motion.button
          onClick={() => setRevealed(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={transitions.snappy}
          className="self-center rounded-lg px-4 py-1.5 text-[11px] font-semibold"
          style={{
            background: "rgba(99,102,241,0.1)",
            color: "var(--color-primary-light)",
            border: "1px solid rgba(99,102,241,0.2)",
          }}
        >
          Plus: vi skapade dessa också +3
        </motion.button>
      )}

      {revealed && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitions.spring}
          className="flex flex-col gap-2"
        >
          <p
            className="text-center text-[11px] font-semibold"
            style={{ color: "var(--color-primary-light)" }}
          >
            Plus: vi skapade dessa också.
          </p>

          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
            {FORMATS.map((fmt, i) => (
              <motion.div
                key={fmt.label}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: i * 0.12,
                  type: "spring",
                  damping: 22,
                  stiffness: 220,
                }}
                className="flex flex-shrink-0 flex-col items-center gap-1"
              >
                <div
                  className="relative overflow-hidden"
                  style={{
                    width: fmt.width,
                    height: fmt.height,
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {fmt.label === "Instagram Story" && (
                    <StoryCard
                      headline={headline}
                      cta={cta}
                      primaryColor={primaryColor}
                      logoUrl={logoUrl}
                    />
                  )}
                  {fmt.label === "Google Display" && (
                    <BannerCard
                      headline={headline}
                      cta={cta}
                      brandName={brandName}
                      primaryColor={primaryColor}
                      logoUrl={logoUrl}
                    />
                  )}
                  {fmt.label === "LinkedIn Post" && (
                    <LinkedInCard
                      headline={headline}
                      bodyCopy={bodyCopy}
                      cta={cta}
                      primaryColor={primaryColor}
                    />
                  )}
                </div>
                <span
                  className="text-[9px] font-medium"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {fmt.label}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
