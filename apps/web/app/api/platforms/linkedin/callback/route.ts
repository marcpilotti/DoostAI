import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { linkedinExchangeCode, encryptToken } from "@doost/platforms";
import { adAccounts, db } from "@doost/db";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    redirect(`/chat?linkedin_error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    redirect("/chat?linkedin_error=missing_code");
  }

  const { orgId } = JSON.parse(atob(state)) as { orgId: string };
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const redirectUri = `${appUrl}/api/platforms/linkedin/callback`;

  const { accessToken, refreshToken, expiresIn } =
    await linkedinExchangeCode(code, redirectUri);

  const { encrypted: accessEncrypted, iv: accessIv } =
    encryptToken(accessToken);
  const { encrypted: refreshEncrypted, iv: refreshIv } =
    encryptToken(refreshToken);

  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  await db
    .insert(adAccounts)
    .values({
      orgId,
      platform: "linkedin",
      platformAccountId: "pending",
      name: "LinkedIn Ads",
      status: "active",
      accessTokenEncrypted: accessEncrypted,
      tokenIv: accessIv,
      refreshTokenEncrypted: refreshEncrypted,
      tokenExpiresAt: expiresAt,
      scopes: ["r_ads", "w_ads", "r_ads_reporting", "w_organization_social"],
      metadata: {
        refreshTokenIv: refreshIv,
      },
    })
    .onConflictDoUpdate({
      target: [
        adAccounts.orgId,
        adAccounts.platform,
        adAccounts.platformAccountId,
      ],
      set: {
        accessTokenEncrypted: accessEncrypted,
        tokenIv: accessIv,
        refreshTokenEncrypted: refreshEncrypted,
        tokenExpiresAt: expiresAt,
        status: "active",
        updatedAt: new Date(),
      },
    });

  redirect("/chat?linkedin_connected=true");
}
