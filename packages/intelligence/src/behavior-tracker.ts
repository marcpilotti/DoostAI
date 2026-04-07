/**
 * Behavior tracking — learns customer preferences from interactions.
 * Tracks approval speed, edit patterns, platform preferences, and tone adjustments.
 * Aggregates signals into the brand profile's behaviorProfile field.
 */

import { behaviorSignals, brandProfiles, db, eq } from "@doost/db";

export type BehaviorSignalType =
  | "approval_speed"
  | "edit_pattern"
  | "platform_preference"
  | "tone_adjustment"
  | "regeneration"
  | "session_length";

export type BehaviorSignalData = {
  approvalSpeedMs?: number;
  editField?: "headline" | "bodyCopy" | "cta";
  editLengthDelta?: number;
  platform?: string;
  toneDirection?: string;
  regenerateCount?: number;
  sessionLengthMs?: number;
};

/**
 * Record a single behavior signal.
 */
export async function trackSignal(
  orgId: string,
  signalType: BehaviorSignalType,
  data: BehaviorSignalData,
  confidence: number = 0.5,
): Promise<void> {
  await db.insert(behaviorSignals).values({
    orgId,
    signalType,
    signalData: data as unknown as Record<string, unknown>,
    confidence: String(confidence),
    dataPoints: 1,
  });
}

/**
 * Aggregate all signals for an org into a behavior profile.
 * Called periodically (e.g., after every 10 interactions or weekly).
 */
export async function aggregateBehaviorProfile(orgId: string): Promise<void> {
  const signals = await db
    .select()
    .from(behaviorSignals)
    .where(eq(behaviorSignals.orgId, orgId));

  if (signals.length === 0) return;

  // Aggregate approval speed
  const approvalSignals = signals
    .filter((s) => s.signalType === "approval_speed")
    .map((s) => (s.signalData as BehaviorSignalData)?.approvalSpeedMs ?? 0)
    .filter((ms) => ms > 0);

  const avgApproval = approvalSignals.length > 0
    ? approvalSignals.reduce((a, b) => a + b, 0) / approvalSignals.length
    : null;

  const controlLevel = avgApproval === null
    ? undefined
    : avgApproval < 30_000 ? "hands-off"
    : avgApproval < 120_000 ? "moderate"
    : "hands-on";

  // Aggregate edit patterns → headline preference
  const editSignals = signals
    .filter((s) => s.signalType === "edit_pattern")
    .map((s) => (s.signalData as BehaviorSignalData)?.editLengthDelta ?? 0);

  const avgLengthDelta = editSignals.length > 0
    ? editSignals.reduce((a, b) => a + b, 0) / editSignals.length
    : 0;

  const headlinePreference = avgLengthDelta < -5 ? "shorter"
    : avgLengthDelta > 5 ? "longer"
    : "same";

  // Aggregate platform preferences
  const platformSignals = signals
    .filter((s) => s.signalType === "platform_preference")
    .map((s) => (s.signalData as BehaviorSignalData)?.platform)
    .filter(Boolean) as string[];

  const platformCounts = new Map<string, number>();
  for (const p of platformSignals) {
    platformCounts.set(p, (platformCounts.get(p) ?? 0) + 1);
  }
  const preferredPlatforms = [...platformCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([p]) => p);

  // Aggregate tone adjustments
  const toneSignals = signals
    .filter((s) => s.signalType === "tone_adjustment")
    .map((s) => (s.signalData as BehaviorSignalData)?.toneDirection)
    .filter(Boolean) as string[];

  const toneCounts = new Map<string, number>();
  for (const t of toneSignals) {
    toneCounts.set(t, (toneCounts.get(t) ?? 0) + 1);
  }
  const copyTone = [...toneCounts.entries()]
    .sort((a, b) => b[1] - a[1])[0]?.[0];

  // Detect language preference from content
  const languagePreference = platformSignals.length > 0 ? "sv" : undefined;

  // Update brand profile
  const behaviorProfile = {
    headlinePreference: editSignals.length > 0 ? headlinePreference : undefined,
    controlLevel,
    copyTone,
    preferredPlatforms: preferredPlatforms.length > 0 ? preferredPlatforms : undefined,
    languagePreference,
  };

  // Find brand profile for this org and update
  const [profile] = await db
    .select({ id: brandProfiles.id })
    .from(brandProfiles)
    .where(eq(brandProfiles.orgId, orgId))
    .limit(1);

  if (profile) {
    await db
      .update(brandProfiles)
      .set({
        behaviorProfile,
        updatedAt: new Date(),
      })
      .where(eq(brandProfiles.id, profile.id));
  }
}
