import express from "express";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFile, spawn } from "child_process";
import { Server } from "socket.io";
import { createAgentLogger } from "./agentLogger.js";
import { createBinaryUpdateSession, requestBinaryUpdate, listBinaryUpdateSessions, decodeBase64Payload, validateExecutableBuffer } from "../backend/binaryUpdate.js";
import { MAX_UPLOAD_FILE_BYTES, saveUploadedFile } from "../backend/fileUpload.js";

const log = createAgentLogger("agent");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 1024 * 1024 });
const BINARY_UPDATE_EXIT_CODE = 76;
let binaryUpdateRestartScheduled = false;
app.use(express.json({ limit: "4mb" }));
app.use("/api/binary-update/stage", express.raw({ type: "application/octet-stream", limit: "1024mb" }));

function getAgentDir() {
  if (typeof process !== "undefined" && process.pkg) {
    return path.dirname(process.execPath);
  }

  try {
    return path.dirname(fileURLToPath(import.meta.url));
  } catch (err) {
    return process.cwd();
  }
}

function getConfigFilePath() {
  return process.env.SGTA_AGENT_CONFIG || path.join(getAgentDir(), "agent.config.js");
}

function loadAgentConfig() {
  const configFile = getConfigFilePath();
  if (!fs.existsSync(configFile)) {
    return {};
  }

  const content = fs.readFileSync(configFile, "utf-8");
  const module = { exports: {} };
  const func = new Function(
    "exports",
    "module",
    content.replace(/export const/g, "const") + "\nmodule.exports = { AGENT_CONFIG };"
  );
  func(module.exports, module);
  return module.exports.AGENT_CONFIG || {};
}

function normalizeAgentConfig(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Configuração inválida.");
  }
  const port = Number(input.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT inválida.");
  const encoding = String(input.ENCODING || "utf-8").trim();
  const maxBytes = Number(input.MAX_BYTES);
  const maxLines = Number(input.MAX_LINES_PER_READ);
  if (!encoding) throw new Error("ENCODING inválido.");
  if (!Number.isInteger(maxBytes) || maxBytes < 1) throw new Error("MAX_BYTES inválido.");
  if (!Number.isInteger(maxLines) || maxLines < 1) throw new Error("MAX_LINES_PER_READ inválido.");

  const result = {
    PORT: port,
    ...(input.LOG_PATH ? { LOG_PATH: String(input.LOG_PATH).trim() } : {}),
    ENCODING: encoding,
    MAX_BYTES: maxBytes,
    MAX_LINES_PER_READ: maxLines,
    TOKEN: String(input.TOKEN || ""),
    ALLOW_EXEC: Boolean(input.ALLOW_EXEC),
    ALLOW_FS_BROWSE: Boolean(input.ALLOW_FS_BROWSE),
    ALLOW_FS_EDIT: Boolean(input.ALLOW_FS_EDIT),
    ...(input.EXEC_TIMEOUT_MS ? { EXEC_TIMEOUT_MS: Number(input.EXEC_TIMEOUT_MS) } : {})
  };
  if (input.LOG_SOURCES && typeof input.LOG_SOURCES === "object" && !Array.isArray(input.LOG_SOURCES)) {
    const sources = {};
    for (const [key, value] of Object.entries(input.LOG_SOURCES)) {
      if (!/^[A-Za-z0-9._-]+$/.test(key)) throw new Error(`Chave de fonte inválida: ${key}`);
      const source = typeof value === "string" ? { PATH: value } : value;
      const sourcePath = String(source?.PATH || source?.path || "").trim();
      const pathTemplate = String(source?.PATH_TEMPLATE || source?.pathTemplate || "").trim();
      if (!sourcePath && !pathTemplate) throw new Error(`Informe PATH ou PATH_TEMPLATE para a fonte ${key}.`);
      const timezone = String(source?.TIMEZONE || source?.timezone || "America/Sao_Paulo").trim();
      try { new Intl.DateTimeFormat("pt-BR", { timeZone: timezone }).format(new Date()); }
      catch (_) { throw new Error(`TIMEZONE inválido para a fonte ${key}.`); }
      const fallbackDays = Number(source?.DATE_FALLBACK_DAYS ?? source?.dateFallbackDays ?? 0);
      if (!Number.isInteger(fallbackDays) || fallbackDays < 0 || fallbackDays > 366) {
        throw new Error(`DATE_FALLBACK_DAYS inválido para a fonte ${key}.`);
      }
      const fallbackHours = Number(source?.DATE_FALLBACK_HOURS ?? source?.dateFallbackHours ?? 0);
      if (!Number.isInteger(fallbackHours) || fallbackHours < 0 || fallbackHours > 8_784) {
        throw new Error(`DATE_FALLBACK_HOURS inválido para a fonte ${key}.`);
      }
      sources[key] = {
        label: String(source?.label || key).trim() || key,
        ...(sourcePath ? { PATH: sourcePath } : {}),
        ...(pathTemplate ? {
          PATH_TEMPLATE: pathTemplate,
          TIMEZONE: timezone,
          DATE_FALLBACK_DAYS: fallbackDays,
          ...(fallbackHours ? { DATE_FALLBACK_HOURS: fallbackHours } : {})
        } : {}),
        ...(source?.ENCODING || source?.encoding ? { ENCODING: String(source.ENCODING || source.encoding).trim() } : {})
      };
    }
    if (Object.keys(sources).length) result.LOG_SOURCES = sources;
  }
  if (!result.LOG_PATH && !result.LOG_SOURCES) throw new Error("Informe LOG_PATH ou LOG_SOURCES.");
  return result;
}

