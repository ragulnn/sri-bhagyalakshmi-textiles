import { test } from "node:test";
import assert from "node:assert/strict";

import {
  base32Encode,
  base32Decode,
  generateSecret,
  hotp,
  verifyTotp,
  otpauthUri,
} from "../twofa.js";

test("Base32 encoding and decoding round-trip", () => {
  const original = Buffer.from("Hello, textiles!");
  const encoded = base32Encode(original);

  assert.equal(base32Decode(encoded).toString(), original.toString());
});

test("Base32 decoding accepts lowercase and trailing padding", () => {
  const encoded = base32Encode(Buffer.from("hello"));
  assert.equal(
    base32Decode(encoded.toLowerCase() + "====").toString(),
    "hello",
  );
});

test("generateSecret returns a Base32 secret", () => {
  const secret = generateSecret();

  assert.match(secret, /^[A-Z2-7]+$/);
  assert.equal(base32Decode(secret).length, 20);
});

test("HOTP matches RFC 4226 test vectors", () => {
  const secret = Buffer.from("12345678901234567890");

  const expected = [
    "755224",
    "287082",
    "359152",
    "969429",
    "338314",
    "254676",
    "287922",
    "162583",
    "399871",
    "520489",
  ];

  expected.forEach((code, counter) => {
    assert.equal(hotp(secret, counter), code);
  });
});

test("HOTP preserves leading zeroes", () => {
  const secret = Buffer.from("12345678901234567890");

  assert.equal(hotp(secret, 0).length, 6);
  assert.match(hotp(secret, 0), /^\d{6}$/);
});

test("TOTP accepts the current valid time step", () => {
  const secret = Buffer.from("test secret for TOTP");
  const secretB32 = base32Encode(secret);
  const now = 1_800_000_000_000;
  const step = Math.floor(now / 30_000);
  const code = hotp(secret, step);

  assert.equal(verifyTotp(secretB32, code, step - 1, now), step);
});

test("TOTP rejects malformed codes", () => {
  const secretB32 = base32Encode(Buffer.from("test secret"));

  assert.equal(verifyTotp(secretB32, "12345", -1, 1_800_000_000_000), null);
  assert.equal(verifyTotp(secretB32, "abcdef", -1, 1_800_000_000_000), null);
});

test("TOTP rejects a code that has already been used", () => {
  const secret = Buffer.from("replay protection test");
  const secretB32 = base32Encode(secret);
  const now = 1_800_000_000_000;
  const step = Math.floor(now / 30_000);
  const code = hotp(secret, step);

  assert.equal(verifyTotp(secretB32, code, step, now), null);
});

test("TOTP accepts a code from an adjacent time step when unused", () => {
  const secret = Buffer.from("time drift test");
  const secretB32 = base32Encode(secret);
  const now = 1_800_000_000_000;
  const step = Math.floor(now / 30_000);
  const previousCode = hotp(secret, step - 1);

  assert.equal(verifyTotp(secretB32, previousCode, step - 2, now), step - 1);
});

test("otpauth URI encodes issuer and account names", () => {
  const uri = otpauthUri("JBSWY3DPEHPK3PXP", "customer@example.com", "Sri Textiles");

  assert.ok(uri.startsWith("otpauth://totp/"));
  assert.ok(uri.includes("Sri%20Textiles"));
  assert.ok(uri.includes("customer%40example.com"));
  assert.ok(uri.includes("algorithm=SHA1"));
  assert.ok(uri.includes("digits=6"));
  assert.ok(uri.includes("period=30"));
});
