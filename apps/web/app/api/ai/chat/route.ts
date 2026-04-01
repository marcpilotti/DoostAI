import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

export const maxDuration = 90;

// In-memory rate limiter: max 20 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= RATE_LIMIT_MAX;
}

const inputSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["system", "user", "assistant"]),
    content: z.string(),
  })),
  model: z.string().optional(),
  pageContext: z.string().optional(),
});

/**
 * POST /api/ai/chat
 * Dashboard AI panel — streaming chat with action execution.
 *
 * The AI can recommend and execute marketing actions. When it mentions
 * an action, it formats it as a structured block that the client renders
 * as an executable button.
 */
export async function POST(req: Request) {
  // Rate limit by IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";
  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please wait a moment." }),
      { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } },
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400 });
  }

  const { messages, model: modelId, pageContext } = parsed.data;

  const modelMap: Record<string, string> = {
    "claude-haiku-4-5-20251001": "claude-haiku-4-5-20251001",
    "claude-sonnet-4-6": "claude-sonnet-4-6",
    "claude-opus-4-6": "claude-opus-4-6",
  };

  const resolvedModel = modelMap[modelId ?? "claude-sonnet-4-6"] ?? "claude-sonnet-4-6";

  // Inject action execution capability into system prompt
  const actionSystemPrompt = `

When you recommend an action that can be executed, format it as a markdown action block like this:

**Recommended action:** [action title]
> [one-line description]
> Type: [scale_budget|pause_campaign|refresh_creative|new_audience|consolidate|adjust_targeting]
> Target: [campaign or creative name]

This helps the user understand what you're recommending. Be specific about WHY and the expected impact.

Available action types:
- scale_budget: Increase daily budget by a percentage
- pause_campaign: Pause an underperforming campaign
- refresh_creative: Generate new creative variants
- new_audience: Create a lookalike audience
- consolidate: Merge overlapping campaigns
- adjust_targeting: Refine audience targeting`;

  const systemMessage = messages.find((m) => m.role === "system");
  const otherMessages = messages.filter((m) => m.role !== "system");

  const fullSystem = (systemMessage?.content ?? "") + actionSystemPrompt;

  const result = streamText({
    model: anthropic(resolvedModel),
    system: fullSystem,
    messages: otherMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  });

  return result.toTextStreamResponse();
}