function saveAgentConfig(input) {
  const normalized = normalizeAgentConfig(input);
  const configFile = getConfigFilePath();
  const tempFile = `${configFile}.${process.pid}.${Date.now()}.tmp`;
  const backupFile = `${configFile}.backup`;
  const content = `export const AGENT_CONFIG = ${JSON.stringify(normalized, null, 2)};\n`;
  fs.writeFileSync(tempFile, content, { encoding: "utf-8", flag: "wx" });
  try {
    if (fs.existsSync(configFile)) fs.copyFileSync(configFile, backupFile);
    fs.renameSync(tempFile, configFile);
  } catch (err) {
    try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch (_) {}
    throw err;
  }
  return normalized;
}

const fileConfig = loadAgentConfig();
const PORT = Number(process.env.SGTA_AGENT_PORT || process.env.PORT || fileConfig.PORT || 3100);
const LOG_PATH = process.env.SGTA_AGENT_LOG_PATH || process.env.LOG_PATH || fileConfig.LOG_PATH;
const LOG_SOURCES = fileConfig.LOG_SOURCES && typeof fileConfig.LOG_SOURCES === "object"
  ? fileConfig.LOG_SOURCES
  : null;
const ENCODING = process.env.SGTA_AGENT_ENCODING || fileConfig.ENCODING || "utf-8";
const MAX_BYTES = Number(process.env.SGTA_AGENT_MAX_BYTES || fileConfig.MAX_BYTES || 50 * 1024 * 1024);
const MAX_LINES_PER_READ = Number(process.env.SGTA_AGENT_MAX_LINES || fileConfig.MAX_LINES_PER_READ || 1000);
const TOKEN = process.env.SGTA_AGENT_TOKEN || fileConfig.TOKEN || "";
// Execução remota de comandos é desabilitada por padrão: precisa ser habilitada
// explicitamente em agent.config.js (ALLOW_EXEC: true), pois permite rodar
// qualquer comando no shell da máquina onde o agente está instalado.
const ALLOW_EXEC = Boolean(fileConfig.ALLOW_EXEC) || process.env.SGTA_AGENT_ALLOW_EXEC === "1";
const EXEC_TIMEOUT_MS = Number(process.env.SGTA_AGENT_EXEC_TIMEOUT_MS || fileConfig.EXEC_TIMEOUT_MS || 30_000);
// Navegação de arquivos (somente leitura) também é desabilitada por padrão.
const ALLOW_FS_BROWSE = Boolean(fileConfig.ALLOW_FS_BROWSE) || process.env.SGTA_AGENT_ALLOW_FS_BROWSE === "1";
const ALLOW_FS_EDIT = Boolean(fileConfig.ALLOW_FS_EDIT) || process.env.SGTA_AGENT_ALLOW_FS_EDIT === "1";
const MAX_EDIT_FILE_BYTES = 512 * 1024;
const EXEC_CWD_MARKER = `__SGTA_CWD_${process.pid}_${Date.now()}__`;
const LINUX_PTY_HELPER = String.raw`
import fcntl, os, pty, select, signal, struct, sys, termios
shell, cwd, cols, rows = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
pid, master = pty.fork()
if pid == 0:
    os.chdir(cwd)
    os.execvpe(shell, [shell, '-l'], dict(os.environ, TERM='xterm-256color', COLORTERM='truecolor'))
def resize(c, r):
    fcntl.ioctl(master, termios.TIOCSWINSZ, struct.pack('HHHH', r, c, 0, 0))
    try: os.kill(pid, signal.SIGWINCH)
    except ProcessLookupError: pass
resize(cols, rows)
control = b''
control_open = True
while True:
    watched = [master, 0] + ([3] if control_open else [])
    readable, _, _ = select.select(watched, [], [])
    if master in readable:
        try: data = os.read(master, 65536)
        except OSError: break
        if not data: break
        os.write(1, data)
    if 0 in readable:
        data = os.read(0, 65536)
        if not data: break
        os.write(master, data)
    if 3 in readable:
        data = os.read(3, 1024)
        if not data:
            control_open = False
            continue
        control += data
        while b'\n' in control:
            line, control = control.split(b'\n', 1)
            try:
                c, r = map(int, line.split())
                resize(c, r)
            except (ValueError, OSError): pass
try: os.close(master)
except OSError: pass
_, status = os.waitpid(pid, 0)
sys.exit(os.waitstatus_to_exitcode(status))
`;

