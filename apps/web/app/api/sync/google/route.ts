import { NextResponse } from "next/server";

/**
 * GET /api/sync/google
 * Cron endpoint to sync Google Ads performance data.
 * Called by Vercel Cron every hour.
 *
 * Flow:
 * 1. Fetch all active Google ad accounts from DB
 * 2. For each account, pull yesterday's metrics from Google Ads API
 * 3. Upsert into performance_daily table
 * 4. Update campaign status if changed
 *
 * Requires: GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_MCC_ID, account OAuth tokens
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // TODO: Implement when Google Ads API credentials are configured
    // 1. const accounts = await db.select().from(adAccounts).where(eq(adAccounts.platform, "google"));
    // 2. For each account:
    //    const report = await googleAdsApi.getReport(account.platformAccountId, account.refreshToken, yesterday);
    //    await db.insert(performanceDaily).values(report).onConflictDoUpdate(...)
    // 3. Log sync result

    console.log("[sync/google] Cron triggered — no Google accounts configured yet");

    return NextResponse.json({
      success: true,
      accountsSynced: 0,
      message: "No Google Ads accounts configured",
    });
  } catch (err) {
    console.error("[sync/google] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    );
  }
}
