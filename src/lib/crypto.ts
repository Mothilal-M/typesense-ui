/**
 * Lightweight credential obfuscation for localStorage.
 *
 * This uses AES-GCM via the Web Crypto API to encrypt sensitive values
 * before storing them in localStorage. A device-bound key is derived once
 * from a fixed passphrase + a random salt (stored alongside the ciphertext).
 *
 * NOTE: This is NOT a substitute for a secure backend vault. The key material
 * lives in the same browser, so a determined attacker with full JS access can
 * still recover the plaintext. The goal is to prevent casual inspection and
 * automated credential scraping of localStorage contents.
 */

const ALGO = "AES-GCM";
const KEY_USAGE: KeyUsage[] = ["encrypt", "decrypt"];
const PASSPHRASE = "typesense-ui-local-key-v1"; // app-level constant

/** Derive a CryptoKey from a passphrase + salt using PBKDF2 */
async function deriveKey(salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(PASSPHRASE),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    { name: ALGO, length: 256 },
    false,
    KEY_USAGE
  );
}

/** Convert Uint8Array ↔ base64 */
function toBase64(buf: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf;
}

/**
 * Encrypt a plaintext string and return a storage-safe string.
 * Format: base64(salt) . base64(iv) . base64(ciphertext)
 */
export async function encryptValue(plaintext: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(salt);

  const encoded = new TextEncoder().encode(plaintext);
  const cipherBuf = await crypto.subtle.encrypt(
    { name: ALGO, iv },
    key,
    encoded
  );

  return [toBase64(salt), toBase64(iv), toBase64(new Uint8Array(cipherBuf))].join(".");
}

/**
 * Decrypt a value previously encrypted by `encryptValue`.
 * Returns null if the value cannot be decrypted (e.g. legacy plain-text).
 */
export async function decryptValue(stored: string): Promise<string | null> {
  try {
    const parts = stored.split(".");
    if (parts.length !== 3) return null;

    const [saltB64, ivB64, cipherB64] = parts;
    const salt = fromBase64(saltB64);
    const iv = fromBase64(ivB64);
    const ciphertext = fromBase64(cipherB64);
    const key = await deriveKey(salt);

    const plainBuf = await crypto.subtle.decrypt(
      { name: ALGO, iv: iv as BufferSource },
      key,
      ciphertext as BufferSource
    );

    return new TextDecoder().decode(plainBuf);
  } catch {
    return null;
  }
}

/**
 * Read a credential from localStorage, decrypting if needed.
 * Handles legacy plain JSON gracefully (returns parsed JSON or raw string).
 */
export async function readSecure<T = unknown>(key: string): Promise<T | null> {
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  // Try to decrypt first
  const decrypted = await decryptValue(raw);
  if (decrypted !== null) {
    try {
      return JSON.parse(decrypted) as T;
    } catch {
      return decrypted as unknown as T;
    }
  }

  // Fallback: legacy unencrypted value – parse & re-encrypt for next time
  try {
    const parsed = JSON.parse(raw) as T;
    // Re-encrypt in place so next read is already encrypted
    const encrypted = await encryptValue(JSON.stringify(parsed));
    localStorage.setItem(key, encrypted);
    return parsed;
  } catch {
    // Plain string value
    const encrypted = await encryptValue(raw);
    localStorage.setItem(key, encrypted);
    return raw as unknown as T;
  }
}

/**
 * Write a credential to localStorage with encryption.
 */
export async function writeSecure(key: string, value: unknown): Promise<void> {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  const encrypted = await encryptValue(serialized);
  localStorage.setItem(key, encrypted);
}

/**
 * Remove a credential from localStorage.
 */
export function removeSecure(key: string): void {
  localStorage.removeItem(key);
}