function resolveExecDirectory(requestedCwd) {
  const candidate = String(requestedCwd || "").trim();
  if (!candidate) return getAgentDir();
  const resolved = path.resolve(candidate);
  const stats = fs.statSync(resolved);
  if (!stats.isDirectory()) throw new Error(`O caminho não é uma pasta: ${resolved}`);
  return resolved;
}

function getShellCommand(command) {
  if (process.platform === "win32") {
    // cmd.exe recebe o ambiente completo do processo do agente. /d evita
    // AutoRun de terceiros e /s preserva corretamente as aspas de /c.
    return {
      file: process.env.ComSpec || "cmd.exe",
      args: ["/d", "/v:on", "/s", "/c", `${command}\r\nset "SGTA_EXIT=!errorlevel!"\r\necho ${EXEC_CWD_MARKER}!CD!\r\nexit /b !SGTA_EXIT!`]
    };
  }

  const shell = process.env.SHELL || "/bin/sh";
  // Shell de login para carregar /etc/profile e o perfil do usuário do agente.
  const script = `${command}\nsgta_exit=$?\nprintf '\\n${EXEC_CWD_MARKER}%s\\n' "$PWD"\nexit $sgta_exit`;
  return { file: shell, args: ["-l", "-c", script] };
}

function extractExecDirectory(stdout, fallbackCwd) {
  const markerIndex = stdout.lastIndexOf(EXEC_CWD_MARKER);
  if (markerIndex < 0) return { stdout, cwd: fallbackCwd };
  const before = stdout.slice(0, markerIndex).replace(/\r?\n$/, "");
  const after = stdout.slice(markerIndex + EXEC_CWD_MARKER.length);
  const cwd = after.split(/\r?\n/, 1)[0].trim() || fallbackCwd;
  return { stdout: before, cwd };
}

if (!LOG_PATH && !Object.keys(LOG_SOURCES || {}).length) {
  log.error("Informe LOG_PATH ou configure LOG_SOURCES no agent.config.js.");
  process.exit(1);
}

function datePartsInTimezone(date, timezone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date).reduce((result, part) => {
    if (part.type !== "literal") result[part.type] = part.value;
    return result;
  }, {});
  return { year: parts.year, month: parts.month, day: parts.day, hour: parts.hour, minute: parts.minute };
}

