import fs from "fs";
import { Readable } from "stream";
import { getConfig } from "./configManager.js";
import { logger } from "./logger.js";
import { resolvePath } from "./paths.js";

const configuredRemoteTimeout = Number(process.env.SGTA_REMOTE_TIMEOUT_MS);
const REMOTE_TIMEOUT_MS =
  Number.isFinite(configuredRemoteTimeout) && configuredRemoteTimeout > 0
    ? configuredRemoteTimeout
    : 10_000;

async function fetchRemote(url, options = {}) {
  try {
    return await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(REMOTE_TIMEOUT_MS)
    });
  } catch (err) {
    if (err?.name === "TimeoutError" || err?.name === "AbortError") {
      throw new Error(`Agente remoto não respondeu em ${REMOTE_TIMEOUT_MS}ms`);
    }
    throw err;
  }
}

function getSelectedLogSource(config, sourceKey) {
  const sources = config?.LOG_SOURCES;
  if (sourceKey && sources && sources[sourceKey]) {
    return sources[sourceKey];
  }

  const activeSource = config?.ACTIVE_LOG_SOURCE;
  if (activeSource && sources && sources[activeSource]) {
    return sources[activeSource];
  }

  return null;
}

function normalizeSource(source, config) {
  if (typeof source === "string") {
    return { type: "local", PATH: source };
  }

  if (!source || typeof source !== "object") {
    return { type: "local", PATH: config.LOG_CONFIG.PATH };
  }

  return {
    ...source,
    type: source.type || (source.URL || source.url ? "remote-http" : "local"),
    URL: source.URL || source.url || "",
    TOKEN: source.TOKEN || source.token || "",
    SOURCE: source.SOURCE || source.source || "",
    PATH: source.PATH || source.path || config.LOG_CONFIG.PATH
  };
}

function getSelectedSource(config, sourceKey) {
  return normalizeSource(getSelectedLogSource(config, sourceKey), config);
}

function getSelectedLogPath(config, sourceKey) {
  const source = getSelectedSource(config, sourceKey);
  return resolvePath(source.PATH);
}

function isRemoteSource(source) {
  return source?.type === "remote-http" || !!source?.URL;
}

function buildRemoteUrl(source, pathname, params = {}) {
  const url = new URL(pathname, source.URL.endsWith("/") ? source.URL : `${source.URL}/`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url;
}

function remoteHeaders(source) {
  return source.TOKEN ? { "x-sgta-token": source.TOKEN } : {};
}

async function fetchRemoteJson(source, pathname, params = {}) {
  const res = await fetchRemote(buildRemoteUrl(source, pathname, params), {
    headers: remoteHeaders(source)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Agente remoto respondeu HTTP ${res.status}`);
  }
  return data;
}

function splitLogLines(text) {
  return String(text || "")
    .split(/\r\n|\n|\r/)
    .filter(line => line.trim());
}

async function statLogFile(logPath, context) {
  try {
    return await fs.promises.stat(logPath);
  } catch (err) {
    logger.error(`${context}: Arquivo de log não encontrado em: ${logPath}`);
    throw new Error(`Arquivo de log não encontrado: ${logPath}`);
  }
}

async function getLogFileInfo(sourceKey = null) {
  const config = await getConfig();
  const source = getSelectedSource(config, sourceKey);
  const logPath = resolvePath(source.PATH);
  const stats = await statLogFile(logPath, "Log");

  if (stats.size > config.LOG_CONFIG.MAX_BYTES) {
    logger.warn("Tentativa de leitura de log muito grande");
    throw new Error("Arquivo de log muito grande");
  }

  return {
    config,
    source,
    logPath,
    stats
  };
}

export async function createFullLogStream(sourceKey = null) {
  const config = await getConfig();
  const source = getSelectedSource(config, sourceKey);
  if (isRemoteSource(source)) {
    const res = await fetchRemote(buildRemoteUrl(source, "api/log", { source: source.SOURCE }), {
      headers: remoteHeaders(source)
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Agente remoto respondeu HTTP ${res.status}`);
    }
    return {
      stream: Readable.fromWeb(res.body),
      size: Number(res.headers.get("content-length") || 0),
      encoding: config.LOG_CONFIG.ENCODING
    };
  }

  const { logPath, stats } = await getLogFileInfo(sourceKey);
  return {
    stream: fs.createReadStream(logPath, {
      encoding: config.LOG_CONFIG.ENCODING
    }),
    size: stats.size,
    encoding: config.LOG_CONFIG.ENCODING
  };
}

/**
 * Lê o arquivo inteiro (com proteção de tamanho)
 */
