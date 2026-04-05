/**
 * HMAC-signed OAuth state parameter.
 * Prevents state forgery in platform OAuth callbacks.
 */

import { createHmac } from "crypto";

const SECRET = process.env.OAUTH_STATE_SECRET || process.env.CLERK_SECRET_KEY || "fallback-dev-secret";

export function createOAuthState(payload: { orgId: string }): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64");
  const sig = createHmac("sha256", SECRET).update(data).digest("hex").slice(0, 16);
  return `${data}.${sig}`;
}

export function verifyOAuthState(state: string): { orgId: string } | null {
  const [data, sig] = state.split(".");
  if (!data || !sig) return null;

  const expected = createHmac("sha256", SECRET).update(data).digest("hex").slice(0, 16);
  if (sig !== expected) return null;

  try {
    const parsed = JSON.parse(Buffer.from(data, "base64").toString()) as { orgId?: string };
    if (!parsed.orgId) return null;
    return { orgId: parsed.orgId };
  } catch {
    return null;
  }
}
