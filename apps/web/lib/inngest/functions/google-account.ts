import {
  GoogleAdsClient,
  createClientAccount,
  decryptToken,
  googleRefreshAccessToken,
  encryptToken,
} from "@doost/platforms";
import { adAccounts, db, eq } from "@doost/db";

import { inngest } from "../client";

export const googleCreateAccount = inngest.createFunction(
  {
    id: "google-create-account",
    retries: 2,
    triggers: [{ event: "google/create-account" }],
  },
  async ({ event, step }) => {
    const { adAccountId, companyName } = event.data as {
      adAccountId: string;
      companyName: string;
    };

    // 1. Get stored credentials
    const account = await step.run("get-credentials", async () => {
      const [row] = await db
        .select()
        .from(adAccounts)
        .where(eq(adAccounts.id, adAccountId))
        .limit(1);
      if (!row) throw new Error(`Ad account ${adAccountId} not found`);
      return row;
    });

    // 2. Refresh access token using refresh token
    const accessToken = await step.run("refresh-token", async () => {
      if (!account.refreshTokenEncrypted || !account.tokenIv) {
        throw new Error("No refresh token stored");
      }
      const refreshToken = decryptToken(
        account.refreshTokenEncrypted,
        account.tokenIv,
      );
      const { accessToken: newToken } =
        await googleRefreshAccessToken(refreshToken);

      // Update stored access token
      const { encrypted, iv } = encryptToken(newToken);
      await db
        .update(adAccounts)
        .set({
          accessTokenEncrypted: encrypted,
          tokenIv: iv,
          tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
          updatedAt: new Date(),
        })
        .where(eq(adAccounts.id, adAccountId));

      return newToken;
    });

    // 3. Create client account under MCC
    const { customerId } = await step.run("create-client", async () => {
      const client = GoogleAdsClient.fromEnv(accessToken);
      return createClientAccount(client, companyName);
    });

    // 4. Update ad account with the new customer ID
    await step.run("update-account", async () => {
      await db
        .update(adAccounts)
        .set({
          platformAccountId: customerId,
          name: `Google Ads - ${companyName}`,
          updatedAt: new Date(),
        })
        .where(eq(adAccounts.id, adAccountId));
    });

    return { customerId };
  },
);
