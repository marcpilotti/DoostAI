import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 12; // NIST recommended for AES-GCM
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("TOKEN_ENCRYPTION_KEY environment variable is not set");
  }
  // Accept hex-encoded 32-byte key
  const buf = Buffer.from(key, "hex");
  if (buf.length !== KEY_LENGTH) {
    throw new Error(
      `TOKEN_ENCRYPTION_KEY must be ${KEY_LENGTH * 2} hex characters (${KEY_LENGTH} bytes)`,
    );
  }
  return buf;
}

export function encryptToken(plaintext: string): {
  encrypted: string;
  iv: string;
} {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");
  const tag = cipher.getAuthTag();

  // Append auth tag to encrypted data
  return {
    encrypted: encrypted + "." + tag.toString("base64"),
    iv: iv.toString("base64"),
  };
}

export function decryptToken(encrypted: string, iv: string): string {
  const key = getEncryptionKey();
  const ivBuf = Buffer.from(iv, "base64");

  const [encData, tagData] = encrypted.split(".");
  if (!encData || !tagData) {
    throw new Error("Invalid encrypted token format");
  }

  const decipher = createDecipheriv(ALGORITHM, key, ivBuf);
  decipher.setAuthTag(Buffer.from(tagData, "base64"));

  let decrypted = decipher.update(encData, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export function generateEncryptionKey(): string {
  return randomBytes(KEY_LENGTH).toString("hex");
}
