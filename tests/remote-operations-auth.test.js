import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const originalCredentialPath = process.env.SGTA_REMOTE_OPERATIONS_CREDENTIALS_FILE;
const testDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "sgta-auth-test-"));
process.env.SGTA_REMOTE_OPERATIONS_CREDENTIALS_FILE = path.join(testDataDir, "credentials.json");
const {
  authenticateRemoteOperations,
  createRemoteOperationsCredential,
  getRemoteOperationsAuthStatus,
  isRemoteOperationsAdminTokenValid,
  isRemoteOperationsTokenValid,
  listRemoteOperationsCredentials,
  requireRemoteOperationsAuth,
  revokeRemoteOperationsCredential,
  revokeRemoteOperationsToken,
  setupRemoteOperationsAdmin
} = await import("../backend/remoteOperationsAuth.js");

test("admin creates permanent/temporary credentials and revocation ends active sessions", t => {
  t.after(() => {
    if (originalCredentialPath === undefined) delete process.env.SGTA_REMOTE_OPERATIONS_CREDENTIALS_FILE;
    else process.env.SGTA_REMOTE_OPERATIONS_CREDENTIALS_FILE = originalCredentialPath;
    if (originalPassword === undefined) delete process.env.SGTA_REMOTE_OPERATIONS_PASSWORD;
    else process.env.SGTA_REMOTE_OPERATIONS_PASSWORD = originalPassword;
    fs.rmSync(testDataDir, { recursive: true, force: true });
  });

  const originalPassword = process.env.SGTA_REMOTE_OPERATIONS_PASSWORD;
  delete process.env.SGTA_REMOTE_OPERATIONS_PASSWORD;
  assert.deepEqual(getRemoteOperationsAuthStatus(), {
    enabled: false,
    setupRequired: true,
    authenticated: false,
    isAdmin: false,
    username: ""
  });
  assert.equal(authenticateRemoteOperations("admin", "anything", "test-client").status, 503);
  assert.equal(setupRemoteOperationsAdmin("short", "setup-client").status, 400);
  const firstSetup = setupRemoteOperationsAdmin("bootstrap-master-password-123", "setup-client");
  assert.equal(firstSetup.ok, true);
  assert.equal(firstSetup.isAdmin, true);
  assert.equal(getRemoteOperationsAuthStatus(firstSetup.token).setupRequired, false);
  assert.equal(setupRemoteOperationsAdmin("another-bootstrap-password-123", "other-client").status, 409);
  revokeRemoteOperationsToken(firstSetup.token);

  process.env.SGTA_REMOTE_OPERATIONS_PASSWORD = "test-password-for-unit";
  assert.equal(getRemoteOperationsAuthStatus().enabled, true);
  assert.equal(authenticateRemoteOperations("admin", "incorrect", "test-client").status, 401);

  const denied = { statusCode: 0, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; } };
  requireRemoteOperationsAuth({ get: () => "" }, denied, () => assert.fail("Unauthenticated request passed"));
  assert.equal(denied.statusCode, 401);

  const adminLogin = authenticateRemoteOperations("admin", "test-password-for-unit", "admin-client");
  assert.equal(adminLogin.ok, true);
  assert.equal(adminLogin.isAdmin, true);
  assert.equal(isRemoteOperationsAdminTokenValid(adminLogin.token), true);

  let authorized = false;
  requireRemoteOperationsAuth({ get: () => `Bearer ${adminLogin.token}` }, {}, () => { authorized = true; });
  assert.equal(authorized, true);

  const temporary = createRemoteOperationsCredential(adminLogin.token, {
    username: "temp.user",
    password: "temporary-pass-123",
    expiresInHours: 1
  });
  assert.ok(Date.parse(temporary.expiresAt) > Date.now());
  const storedCredentials = fs.readFileSync(path.join(testDataDir, "credentials.json"), "utf8");
  assert.equal(storedCredentials.includes("temporary-pass-123"), false);
  const userLogin = authenticateRemoteOperations("temp.user", "temporary-pass-123", "user-client");
  assert.equal(userLogin.isAdmin, false);
  assert.equal(isRemoteOperationsTokenValid(userLogin.token), true);
  assert.ok(userLogin.expiresAt <= Date.parse(temporary.expiresAt));
  assert.throws(() => createRemoteOperationsCredential(userLogin.token, {
    username: "another.user",
    password: "another-pass-123",
    expiresInHours: 0
  }), error => error.status === 403);

  const permanent = createRemoteOperationsCredential(adminLogin.token, {
    username: "permanent.user",
    password: "permanent-pass-123",
    expiresInHours: 0
  });
  assert.equal(permanent.expiresAt, null);
  assert.deepEqual(listRemoteOperationsCredentials().map(credential => credential.username), ["temp.user", "permanent.user"]);

  revokeRemoteOperationsCredential(adminLogin.token, temporary.id);
  assert.equal(isRemoteOperationsTokenValid(userLogin.token), false);
  assert.deepEqual(listRemoteOperationsCredentials().map(credential => credential.username), ["permanent.user"]);

  revokeRemoteOperationsToken(adminLogin.token);
  assert.equal(isRemoteOperationsAdminTokenValid(adminLogin.token), false);

});