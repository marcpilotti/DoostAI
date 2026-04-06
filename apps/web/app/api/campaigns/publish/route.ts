import { auth } from "@clerk/nextjs/server";
import { db, eq, organizations } from "@doost/db";
import { NextResponse } from "next/server";
import { z } from "zod";

import { checkCampaignLimit, checkChannelLimit } from "@/lib/stripe/plan-limits";
import { safeQuery,supabase } from "@/lib/supabase";

export const maxDuration = 30;

const inputSchema = z.object({
  // Brand data
  brandName: z.string(),
  brandUrl: z.string(),
  brandColors: z.object({
    primary: z.string(),
    secondary: z.string().optional(),
    accent: z.string().optional(),
  }).optional(),

  // Ad creative
  headline: z.string(),
  bodyText: z.string(),
  cta: z.string(),
  imageUrl: z.string().optional(),
  platform: z.string(),

  // Campaign settings
  dailyBudget: z.number(),
  duration: z.number(),
  regions: z.array(z.string().max(100)).max(20),
  channel: z.string().max(50),

  // Idempotency
  idempotencyKey: z.string().uuid().optional(),
});

/**
 * POST /api/campaigns/publish
 * Creates a campaign record from the onboarding flow.
 * Stores brand profile + ad creative + campaign settings.
 */
export async function POST(req: Request) {
  const { userId, orgId } = await auth();
  if (!userId) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  // ── Plan limit enforcement ──
  if (orgId) {
    const [org] = await db
      .select({ plan: organizations.plan })
      .from(organizations)
      .where(eq(organizations.clerkOrgId, orgId))
      .limit(1);

    if (org) {
      // Count active campaigns for this org
      const activeCount = await safeQuery(() =>
        supabase
          .from("campaigns")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId)
          .in("status", ["draft", "generating", "review", "publishing", "live", "paused"]),
      );
      const count = typeof activeCount === "object" && activeCount !== null && "count" in activeCount
        ? (activeCount as { count: number }).count
        : 0;

      const campaignCheck = checkCampaignLimit(org.plan, count);
      if (!campaignCheck.allowed) {
        return NextResponse.json({
          success: false,
          error: campaignCheck.reason,
          upgrade: { suggestedPlan: campaignCheck.suggestedPlan },
        }, { status: 403 });
      }

      const channelCheck = checkChannelLimit(org.plan, 1);
      if (!channelCheck.allowed) {
        return NextResponse.json({
          success: false,
          error: channelCheck.reason,
          upgrade: { suggestedPlan: channelCheck.suggestedPlan },
        }, { status: 403 });
      }
    }
  }

  // Idempotency: check for duplicate campaign (same brand + channel + budget) in last 5 minutes
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const existing = await safeQuery(() =>
    supabase
      .from("campaigns")
      .select("id, name, status")
      .eq("platform", data.channel)
      .eq("daily_budget", data.dailyBudget)
      .gte("created_at", fiveMinAgo)
      .ilike("name", `${data.brandName}%`)
      .limit(1)
      .maybeSingle(),
  );

  if (existing && typeof existing === "object" && "id" in existing) {
    return NextResponse.json({
      success: true,
      data: {
        campaignId: (existing as { id: string }).id,
        name: data.brandName,
        status: (existing as { status: string }).status ?? "review",
        message: "Duplicate detected — returning existing campaign.",
        deduplicated: true,
      },
    });
  }

  // Try to create campaign in Supabase
  const campaign = await safeQuery(() =>
    supabase.from("campaigns").insert({
      name: `${data.brandName} — ${data.channel} campaign`,
      status: "review",
      platform: data.channel,
      daily_budget: data.dailyBudget,
      start_date: new Date().toISOString(),
      end_date: data.duration > 0
        ? new Date(Date.now() + data.duration * 86400000).toISOString()
        : null,
      targeting: { regions: data.regions },
      org_id: orgId ?? undefined,
      user_id: userId,
    }).select("id, name, status").single(),
  );

  // Try to log activity
  if (campaign && typeof campaign === "object" && "id" in campaign) {
    await safeQuery(() =>
      supabase.from("activity_log").insert({
        campaign_id: (campaign as { id: string }).id,
        action: "campaign_published",
        description: `${data.brandName} — Campaign published`,
        platform: data.channel,
      }),
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      campaignId: campaign && typeof campaign === "object" && "id" in campaign
        ? (campaign as { id: string }).id
        : `demo_${Date.now()}`,
      name: data.brandName,
      status: "review",
      message: `${data.channel} campaign created. Budget: ${data.dailyBudget} SEK/day for ${data.duration > 0 ? `${data.duration} days` : "ongoing"}.`,
    },
  });
}
