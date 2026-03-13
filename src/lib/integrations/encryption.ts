// ============================================================================
// AES-256-GCM Credential Encryption
// ============================================================================
// Encrypts integration credentials (OAuth tokens, API keys) at rest.
// All credentials pass through encrypt() before DB insert and decrypt()
// when read back for API calls. Never stores plaintext tokens.
//
// Required env var:
//   INTEGRATION_ENCRYPTION_KEY — 32-byte hex string
//   Generate: openssl rand -hex 32
// ============================================================================

import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const hex = process.env.INTEGRATION_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "INTEGRATION_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). " +
        "Generate one with: openssl rand -hex 32"
    );
  }
  return Buffer.from(hex, "hex");
}

/**
 * Encrypt a plaintext string → `iv:authTag:ciphertext` (all hex).
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypt an `iv:authTag:ciphertext` string back to plaintext.
 */
export function decrypt(encryptedStr: string): string {
  const key = getKey();
  const parts = encryptedStr.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted credential format.");
  }

  const [ivHex, authTagHex, ciphertext] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Encrypt a credentials object → encrypted string for DB storage.
 */
export function encryptCredentials(creds: object): string {
  return encrypt(JSON.stringify(creds));
}

/**
 * Decrypt a stored credential string → parsed object.
 * Returns null if decryption fails (e.g. key rotated, corrupt data).
 */
export function decryptCredentials<T = Record<string, unknown>>(
  encryptedStr: string
): T | null {
  try {
    // If it's already a JSON object (legacy unencrypted), parse directly
    if (encryptedStr.startsWith("{")) {
      return JSON.parse(encryptedStr) as T;
    }
    return JSON.parse(decrypt(encryptedStr)) as T;
  } catch (err) {
    console.error("[encryption] Failed to decrypt credentials:", err);
    return null;
  }
}
