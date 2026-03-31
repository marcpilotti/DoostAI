import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

export const maxDuration = 60;

const inputSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["system", "user", "assistant"]),
    content: z.string(),
  })),
  model: z.string().optional(),
});

/**
 * POST /api/ai/chat
 * Lightweight streaming chat for the dashboard AI panel.
 * Separate from /api/chat (which uses tool calling for onboarding).
 */
export async function POST(req: Request) {
  const body = await req.json();
  const parsed = inputSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400 });
  }

  const { messages, model: modelId } = parsed.data;

  // Map model IDs to Anthropic models
  const modelMap: Record<string, string> = {
    "claude-haiku-4-5-20251001": "claude-haiku-4-5-20251001",
    "claude-sonnet-4-6": "claude-sonnet-4-6",
    "claude-opus-4-6": "claude-opus-4-6",
  };

  const resolvedModel = modelMap[modelId ?? "claude-sonnet-4-6"] ?? "claude-sonnet-4-6";

  const result = streamText({
    model: anthropic(resolvedModel),
    messages: messages.map((m) => ({
      role: m.role as "system" | "user" | "assistant",
      content: m.content,
    })),
  });

  return result.toTextStreamResponse();
}
