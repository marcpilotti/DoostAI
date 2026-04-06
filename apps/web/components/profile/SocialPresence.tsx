"use client";

import { Globe } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

export type SocialData = {
  profiles: Array<{ platform: string; url: string; verified: boolean; followers?: number }>;
  mobileScore?: number;
  hasMetaPixel?: boolean;
  hasGoogleTag?: boolean;
  hasLinkedinTag?: boolean;
};

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const, delay: 0.15 },
};

export function SocialPresence({ data }: { data: SocialData }) {
  const prefersReduced = useReducedMotion();
  const variants = prefersReduced ? {} : fadeIn;

  return (
    <motion.div
      {...variants}
      className="rounded-xl bg-[var(--doost-bg)] p-4"
      style={{ border: "1px solid var(--doost-border)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Globe className="h-4 w-4 text-[var(--doost-text-muted)]" />
        <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--doost-text-muted)]">
          Digital närvaro
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {data.profiles.map((p) => (
          <span
            key={p.platform}
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
              p.verified
                ? "bg-[var(--doost-bg-badge-ready)] text-[var(--doost-text-positive)]"
                : "bg-[var(--doost-bg-secondary)] text-[var(--doost-text-muted)]"
            }`}
          >
            {p.platform} {p.verified ? "✓" : "?"}
            {p.followers != null ? ` · ${p.followers.toLocaleString()}` : ""}
          </span>
        ))}
      </div>
      {data.mobileScore != null && (
        <p className="mt-2 text-[12px] text-[var(--doost-text-secondary)]">
          Mobilpoäng: {data.mobileScore}/100
          {data.hasMetaPixel && " · Meta Pixel ✓"}
          {data.hasGoogleTag && " · Google Tag ✓"}
          {data.hasLinkedinTag && " · LinkedIn Tag ✓"}
        </p>
      )}
    </motion.div>
  );
}
