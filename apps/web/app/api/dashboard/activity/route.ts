import { NextResponse } from "next/server";
import { supabase, safeQuery } from "@/lib/supabase";
import { MOCK_ACTIVITY } from "@/lib/mock-data";

/**
 * GET /api/dashboard/activity
 * Returns campaign activity feed.
 */
export async function GET() {
  const realData = await safeQuery(() =>
    supabase
      .from("activity_log")
      .select("id, action, description, platform, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  );

  if (realData && Array.isArray(realData) && realData.length > 0) {
    const items = realData.map((r) => ({
      id: r.id,
      platform: r.platform ?? "meta",
      campaignName: r.description?.split(" — ")[0] ?? "Campaign",
      action: r.description?.split(" — ")[1] ?? r.action,
      timestamp: formatTimeAgo(new Date(r.created_at)),
    }));
    return NextResponse.json({ source: "supabase", items });
  }

  return NextResponse.json({ source: "mock", items: MOCK_ACTIVITY });
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
