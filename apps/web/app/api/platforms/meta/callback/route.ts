import { auth } from "@clerk/nextjs/server";
import { adAccounts, db } from "@doost/db";
import {
  encryptAndStoreToken,
  exchangeCode,
  extendToken,
} from "@doost/platforms";
import { redirect } from "next/navigation";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // contains orgId
  const error = url.searchParams.get("error");

  if (error) {
    redirect(`/chat?meta_error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    redirect("/chat?meta_error=missing_code");
  }

  const { verifyOAuthState } = await import("@/lib/auth/oauth-state");
  const verified = verifyOAuthState(state);
  if (!verified) {
    redirect("/chat?meta_error=invalid_state");
  }
  const orgId = verified.orgId;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const redirectUri = `${appUrl}/api/platforms/meta/callback`;

  // Exchange code for short-lived token
  const { accessToken: shortToken } = await exchangeCode(code, redirectUri);

  // Extend to long-lived token (60 days)
  const { accessToken: longToken } = await extendToken(shortToken);

  // Encrypt and store
  const { encrypted, iv, expiresAt } = encryptAndStoreToken(longToken);

  await db
    .insert(adAccounts)
    .values({
      orgId,
      platform: "meta",
      platformAccountId: "pending", // will be updated after account creation
      name: "Meta Ads",
      status: "active",
      accessTokenEncrypted: encrypted,
      tokenIv: iv,
      tokenExpiresAt: expiresAt,
      scopes: [
        "ads_management",
        "ads_read",
        "business_management",
        "pages_read_engagement",
      ],
      metadata: {
        businessManagerId: process.env.META_BUSINESS_MANAGER_ID,
      },
    })
    .onConflictDoUpdate({
      target: [adAccounts.orgId, adAccounts.platform, adAccounts.platformAccountId],
      set: {
        accessTokenEncrypted: encrypted,
        tokenIv: iv,
        tokenExpiresAt: expiresAt,
        status: "active",
        updatedAt: new Date(),
      },
    });

  redirect("/chat?meta_connected=true");
}
