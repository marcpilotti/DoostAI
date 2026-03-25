import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";

import { createTrace, traceGeneration } from "./tracing";

// --- Types ---

export type ModelIntent =
  | "chat"
  | "copy_generation"
  | "copy_variant"
  | "analysis"
  | "optimization";

export type ModelChoice = {
  provider: "anthropic" | "openai";
  modelId: string;
  reason: string;
  model: ReturnType<typeof anthropic> | ReturnType<typeof openai>;
};

type RouterInput = {
  messageTokens: number;
  intent: ModelIntent;
  requiresTools: boolean;
  isRegeneration: boolean;
};

// --- Cost per 1K tokens (USD) ---

const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-20250514": { input: 0.003, output: 0.015 },
  "claude-haiku-4-5-20251001": { input: 0.001, output: 0.005 },
  "gpt-4o": { input: 0.0025, output: 0.01 },
};

// --- Router ---

export function routeModel(input: RouterInput): ModelChoice {
  // Quick chat: Haiku (fast for simple messages)
  if (
    input.intent === "chat" &&
    input.messageTokens < 50 &&
    !input.requiresTools
  ) {
    return {
      provider: "anthropic",
      modelId: "claude-haiku-4-5-20251001",
      reason: "short_chat",
      model: anthropic("claude-haiku-4-5-20251001"),
    };
  }

  // Hero copy: Opus 4.6 (best creative quality)
  if (input.intent === "copy_generation" && !input.isRegeneration) {
    return {
      provider: "anthropic",
      modelId: "claude-opus-4-6",
      reason: "hero_copy",
      model: anthropic("claude-opus-4-6"),
    };
  }

  // Variants / regeneration: Opus 4.6 (every variant must be top quality)
  if (input.intent === "copy_variant" || input.isRegeneration) {
    return {
      provider: "anthropic",
      modelId: "claude-opus-4-6",
      reason: "variants",
      model: anthropic("claude-opus-4-6"),
    };
  }

  // Brand analysis: Sonnet 4.6 (accurate structured output)
  if (input.intent === "analysis") {
    return {
      provider: "anthropic",
      modelId: "claude-sonnet-4-6",
      reason: "analysis",
      model: anthropic("claude-sonnet-4-6"),
    };
  }

  // Optimization: Sonnet 4.6 (quality recommendations)
  if (input.intent === "optimization") {
    return {
      provider: "anthropic",
      modelId: "claude-sonnet-4-6",
      reason: "optimization",
      model: anthropic("claude-sonnet-4-6"),
    };
  }

  // Chat with tools: Sonnet 4.6 (tool use quality)
  if (input.requiresTools) {
    return {
      provider: "anthropic",
      modelId: "claude-sonnet-4-6",
      reason: "tools_required",
      model: anthropic("claude-sonnet-4-6"),
    };
  }

  // Default: Sonnet 4.6
  return {
    provider: "anthropic",
    modelId: "claude-sonnet-4-6",
    reason: "default",
    model: anthropic("claude-sonnet-4-6"),
  };
}

// --- Intent classifier (heuristic, no LLM call) ---

const URL_PATTERN =
  /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9][a-zA-Z0-9-]{0,61}\.[a-zA-Z]{2,}/i;
const COPY_TRIGGERS = /\b(genera|skapa|skriv|create|make|generate)\b.*\b(annons|ad|copy|kampanj|campaign)\b/i;
const REGEN_TRIGGERS = /\b(annan|annat|ny|nytt|different|another|try again|regenerat|ändra|skriv om|kortare|längre)\b/i;
const OPTIMIZE_TRIGGERS = /\b(hur går|performance|prestanda|optimera|förbättra|improve|optimize|statistik|analytics)\b/i;

export function classifyIntent(
  message: string,
  hasActiveTools: boolean,
): ModelIntent {
  const trimmed = message.trim();
  const wordCount = trimmed.split(/\s+/).length;

  // URL detected → brand analysis
  if (URL_PATTERN.test(trimmed)) return "analysis";

  // Copy generation request
  if (COPY_TRIGGERS.test(trimmed)) return "copy_generation";

  // Regeneration / edit request
  if (REGEN_TRIGGERS.test(trimmed)) return "copy_variant";

  // Performance / optimization query
  if (OPTIMIZE_TRIGGERS.test(trimmed)) return "optimization";

  // Short message without tools → cheap chat
  if (wordCount <= 8 && !hasActiveTools) return "chat";

  // Default: chat (with tools if needed)
  return "chat";
}

// --- Token estimator (rough, ~4 chars per token for Swedish/English) ---

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// --- Cost estimator ---

export function estimateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const costs = MODEL_COSTS[modelId];
  if (!costs) return 0;
  return (inputTokens / 1000) * costs.input + (outputTokens / 1000) * costs.output;
}

// --- Trace a routed model call ---

export function traceRouting(choice: ModelChoice, latencyMs: number) {
  const trace = createTrace(`router/${choice.reason}`, {
    provider: choice.provider,
    model: choice.modelId,
    reason: choice.reason,
  });

  traceGeneration(trace, {
    name: `routed-${choice.reason}`,
    model: choice.modelId,
    input: { reason: choice.reason },
    output: { provider: choice.provider, model: choice.modelId },
    latencyMs,
  });
}
