import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const MAX_CREDENTIALS = 100;
const CREDENTIALS_FILE = path.resolve(
  process.env.SGTA_REMOTE_OPERATIONS_CREDENTIALS_FILE
    || path.join(process.cwd(), "data", "remote-operations-credentials.json")
);
const sessions = new Map();
const loginAttempts = new Map();

function configuredPassword() {
  return String(process.env.SGTA_REMOTE_OPERATIONS_PASSWORD || "");
}

function passwordMatches(provided) {
  const expectedHash = crypto.createHash("sha256").update(configuredPassword()).digest();
  const providedHash = crypto.createHash("sha256").update(String(provided || "")).digest();
  return crypto.timingSafeEqual(expectedHash, providedHash);
}

function derivePasswordHash(password, salt) {
  return crypto.scryptSync(String(password), salt, 64).toString("hex");
}

function readCredentials() {
  try {
    const data = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw new Error(`Não foi possível ler as credenciais de operações remotas: ${error.message}`);
  }
}

function writeCredentials(credentials) {
  fs.mkdirSync(path.dirname(CREDENTIALS_FILE), { recursive: true });
  const temporaryFile = `${CREDENTIALS_FILE}.${process.pid}.${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(temporaryFile, `${JSON.stringify(credentials, null, 2)}\n`, { mode: 0o600, flag: "wx" });
  try {
    fs.renameSync(temporaryFile, CREDENTIALS_FILE);
    try { fs.chmodSync(CREDENTIALS_FILE, 0o600); } catch {}
  } catch (error) {
    try { fs.rmSync(temporaryFile, { force: true }); } catch {}
    throw error;
  }
}

function hashMatches(password, salt, expectedHex) {
  const actual = Buffer.from(derivePasswordHash(password, salt), "hex");
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function extractToken(req) {
  const authorization = String(req.get("authorization") || "");
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
}

function pruneExpiredSessions() {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (session.expiresAt <= now) sessions.delete(token);
  }
  for (const [key, attempt] of loginAttempts) {
    if (now - attempt.windowStartedAt > LOGIN_WINDOW_MS) loginAttempts.delete(key);
  }
}

export function getRemoteOperationsAuthStatus(token = "") {
  pruneExpiredSessions();
  const session = token ? sessions.get(String(token)) : null;
  const credentials = readCredentials();
  const activeCredentials = credentials.filter(credential => !credential.expiresAt || Date.parse(credential.expiresAt) > Date.now());
  const hasStoredAdmin = activeCredentials.some(credential => credential.role === "admin");
  return {
    enabled: Boolean(configuredPassword()) || activeCredentials.length > 0,
    setupRequired: !configuredPassword() && !hasStoredAdmin && activeCredentials.length === 0,
    authenticated: Boolean(session && session.expiresAt > Date.now()),
    isAdmin: Boolean(session?.isAdmin),
    username: session?.username || ""
  };
}

export function authenticateRemoteOperations(username, password, clientKey) {
  pruneExpiredSessions();
  const activeCredentials = readCredentials().filter(credential => !credential.expiresAt || Date.parse(credential.expiresAt) > Date.now());
  if (!configuredPassword() && activeCredentials.length === 0) {
    return { ok: false, status: 503, error: "Autenticação remota não configurada no servidor." };
  }
  const key = String(clientKey || "unknown");
  let attempt = loginAttempts.get(key);
  if (!attempt || Date.now() - attempt.windowStartedAt > LOGIN_WINDOW_MS) {
    attempt = { count: 0, windowStartedAt: Date.now() };
    loginAttempts.set(key, attempt);
  }
  if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
    return { ok: false, status: 429, error: "Muitas tentativas. Aguarde 15 minutos antes de tentar novamente." };
  }

  attempt.count += 1;
  const normalizedUsername = String(username || "").trim();
  const envMasterConfigured = Boolean(configuredPassword());
  const envAdmin = envMasterConfigured && normalizedUsername === "admin" && passwordMatches(password);
  const credential = envMasterConfigured && normalizedUsername === "admin"
    ? null
    : activeCredentials.find(item => item.username === normalizedUsername);
  const credentialPasswordValid = Boolean(credential && hashMatches(password, credential.salt, credential.passwordHash));
  const isAdmin = envAdmin || Boolean(credentialPasswordValid && credential.role === "admin");
  if (!envAdmin && !credentialPasswordValid) {
    return { ok: false, status: 401, error: "Senha incorreta." };
  }

  loginAttempts.delete(key);
  const token = crypto.randomBytes(32).toString("base64url");
  const sessionExpiresAt = Math.min(
    Date.now() + SESSION_TTL_MS,
    credential?.expiresAt ? Date.parse(credential.expiresAt) : Number.POSITIVE_INFINITY
  );
  const expiresAt = sessionExpiresAt;
  sessions.set(token, { expiresAt, isAdmin, username: normalizedUsername, credentialId: credential?.id || null });
  return { ok: true, token, expiresAt, isAdmin, username: normalizedUsername };
}

export function setupRemoteOperationsAdmin(password, clientKey) {
  const key = String(clientKey || "unknown");
  let attempt = loginAttempts.get(key);
  if (!attempt || Date.now() - attempt.windowStartedAt > LOGIN_WINDOW_MS) {
    attempt = { count: 0, windowStartedAt: Date.now() };
    loginAttempts.set(key, attempt);
  }
  if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
    return { ok: false, status: 429, error: "Muitas tentativas. Aguarde 15 minutos antes de tentar novamente." };
  }
  attempt.count += 1;

  const credentials = readCredentials();
  const activeCredentials = credentials.filter(credential => !credential.expiresAt || Date.parse(credential.expiresAt) > Date.now());
  if (configuredPassword() || activeCredentials.length > 0) {
    return { ok: false, status: 409, error: "A configuração inicial já foi concluída." };
  }
  const normalizedPassword = String(password || "");
  if (normalizedPassword.length < 16) {
    return { ok: false, status: 400, error: "A senha mestra deve ter pelo menos 16 caracteres." };
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const createdAt = new Date().toISOString();
  writeCredentials([{
    id: crypto.randomUUID(),
    username: "admin",
    role: "admin",
    salt,
    passwordHash: derivePasswordHash(normalizedPassword, salt),
    createdAt,
    expiresAt: null
  }]);
  loginAttempts.delete(key);

  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + SESSION_TTL_MS;
  sessions.set(token, { expiresAt, isAdmin: true, username: "admin", credentialId: null });
  return { ok: true, token, expiresAt, isAdmin: true, username: "admin" };
}

export function listRemoteOperationsCredentials() {
  const now = Date.now();
  return readCredentials()
    .filter(credential => credential.role !== "admin" && (!credential.expiresAt || Date.parse(credential.expiresAt) > now))
    .map(({ id, username, createdAt, expiresAt }) => ({ id, username, createdAt, expiresAt }));
}

export function createRemoteOperationsCredential(adminToken, { username, password, expiresInHours = 0 } = {}) {
  if (!isRemoteOperationsAdminTokenValid(adminToken)) {
    throw Object.assign(new Error("Somente o administrador pode criar credenciais."), { status: 403 });
  }
  const normalizedUsername = String(username || "").trim();
  const normalizedPassword = String(password || "");
  if (!/^[A-Za-z0-9._-]{3,40}$/.test(normalizedUsername) || normalizedUsername.toLowerCase() === "admin") {
    throw Object.assign(new Error("Nome de acesso inválido. Use 3 a 40 caracteres: letras, números, ponto, hífen ou sublinhado."), { status: 400 });
  }
  if (normalizedPassword.length < 12) {
    throw Object.assign(new Error("A senha deve ter pelo menos 12 caracteres."), { status: 400 });
  }
  const validDurations = [0, 1, 8, 24, 168];
  const duration = Number(expiresInHours);
  if (!validDurations.includes(duration)) {
    throw Object.assign(new Error("Validade inválida."), { status: 400 });
  }

  const credentials = readCredentials().filter(credential => !credential.expiresAt || Date.parse(credential.expiresAt) > Date.now());
  if (credentials.length >= MAX_CREDENTIALS) {
    throw Object.assign(new Error("Limite de 100 credenciais atingido."), { status: 400 });
  }
  if (credentials.some(credential => credential.username.toLowerCase() === normalizedUsername.toLowerCase())) {
    throw Object.assign(new Error("Já existe uma credencial com esse nome."), { status: 409 });
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const createdAt = new Date().toISOString();
  const expiresAt = duration ? new Date(Date.now() + duration * 60 * 60 * 1000).toISOString() : null;
  const credential = {
    id: crypto.randomUUID(),
    username: normalizedUsername,
    role: "user",
    salt,
    passwordHash: derivePasswordHash(normalizedPassword, salt),
    createdAt,
    expiresAt
  };
  writeCredentials([...credentials, credential]);
  return { id: credential.id, username: credential.username, createdAt, expiresAt };
}

export function revokeRemoteOperationsCredential(adminToken, credentialId) {
  if (!isRemoteOperationsAdminTokenValid(adminToken)) {
    throw Object.assign(new Error("Somente o administrador pode revogar credenciais."), { status: 403 });
  }
  const credentials = readCredentials();
  const target = credentials.find(credential => credential.id === credentialId);
  if (target?.role === "admin") {
    throw Object.assign(new Error("A senha mestra admin não pode ser revogada por esta tela."), { status: 400 });
  }
  const remaining = credentials.filter(credential => credential.id !== credentialId);
  if (remaining.length === credentials.length) {
    throw Object.assign(new Error("Credencial não encontrada."), { status: 404 });
  }
  writeCredentials(remaining);
  for (const [token, session] of sessions) {
    if (session.credentialId === credentialId) sessions.delete(token);
  }
  return { ok: true };
}

export function isRemoteOperationsTokenValid(token) {
  pruneExpiredSessions();
  if (!token) return false;
  const session = sessions.get(String(token));
  return Boolean(session && session.expiresAt > Date.now());
}

export function isRemoteOperationsAdminTokenValid(token) {
  pruneExpiredSessions();
  const session = token ? sessions.get(String(token)) : null;
  return Boolean(session && session.expiresAt > Date.now() && session.isAdmin);
}

export function revokeRemoteOperationsToken(token) {
  if (token) sessions.delete(String(token));
}

export function requireRemoteOperationsAuth(req, res, next) {
  const enabled = Boolean(configuredPassword()) || readCredentials().some(credential =>
    !credential.expiresAt || Date.parse(credential.expiresAt) > Date.now()
  );
  if (!enabled) {
    return res.status(503).json({ error: "Autenticação remota não configurada no servidor." });
  }
  if (!isRemoteOperationsTokenValid(extractToken(req))) {
    return res.status(401).json({ error: "Autenticação necessária para operações remotas." });
  }
  return next();
}

export { extractToken };