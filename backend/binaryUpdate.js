import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";

const SESSION_DIR = path.resolve(process.cwd(), "data", "binary-updates");
fs.mkdirSync(SESSION_DIR, { recursive: true });

function normalizeBuffer(content) {
  if (Buffer.isBuffer(content)) return content;
  if (typeof content === "string") return Buffer.from(content, "utf8");
  if (content === null || content === undefined) return Buffer.alloc(0);
  if (ArrayBuffer.isView(content)) return Buffer.from(content.buffer, content.byteOffset, content.byteLength);
  if (content instanceof ArrayBuffer) return Buffer.from(content);
  return Buffer.from(String(content), "utf8");
}

export function validateExecutableBuffer(content, platform = process.platform) {
  const buffer = normalizeBuffer(content);
  const valid = platform === "win32"
    ? buffer.length > 2 && buffer[0] === 0x4d && buffer[1] === 0x5a
    : platform === "linux"
      ? buffer.length > 4 && buffer[0] === 0x7f && buffer.toString("ascii", 1, 4) === "ELF"
      : false;
  if (!valid) {
    const expected = platform === "win32" ? "Windows PE (.exe)" : platform === "linux" ? "Linux ELF" : platform;
    throw new Error(`O arquivo enviado não é um executável ${expected} válido.`);
  }
  return buffer;
}

function sessionPath(sessionId) {
  return path.join(SESSION_DIR, `${sessionId}.json`);
}

function writeSession(session) {
  fs.writeFileSync(sessionPath(session.id), JSON.stringify(session, null, 2), "utf8");
}

