import { adAccounts, and, db, eq,lt } from "@doost/db";
import { decryptToken, encryptToken, extendToken } from "@doost/platforms";

import { inngest } from "../client";

export const metaRefreshTokens = inngest.createFunction(
  {
    id: "meta-refresh-tokens",
    triggers: [{ cron: "0 3 * * *" }], // daily at 3 AM
  },
  async ({ step }) => {
    // Find Meta accounts with tokens expiring within 7 days
    const sevenDaysFromNow = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    );

    const accounts = await step.run("find-expiring", async () => {
      return db
        .select()
        .from(adAccounts)
        .where(
          and(
            eq(adAccounts.platform, "meta"),
            eq(adAccounts.status, "active"),
            lt(adAccounts.tokenExpiresAt, sevenDaysFromNow),
          ),
        );
    });

    let refreshed = 0;

    for (const account of accounts) {
      await step.run(`refresh-${account.id}`, async () => {
        if (!account.accessTokenEncrypted || !account.tokenIv) return;

        const currentToken = decryptToken(
          account.accessTokenEncrypted,
          account.tokenIv,
        );

        const { accessToken: newToken } = await extendToken(currentToken);
        const { encrypted, iv } = encryptToken(newToken);
        const expiresAt = new Date(
          Date.now() + 60 * 24 * 60 * 60 * 1000,
        );

        await db
          .update(adAccounts)
          .set({
            accessTokenEncrypted: encrypted,
            tokenIv: iv,
            tokenExpiresAt: expiresAt,
            updatedAt: new Date(),
          })
          .where(eq(adAccounts.id, account.id));

        refreshed++;
      });
    }

    return { accountsChecked: accounts.length, refreshed };
  },
);
