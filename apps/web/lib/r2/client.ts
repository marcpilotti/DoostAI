/**
 * Cloudflare R2 upload client (S3-compatible).
 * Uses native fetch — no AWS SDK needed.
 */

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID ?? "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID ?? "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY ?? "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME ?? "doost-creatives";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "https://creatives.doost.tech";

function isConfigured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);
}

/**
 * Upload a buffer to R2 and return the public URL.
 * Falls back to a data URL if R2 is not configured.
 */
export async function uploadToR2(
  key: string,
  data: Buffer,
  contentType = "image/png",
): Promise<string> {
  if (!isConfigured()) {
    console.warn("[r2] R2 not configured — returning data URL fallback");
    return `data:${contentType};base64,${data.toString("base64")}`;
  }

  const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`;

  // Simple unsigned PUT — works with R2's S3-compatible API when using API tokens
  // For production, use AWS SDK v3 or S3-compatible signing
  const res = await fetch(endpoint, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "Authorization": `Bearer ${R2_SECRET_ACCESS_KEY}`,
      "Content-Length": String(data.length),
    },
    body: new Uint8Array(data),
  });

  if (!res.ok) {
    console.error(`[r2] Upload failed: ${res.status} ${res.statusText}`);
    return `data:${contentType};base64,${data.toString("base64")}`;
  }

  return `${R2_PUBLIC_URL}/${key}`;
}
