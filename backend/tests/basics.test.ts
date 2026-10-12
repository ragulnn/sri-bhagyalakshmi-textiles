import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizePhone } from "../auth.js";

test("accepts a valid 10-digit Indian mobile number", () => {
  assert.equal(normalizePhone("9876543210"), "9876543210");
});

test("normalizes supported Indian phone prefixes", () => {
  assert.equal(normalizePhone("+91 9876543210"), "9876543210");
  assert.equal(normalizePhone("91-9876543210"), "9876543210");
  assert.equal(normalizePhone("09876543210"), "9876543210");
});

test("rejects invalid phone numbers", () => {
  assert.equal(normalizePhone("1234567890"), null);
  assert.equal(normalizePhone("987654321"), null);
  assert.equal(normalizePhone("98765432101"), null);
  assert.equal(normalizePhone("not-a-number"), null);
  assert.equal(normalizePhone(null), null);
});
