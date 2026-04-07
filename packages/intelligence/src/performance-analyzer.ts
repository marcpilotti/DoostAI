/**
 * Performance pattern analysis — learns what works from campaign results.
 * Analyzes 90-day rolling window to find winning and losing patterns.
 * Updates brandProfiles.performanceProfile field.
 */

import { adCreatives, brandProfiles, creativePerformance, db, eq, and, gte } from "@doost/db";

/**
 * Update the performance profile for an organization.
 * Called after every 6-hour performance poll.
 */
export async function updatePerformanceProfile(orgId: string): Promise<void> {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  // Get all performance data with creative details
  const perfData = await db
    .select({
      impressions: creativePerformance.impressions,
      clicks: creativePerformance.clicks,
      spend: creativePerformance.spend,
      ctr: creativePerformance.ctr,
      cpc: creativePerformance.cpc,
      roas: creativePerformance.roas,
      platform: creativePerformance.platform,
      date: creativePerformance.date,
      headline: adCreatives.headline,
      bodyCopy: adCreatives.bodyCopy,
      cta: adCreatives.cta,
      format: adCreatives.format,
      templateId: adCreatives.templateId,
    })
    .from(creativePerformance)
    .innerJoin(adCreatives, eq(creativePerformance.creativeId, adCreatives.id))
    .where(
      and(
        eq(creativePerformance.orgId, orgId),
        gte(creativePerformance.date, ninetyDaysAgo),
      ),
    );

  if (perfData.length === 0) return;

  // Calculate median CTR for this org
  const ctrs = perfData
    .map((d) => Number(d.ctr ?? 0))
    .filter((c) => c > 0)
    .sort((a, b) => a - b);
  const medianCTR = ctrs.length > 0 ? ctrs[Math.floor(ctrs.length / 2)] ?? 0 : 0;

  // Split into winners and losers
  const winners = perfData.filter((d) => Number(d.ctr ?? 0) > medianCTR);
  const losers = perfData.filter((d) => Number(d.ctr ?? 0) < medianCTR * 0.5);

  // Find most common CTA among winners
  const ctaCounts = new Map<string, number>();
  for (const w of winners) {
    if (w.cta) ctaCounts.set(w.cta, (ctaCounts.get(w.cta) ?? 0) + 1);
  }
  const bestCTA = [...ctaCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  // Find best platform by avg ROAS
  const platformROAS = new Map<string, { totalRoas: number; count: number }>();
  for (const d of perfData) {
    const roas = Number(d.roas ?? 0);
    if (roas > 0) {
      const existing = platformROAS.get(d.platform) ?? { totalRoas: 0, count: 0 };
      existing.totalRoas += roas;
      existing.count++;
      platformROAS.set(d.platform, existing);
    }
  }
  const bestPlatform = [...platformROAS.entries()]
    .map(([p, v]) => ({ platform: p, avgRoas: v.totalRoas / v.count }))
    .sort((a, b) => b.avgRoas - a.avgRoas)[0]?.platform;

  // Find best day of week
  const dayPerf = new Map<number, { totalCtr: number; count: number }>();
  for (const d of winners) {
    const day = new Date(d.date).getDay();
    const existing = dayPerf.get(day) ?? { totalCtr: 0, count: 0 };
    existing.totalCtr += Number(d.ctr ?? 0);
    existing.count++;
    dayPerf.set(day, existing);
  }
  const dayNames = ["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"];
  const bestDay = [...dayPerf.entries()]
    .map(([day, v]) => ({ day, avgCtr: v.totalCtr / v.count }))
    .sort((a, b) => b.avgCtr - a.avgCtr)[0];

  // Find best format
  const formatCounts = new Map<string, number>();
  for (const w of winners) {
    if (w.format) formatCounts.set(w.format, (formatCounts.get(w.format) ?? 0) + 1);
  }
  const bestFormat = [...formatCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  // Avg headline length of winners
  const avgHeadlineLength = winners
    .filter((w) => w.headline)
    .reduce((sum, w) => sum + (w.headline?.length ?? 0), 0) / (winners.filter((w) => w.headline).length || 1);

  // Find common mistakes in losers
  const loserWords = new Map<string, number>();
  for (const l of losers) {
    if (l.headline) {
      for (const word of l.headline.toLowerCase().split(/\s+/)) {
        if (word.length > 3) loserWords.set(word, (loserWords.get(word) ?? 0) + 1);
      }
    }
  }
  const commonMistakes = [...loserWords.entries()]
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);

  // Build profile
  const winningPatterns = {
    bestCTA,
    bestPlatform,
    bestDay: bestDay ? dayNames[bestDay.day] : undefined,
    bestFormat,
    avgHeadlineLength: Math.round(avgHeadlineLength),
    medianCTR,
    sampleSize: perfData.length,
  };

  const losingPatterns = {
    commonMistakes,
    worstFormats: [...formatCounts.entries()].sort((a, b) => a[1] - b[1]).slice(0, 2).map(([f]) => f),
  };

  // Save to brand profile
  const [profile] = await db
    .select({ id: brandProfiles.id })
    .from(brandProfiles)
    .where(eq(brandProfiles.orgId, orgId))
    .limit(1);

  if (profile) {
    await db
      .update(brandProfiles)
      .set({
        performanceProfile: {
          winningPatterns,
          losingPatterns,
          lastUpdated: new Date().toISOString(),
        },
        updatedAt: new Date(),
      })
      .where(eq(brandProfiles.id, profile.id));
  }
}
