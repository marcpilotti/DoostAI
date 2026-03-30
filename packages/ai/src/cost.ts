// TODO: Wire up cost tracking — currently unused
import { estimateCost } from "./router";

type CostEntry = {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  intent: string;
  timestamp: number;
};

// In-memory accumulator per process (resets on cold start)
// For persistent tracking, write to a usage_metrics table
const entries: CostEntry[] = [];

export function trackCost(entry: Omit<CostEntry, "cost" | "timestamp">) {
  const cost = estimateCost(entry.model, entry.inputTokens, entry.outputTokens);
  entries.push({
    ...entry,
    cost,
    timestamp: Date.now(),
  });

  // Keep only last 1000 entries in memory
  if (entries.length > 1000) entries.shift();
}

export function getCostSummary(sinceMins: number = 60) {
  const cutoff = Date.now() - sinceMins * 60 * 1000;
  const recent = entries.filter((e) => e.timestamp >= cutoff);

  const totalCost = recent.reduce((s, e) => s + e.cost, 0);
  const byModel: Record<string, { calls: number; cost: number }> = {};

  for (const e of recent) {
    if (!byModel[e.model]) byModel[e.model] = { calls: 0, cost: 0 };
    byModel[e.model]!.calls++;
    byModel[e.model]!.cost += e.cost;
  }

  // Estimate savings: if all calls were Sonnet instead
  const sonnetCost = recent.reduce(
    (s, e) => s + estimateCost("claude-sonnet-4-20250514", e.inputTokens, e.outputTokens),
    0,
  );

  return {
    totalCalls: recent.length,
    totalCost: Math.round(totalCost * 10000) / 10000,
    savings: Math.round((sonnetCost - totalCost) * 10000) / 10000,
    savingsPercent:
      sonnetCost > 0
        ? Math.round(((sonnetCost - totalCost) / sonnetCost) * 100)
        : 0,
    byModel,
  };
}
