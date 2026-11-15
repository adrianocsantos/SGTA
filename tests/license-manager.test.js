import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { key, iv } from "../license/private.js";
import { validateLicenseContent } from "../backend/licenseManager.js";

function encryptLicense(payload) {
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(key.toString().trim()),
    Buffer.from(iv.toString().trim(), "hex")
  );
  return Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final()
  ]).toString("hex");
}

test("validates a current encrypted TBB license", () => {
  const expirationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const result = validateLicenseContent(encryptLicense({ expirationDate }));

  assert.equal(result.expDateLicense, expirationDate);
  assert.match(result.encryptedLicense, /^[0-9a-f]+$/);
});

test("rejects malformed, incompatible, and expired licenses", () => {
  assert.throws(() => validateLicenseContent(Buffer.alloc(0)), /Arquivo de licença inválido/);
  assert.throws(() => validateLicenseContent("not-a-license"), /Arquivo de licença inválido/);
  assert.throws(() => validateLicenseContent(encryptLicense({ expirationDate: "2020-01-01" })), /já está expirada/);
  assert.throws(() => validateLicenseContent(encryptLicense({ expirationDate: "2026-02-31" })), /data de expiração válida/);
});
