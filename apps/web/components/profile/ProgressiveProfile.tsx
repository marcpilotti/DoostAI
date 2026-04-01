"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Building2, Globe, BarChart3, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type ProfilePhase = {
  identity?: {
    name: string;
    url: string;
    industry?: string;
    employees?: number;
    colors: string[];
    fonts: string[];
    logoUrl?: string;
  };
  social?: {
    profiles: Array<{ platform: string; url: string; verified: boolean }>;
    mobileScore?: number;
    hasMetaPixel?: boolean;
    hasGoogleTag?: boolean;
  };
  competitors?: {
    names: string[];
    adCount?: number;
  };
  readiness?: {
    score: number;
    breakdown?: Record<string, number>;
  };
};

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
};

function SectionSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2 p-4">
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" />
      ))}
    </div>
  );
}

export function ProgressiveProfile({ data }: { data: ProfilePhase }) {
  const prefersReduced = useReducedMotion();
  const variants = prefersReduced ? {} : fadeIn;

  return (
    <div className="space-y-3">
      {/* Phase 1: Identity card */}
      <AnimatePresence>
        {data.identity ? (
          <motion.div
            key="identity"
            {...variants}
            className="rounded-xl bg-[var(--doost-bg)] p-4"
            style={{ border: "1px solid var(--doost-border)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-[var(--doost-text-muted)]" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--doost-text-muted)]">Identitet</span>
            </div>
            <h3 className="text-[16px] font-semibold text-[var(--doost-text)]">{data.identity.name}</h3>
            <p className="text-[12px] text-[var(--doost-text-muted)]">{data.identity.url}</p>
            {data.identity.industry && (
              <p className="mt-1 text-[12px] text-[var(--doost-text-secondary)]">
                {data.identity.industry}
                {data.identity.employees ? ` · ${data.identity.employees} anställda` : ""}
              </p>
            )}
            {data.identity.colors.length > 0 && (
              <div className="mt-3 flex gap-1.5">
                {data.identity.colors.slice(0, 5).map((c, i) => (
                  <div
                    key={i}
                    className="h-6 w-6 rounded-md"
                    style={{ backgroundColor: c, border: "1px solid var(--doost-border)" }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <SectionSkeleton />
        )}
      </AnimatePresence>

      {/* Phase 2: Social & online presence */}
      <AnimatePresence>
        {data.social ? (
          <motion.div
            key="social"
            {...variants}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const, delay: 0.15 }}
            className="rounded-xl bg-[var(--doost-bg)] p-4"
            style={{ border: "1px solid var(--doost-border)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4 text-[var(--doost-text-muted)]" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--doost-text-muted)]">Digital närvaro</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.social.profiles.map((p) => (
                <span
                  key={p.platform}
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                    p.verified
                      ? "bg-[var(--doost-bg-badge-ready)] text-[var(--doost-text-positive)]"
                      : "bg-[var(--doost-bg-secondary)] text-[var(--doost-text-muted)]"
                  }`}
                >
                  {p.platform} {p.verified ? "✓" : "?"}
                </span>
              ))}
            </div>
            {data.social.mobileScore != null && (
              <p className="mt-2 text-[12px] text-[var(--doost-text-secondary)]">
                Mobilpoäng: {data.social.mobileScore}/100
                {data.social.hasMetaPixel && " · Meta Pixel ✓"}
                {data.social.hasGoogleTag && " · Google Tag ✓"}
              </p>
            )}
          </motion.div>
        ) : data.identity ? (
          <SectionSkeleton lines={2} />
        ) : null}
      </AnimatePresence>

      {/* Phase 3: Competitor radar */}
      <AnimatePresence>
        {data.competitors ? (
          <motion.div
            key="competitors"
            {...variants}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const, delay: 0.3 }}
            className="rounded-xl bg-[var(--doost-bg)] p-4"
            style={{ border: "1px solid var(--doost-border)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-[var(--doost-text-muted)]" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--doost-text-muted)]">Konkurrenter</span>
            </div>
            {data.competitors.names.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {data.competitors.names.map((name) => (
                  <span key={name} className="rounded-full bg-[var(--doost-bg-secondary)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--doost-text)]">
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-[var(--doost-text-muted)]">Inga konkurrenter hittade</p>
            )}
          </motion.div>
        ) : data.social ? (
          <SectionSkeleton lines={2} />
        ) : null}
      </AnimatePresence>

      {/* Phase 4: Readiness score */}
      <AnimatePresence>
        {data.readiness ? (
          <motion.div
            key="readiness"
            {...variants}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const, delay: 0.45 }}
            className="rounded-xl bg-[var(--doost-bg)] p-4"
            style={{ border: "1px solid var(--doost-border)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-[var(--doost-text-muted)]" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--doost-text-muted)]">Marknadsföringsberedskap</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[28px] font-bold text-[var(--doost-text)]">{data.readiness.score}</span>
              <span className="text-[14px] text-[var(--doost-text-muted)]">/ 100</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--doost-bg-secondary)]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${data.readiness.score}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  data.readiness.score >= 70
                    ? "bg-[var(--doost-text-positive)]"
                    : data.readiness.score >= 40
                      ? "bg-[var(--color-warning,#F59E0B)]"
                      : "bg-[var(--color-error,#DC2626)]"
                }`}
              />
            </div>
          </motion.div>
        ) : data.competitors ? (
          <SectionSkeleton lines={1} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
