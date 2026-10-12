import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { getServerEnv } from "@/lib/env.server";

// AES-256-GCM. The key is derived from APP_ENCRYPTION_KEY with SHA-256.
function getKey(): Buffer {
  const serverEnv = getServerEnv();

  if (!serverEnv) {
    throw new Error("APP_ENCRYPTION_KEY ontbreekt.");
  }

  return createHash("sha256").update(serverEnv.APP_ENCRYPTION_KEY).digest();
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv, tag, encrypted].map((part) => part.toString("base64")).join(".");
}

export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(".");

  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Ongeldig versleuteld geheim.");
  }

  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));

  return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]).toString("utf8");
}
