export type CampaignEvent =
  | { type: "GENERATE_ADS" }
  | { type: "ADS_GENERATED" }
  | { type: "GENERATION_FAILED"; error: string }
  | { type: "APPROVE" }
  | { type: "REGENERATE" }
  | { type: "EDIT" }
  | { type: "ALL_DEPLOYED"; platformIds: Record<string, string> }
  | { type: "PARTIAL_DEPLOY"; platformStatuses: Record<string, string> }
  | { type: "DEPLOY_FAILED"; error: string }
  | { type: "RETRY_FAILED"; platform: string; error: string }
  | { type: "PAUSE"; reason?: string }
  | { type: "RESUME" }
  | { type: "COMPLETE" }
  | { type: "BUDGET_DEPLETED" }
  | { type: "DELETE" };

export type CampaignState =
  | "draft"
  | "generating"
  | "review"
  | "publishing"
  | "live"
  | "partially_live"
  | "paused"
  | "completed"
  | "deleted";

type Transition = {
  target: CampaignState;
};

// State machine as a pure lookup table (no xstate runtime dependency in packages/ai)
const TRANSITIONS: Record<CampaignState, Record<string, Transition>> = {
  draft: {
    GENERATE_ADS: { target: "generating" },
    DELETE: { target: "deleted" },
  },
  generating: {
    ADS_GENERATED: { target: "review" },
    GENERATION_FAILED: { target: "draft" },
  },
  review: {
    APPROVE: { target: "publishing" },
    REGENERATE: { target: "generating" },
    EDIT: { target: "review" },
  },
  publishing: {
    ALL_DEPLOYED: { target: "live" },
    PARTIAL_DEPLOY: { target: "partially_live" },
    DEPLOY_FAILED: { target: "review" },
  },
  live: {
    PAUSE: { target: "paused" },
    COMPLETE: { target: "completed" },
    BUDGET_DEPLETED: { target: "paused" },
  },
  partially_live: {
    RETRY_FAILED: { target: "partially_live" },
    ALL_DEPLOYED: { target: "live" },
    PAUSE: { target: "paused" },
  },
  paused: {
    RESUME: { target: "live" },
    COMPLETE: { target: "completed" },
    DELETE: { target: "deleted" },
  },
  completed: {},
  deleted: {},
};

export function canTransition(
  currentState: CampaignState,
  eventType: string,
): boolean {
  return !!TRANSITIONS[currentState]?.[eventType];
}

export function getNextState(
  currentState: CampaignState,
  eventType: string,
): CampaignState | null {
  const transition = TRANSITIONS[currentState]?.[eventType];
  return transition?.target ?? null;
}

export function getAvailableEvents(state: CampaignState): string[] {
  return Object.keys(TRANSITIONS[state] ?? {});
}
