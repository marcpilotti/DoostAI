import { encryptToken } from "../crypto";

const META_API_BASE = "https://graph.facebook.com/v21.0";

export function getOAuthUrl(redirectUri: string, state?: string): string {
  const appId = process.env.META_APP_ID;
  if (!appId) throw new Error("META_APP_ID is not set");

  const scopes = [
    "ads_management",
    "ads_read",
    "business_management",
    "pages_read_engagement",
    "pages_manage_ads",
  ].join(",");

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: scopes,
    response_type: "code",
    ...(state ? { state } : {}),
  });

  return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
}

export async function exchangeCode(
  code: string,
  redirectUri: string,
): Promise<{ accessToken: string; expiresIn: number }> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("META_APP_ID and META_APP_SECRET must be set");
  }

  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  });

  const res = await fetch(
    `${META_API_BASE}/oauth/access_token?${params.toString()}`,
  );
  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message: string };
  };

  if (!res.ok || data.error) {
    throw new Error(
      `Meta OAuth exchange failed: ${data.error?.message ?? res.statusText}`,
    );
  }

  return {
    accessToken: data.access_token!,
    expiresIn: data.expires_in ?? 3600,
  };
}

export async function extendToken(
  shortLivedToken: string,
): Promise<{ accessToken: string; expiresIn: number }> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("META_APP_ID and META_APP_SECRET must be set");
  }

  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortLivedToken,
  });

  const res = await fetch(
    `${META_API_BASE}/oauth/access_token?${params.toString()}`,
  );
  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message: string };
  };

  if (!res.ok || data.error) {
    throw new Error(
      `Meta token extension failed: ${data.error?.message ?? res.statusText}`,
    );
  }

  return {
    accessToken: data.access_token!,
    expiresIn: data.expires_in ?? 5_184_000, // 60 days default
  };
}

export function encryptAndStoreToken(accessToken: string): {
  encrypted: string;
  iv: string;
  expiresAt: Date;
} {
  const { encrypted, iv } = encryptToken(accessToken);
  const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days
  return { encrypted, iv, expiresAt };
}