export async function readFullLog(sourceKey = null) {
  const config = await getConfig();
  const source = getSelectedSource(config, sourceKey);
  if (isRemoteSource(source)) {
    const res = await fetchRemote(buildRemoteUrl(source, "api/log", { source: source.SOURCE }), {
      headers: remoteHeaders(source)
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Agente remoto respondeu HTTP ${res.status}`);
    }
    return res.text();
  }

  const info = await getLogFileInfo(sourceKey);
  return fs.promises.readFile(info.logPath, info.config.LOG_CONFIG.ENCODING);
}

/**
 * Faz o tail contínuo (para WebSocket)
 */
export async function watchLog(onNewLine, sourceKey = null) {
  const config = await getConfig();
  const source = getSelectedSource(config, sourceKey);
  if (isRemoteSource(source)) {
    let cursor = 0;
    let running = false;
    let closed = false;
    const pollMs = Number(source.POLL_MS || source.pollMs || 1000);

    async function pollRemote() {
      if (closed || running) return;
      running = true;
      try {
        const data = await fetchRemoteJson(source, "api/log/tail/realtime", {
          cursor,
          initialLines: 0,
          source: source.SOURCE
        });
        cursor = Number(data.cursor || cursor);
        if (Array.isArray(data.chunks)) {
          data.chunks.forEach(chunk => {
            if (String(chunk).trim()) onNewLine(chunk);
          });
        } else if (Array.isArray(data.lines)) {
          data.lines.forEach(line => {
            if (String(line).trim()) onNewLine(`${line}\n`);
          });
        }
      } catch (err) {
        logger.error(`Watch remoto: ${err.message}`);
      } finally {
        running = false;
      }
    }

    await pollRemote();
    const timer = setInterval(pollRemote, pollMs);
    return {
      close() {
        closed = true;
        clearInterval(timer);
      }
    };
  }

  const LOG_PATH = getSelectedLogPath(config, sourceKey);

  let lastSize = (await statLogFile(LOG_PATH, "Watch")).size;
  let reading = false;
  let pendingRead = false;

  function readNewChunk() {
    if (reading) {
      pendingRead = true;
      return;
    }

    let newSize;
    try {
      newSize = fs.statSync(LOG_PATH).size;
    } catch (err) {
      logger.error(`Watch: falha ao consultar arquivo: ${err.message}`);
      return;
    }

    if (newSize < lastSize) {
      lastSize = newSize;
      return;
    }
    if (newSize === lastSize) return;

    const start = lastSize;
    const end = newSize - 1;
    lastSize = newSize;
    reading = true;

    const stream = fs.createReadStream(LOG_PATH, {
      start,
      end,
      encoding: config.LOG_CONFIG.ENCODING
    });

    let buffer = "";
    stream.on("data", chunk => { buffer += chunk; });

    stream.on("end", () => {
      reading = false;
      if (buffer.trim()) {
        onNewLine(buffer);
      }

      if (pendingRead) {
        pendingRead = false;
        readNewChunk();
      }
    });

    stream.on("error", () => { reading = false; });
  }

  const watcher = fs.watch(LOG_PATH, (event) => {
    if (event !== "change") return;
    readNewChunk();
  });

  return watcher;
}

/**
 * Lê os últimos `n` bytes do arquivo e extrai as últimas `wantLines` linhas.
 * Evita carregar o arquivo inteiro na memória.
 */
async function readLastLines(filePath, wantLines, encoding, fileSize, maxReadBytes) {
  // Heurística: assume ~200 bytes por linha; dobra a janela se necessário
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

/**
 * Tail incremental via HTTP (inicia nas últimas N linhas)
 * Retorna máximo de linhas configuradas em LOG_CONFIG.MAX_LINES_PER_READ
 */
export async function readTailIncremental(cursor = 0, initialLines = 100, sourceKey = null) {
  const config = await getConfig();
  const source = getSelectedSource(config, sourceKey);
  if (isRemoteSource(source)) {
    return fetchRemoteJson(source, "api/log/tail/realtime", {
      cursor,
      initialLines,
      source: source.SOURCE
    });
  }

  const LOG_PATH = getSelectedLogPath(config, sourceKey);
  const MAX_LINES = config.LOG_CONFIG.MAX_LINES_PER_READ;

  const stats = await statLogFile(LOG_PATH, "Tail");
  const size = stats.size;

  if (cursor === 0 && initialLines <= 0) {
    return { cursor: size, lines: [] };
  }

  // Primeira chamada: posiciona cursor nas últimas N linhas sem ler o arquivo inteiro
  if (cursor === 0 && initialLines > 0) {
    const lines = await readLastLines(
      LOG_PATH,
      Math.min(initialLines, MAX_LINES),
      config.LOG_CONFIG.ENCODING,
      size,
      config.LOG_CONFIG.MAX_BYTES
    );
    return {
      cursor: size,
      lines
    };
  }

  // Log foi rotacionado
  if (cursor > size) {
    const lines = await readLastLines(
      LOG_PATH,
      Math.min(initialLines, MAX_LINES),
      config.LOG_CONFIG.ENCODING,
      size,
      config.LOG_CONFIG.MAX_BYTES
    );
    return {
      cursor: size,
      lines
    };
  }

  // Nada novo
  if (cursor === size) {
    return { cursor, lines: [] };
  }

  const start = Math.max(cursor, size - config.LOG_CONFIG.MAX_BYTES);
  if (start > cursor) {
    logger.warn("Tail incremental excedeu MAX_BYTES; retornando apenas o trecho mais recente");
  }

  const stream = fs.createReadStream(LOG_PATH, {
    start,
    end: size - 1,
    encoding: config.LOG_CONFIG.ENCODING
  });

  return new Promise((resolve, reject) => {
    let buffer = "";

    stream.on("data", chunk => buffer += chunk);

    stream.on("end", () => {
      resolve({
        cursor: size,
        chunks: buffer.trim() ? [buffer] : [],
        lines: splitLogLines(buffer).slice(-MAX_LINES)
      });
    });

    stream.on("error", reject);
  });
}
