import { NextResponse } from "next/server";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

import { MOCK_CAMPAIGNS, MOCK_CREATIVES, MOCK_KPIS } from "@/lib/mock-data";

export const maxDuration = 60;

/**
 * POST /api/actions/generate
 * AI analyzes current campaign/creative data and generates smart action items.
 */
export async function POST() {
  const campaignSummary = MOCK_CAMPAIGNS.map((c) =>
    `- ${c.name} (${c.platform}, ${c.status}): ROAS ${c.roas}x, Spend $${c.totalSpend}, CTR ${c.ctr}%, Budget $${c.dailyBudget}/day`,
  ).join("\n");

  const creativeSummary = MOCK_CREATIVES.map((c) =>
    `- ${c.name}: ROAS ${c.roas}x, Spend $${c.spend}, CTR ${c.ctr}%`,
  ).join("\n");

  const kpiSummary = MOCK_KPIS.map((k) =>
    `- ${k.label}: ${k.prefix ?? ""}${k.value}${k.suffix ?? ""} (${k.change >= 0 ? "+" : ""}${k.change}%)`,
  ).join("\n");

  try {
    const result = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      prompt: `You are a senior digital marketing strategist. Analyze this data and generate 4-6 specific, actionable recommendations.

KPIs:
${kpiSummary}

Campaigns:
${campaignSummary}

Creatives:
${creativeSummary}

For each action, return a JSON array with objects containing:
- "title": short action title (max 60 chars)
- "description": one-sentence explanation of why and expected impact
- "priority": "high", "medium", or "low"
- "type": one of "scale_budget", "pause_campaign", "refresh_creative", "new_audience", "consolidate", "adjust_targeting"
- "target": the campaign or creative name this applies to
- "params": object with the specific values (e.g. {"budget_increase_pct": 20} or {"new_daily_budget": 200})

Return ONLY the JSON array, no markdown, no explanation.`,
    });

    // Parse the AI response
    const text = result.text.trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ actions: [], error: "Could not parse AI response" });
    }

    const actions = JSON.parse(jsonMatch[0]) as Array<{
      title: string;
      description: string;
      priority: string;
      type: string;
      target: string;
      params: Record<string, unknown>;
    }>;

    return NextResponse.json({
      actions: actions.map((a, i) => ({
        id: `ai_${Date.now()}_${i}`,
        ...a,
        status: "pending",
      })),
    });
  } catch (err) {
    console.error("[actions/generate] Error:", err);
    return NextResponse.json({
      actions: [
        { id: "1", title: "Scale Holiday Sale 2025", description: "ROAS is 3.2x and stable — increase budget by 20%.", priority: "high", type: "scale_budget", target: "Holiday Sale 2025", params: { budget_increase_pct: 20 }, status: "pending" },
        { id: "2", title: "Refresh Black Friday creative", description: "CTR declining. New creative could recover 0.5% CTR.", priority: "medium", type: "refresh_creative", target: "Black Friday", params: {}, status: "pending" },
        { id: "3", title: "Pause Brand Awareness Q1", description: "Campaign completed. No reason to keep it active.", priority: "low", type: "pause_campaign", target: "Brand Awareness Q1", params: {}, status: "pending" },
      ],
    });
  }
}
