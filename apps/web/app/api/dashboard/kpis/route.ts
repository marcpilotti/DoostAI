import { NextResponse } from "next/server";
import { supabase, safeQuery } from "@/lib/supabase";
import { MOCK_KPIS, MOCK_CHART_DATA } from "@/lib/mock-data";

/**
 * GET /api/dashboard/kpis
 * Returns KPIs + chart data. Uses real Supabase data if available,
 * falls back to mock data if tables don't exist.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") ?? "6m";

  // Try real data from performance_daily
  const realData = await safeQuery(() =>
    supabase
      .from("performance_daily")
      .select("clicks, impressions, spend, revenue, roas, date")
      .order("date", { ascending: true })
      .limit(200),
  );

  if (realData && Array.isArray(realData) && realData.length > 0) {
    // Aggregate KPIs from real data
    const totalClicks = realData.reduce((s, r) => s + (r.clicks ?? 0), 0);
    const totalViews = realData.reduce((s, r) => s + (r.impressions ?? 0), 0);
    const totalSpend = realData.reduce((s, r) => s + Number(r.spend ?? 0), 0);
    const totalRevenue = realData.reduce((s, r) => s + Number(r.revenue ?? 0), 0);
    const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    return NextResponse.json({
      source: "supabase",
      kpis: [
        { id: "clicks", label: "Clicks", value: totalClicks, change: 0, format: "number" },
        { id: "views", label: "Views", value: totalViews, change: 0, format: "number" },
        { id: "roas", label: "ROAS", value: Math.round(avgRoas * 10) / 10, change: 0, suffix: "x", format: "multiplier" },
        { id: "spend", label: "Ad Spend", value: Math.round(totalSpend), change: 0, prefix: "$", format: "currency" },
        { id: "revenue", label: "Gross revenue", value: Math.round(totalRevenue * 100) / 100, change: 0, prefix: "$", format: "currency" },
      ],
      chartData: MOCK_CHART_DATA, // Chart aggregation TBD
    });
  }

  // Fallback to mock
  return NextResponse.json({
    source: "mock",
    kpis: MOCK_KPIS,
    chartData: MOCK_CHART_DATA,
  });
}
