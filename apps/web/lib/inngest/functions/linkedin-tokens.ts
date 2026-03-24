import {
  linkedinRefreshToken,
  decryptToken,
  encryptToken,
} from "@doost/platforms";
import { adAccounts, db, and, lt, eq } from "@doost/db";

import { inngest } from "../client";

export const linkedinRefreshTokens = inngest.createFunction(
  {
    id: "linkedin-refresh-tokens",
    triggers: [{ cron: "0 4 * * *" }], // daily at 4 AM
  },
  async ({ step }) => {
    const fourteenDays = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const accounts = await step.run("find-expiring", async () => {
      return db
        .select()
        .from(adAccounts)
        .where(
          and(
            eq(adAccounts.platform, "linkedin"),
            eq(adAccounts.status, "active"),
            lt(adAccounts.tokenExpiresAt, fourteenDays),
          ),
        );
    });

    let refreshed = 0;

    for (const account of accounts) {
      await step.run(`refresh-${account.id}`, async () => {
        if (!account.refreshTokenEncrypted || !account.tokenIv) return;

        const currentRefresh = decryptToken(
          account.refreshTokenEncrypted,
          account.tokenIv,
        );

        const { accessToken, refreshToken, expiresIn } =
          await linkedinRefreshToken(currentRefresh);

        const { encrypted: accessEnc, iv: accessIv } =
          encryptToken(accessToken);
        const { encrypted: refreshEnc } = encryptToken(refreshToken);

        await db
          .update(adAccounts)
          .set({
            accessTokenEncrypted: accessEnc,
            tokenIv: accessIv,
            refreshTokenEncrypted: refreshEnc,
            tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
            updatedAt: new Date(),
          })
          .where(eq(adAccounts.id, account.id));

        refreshed++;
      });
    }

    return { checked: accounts.length, refreshed };
  },
);
