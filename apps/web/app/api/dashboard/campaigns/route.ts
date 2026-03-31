import { NextResponse } from "next/server";
import { supabase, safeQuery } from "@/lib/supabase";
import { MOCK_CAMPAIGNS } from "@/lib/mock-data";

/**
 * GET /api/dashboard/campaigns
 * Returns campaign list with performance data.
 */
export async function GET() {
  const realData = await safeQuery(() =>
    supabase
      .from("campaigns")
      .select("id, name, status, platform, daily_budget, total_spend, start_date, end_date, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
  );

  if (realData && Array.isArray(realData) && realData.length > 0) {
    const campaigns = realData.map((c) => ({
      id: c.id,
      name: c.name,
      platform: c.platform ?? "meta",
      status: c.status ?? "draft",
      dailyBudget: Number(c.daily_budget ?? 0),
      totalSpend: Number(c.total_spend ?? 0),
      roas: 0,
      clicks: 0,
      impressions: 0,
      ctr: 0,
      startDate: c.start_date,
      endDate: c.end_date,
    }));
    return NextResponse.json({ source: "supabase", campaigns });
  }

  return NextResponse.json({ source: "mock", campaigns: MOCK_CAMPAIGNS });
}
