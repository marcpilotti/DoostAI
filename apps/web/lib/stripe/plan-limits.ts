type Plan = "free" | "starter" | "pro" | "agency";

type PlanLimits = {
  maxCampaigns: number;
  maxChannels: number;
  aiImages: boolean;
  abTesting: boolean;
  whiteLabel: boolean;
  clientAccounts: number;
  apiAccess: boolean;
};

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    maxCampaigns: 1,
    maxChannels: 1,
    aiImages: false,
    abTesting: false,
    whiteLabel: false,
    clientAccounts: 0,
    apiAccess: false,
  },
  starter: {
    maxCampaigns: 5,
    maxChannels: 2,
    aiImages: false,
    abTesting: false,
    whiteLabel: false,
    clientAccounts: 0,
    apiAccess: false,
  },
  pro: {
    maxCampaigns: Infinity,
    maxChannels: 3,
    aiImages: true,
    abTesting: true,
    whiteLabel: false,
    clientAccounts: 0,
    apiAccess: false,
  },
  agency: {
    maxCampaigns: Infinity,
    maxChannels: 3,
    aiImages: true,
    abTesting: true,
    whiteLabel: true,
    clientAccounts: 20,
    apiAccess: true,
  },
};

export const PLAN_PRICES: Record<Plan, { monthly: number; currency: string }> = {
  free: { monthly: 0, currency: "EUR" },
  starter: { monthly: 199, currency: "EUR" },
  pro: { monthly: 499, currency: "EUR" },
  agency: { monthly: 999, currency: "EUR" },
};

export type PlanCheckResult =
  | { allowed: true }
  | { allowed: false; reason: string; suggestedPlan: Plan };

export function checkCampaignLimit(
  plan: Plan,
  activeCampaigns: number,
): PlanCheckResult {
  const limits = PLAN_LIMITS[plan];
  if (activeCampaigns >= limits.maxCampaigns) {
    const suggested = plan === "free" ? "starter" : plan === "starter" ? "pro" : "agency";
    return {
      allowed: false,
      reason: `Du har nått gränsen på ${limits.maxCampaigns} aktiva kampanj${limits.maxCampaigns === 1 ? "" : "er"} för ${plan}-planen.`,
      suggestedPlan: suggested,
    };
  }
  return { allowed: true };
}

export function checkChannelLimit(
  plan: Plan,
  requestedChannels: number,
): PlanCheckResult {
  const limits = PLAN_LIMITS[plan];
  if (requestedChannels > limits.maxChannels) {
    const suggested = plan === "free" ? "starter" : plan === "starter" ? "pro" : "agency";
    return {
      allowed: false,
      reason: `${plan}-planen stöder max ${limits.maxChannels} kanal${limits.maxChannels === 1 ? "" : "er"}. Du begärde ${requestedChannels}.`,
      suggestedPlan: suggested,
    };
  }
  return { allowed: true };
}

export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan];
}

export function getPlanDisplayName(plan: Plan): string {
  const names: Record<Plan, string> = {
    free: "Free",
    starter: "Starter",
    pro: "Pro",
    agency: "Agency",
  };
  return names[plan];
}
