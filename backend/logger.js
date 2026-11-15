import fs from "fs";
import path from "path";
import { LOGS_DIR } from "./paths.js";

/* Criar pasta logs se não existir */
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

const APP_LOG_PATH = path.join(LOGS_DIR, "app-server.log");
const LOG_BUFFER_LIMIT = 200;
const DEFAULT_LOG_MAX_BYTES = 10 * 1024 * 1024;
const LOG_MAX_FILES = 5;
const configuredLogMaxBytes = Number(process.env.SGTA_APP_LOG_MAX_BYTES);
const LOG_MAX_BYTES = Number.isFinite(configuredLogMaxBytes) && configuredLogMaxBytes > 0
  ? configuredLogMaxBytes
  : DEFAULT_LOG_MAX_BYTES;
const runtimeLogs = [];
let lastIssue = null;
const unavailableConsoleStreams = new Set();

function isClosedOutputError(err) {
  return err?.code === "EIO" || err?.code === "EPIPE";
}

function monitorConsoleStream(stream) {
  if (!stream || typeof stream.on !== "function") return;

  stream.on("error", (err) => {
    // Quando a aplicação roda como serviço, o terminal/pipe pode ser fechado.
    // A gravação no arquivo continua válida; apenas desabilitamos esse console.
    if (isClosedOutputError(err)) {
      unavailableConsoleStreams.add(stream);
      return;
    }

    // O listener evita que um erro do próprio diagnóstico vire uncaughtException.
    unavailableConsoleStreams.add(stream);
  });
}

monitorConsoleStream(process.stdout);
monitorConsoleStream(process.stderr);

function getCallerLocation() {
  try {
    const stack = new Error().stack || "";
    const lines = stack.split("\n").slice(2);

    for (const line of lines) {
      // Ex.: at file:///C:/repo/backend/server.js:120:5
      // Ex.: at C:\repo\backend\server.js:120:5
      // Ex.: at onceWrapper (node:events:651:28)
      const match = line.match(/at\s+(?:.+\s+\()?(.+?):(\d+):(\d+)\)?$/);
      if (!match) continue;

      const fullPath = match[1].replace(/\\/g, "/");
      if (fullPath.endsWith("/backend/logger.js")) continue;
      if (fullPath.startsWith("node:")) continue;
      if (fullPath.includes("node_modules")) continue;
      if (fullPath.includes("bootstrap.js")) continue;

      const fileName = fullPath.split("/").pop() || fullPath;
      return `${fileName}:${match[2]}:${match[3]}`;
    }
  } catch (_) {
    // ignora falhas de parse da stack
  }

  return "origem-desconhecida";
}

function buildEntry(level, message) {
  const ts = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const caller = level === "INFO" ? null : getCallerLocation();

  return {
    timestamp: ts,
    level,
    caller,
    message
  };
}

/* Níveis */
function format(entry) {
  if (entry.caller) {
    return `[${entry.timestamp}] [${entry.level}] [${entry.caller}] ${entry.message}\n`;
  }
  return `[${entry.timestamp}] [${entry.level}] ${entry.message}\n`;
}

function stringifyPart(part) {
  if (part instanceof Error) {
    // Evita poluir logs operacionais com stack inteira de internals.
    return part.message || String(part);
  }

  if (typeof part === "object" && part !== null) {
    try {
      return JSON.stringify(part);
    } catch (_) {
      return String(part);
    }
  }

  return String(part);
}

function writeToConsole(level, line) {
  const stream = level === "INFO" ? process.stdout : process.stderr;
  if (unavailableConsoleStreams.has(stream) || stream?.destroyed) return;

  try {
    stream.write(line);
  } catch (err) {
    if (isClosedOutputError(err)) {
      unavailableConsoleStreams.add(stream);
      return;
    }
    unavailableConsoleStreams.add(stream);
  }
}

function rotateLogIfNeeded(incomingBytes) {
  let currentSize = 0;
  try {
    currentSize = fs.statSync(APP_LOG_PATH).size;
  } catch (err) {
    if (err?.code !== "ENOENT") return;
  }

  if (currentSize + incomingBytes <= LOG_MAX_BYTES) return;

  try {
    for (let index = LOG_MAX_FILES - 1; index >= 1; index -= 1) {
      const source = `${APP_LOG_PATH}.${index}`;
      const destination = `${APP_LOG_PATH}.${index + 1}`;
      if (!fs.existsSync(source)) continue;
      if (fs.existsSync(destination)) fs.unlinkSync(destination);
      fs.renameSync(source, destination);
    }

    const firstRotatedLog = `${APP_LOG_PATH}.1`;
    if (fs.existsSync(firstRotatedLog)) fs.unlinkSync(firstRotatedLog);
    if (fs.existsSync(APP_LOG_PATH)) {
      fs.renameSync(APP_LOG_PATH, firstRotatedLog);
    }
  } catch (_) {
    // Supervisor e worker podem tentar rotacionar simultaneamente. Nesse caso,
    // a escrita atual prossegue e uma próxima mensagem tentará novamente.
  }
}

function write(level, ...parts) {
  const message = parts.map(stringifyPart).join(" ");
  const entry = buildEntry(level, message);
  const line = format(entry);

  try {
    rotateLogIfNeeded(Buffer.byteLength(line, "utf-8"));
    fs.appendFileSync(APP_LOG_PATH, line);
  } catch (_) {
    // O buffer em memória e o console ainda podem fornecer o diagnóstico.
  }

  runtimeLogs.push(entry);
  if (runtimeLogs.length > LOG_BUFFER_LIMIT) runtimeLogs.shift();
  if (level === "ERROR" || level === "WARN") lastIssue = entry;

  // A escrita direta permite tratar pipes fechados sem gerar uncaughtException.
  writeToConsole(level, line);
}

export const logger = {
  info: (...parts) => write("INFO", ...parts),
  warn: (...parts) => write("WARN", ...parts),
  error: (...parts) => write("ERROR", ...parts)
};

export function getRuntimeDiagnostics() {
  return {
    lastIssue,
    latest: runtimeLogs.slice(-20)
  };
}
