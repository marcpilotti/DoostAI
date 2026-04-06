/**
 * Trigger definitions — proactive intelligence system.
 * Based on LIVING-PROFILE.md trigger specification.
 *
 * Each trigger has:
 * - id: unique identifier
 * - name: human-readable name
 * - cooldownDays: minimum days between firings per org
 * - condition: evaluator function
 * - buildNotification: creates the notification payload
 */

export type TriggerConditionInput = {
  orgId: string;
  avgROAS: number;
  activePlatforms: string[];
  daysActive: number;
  recentPerformance: Array<{
    date: string;
    ctr: number;
    spend: number;
    roas: number;
  }>;
  activeCreatives: Array<{
    id: string;
    startDate: string;
    ctrTrend: "improving" | "stable" | "declining";
  }>;
  newGoogleReviews: Array<{
    rating: number;
    text: string;
    isNew: boolean;
  }>;
};

export type TriggerNotification = {
  title: string;
  body: string;
  type: string;
  priority: "low" | "medium" | "high";
};

export type TriggerDefinition = {
  id: string;
  name: string;
  cooldownDays: number;
  condition: (input: TriggerConditionInput) => boolean;
  buildNotification: (input: TriggerConditionInput) => TriggerNotification;
};

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export const TRIGGERS: TriggerDefinition[] = [
  // Competitor trigger — stubbed (needs Meta Ad Library integration)
  {
    id: "competitor_new_campaign",
    name: "Competitor launched new ads",
    cooldownDays: 14,
    condition: () => false, // Stub: requires Meta Ad Library
    buildNotification: () => ({
      title: "En konkurrent har lanserat nya annonser",
      body: "Vill du se deras annonser och uppdatera dina?",
      type: "competitor_alert",
      priority: "medium",
    }),
  },

  {
    id: "performance_drop",
    name: "CTR dropped significantly",
    cooldownDays: 7,
    condition: (input) => {
      const perf = input.recentPerformance;
      if (perf.length < 14) return false;
      const last7 = average(perf.slice(-7).map((d) => d.ctr));
      const prev7 = average(perf.slice(-14, -7).map((d) => d.ctr));
      return prev7 > 0 && last7 < prev7 * 0.7; // 30% drop
    },
    buildNotification: (input) => {
      const last7 = average(input.recentPerformance.slice(-7).map((d) => d.ctr));
      const prev7 = average(input.recentPerformance.slice(-14, -7).map((d) => d.ctr));
      const dropPct = Math.round((1 - last7 / prev7) * 100);
      return {
        title: `Din CTR har sjunkit ${dropPct}% senaste veckan`,
        body: "Jag analyserar orsaken och föreslår åtgärder.",
        type: "performance_alert",
        priority: "high",
      };
    },
  },

  {
    id: "ad_fatigue",
    name: "Creative fatigue detected",
    cooldownDays: 14,
    condition: (input) => {
      return input.activeCreatives.some(
        (c) => daysSince(c.startDate) > 21 && c.ctrTrend === "declining",
      );
    },
    buildNotification: (input) => {
      const fatigued = input.activeCreatives.filter(
        (c) => daysSince(c.startDate) > 21 && c.ctrTrend === "declining",
      );
      return {
        title: `${fatigued.length} annonser visar tecken på ad fatigue`,
        body: "Jag har genererat nya varianter. Vill du byta ut dem?",
        type: "creative_refresh",
        priority: "medium",
      };
    },
  },

  {
    id: "new_google_reviews",
    name: "New Google reviews detected",
    cooldownDays: 7,
    condition: (input) => {
      return input.newGoogleReviews.some((r) => r.isNew && r.rating >= 4);
    },
    buildNotification: (input) => {
      const best = input.newGoogleReviews
        .filter((r) => r.isNew && r.rating >= 4)
        .sort((a, b) => b.rating - a.rating)[0];
      return {
        title: "Nytt positivt omdöme på Google!",
        body: best
          ? `"${best.text.slice(0, 80)}..." — Vill du använda det i dina annonser?`
          : "Vill du använda det i dina annonser?",
        type: "review_opportunity",
        priority: "low",
      };
    },
  },

  {
    id: "ready_to_scale",
    name: "Customer is ready for next platform",
    cooldownDays: 30,
    condition: (input) => {
      const allPlatforms = ["meta", "google", "linkedin"];
      const unused = allPlatforms.filter((p) => !input.activePlatforms.includes(p));
      return unused.length > 0 && input.avgROAS > 2.0 && input.daysActive > 30;
    },
    buildNotification: (input) => {
      const allPlatforms = ["meta", "google", "linkedin"];
      const unused = allPlatforms.filter((p) => !input.activePlatforms.includes(p));
      const next = unused[0] ?? "en ny kanal";
      return {
        title: `Dags att expandera till ${next}?`,
        body: `Dina kampanjer ger ${input.avgROAS.toFixed(1)}x ROAS. Baserat på din bransch bör ${next} ge liknande resultat.`,
        type: "expansion_opportunity",
        priority: "medium",
      };
    },
  },

  {
    id: "budget_waste",
    name: "Budget allocated to underperforming segment",
    cooldownDays: 7,
    condition: (input) => {
      const perf = input.recentPerformance;
      if (perf.length < 7) return false;
      const wastedSpend = perf
        .filter((m) => m.roas < input.avgROAS * 0.5)
        .reduce((sum, m) => sum + m.spend, 0);
      const totalSpend = perf.reduce((sum, m) => sum + m.spend, 0);
      return totalSpend > 0 && wastedSpend / totalSpend > 0.3;
    },
    buildNotification: (input) => {
      const perf = input.recentPerformance;
      const wastedSpend = perf
        .filter((m) => m.roas < input.avgROAS * 0.5)
        .reduce((sum, m) => sum + m.spend, 0);
      const totalSpend = perf.reduce((sum, m) => sum + m.spend, 0);
      const wastedPct = Math.round((wastedSpend / totalSpend) * 100);
      return {
        title: `${wastedPct}% av din budget går till underpresterande annonser`,
        body: "Jag föreslår en omfördelning för att förbättra ROAS.",
        type: "budget_optimization",
        priority: "high",
      };
    },
  },

  {
    id: "seasonal_opportunity",
    name: "Industry seasonal peak approaching",
    cooldownDays: 30,
    condition: () => {
      // Simplified: check if we're within 3 weeks of common seasonal peaks
      const month = new Date().getMonth(); // 0-indexed
      // Black Friday (November), Christmas (December), Back to School (August)
      const peakMonths = [7, 10, 11];
      return peakMonths.includes(month);
    },
    buildNotification: () => {
      const month = new Date().getMonth();
      const peaks: Record<number, string> = {
        7: "Back-to-school-säsongen",
        10: "Black Friday",
        11: "Julhandeln",
      };
      const peakName = peaks[month] ?? "en högsäsong";
      return {
        title: `${peakName} närmar sig`,
        body: "Förra året ökade konverteringar i din bransch under denna period. Vill du öka budgeten?",
        type: "seasonal_opportunity",
        priority: "medium",
      };
    },
  },
];
