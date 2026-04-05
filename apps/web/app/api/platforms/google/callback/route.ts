import { auth } from "@clerk/nextjs/server";
import { adAccounts, db } from "@doost/db";
import { encryptToken,googleExchangeCode } from "@doost/platforms";
import { redirect } from "next/navigation";

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
    redirect(`/chat?google_error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    redirect("/chat?google_error=missing_code");
  }

  const { verifyOAuthState } = await import("@/lib/auth/oauth-state");
  const verified = verifyOAuthState(state);
  if (!verified) {
    redirect("/chat?google_error=invalid_state");
  }
  const orgId = verified.orgId;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const redirectUri = `${appUrl}/api/platforms/google/callback`;

  const { accessToken, refreshToken } = await googleExchangeCode(
    code,
    redirectUri,
  );

  // Encrypt both tokens
  const { encrypted: accessEncrypted, iv: accessIv } =
    encryptToken(accessToken);
  const { encrypted: refreshEncrypted, iv: refreshIv } =
    encryptToken(refreshToken);

  await db
    .insert(adAccounts)
    .values({
      orgId,
      platform: "google",
      platformAccountId: "pending",
      name: "Google Ads",
      status: "active",
      accessTokenEncrypted: accessEncrypted,
      tokenIv: accessIv,
      refreshTokenEncrypted: refreshEncrypted,
      tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
      scopes: ["https://www.googleapis.com/auth/adwords"],
      metadata: {
        mccCustomerId: process.env.GOOGLE_ADS_MCC_ID,
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
        tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
        status: "active",
        updatedAt: new Date(),
      },
    });

  redirect("/chat?google_connected=true");
}
