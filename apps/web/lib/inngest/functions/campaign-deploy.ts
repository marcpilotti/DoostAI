import { adAccounts, and, db, eq } from "@doost/db";
import {
  decryptToken,
  deployCampaign as deployMetaCampaign,
  deploySearchCampaign,
  deploySponsoredContent,
  encryptToken,
  GoogleAdsClient,
  googleRefreshAccessToken,
  LinkedInAdsClient,
  MetaAdsClient,
} from "@doost/platforms";

import { inngest } from "../client";

type DeployResult = {
  platform: string;
  status: "live" | "failed";
  campaignId?: string;
  error?: string;
};

export const campaignDeploy = inngest.createFunction(
  {
    id: "campaign-deploy",
    retries: 2,
    triggers: [{ event: "campaign/deploy" }],
  },
  async ({ event, step }) => {
    const { orgId, campaignName, platforms, budget, targeting } =
      event.data as {
        orgId: string;
        campaignName: string;
        platforms: string[];
        budget: { daily: number; currency: string };
        targeting: { locations?: string[] };
      };

    // Fan out: deploy all platforms in parallel
    const results = await Promise.allSettled(
      platforms.map((platform) =>
        step.run(`deploy-${platform}`, async () => {
          // Get account for this platform
          const [account] = await db
            .select()
            .from(adAccounts)
            .where(
              and(
                eq(adAccounts.orgId, orgId),
                eq(adAccounts.platform, platform as "meta" | "google" | "linkedin"),
                eq(adAccounts.status, "active"),
              ),
            )
            .limit(1);

          if (!account?.accessTokenEncrypted || !account.tokenIv) {
            throw new Error(`No active ${platform} account for org ${orgId}`);
          }

          const token = decryptToken(
            account.accessTokenEncrypted,
            account.tokenIv,
          );

          switch (platform) {
            case "meta": {
              const bmId =
                (account.metadata as { businessManagerId?: string })
                  ?.businessManagerId ?? "";
              const client = new MetaAdsClient(token, bmId);
              const result = await deployMetaCampaign(client, {
                adAccountId: account.platformAccountId,
                name: campaignName,
                objective: "traffic",
                dailyBudget: budget.daily,
                targeting: {
                  countries: targeting.locations ?? ["SE"],
                },
                creatives: [],
              });
              return {
                platform: "meta",
                campaignId: result.campaignId,
              };
            }

            case "google": {
              // Refresh access token first
              const refreshIv =
                (account.metadata as { refreshTokenIv?: string })
                  ?.refreshTokenIv ?? account.tokenIv;
              let accessToken = token;
              if (account.refreshTokenEncrypted) {
                const refreshToken = decryptToken(
                  account.refreshTokenEncrypted,
                  refreshIv,
                );
                const { accessToken: newToken } =
                  await googleRefreshAccessToken(refreshToken);
                accessToken = newToken;
                // Update stored access token
                const { encrypted, iv } = encryptToken(newToken);
                await db
                  .update(adAccounts)
                  .set({
                    accessTokenEncrypted: encrypted,
                    tokenIv: iv,
                    tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
                  })
                  .where(eq(adAccounts.id, account.id));
              }

              const client = GoogleAdsClient.fromEnv(accessToken);
              const result = await deploySearchCampaign(client, {
                customerId: account.platformAccountId,
                name: campaignName,
                dailyBudgetMicros: budget.daily * 1_000_000,
                headlines: [campaignName.slice(0, 30), "Kontakta oss idag", "Boka en demo"],
                descriptions: [
                  "Upptäck hur vi kan hjälpa ditt företag växa.",
                  "Professionella lösningar för nordiska företag.",
                ],
                finalUrl: "https://doost.tech",
                locations: targeting.locations?.includes("SE")
                  ? ["2752"]
                  : undefined,
              });
              return {
                platform: "google",
                campaignId: result.campaignId,
              };
            }

            case "linkedin": {
              const client = new LinkedInAdsClient(token);
              const result = await deploySponsoredContent(client, {
                adAccountId: account.platformAccountId,
                name: campaignName,
                objective: "traffic",
                dailyBudget: budget.daily,
                targeting: {
                  locations: targeting.locations,
                },
                creative: {
                  headline: campaignName,
                  bodyCopy: "",
                  cta: "Läs mer",
                  destinationUrl: "https://doost.tech",
                },
              });
              return {
                platform: "linkedin",
                campaignId: result.campaignId,
              };
            }

            default:
              throw new Error(`Unknown platform: ${platform}`);
          }
        }),
      ),
    );

    // Determine overall status
    const platformResults: DeployResult[] = platforms.map((p, i) => {
      const r = results[i]!;
      if (r.status === "fulfilled") {
        return {
          platform: p,
          status: "live" as const,
          campaignId: r.value.campaignId,
        };
      }
      return {
        platform: p,
        status: "failed" as const,
        error: r.reason?.message ?? "Unknown error",
      };
    });

    const allLive = platformResults.every((r) => r.status === "live");
    const allFailed = platformResults.every((r) => r.status === "failed");
    const overallStatus = allLive
      ? "live"
      : allFailed
        ? "failed"
        : "partially_live";

    // Emit completion event for real-time UI updates
    await step.sendEvent("deploy-complete", {
      name: "campaign/deploy-complete",
      data: {
        orgId,
        campaignName,
        status: overallStatus,
        platforms: platformResults,
      },
    });

    return { status: overallStatus, platforms: platformResults };
  },
);
