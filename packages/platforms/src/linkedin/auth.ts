const LINKEDIN_AUTH_BASE = "https://www.linkedin.com/oauth/v2";

export function getOAuthUrl(redirectUri: string, state?: string): string {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) throw new Error("LINKEDIN_CLIENT_ID is not set");

  const scopes = [
    "r_ads",
    "w_ads",
    "r_ads_reporting",
    "w_organization_social",
    "r_organization_social",
  ].join(" ");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes,
    ...(state ? { state } : {}),
  });

  return `${LINKEDIN_AUTH_BASE}/authorization?${params.toString()}`;
}

export async function exchangeCode(
  code: string,
  redirectUri: string,
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshTokenExpiresIn: number;
}> {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET must be set",
    );
  }

  const res = await fetch(`${LINKEDIN_AUTH_BASE}/accessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  });

  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    refresh_token_expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || data.error) {
    throw new Error(
      `LinkedIn OAuth exchange failed: ${data.error_description ?? data.error ?? res.statusText}`,
    );
  }

  return {
    accessToken: data.access_token!,
    refreshToken: data.refresh_token!,
    expiresIn: data.expires_in ?? 5_184_000, // 60 days
    refreshTokenExpiresIn: data.refresh_token_expires_in ?? 31_536_000, // 12 months
  };
}

export async function refreshToken(
  currentRefreshToken: string,
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET must be set",
    );
  }

  const res = await fetch(`${LINKEDIN_AUTH_BASE}/accessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: currentRefreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || data.error) {
    throw new Error(
      `LinkedIn token refresh failed: ${data.error_description ?? data.error ?? res.statusText}`,
    );
  }

  return {
    accessToken: data.access_token!,
    refreshToken: data.refresh_token ?? currentRefreshToken,
    expiresIn: data.expires_in ?? 5_184_000,
  };
}
