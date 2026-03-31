import { NextResponse } from "next/server";

/**
 * GET /api/sync/meta
 * Cron endpoint to sync Meta Ads performance data.
 * Called by Vercel Cron every hour.
 *
 * Flow:
 * 1. Fetch all active Meta ad accounts from DB
 * 2. For each account, pull yesterday's metrics from Meta Marketing API
 * 3. Upsert into performance_daily table
 * 4. Update campaign status if changed
 *
 * Requires: META_APP_ID, META_APP_SECRET, account access tokens
 */
export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // TODO: Implement when Meta API credentials are configured
    // 1. const accounts = await db.select().from(adAccounts).where(eq(adAccounts.platform, "meta"));
    // 2. For each account:
    //    const insights = await metaApi.getInsights(account.platformAccountId, account.accessToken, yesterday);
    //    await db.insert(performanceDaily).values(insights).onConflictDoUpdate(...)
    // 3. Log sync result

    console.log("[sync/meta] Cron triggered — no Meta accounts configured yet");

    return NextResponse.json({
      success: true,
      accountsSynced: 0,
      message: "No Meta accounts configured",
    });
  } catch (err) {
    console.error("[sync/meta] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    );
  }
}
