"use client";

import { type LiveProfileData, LiveProfileView } from "./LiveProfileView";

type ProfilePhase = LiveProfileData;

export function ProgressiveProfile({ data }: { data: ProfilePhase }) {
  return <LiveProfileView data={data} />;
}