export function listBinaryUpdateSessions() {
  if (!fs.existsSync(SESSION_DIR)) return [];
  return fs.readdirSync(SESSION_DIR)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      const filePath = path.join(SESSION_DIR, name);
      try {
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getBinaryUpdateSession(sessionId) {
  const filePath = sessionPath(sessionId);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

export function decodeBase64Payload(value, label = "binary") {
  const raw = value == null ? "" : String(value).trim();
  if (!raw) {
    throw new Error(`Informe o conteúdo do binário para ${label}.`);
  }

  const normalized = raw.includes("base64,") ? raw.split("base64,").pop() : raw;
  const buffer = Buffer.from(normalized, "base64");
  if (!buffer.length) {
    throw new Error(`Conteúdo binário em base64 vazio para ${label}.`);
  }
  return buffer;
}

export function createBinaryUpdateSession({ targetPath, stagedContent, label = "binary" }) {
  if (!targetPath || typeof targetPath !== "string") {
    throw new Error("Informe o caminho do binário alvo.");
  }

  const sessionId = crypto.randomUUID();
  const resolvedTargetPath = path.resolve(targetPath);
  const backupPath = `${resolvedTargetPath}.bkp`;
  const stagedPath = path.join(SESSION_DIR, `${sessionId}.staged.bin`);
  const nowIso = new Date().toISOString();

  if (fs.existsSync(resolvedTargetPath)) {
    fs.copyFileSync(resolvedTargetPath, backupPath);
  }

  const content = normalizeBuffer(stagedContent);
  fs.writeFileSync(stagedPath, content);

  const session = {
    id: sessionId,
    label,
    targetPath: resolvedTargetPath,
    backupPath,
    stagedPath,
    createdAt: nowIso,
    updatedAt: nowIso,
    status: "staged"
  };

  writeSession(session);
  return session;
}

export function requestBinaryUpdate(sessionId, action = "apply") {
  const session = getBinaryUpdateSession(sessionId);
  if (!session) {
    throw new Error(`Sessão de atualização não encontrada: ${sessionId}`);
  }
  if (!['apply', 'rollback'].includes(action)) {
    throw new Error(`Ação de atualização inválida: ${action}`);
  }

  const sourcePath = action === "apply" ? session.stagedPath : session.backupPath;
  if (!fs.existsSync(sourcePath)) {
    throw new Error(action === "apply"
      ? `Arquivo preparado não encontrado para a sessão ${sessionId}.`
      : `Backup do binário não encontrado para a sessão ${sessionId}.`);
  }

  session.status = action === "apply" ? "apply_requested" : "rollback_requested";
  session.updatedAt = new Date().toISOString();
  writeSession(session);
  return session;
}

export function completePendingBinaryUpdate(targetPath) {
  const resolvedTargetPath = path.resolve(targetPath);
  const session = listBinaryUpdateSessions()
    .reverse()
    .find(candidate => path.resolve(candidate.targetPath) === resolvedTargetPath
      && ["apply_requested", "rollback_requested"].includes(candidate.status));
  if (!session) return null;

  const isRollback = session.status === "rollback_requested";
  const sourcePath = isRollback ? session.backupPath : session.stagedPath;
  const temporaryPath = `${session.targetPath}.${process.pid}.${session.id}.tmp`;
  try {
    fs.copyFileSync(sourcePath, temporaryPath);
    if (process.platform !== "win32") {
      const mode = fs.statSync(session.targetPath).mode;
      fs.chmodSync(temporaryPath, mode);
    }
    fs.renameSync(temporaryPath, session.targetPath);
    session.status = isRollback ? "rolled_back" : "applied";
    session.updatedAt = new Date().toISOString();
    if (isRollback) session.rolledBackAt = session.updatedAt;
    else session.appliedAt = session.updatedAt;
    writeSession(session);
    return session;
  } catch (err) {
    try { fs.rmSync(temporaryPath, { force: true }); } catch {}
    session.status = isRollback ? "rollback_failed" : "apply_failed";
    session.updatedAt = new Date().toISOString();
    session.error = err.message;
    writeSession(session);
    throw err;
  }
}

export function startWindowsBinaryUpdate(sessionId, targetPath, serviceHostPath = "") {
  const session = getBinaryUpdateSession(sessionId);
  if (!session) throw new Error(`Sessão de atualização não encontrada: ${sessionId}`);
  if (path.resolve(session.targetPath) !== path.resolve(targetPath)) {
    throw new Error("A sessão não corresponde ao executável deste serviço.");
  }
  if (!["apply_requested", "rollback_requested"].includes(session.status)) {
    throw new Error("A sessão não está aguardando aplicação.");
  }

  const rollback = session.status === "rollback_requested";
  const sourcePath = rollback ? session.backupPath : session.stagedPath;
  const temporaryPath = `${session.targetPath}.${session.id}.update`;
  const quote = value => `'${String(value).replace(/'/g, "''")}'`;
  const restartService = serviceHostPath
    ? `if (Test-Path -LiteralPath ${quote(serviceHostPath)}) { Start-Process -FilePath ${quote(serviceHostPath)} -ArgumentList 'restart' -Wait } else { Start-Process -FilePath ${quote(session.targetPath)} -WorkingDirectory ${quote(path.dirname(session.targetPath))} }`
    : `Start-Process -FilePath ${quote(session.targetPath)} -WorkingDirectory ${quote(path.dirname(session.targetPath))}`;
  const recoverService = serviceHostPath
    ? `if (Test-Path -LiteralPath ${quote(serviceHostPath)}) { Start-Process -FilePath ${quote(serviceHostPath)} -ArgumentList 'restart' } else { Start-Process -FilePath ${quote(session.targetPath)} -WorkingDirectory ${quote(path.dirname(session.targetPath))} }`
    : `Start-Process -FilePath ${quote(session.targetPath)} -WorkingDirectory ${quote(path.dirname(session.targetPath))}`;
  const script = [
    "$ErrorActionPreference = 'Stop'",
    `$parentPid = ${process.pid}`,
    "while (Get-Process -Id $parentPid -ErrorAction SilentlyContinue) { Start-Sleep -Milliseconds 250 }",
    `try { Copy-Item -LiteralPath ${quote(sourcePath)} -Destination ${quote(temporaryPath)} -Force; Move-Item -LiteralPath ${quote(temporaryPath)} -Destination ${quote(session.targetPath)} -Force; $s = Get-Content -LiteralPath ${quote(sessionPath(session.id))} -Raw | ConvertFrom-Json; $s.status = ${quote(rollback ? "rolled_back" : "applied")}; $s.updatedAt = [DateTime]::UtcNow.ToString('o'); if (${rollback ? "$true" : "$false"}) { $s.rolledBackAt = $s.updatedAt } else { $s.appliedAt = $s.updatedAt }; [IO.File]::WriteAllText(${quote(sessionPath(session.id))}, ($s | ConvertTo-Json -Depth 10), [Text.UTF8Encoding]::new($false)); ${restartService} } catch { $s = Get-Content -LiteralPath ${quote(sessionPath(session.id))} -Raw | ConvertFrom-Json; $s.status = ${quote(rollback ? "rollback_failed" : "apply_failed")}; $s.error = $_.Exception.Message; $s.updatedAt = [DateTime]::UtcNow.ToString('o'); [IO.File]::WriteAllText(${quote(sessionPath(session.id))}, ($s | ConvertTo-Json -Depth 10), [Text.UTF8Encoding]::new($false)); ${recoverService} }`
  ].join("\n");
  const encodedScript = Buffer.from(script, "utf16le").toString("base64");
  const helper = spawn("powershell.exe", [
    "-NoLogo", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-EncodedCommand", encodedScript
  ], { detached: true, stdio: "ignore", windowsHide: true });
  helper.unref();
  return helper;
}

export function applyBinaryUpdate(sessionId) {
  const session = getBinaryUpdateSession(sessionId);
  if (!session) {
    throw new Error(`Sessão de atualização não encontrada: ${sessionId}`);
  }
  if (!fs.existsSync(session.stagedPath)) {
    throw new Error(`Arquivo preparado não encontrado para a sessão ${sessionId}.`);
  }

  const targetDir = path.dirname(session.targetPath);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.copyFileSync(session.stagedPath, session.targetPath);

  session.status = "applied";
  session.updatedAt = new Date().toISOString();
  session.appliedAt = session.updatedAt;
  writeSession(session);
  return session;
}

export function rollbackBinaryUpdate(sessionId) {
  const session = getBinaryUpdateSession(sessionId);
  if (!session) {
    throw new Error(`Sessão de atualização não encontrada: ${sessionId}`);
  }
  if (!fs.existsSync(session.backupPath)) {
    throw new Error(`Backup do binário não encontrado para a sessão ${sessionId}.`);
  }

  const targetDir = path.dirname(session.targetPath);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.copyFileSync(session.backupPath, session.targetPath);

  session.status = "rolled_back";
  session.updatedAt = new Date().toISOString();
  session.rolledBackAt = session.updatedAt;
  writeSession(session);
  return session;
}
