import { db, campaigns, campaignEvents, eq, asc } from "@doost/db";

import type { CampaignEvent, CampaignState } from "../machines/campaign-machine";
import { canTransition, getAvailableEvents, getNextState } from "../machines/campaign-machine";

type CampaignEventRecord = {
  campaignId: string;
  orgId: string;
  eventType: string;
  fromState: string;
  toState: string;
  payload: Record<string, unknown>;
  actor: string;
};

/**
 * Transition a campaign through the state machine.
 * Validates the transition, inserts an event record, and updates the campaign status.
 * Throws if the transition is invalid.
 */
export async function transitionCampaign(
  campaignId: string,
  event: CampaignEvent,
  actor: string = "system",
): Promise<{ fromState: CampaignState; toState: CampaignState }> {
  // Get current campaign
  const [campaign] = await db
    .select({ status: campaigns.status, orgId: campaigns.orgId })
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }

  const currentState = campaign.status as CampaignState;

  if (!canTransition(currentState, event.type)) {
    const available = getAvailableEvents(currentState);
    console.error("[campaign-state] Invalid transition attempted", {
      campaignId,
      currentState,
      attemptedEvent: event.type,
      allowedEvents: available,
      actor,
    });
    throw new Error(
      `Invalid transition: ${currentState} → ${event.type}. Allowed: ${available.join(", ")}`,
    );
  }

  const nextState = getNextState(currentState, event.type);
  if (!nextState) {
    throw new Error(`No target state for ${currentState} + ${event.type}`);
  }

  // Insert event record
  await db.insert(campaignEvents).values({
    campaignId,
    orgId: campaign.orgId,
    eventType: event.type,
    fromState: currentState,
    toState: nextState,
    payload: event as unknown as Record<string, unknown>,
    actor,
  });

  // Update campaign status
  await db
    .update(campaigns)
    .set({
      status: nextState as typeof campaigns.status.enumValues[number],
      updatedAt: new Date(),
    })
    .where(eq(campaigns.id, campaignId));

  return { fromState: currentState, toState: nextState };
}

/**
 * Get the full event history for a campaign.
 */
export async function getCampaignHistory(
  campaignId: string,
): Promise<CampaignEventRecord[]> {
  const rows = await db
    .select({
      campaignId: campaignEvents.campaignId,
      orgId: campaignEvents.orgId,
      eventType: campaignEvents.eventType,
      fromState: campaignEvents.fromState,
      toState: campaignEvents.toState,
      payload: campaignEvents.payload,
      actor: campaignEvents.actor,
    })
    .from(campaignEvents)
    .where(eq(campaignEvents.campaignId, campaignId))
    .orderBy(asc(campaignEvents.createdAt));

  return rows.map((r) => ({
    ...r,
    payload: (r.payload ?? {}) as Record<string, unknown>,
    actor: r.actor ?? "system",
  }));
}

/**
 * Replay events to derive the current state (for debugging/verification).
 */
export async function replayCampaignState(
  campaignId: string,
): Promise<CampaignState> {
  const events = await getCampaignHistory(campaignId);
  let state: CampaignState = "draft";

  for (const event of events) {
    const next = getNextState(state, event.eventType);
    if (next) state = next;
  }

  return state;
}
