import { describe, it, expect } from "vitest";
import {
  generateSalt,
  generateDEK,
  generateRecoveryCode,
  normalizeRecoveryCode,
  deriveKEK,
  wrapDEK,
  unwrapDEK,
  encryptText,
  decryptText,
  encryptFile,
  decryptFile,
  bufToB64,
  b64ToBuf,
} from "./crypto";

const PASSPHRASE = "correct horse battery staple";

describe("encoding helpers", () => {
  it("round-trips bytes through base64", () => {
    const bytes = crypto.getRandomValues(new Uint8Array(40));
    expect(Array.from(b64ToBuf(bufToB64(bytes)))).toEqual(Array.from(bytes));
  });
});

describe("recovery code", () => {
  it("is grouped base32 of the expected length", () => {
    const code = generateRecoveryCode();
    // 32 bytes -> 52 base32 chars -> 13 groups of 4 joined by dashes
    expect(code.replace(/-/g, "")).toMatch(/^[A-Z2-7]+$/);
    expect(code.replace(/-/g, "").length).toBe(52);
    expect(code).toContain("-");
  });

  it("is different every time", () => {
    expect(generateRecoveryCode()).not.toBe(generateRecoveryCode());
  });

  it("normalizes for forgiving entry (dashes, spaces, case)", async () => {
    // The recovery KEK must derive the same whether the user types the code
    // with dashes/spaces/case or not — this is what makes recovery work.
    const code = generateRecoveryCode();
    const salt = generateSalt();
    const kek = await deriveKEK(normalizeRecoveryCode(code), salt);
    const dek = await generateDEK();
    const { wrapped, iv } = await wrapDEK(dek, kek);

    const messyEntry = ` ${code.toLowerCase().replace(/-/g, " ")} `;
    const kek2 = await deriveKEK(normalizeRecoveryCode(messyEntry), salt);
    const dek2 = await unwrapDEK(wrapped, iv, kek2);

    const enc = await encryptText("recovered", dek);
    expect(await decryptText(enc.ciphertext, enc.iv, dek2)).toBe("recovered");
  });
});

describe("KEK derivation", () => {
  it("is deterministic for the same passphrase + salt", async () => {
    const salt = generateSalt();
    const kek1 = await deriveKEK(PASSPHRASE, salt);
    const kek2 = await deriveKEK(PASSPHRASE, salt);

    // CryptoKeys aren't directly comparable; prove equivalence by wrapping with
    // one and unwrapping with the other, then using the result.
    const dek = await generateDEK();
    const { wrapped, iv } = await wrapDEK(dek, kek1);
    const dek2 = await unwrapDEK(wrapped, iv, kek2);

    const enc = await encryptText("hello", dek);
    expect(await decryptText(enc.ciphertext, enc.iv, dek2)).toBe("hello");
  });
});

describe("wrap / unwrap DEK", () => {
  it("round-trips the DEK so the unwrapped key decrypts the original's output", async () => {
    const salt = generateSalt();
    const kek = await deriveKEK(PASSPHRASE, salt);
    const dek = await generateDEK();

    const { wrapped, iv } = await wrapDEK(dek, kek);
    const unwrapped = await unwrapDEK(wrapped, iv, kek);

    const enc = await encryptText("a secret memory", dek);
    expect(await decryptText(enc.ciphertext, enc.iv, unwrapped)).toBe(
      "a secret memory",
    );
  });

  it("fails to unwrap with the wrong passphrase", async () => {
    const salt = generateSalt();
    const rightKek = await deriveKEK(PASSPHRASE, salt);
    const wrongKek = await deriveKEK("not the passphrase", salt);
    const dek = await generateDEK();

    const { wrapped, iv } = await wrapDEK(dek, rightKek);
    await expect(unwrapDEK(wrapped, iv, wrongKek)).rejects.toBeTruthy();
  });
});

describe("content encryption", () => {
  it("round-trips text", async () => {
    const dek = await generateDEK();
    const { ciphertext, iv } = await encryptText("journal entry 🌱", dek);
    expect(ciphertext).not.toContain("journal");
    expect(await decryptText(ciphertext, iv, dek)).toBe("journal entry 🌱");
  });

  it("fails (GCM auth) when the ciphertext is tampered with", async () => {
    const dek = await generateDEK();
    const { ciphertext, iv } = await encryptText("do not modify", dek);

    const bytes = b64ToBuf(ciphertext);
    bytes[0] ^= 0xff; // flip a byte
    const tampered = bufToB64(bytes);

    await expect(decryptText(tampered, iv, dek)).rejects.toBeTruthy();
  });
});

describe("file encryption", () => {
  it("round-trips bytes and preserves the MIME type", async () => {
    const dek = await generateDEK();
    const original = new Uint8Array([0, 1, 2, 250, 255, 10, 42]); // includes 0x0A
    const { ciphertext, iv } = await encryptFile(
      original.buffer,
      "image/png",
      dek,
    );

    const blob = await decryptFile(ciphertext, iv, dek);
    expect(blob.type).toBe("image/png");

    const out = new Uint8Array(await blob.arrayBuffer());
    expect(Array.from(out)).toEqual(Array.from(original));
  });
});
