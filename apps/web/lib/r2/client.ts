import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID ?? "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID ?? "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY ?? "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME ?? "doost-creatives";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "https://creatives.doost.tech";

let _client: S3Client | null = null;

function getClient(): S3Client | null {
  if (_client) return _client;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    return null;
  }
  _client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
  return _client;
}

/**
 * Upload a buffer to Cloudflare R2 and return the public URL.
 * Falls back to a data URL if R2 is not configured.
 */
export async function uploadToR2(
  key: string,
  data: Buffer,
  contentType = "image/png",
): Promise<string> {
  const client = getClient();
  if (!client) {
    console.warn("[r2] R2 not configured — returning data URL fallback");
    return `data:${contentType};base64,${data.toString("base64")}`;
  }

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: data,
        ContentType: contentType,
      }),
    );
    return `${R2_PUBLIC_URL}/${key}`;
  } catch (err) {
    console.error(`[r2] Upload failed:`, err instanceof Error ? err.message : err);
    return `data:${contentType};base64,${data.toString("base64")}`;
  }
}
