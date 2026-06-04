// Client-side end-to-end encryption primitives.
//
// Pure functions over the Web Crypto API (window.crypto.subtle) — no app state,
// no third-party crypto libraries. See encryption-guide.html for the full design.
//
// Key hierarchy:  passphrase + salt --PBKDF2--> KEK --(un)wraps--> DEK --encrypts--> content
// The server only ever sees: salts, wrapped DEKs, IVs, ciphertext.
// It never sees: passphrase, recovery code, KEK, DEK, or plaintext.

const PBKDF2_ITERATIONS = 600_000; // OWASP 2023 recommendation
const SALT_BYTES = 16;
const IV_BYTES = 12;
const RECOVERY_BYTES = 32;

// ArrayBuffer-backed bytes. The lib types distinguish this from SharedArrayBuffer,
// and Web Crypto's BufferSource slots only accept the ArrayBuffer-backed form.
type Bytes = Uint8Array<ArrayBuffer>;

// ---------------------------------------------------------------------------
// Encoding helpers — ciphertext/keys are binary; JSON transport needs strings.
// ---------------------------------------------------------------------------

export function bufToB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function b64ToBuf(b64: string): Bytes {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ---------------------------------------------------------------------------
// Randomness
// ---------------------------------------------------------------------------

export function generateSalt(): Bytes {
  return crypto.getRandomValues(new Uint8Array(SALT_BYTES));
}

function generateIV(): Bytes {
  return crypto.getRandomValues(new Uint8Array(IV_BYTES));
}

// RFC 4648 base32 (no padding) — used for the human-copyable recovery code.
function base32Encode(bytes: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let output = "";
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }
  return output;
}

// 32 random bytes -> ~52 base32 chars, grouped as XXXX-XXXX-... for copyability.
export function generateRecoveryCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(RECOVERY_BYTES));
  const raw = base32Encode(bytes);
  return raw.match(/.{1,4}/g)!.join("-");
}

// Canonical form for deriving the recovery KEK, so entry is forgiving of the
// display dashes, spaces, and lower-case. Derive from this on both ends.
export function normalizeRecoveryCode(code: string): string {
  return code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

// Derive a Key-Encryption Key from a passphrase (or recovery code) + salt.
// The result can only wrap/unwrap the DEK — never touch user data directly.
export async function deriveKEK(
  passphrase: string,
  salt: Bytes,
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false, // KEK itself is never extractable
    ["wrapKey", "unwrapKey"],
  );
}

// A fresh random 256-bit Data-Encryption Key. Extractable so it can be wrapped
// at signup and re-wrapped on change-passphrase.
export async function generateDEK(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
}

export interface WrappedKey {
  wrapped: string; // base64
  iv: string; // base64
}

// Wrap (encrypt) the DEK with a KEK. Uses wrapKey so raw key bytes never pass
// through a JS variable where they could leak.
export async function wrapDEK(
  dek: CryptoKey,
  kek: CryptoKey,
): Promise<WrappedKey> {
  const iv = generateIV();
  const wrapped = await crypto.subtle.wrapKey("raw", dek, kek, {
    name: "AES-GCM",
    iv,
  });
  return { wrapped: bufToB64(wrapped), iv: bufToB64(iv) };
}

// Unwrap the DEK with a KEK. A wrong passphrase makes AES-GCM authentication
// fail and this throws — the crypto operation *is* the password check.
export async function unwrapDEK(
  wrapped: string,
  iv: string,
  kek: CryptoKey,
): Promise<CryptoKey> {
  return crypto.subtle.unwrapKey(
    "raw",
    b64ToBuf(wrapped),
    kek,
    { name: "AES-GCM", iv: b64ToBuf(iv) },
    { name: "AES-GCM", length: 256 },
    true, // extractable so change-passphrase can re-wrap the same DEK
    ["encrypt", "decrypt"],
  );
}

// ---------------------------------------------------------------------------
// Content encryption (DEK-based)
// ---------------------------------------------------------------------------

export interface Encrypted {
  ciphertext: string; // base64
  iv: string; // base64
}

export async function encryptBytes(
  data: BufferSource,
  dek: CryptoKey,
): Promise<Encrypted> {
  const iv = generateIV();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    dek,
    data,
  );
  return { ciphertext: bufToB64(ciphertext), iv: bufToB64(iv) };
}

export async function decryptBytes(
  ciphertext: string,
  iv: string,
  dek: CryptoKey,
): Promise<ArrayBuffer> {
  return crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64ToBuf(iv) },
    dek,
    b64ToBuf(ciphertext),
  );
}

export async function encryptText(
  plaintext: string,
  dek: CryptoKey,
): Promise<Encrypted> {
  return encryptBytes(new TextEncoder().encode(plaintext), dek);
}

// ---------------------------------------------------------------------------
// File encryption. The MIME type is prepended to the bytes ("mime\n" + data)
// and encrypted with them, so the server never learns it and we can rebuild a
// displayable Blob on decrypt. Returns raw ciphertext (uploaded as-is, no
// base64 inflation) plus the base64 IV (stored in content_iv).
// ---------------------------------------------------------------------------

export async function encryptFile(
  data: ArrayBuffer,
  mimeType: string,
  dek: CryptoKey,
): Promise<{ ciphertext: ArrayBuffer; iv: string }> {
  const header = new TextEncoder().encode(`${mimeType}\n`);
  const framed = new Uint8Array(header.length + data.byteLength);
  framed.set(header, 0);
  framed.set(new Uint8Array(data), header.length);

  const iv = generateIV();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    dek,
    framed,
  );
  return { ciphertext, iv: bufToB64(iv) };
}

export async function decryptFile(
  ciphertext: BufferSource,
  iv: string,
  dek: CryptoKey,
): Promise<Blob> {
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64ToBuf(iv) },
    dek,
    ciphertext,
  );
  const bytes = new Uint8Array(plain);
  const newline = bytes.indexOf(10); // '\n' separating mime header from body
  const mimeType = new TextDecoder().decode(bytes.subarray(0, newline));
  const body = bytes.subarray(newline + 1);
  return new Blob([body], { type: mimeType });
}

export async function decryptText(
  ciphertext: string,
  iv: string,
  dek: CryptoKey,
): Promise<string> {
  const plain = await decryptBytes(ciphertext, iv, dek);
  return new TextDecoder().decode(plain);
}
