"use client";

import { AnimatePresence } from "motion/react";

import { Skeleton } from "@/components/ui/skeleton";

import { type CompetitorData, CompetitorRadar } from "./CompetitorRadar";
import { IdentityCard,type IdentityData } from "./IdentityCard";
import { ProfileCompletion,type ProfileCompletionData } from "./ProfileCompletion";
import { type ReadinessData, ReadinessScore } from "./ReadinessScore";
import { type SocialData, SocialPresence } from "./SocialPresence";

export type LiveProfileData = {
  identity?: IdentityData;
  social?: SocialData;
  competitors?: CompetitorData;
  readiness?: ReadinessData;
  completion?: ProfileCompletionData;
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

/**
 * Assembles all profile sub-components with progressive rendering.
 * Each section appears as its data arrives via SSE streaming.
 */
export function LiveProfileView({ data }: { data: LiveProfileData }) {
  return (
    <div className="space-y-3">
      {/* Phase 1: Identity */}
      <AnimatePresence>
        {data.identity ? (
          <IdentityCard data={data.identity} />
        ) : (
          <SectionSkeleton />
        )}
      </AnimatePresence>

      {/* Phase 2: Social & online presence */}
      <AnimatePresence>
        {data.social ? (
          <SocialPresence data={data.social} />
        ) : data.identity ? (
          <SectionSkeleton lines={2} />
        ) : null}
      </AnimatePresence>

      {/* Phase 3: Competitor radar */}
      <AnimatePresence>
        {data.competitors ? (
          <CompetitorRadar data={data.competitors} />
        ) : data.social ? (
          <SectionSkeleton lines={2} />
        ) : null}
      </AnimatePresence>

      {/* Phase 4: Readiness score */}
      <AnimatePresence>
        {data.readiness ? (
          <ReadinessScore data={data.readiness} />
        ) : data.competitors ? (
          <SectionSkeleton lines={1} />
        ) : null}
      </AnimatePresence>

      {/* Phase 5: Profile completion */}
      <AnimatePresence>
        {data.completion ? (
          <ProfileCompletion data={data.completion} />
        ) : data.readiness ? (
          <SectionSkeleton lines={1} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