function renderPathTemplate(template, parts) {
  const yy = parts.year.slice(-2);
  return template
    .replaceAll("{YYYYMMDDHHmm}", `${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}`)
    .replaceAll("{YYYYMMDDHH}", `${parts.year}${parts.month}${parts.day}${parts.hour}`)
    .replaceAll("{DDMMYYYYHH}", `${parts.day}${parts.month}${parts.year}${parts.hour}`)
    .replaceAll("{DDMMYYYY}", `${parts.day}${parts.month}${parts.year}`)
    .replaceAll("{YYYYMMDD}", `${parts.year}${parts.month}${parts.day}`)
    .replaceAll("{YYYY}", parts.year)
    .replaceAll("{YY}", yy)
    .replaceAll("{MM}", parts.month)
    .replaceAll("{DD}", parts.day)
    .replaceAll("{HH}", parts.hour)
    .replaceAll("{mm}", parts.minute);
}

function resolveTemplatePath(source, sourceKey) {
  const template = String(source.PATH_TEMPLATE || source.pathTemplate || "").trim();
  const timezone = source.TIMEZONE || source.timezone || "America/Sao_Paulo";
  const fallbackDays = Number(source.DATE_FALLBACK_DAYS ?? source.dateFallbackDays ?? 0);
  const fallbackHours = Number(source.DATE_FALLBACK_HOURS ?? source.dateFallbackHours ?? 0);
  const usesTime = /\{(?:HH|mm|YYYYMMDDHH|YYYYMMDDHHmm|DDMMYYYYHH)\}/.test(template);
  const maxOffset = usesTime ? fallbackHours + fallbackDays * 24 : fallbackDays;
  const stepMs = usesTime ? 3_600_000 : 86_400_000;
  const now = new Date();
  const candidates = [];
  for (let offset = 0; offset <= maxOffset; offset += 1) {
    const candidateDate = new Date(now.getTime() - offset * stepMs);
    const parts = datePartsInTimezone(candidateDate, timezone);
    const candidate = renderPathTemplate(template, parts);
    candidates.push(candidate);
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(`Arquivo de log não encontrado para ${sourceKey}. Tentativas: ${candidates.join(", ")}`);
}

function getLogSource(sourceKey) {
  if (sourceKey) {
    const source = LOG_SOURCES?.[sourceKey];
    if (!source) throw new Error(`Fonte de log não encontrada: ${sourceKey}`);
    const sourcePath = typeof source === "string"
      ? source
      : (source?.PATH_TEMPLATE || source?.pathTemplate ? resolveTemplatePath(source, sourceKey) : source?.PATH || source?.path);
    if (!sourcePath) throw new Error(`Caminho não configurado para a fonte: ${sourceKey}`);
    return {
      key: sourceKey,
      label: typeof source === "object" ? source.label || sourceKey : sourceKey,
      path: sourcePath,
      dynamic: typeof source === "object" && !!(source.PATH_TEMPLATE || source.pathTemplate),
      encoding: typeof source === "object" ? source.ENCODING || source.encoding || ENCODING : ENCODING
    };
  }

  // Compatibilidade: requisições antigas, sem `source`, continuam usando
  // LOG_PATH. Se só houver uma fonte nova, ela também pode ser usada sem chave.
  if (LOG_PATH) return { key: null, label: null, path: LOG_PATH, encoding: ENCODING };
  const entries = Object.keys(LOG_SOURCES || {});
  if (entries.length === 1) return getLogSource(entries[0]);
  throw new Error("Informe o parâmetro source para selecionar o log.");
}

function checkToken(req, res, next) {
  if (!TOKEN) return next();

  const headerToken = req.get("x-sgta-token");
  const auth = req.get("authorization") || "";
  const bearerToken = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const queryToken = req.query.token;

  if (headerToken === TOKEN || bearerToken === TOKEN || queryToken === TOKEN) {
    return next();
  }

  return res.status(401).json({ error: "Token inválido para o agente SGTA." });
}

function isValidToken(token) {
  return !TOKEN || token === TOKEN;
}

io.use((socket, next) => {
  const authToken = String(socket.handshake.auth?.token || socket.handshake.headers["x-sgta-token"] || "");
  if (!isValidToken(authToken)) return next(new Error("Token inválido para o agente SGTA."));
  if (!ALLOW_EXEC) return next(new Error("Terminal remoto desabilitado neste agente."));
  if (process.platform !== "linux") return next(new Error("O terminal interativo está habilitado somente em agentes Linux."));
  next();
});

io.on("connection", (socket) => {
  let terminal = null;

  function closeTerminal() {
    if (!terminal) return;
    try { terminal.kill(); } catch (_) {}
    terminal = null;
  }

  socket.on("terminal:start", (payload = {}, acknowledge = () => {}) => {
    closeTerminal();
    try {
      const cols = Math.max(20, Math.min(500, Number(payload.cols) || 80));
      const rows = Math.max(5, Math.min(200, Number(payload.rows) || 24));
      const cwd = resolveExecDirectory(payload.cwd || process.env.HOME || getAgentDir());
      const shell = process.env.SHELL || "/bin/bash";
      const python = process.env.SGTA_AGENT_PYTHON || "python3";
      const child = spawn(python, ["-u", "-c", LINUX_PTY_HELPER, shell, cwd, String(cols), String(rows)], {
        env: { ...process.env },
        stdio: ["pipe", "pipe", "pipe", "pipe"]
      });
      const session = {
        pid: child.pid,
        write: data => child.stdin.write(data),
        resize: (nextCols, nextRows) => child.stdio[3].write(`${nextCols} ${nextRows}\n`),
        kill: () => child.kill("SIGTERM")
      };
      terminal = session;
      child.stdout.on("data", data => socket.emit("terminal:data", data.toString("utf8")));
      child.stderr.on("data", data => socket.emit("terminal:data", `\r\n\x1b[31m${data.toString("utf8")}\x1b[0m`));
      child.once("error", err => {
        socket.emit("terminal:error", { error: `Não foi possível iniciar ${python}: ${err.message}` });
      });
      child.once("exit", (exitCode, signal) => {
        if (terminal === session) terminal = null;
        socket.emit("terminal:exit", { exitCode, signal });
      });
      acknowledge({ ok: true, cwd, pid: session.pid });
    } catch (err) {
      log.error("Falha ao abrir terminal interativo:", err.message);
      acknowledge({ ok: false, error: err.message });
    }
  });

  socket.on("terminal:input", (data) => {
    if (terminal) terminal.write(String(data || ""));
  });
  socket.on("terminal:resize", (size = {}) => {
    if (!terminal) return;
    const cols = Math.max(20, Math.min(500, Number(size.cols) || 80));
    const rows = Math.max(5, Math.min(200, Number(size.rows) || 24));
    try { terminal.resize(cols, rows); } catch (_) {}
  });
  socket.on("terminal:stop", closeTerminal);
  socket.on("disconnect", closeTerminal);
});

async function statLog(logPath) {
  try {
    return await fs.promises.stat(logPath);
  } catch (err) {
    throw new Error(`Arquivo de log não encontrado: ${logPath}`);
  }
}

function splitLogLines(text) {
  return String(text || "")
    .split(/\r\n|\n|\r/)
    .filter(line => line.trim());
}

async function readLastLines(filePath, wantLines, encoding, fileSize, maxReadBytes) {
  const BYTES_PER_LINE = 200;
  const maxWindow = Math.min(maxReadBytes, fileSize);
  let windowSize = Math.min(wantLines * BYTES_PER_LINE * 2, maxWindow);
  let lines = [];

  const fd = fs.openSync(filePath, "r");
  try {
    while (windowSize <= maxWindow) {
      const start = Math.max(fileSize - windowSize, 0);
      const bytesToRead = fileSize - start;
      const buf = Buffer.alloc(bytesToRead);
      fs.readSync(fd, buf, 0, bytesToRead, start);
      lines = splitLogLines(buf.toString(encoding));

      if (lines.length >= wantLines || windowSize === maxWindow) {
        return lines.slice(-wantLines);
      }

      windowSize = Math.min(windowSize * 2, maxWindow);
    }

    return lines.slice(-wantLines);
  } finally {
    fs.closeSync(fd);
  }
}

app.use(checkToken);

app.get("/api/config", (req, res) => {
  try {
    res.json({ config: fileConfig, configFile: getConfigFilePath(), restartEnabled: true });
  } catch (err) {
    log.error("Falha ao consultar configuração:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/binary-update/sessions", (req, res) => {
  try {
    res.json(listBinaryUpdateSessions());
  } catch (err) {
    log.error("Falha ao listar sessões de atualização do agente:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/binary-update/stage", (req, res) => {
  try {
    if (!process.pkg) throw new Error("A atualização do agente exige que ele esteja rodando pelo executável empacotado.");
    const raw = req.body || {};
    const targetPath = process.execPath;
    const stagedContent = Buffer.isBuffer(raw)
      ? raw
      : decodeBase64Payload(raw.binaryBase64 ?? raw.binary, "agente");
    const session = createBinaryUpdateSession({
      targetPath,
      stagedContent: validateExecutableBuffer(stagedContent),
      label: String(req.query.label || raw.label || "agent")
    });
    res.status(201).json(session);
  } catch (err) {
    log.error("Falha ao preparar atualização do agente:", err.message);
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/binary-update/apply", (req, res) => {
  try {
    if (!process.pkg) throw new Error("A atualização automática exige o agente executável rodando sob o supervisor.");
    const sessionId = String(req.body?.sessionId || "").trim();
    if (!sessionId) throw new Error("Informe o sessionId.");
    const session = requestBinaryUpdate(sessionId, "apply");
    res.json({ ok: true, sessionId: session.id, status: session.status, message: "Atualização aceita. O agente será reiniciado para carregar a nova versão." });
    setTimeout(restartForBinaryUpdate, 250);
  } catch (err) {
    log.error("Falha ao aplicar atualização do agente:", err.message);
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/binary-update/rollback", (req, res) => {
  try {
    if (!process.pkg) throw new Error("A reversão automática exige o agente executável rodando sob o supervisor.");
    const sessionId = String(req.body?.sessionId || "").trim();
    if (!sessionId) throw new Error("Informe o sessionId.");
    const session = requestBinaryUpdate(sessionId, "rollback");
    res.json({ ok: true, sessionId: session.id, status: session.status, message: "Reversão aceita. O agente será reiniciado para restaurar o backup." });
    setTimeout(restartForBinaryUpdate, 250);
  } catch (err) {
    log.error("Falha ao reverter atualização do agente:", err.message);
    res.status(400).json({ error: err.message });
  }
});

function restartForBinaryUpdate() {
  if (binaryUpdateRestartScheduled) return;
  binaryUpdateRestartScheduled = true;
  log.info("Encerrando worker para atualizar o executável; o supervisor reiniciará o agente.");
  const finish = () => process.exit(BINARY_UPDATE_EXIT_CODE);
  io.disconnectSockets(true);
  io.close(finish);
  if (server.listening) server.close(finish);
  const forceTimer = setTimeout(finish, 5_000);
  forceTimer.unref();
}

app.put("/api/config", (req, res) => {
  try {
    const config = saveAgentConfig(req.body || {});
    res.json({ ok: true, message: "Configuração salva. O agente será reiniciado automaticamente.", config });
  } catch (err) {
    log.error("Falha ao salvar configuração:", err.message);
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/exec", (req, res) => {
  if (!ALLOW_EXEC) {
    res.status(403).json({ error: "Execução remota de comandos desabilitada neste agente. Habilite ALLOW_EXEC em agent.config.js." });
    return;
  }

  const command = String(req.body?.command || "").trim();
  if (!command) {
    res.status(400).json({ error: "Informe o comando a executar." });
    return;
  }

  let cwd;
  try {
    cwd = resolveExecDirectory(req.body?.cwd);
  } catch (err) {
    res.status(400).json({ error: `Pasta de trabalho inválida: ${err.message}` });
    return;
  }

  const shellCommand = getShellCommand(command);
  log.info(`Executando comando remoto em "${cwd}": ${command}`);
  execFile(shellCommand.file, shellCommand.args, {
    cwd,
    env: { ...process.env },
    timeout: EXEC_TIMEOUT_MS,
    maxBuffer: 5 * 1024 * 1024,
    windowsHide: true
  }, (err, rawStdout = "", stderr = "") => {
    const result = extractExecDirectory(String(rawStdout), cwd);
    if (err && typeof err.code !== "number") {
      log.error("Falha ao executar comando remoto:", err.message);
      res.status(500).json({ ok: false, error: err.message, stdout: result.stdout, stderr, cwd: result.cwd });
      return;
    }
    const code = err?.code ?? 0;
    res.json({ ok: code === 0, code, stdout: result.stdout, stderr, cwd: result.cwd });
  });
});

app.get("/api/fs/list", (req, res) => {
  if (!ALLOW_FS_BROWSE) {
    res.status(403).json({ error: "Navegação de arquivos desabilitada neste agente. Habilite ALLOW_FS_BROWSE em agent.config.js." });
    return;
  }

  const dirPath = String(req.query.path || "").trim();
  if (!dirPath) {
    res.status(400).json({ error: "Informe o parâmetro path." });
    return;
  }

  try {
    const dirents = fs.readdirSync(dirPath, { withFileTypes: true });
    const entries = dirents.map((entry) => {
      const entryPath = path.join(dirPath, entry.name);
      let size = null;
      let modifiedAt = null;
      try {
        const stats = fs.statSync(entryPath);
        size = stats.isDirectory() ? null : stats.size;
        modifiedAt = stats.mtime;
      } catch (_) {
        // Item pode ter sido removido/sem permissão entre o readdir e o stat.
      }
      return { name: entry.name, isDirectory: entry.isDirectory(), size, modifiedAt };
    }).sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    res.json({ path: path.resolve(dirPath), entries });
  } catch (err) {
    log.error(`Falha ao listar pasta "${dirPath}":`, err.message);
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/fs/upload", express.raw({ type: "application/octet-stream", limit: MAX_UPLOAD_FILE_BYTES }), (req, res) => {
  if (!Buffer.isBuffer(req.body)) {
    return res.status(400).json({ error: "Envie um arquivo como application/octet-stream." });
  }

  try {
    const result = saveUploadedFile(
      path.join(getAgentDir(), "uploads"),
      req.query.filename,
      req.body
    );
    log.info(`Arquivo recebido na pasta uploads: ${result.fileName} (${result.size} bytes).`);
    return res.status(201).json({
      ok: true,
      ...result,
      message: `Arquivo ${result.fileName} enviado para uploads/ no agente remoto.`
    });
  } catch (err) {
    log.error("Falha ao receber arquivo na pasta uploads:", err.message);
    return res.status(err.message.startsWith("O arquivo excede") ? 413 : 400).json({ error: err.message });
  }
});

app.get("/api/fs/file", (req, res) => {
  if (!ALLOW_FS_EDIT) {
    res.status(403).json({ error: "Edição de arquivos desabilitada neste agente. Habilite ALLOW_FS_EDIT em agent.config.js." });
    return;
  }

  const filePath = String(req.query.path || "").trim();
  if (!filePath) return res.status(400).json({ error: "Informe o caminho do arquivo." });

  try {
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) return res.status(400).json({ error: "O caminho informado não é um arquivo regular." });
    if (stats.size > MAX_EDIT_FILE_BYTES) return res.status(413).json({ error: "O arquivo excede o limite de edição de 512 KiB." });
    const contentBuffer = fs.readFileSync(filePath);
    if (contentBuffer.includes(0)) return res.status(415).json({ error: "Arquivos binários não podem ser editados no navegador." });
    const content = new TextDecoder("utf-8", { fatal: true }).decode(contentBuffer);
    res.json({ path: path.resolve(filePath), content, size: stats.size, modifiedAt: stats.mtime });
  } catch (err) {
    log.error(`Falha ao ler arquivo remoto "${filePath}":`, err.message);
    res.status(400).json({ error: err.message === "The encoded data was not valid for encoding utf-8"
      ? "O arquivo não está codificado em UTF-8 e não pode ser editado no navegador."
      : `Não foi possível ler o arquivo: ${err.message}` });
  }
});

app.put("/api/fs/file", (req, res) => {
  if (!ALLOW_FS_EDIT) {
    res.status(403).json({ error: "Edição de arquivos desabilitada neste agente. Habilite ALLOW_FS_EDIT em agent.config.js." });
    return;
  }

  const filePath = String(req.body?.path || "").trim();
  const content = req.body?.content;
  if (!filePath) return res.status(400).json({ error: "Informe o caminho do arquivo." });
  if (typeof content !== "string") return res.status(400).json({ error: "O conteúdo do arquivo deve ser texto." });

  const contentBuffer = Buffer.from(content, "utf8");
  if (contentBuffer.length > MAX_EDIT_FILE_BYTES) {
    return res.status(413).json({ error: "O conteúdo excede o limite de edição de 512 KiB." });
  }
  if (content.includes("\0")) return res.status(415).json({ error: "Arquivos binários não podem ser editados no navegador." });

  let temporaryPath;
  try {
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) return res.status(400).json({ error: "O caminho informado não é um arquivo regular." });
    const resolvedPath = path.resolve(filePath);
    temporaryPath = path.join(path.dirname(resolvedPath), `.${path.basename(resolvedPath)}.${process.pid}.${Date.now()}.tmp`);
    fs.writeFileSync(temporaryPath, contentBuffer, { flag: "wx", mode: stats.mode });
    fs.renameSync(temporaryPath, resolvedPath);
    const updated = fs.statSync(resolvedPath);
    log.info(`Arquivo remoto salvo: ${resolvedPath}`);
    res.json({ ok: true, path: resolvedPath, size: updated.size, modifiedAt: updated.mtime });
  } catch (err) {
    if (temporaryPath) {
      try { fs.rmSync(temporaryPath, { force: true }); } catch {}
    }
    log.error(`Falha ao salvar arquivo remoto "${filePath}":`, err.message);
    res.status(400).json({ error: `Não foi possível salvar o arquivo: ${err.message}` });
  }
});

app.get("/health", async (req, res) => {
  try {
    const source = getLogSource(req.query.source);
    const stats = await statLog(source.path);
    res.json({
      ok: true,
      source: source.key,
      availableSources: Object.keys(LOG_SOURCES || {}),
      logPath: source.path,
      fileName: path.basename(source.path),
      size: stats.size,
      encoding: source.encoding
    });
  } catch (err) {
    log.error("Health check falhou:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/log", async (req, res) => {
  try {
    const source = getLogSource(req.query.source);
    const stats = await statLog(source.path);
    if (stats.size > MAX_BYTES) {
      return res.status(413).json({ error: "Arquivo de log muito grande" });
    }

    res.setHeader("Content-Type", `text/plain; charset=${source.encoding}`);
    fs.createReadStream(source.path, { encoding: source.encoding }).pipe(res);
  } catch (err) {
    log.error("Falha ao disponibilizar log completo:", err.message);
    res.status(404).json({ error: err.message });
  }
});

app.get("/api/log/tail/realtime", async (req, res) => {
  try {
    const source = getLogSource(req.query.source);
    let cursor = Number(req.query.cursor || 0);
    const initialLines = Number(req.query.initialLines ?? 50);
    const stats = await statLog(source.path);
    const size = stats.size;

    if (cursor === 0 && initialLines <= 0) {
      return res.json({ cursor: size, lines: [] });
    }

    if (cursor === 0 && initialLines > 0) {
      const lines = await readLastLines(
        source.path,
        Math.min(initialLines, MAX_LINES_PER_READ),
        source.encoding,
        size,
        MAX_BYTES
      );
      return res.json({ cursor: size, lines });
    }

    if (cursor > size) {
      const lines = await readLastLines(
        source.path,
        Math.min(initialLines || 50, MAX_LINES_PER_READ),
        source.encoding,
        size,
        MAX_BYTES
      );
      return res.json({ cursor: size, lines });
    }

    if (cursor === size) {
      return res.json({ cursor, lines: [] });
    }

    const start = Math.max(cursor, size - MAX_BYTES);
    const stream = fs.createReadStream(source.path, {
      start,
      end: size - 1,
      encoding: source.encoding
    });

    let buffer = "";
    stream.on("data", chunk => { buffer += chunk; });
    stream.on("end", () => {
      const lines = splitLogLines(buffer).slice(-MAX_LINES_PER_READ);
      res.json({ cursor: size, chunks: buffer.trim() ? [buffer] : [], lines });
    });
    stream.on("error", err => {
      log.error("Falha durante leitura incremental:", err.message);
      res.status(500).json({ error: err.message });
    });
  } catch (err) {
    log.error("Falha no tail em tempo real:", err.message);
    res.status(500).json({ error: err.message });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  log.info(`SGTA Agent escutando na porta ${PORT}`);
  if (LOG_PATH) log.info(`Log legado: ${LOG_PATH}`);
  if (LOG_SOURCES) log.info(`Fontes disponíveis: ${Object.keys(LOG_SOURCES).join(", ")}`);
  log.info(`Config: ${getConfigFilePath()}`);
});
