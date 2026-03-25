import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

import { campaigns, creativePerformance, db, and, eq, gt } from "@doost/db";

import { inngest } from "../client";

const recommendationSchema = z.object({
  recommendations: z.array(
    z.object({
      type: z.enum(["pause_ad", "increase_budget", "decrease_budget", "shift_budget", "new_variant"]),
      campaignId: z.string(),
      action: z.string(),
      reason: z.string(),
      confidence: z.number().min(0).max(1),
    }),
  ),
});

export const optimizerAnalyze = inngest.createFunction(
  {
    id: "optimizer-analyze",
    triggers: [{ event: "analytics/poll-complete" }],
  },
  async ({ event, step }) => {
    const { orgId } = event.data as { orgId: string };

    const performance = await step.run("get-performance", async () => {
      return db
        .select()
        .from(creativePerformance)
        .where(eq(creativePerformance.orgId, orgId))
        .limit(100);
    });

    if (performance.length === 0) return { recommendations: 0 };

    const analysis = await step.run("analyze", async () => {
      return generateObject({
        model: anthropic("claude-haiku-4-5-20251001"),
        schema: recommendationSchema,
        prompt: `Analyze campaign performance and generate optimization recommendations.

Performance data (last 7 days):
${JSON.stringify(performance.slice(0, 50), null, 2)}

For each underperforming creative:
- If CTR < 1%: recommend pausing
- If CPC > 2x average: recommend budget decrease
- If one variant has 2x better CTR: recommend shifting budget

Return actionable recommendations with confidence scores.`,
      });
    });

    return {
      recommendations: analysis.object.recommendations.length,
      highConfidence: analysis.object.recommendations.filter(
        (r) => r.confidence > 0.8,
      ).length,
    };
  },
);
