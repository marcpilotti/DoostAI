import { db, campaigns, eq, sql } from "@doost/db";

import type { CampaignEvent, CampaignState } from "../machines/campaign-machine";
import { canTransition, getNextState } from "../machines/campaign-machine";

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
    throw new Error(
      `Invalid transition: ${currentState} → ${event.type}. Allowed: ${Object.keys(
        {} /* getAvailableEvents would go here */,
      ).join(", ")}`,
    );
  }

  const nextState = getNextState(currentState, event.type);
  if (!nextState) {
    throw new Error(`No target state for ${currentState} + ${event.type}`);
  }

  // Insert event record into campaign_events table
  // Using raw SQL since the table isn't in Drizzle schema yet
  await db.execute(sql`
    INSERT INTO campaign_events (id, campaign_id, org_id, event_type, from_state, to_state, payload, actor)
    VALUES (
      gen_random_uuid(),
      ${campaignId},
      ${campaign.orgId},
      ${event.type},
      ${currentState},
      ${nextState},
      ${JSON.stringify(event)}::jsonb,
      ${actor}
    )
  `);

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
  const rows = await db.execute(sql`
    SELECT campaign_id, org_id, event_type, from_state, to_state, payload, actor, created_at
    FROM campaign_events
    WHERE campaign_id = ${campaignId}
    ORDER BY created_at ASC
  `);

  return (rows ?? []) as unknown as CampaignEventRecord[];
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
