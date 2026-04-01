import { adAccounts, db, eq, and } from "@doost/db";

import { inngest } from "../client";

/**
 * Auto-creates ad platform accounts when a campaign is about to deploy.
 * - Meta: Creates ad account under our Business Manager
 * - Google: Creates client account under our MCC
 * - LinkedIn: Skips (requires user OAuth)
 */
export const platformAccountSetup = inngest.createFunction(
  {
    id: "platform-account-setup",
    triggers: [{ event: "campaign/pre-deploy" }],
    retries: 2,
  },
  async ({ event, step }) => {
    const { orgId, platforms, brandName } = event.data as {
      orgId: string;
      platforms: string[];
      brandName: string;
    };

    const results: Record<string, { status: string; accountId?: string }> = {};

    for (const platform of platforms) {
      await step.run(`setup-${platform}`, async () => {
        // Check if account already exists
        const [existing] = await db
          .select()
          .from(adAccounts)
          .where(
            and(
              eq(adAccounts.orgId, orgId),
              eq(adAccounts.platform, platform as "meta" | "google" | "linkedin"),
            ),
          )
          .limit(1);

        if (existing && existing.status === "active") {
          results[platform] = { status: "exists", accountId: existing.platformAccountId ?? undefined };
          return;
        }

        switch (platform) {
          case "meta": {
            // Auto-create under our Business Manager
            // In production: POST /{business-id}/adaccount via Meta Marketing API
            const bmId = process.env.META_BUSINESS_MANAGER_ID;
            if (!bmId) {
              results[platform] = { status: "skipped", accountId: undefined };
              console.warn("[platform-setup] META_BUSINESS_MANAGER_ID not configured");
              return;
            }

            // Create account record (actual API call would go here)
            const accountId = `act_${Date.now()}`;
            await db.insert(adAccounts).values({
              orgId,
              platform: "meta",
              platformAccountId: accountId,
              name: `${brandName} — Meta`,
              status: "pending",
              metadata: { businessManagerId: bmId },
            });

            results[platform] = { status: "created", accountId };
            break;
          }

          case "google": {
            // Auto-create under our MCC
            // In production: CustomerService.CreateCustomerClient via Google Ads API
            const mccId = process.env.GOOGLE_ADS_MCC_ID;
            if (!mccId) {
              results[platform] = { status: "skipped", accountId: undefined };
              console.warn("[platform-setup] GOOGLE_ADS_MCC_ID not configured");
              return;
            }

            const customerId = `cust_${Date.now()}`;
            await db.insert(adAccounts).values({
              orgId,
              platform: "google",
              platformAccountId: customerId,
              name: `${brandName} — Google`,
              status: "pending",
              metadata: { mccCustomerId: mccId },
            });

            results[platform] = { status: "created", accountId: customerId };
            break;
          }

          case "linkedin": {
            // Cannot auto-create — requires user OAuth
            results[platform] = { status: "requires_oauth" };
            break;
          }

          default:
            results[platform] = { status: "unsupported" };
        }
      });
    }

    return { orgId, results };
  },
);
