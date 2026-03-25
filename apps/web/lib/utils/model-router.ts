import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";

type ModelContext = {
  intent:
    | "chat"
    | "copy_generation"
    | "copy_variant"
    | "profile_assembly"
    | "optimization";
  tokenCount?: number;
  isRegeneration?: boolean;
};

export function routeModel(context: ModelContext) {
  if (context.intent === "chat" && (context.tokenCount ?? 100) < 50) {
    return anthropic("claude-haiku-4-5-20251001");
  }
  if (context.intent === "copy_generation" && !context.isRegeneration) {
    return anthropic("claude-sonnet-4-20250514");
  }
  if (context.intent === "copy_variant" || context.isRegeneration) {
    return openai("gpt-4o");
  }
  if (context.intent === "profile_assembly") {
    return anthropic("claude-haiku-4-5-20251001");
  }
  if (context.intent === "optimization") {
    return anthropic("claude-haiku-4-5-20251001");
  }
  return anthropic("claude-sonnet-4-20250514");
}
