import posthog from "posthog-js";

export const FLAGS = {
  enable_ai_images: "enable_ai_images",
  enable_video: "enable_video",
  enable_linkedin: "enable_linkedin",
  enable_optimizer_v2: "enable_optimizer_v2",
  enable_budget_estimator: "enable_budget_estimator",
  enable_variant_comparison: "enable_variant_comparison",
  enable_inline_editing: "enable_inline_editing",
  enable_dark_mode: "enable_dark_mode",
  enable_command_palette: "enable_command_palette",
} as const;

export function isFeatureEnabled(flag: keyof typeof FLAGS): boolean {
  if (typeof window === "undefined") return false;
  try {
    return posthog.isFeatureEnabled(FLAGS[flag]) ?? false;
  } catch {
    return false;
  }
}

// Server-side flag check (reads from env for now, PostHog server SDK later)
export function isServerFeatureEnabled(flag: keyof typeof FLAGS): boolean {
  const envKey = `FEATURE_${FLAGS[flag].toUpperCase()}`;
  return process.env[envKey] === "true";
}
