import fs from "fs";
import path from "path";
import { resolvePath, getAppDir } from "./paths.js";
import { logger } from "./logger.js";

let currentConfig = null;
let restartCallback = null;
let lastConfigHash = null;
let suppressWatchRestartUntil = 0;
let configWatcher = null;
let configReloadTimer = null;

// Detectar se está em dev (nodejs) ou empacotado
const isDev = process.execPath.includes("nodejs") || process.execPath.includes("node");
const isPkg = typeof process !== "undefined" && !!process.pkg;
/**
 * Controla se restart automático está habilitado.
 * - Em binários `pkg`, habilita somente no worker gerenciado pelo supervisor.
 * - Pode ser desabilitado explicitamente com a variável de ambiente `NO_AUTO_RESTART=1`.
 */
export function isRestartEnabled() {
  if (process.env.NO_AUTO_RESTART && String(process.env.NO_AUTO_RESTART) !== "0") return false;
  // O executável empacotado pode reiniciar com segurança quando está sob o
  // supervisor interno. O código 75 solicita a troca apenas do worker.
  return !isPkg || process.env.SGTA_WORKER === "1";
}
const CONFIG_FILE = isDev 
  ? path.resolve(process.cwd(), "backend", "configLogs.js")
  : path.resolve(getAppDir(), "configLogs.js");

const RELOAD_INTERVAL = 60 * 1000; // 1 minuto

function normalizePositiveInteger(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Campo inválido: ${fieldName}`);
  }
  return parsed;
}

function normalizeString(value, fieldName) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Campo inválido: ${fieldName}`);
  }
  return value.trim();
}

function normalizeLogSources(value, fallbackPath) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const normalized = {};
  for (const [sourceKey, sourceValue] of Object.entries(value)) {
    if (typeof sourceValue === "string") {
      normalized[sourceKey] = {
        label: sourceKey,
        PATH: normalizeString(sourceValue, `LOG_SOURCES.${sourceKey}`)
      };
      continue;
    }

    if (!sourceValue || typeof sourceValue !== "object") {
      continue;
    }

    const sourceType = typeof sourceValue.type === "string" && sourceValue.type.trim()
      ? sourceValue.type.trim()
      : (sourceValue.URL || sourceValue.url ? "remote-http" : "local");
    const sourcePath = sourceValue.PATH ?? sourceValue.path ?? fallbackPath;
    const sourceUrl = sourceValue.URL ?? sourceValue.url ?? "";
    const sourceToken = sourceValue.TOKEN ?? sourceValue.token ?? "";
    const remoteSource = sourceValue.SOURCE ?? sourceValue.source ?? "";

    if (sourceType === "remote-http" && !String(sourceUrl).trim()) {
      throw new Error(`Campo inválido: LOG_SOURCES.${sourceKey}.URL`);
    }

    normalized[sourceKey] = {
      label: typeof sourceValue.label === "string" && sourceValue.label.trim() ? sourceValue.label.trim() : sourceKey,
      type: sourceType,
      PATH: sourceType === "remote-http" ? String(sourcePath || "").trim() : normalizeString(sourcePath, `LOG_SOURCES.${sourceKey}.PATH`),
      ...(sourceType === "remote-http" ? { URL: normalizeString(sourceUrl, `LOG_SOURCES.${sourceKey}.URL`) } : {}),
      ...(sourceType === "remote-http" && String(remoteSource).trim() ? { SOURCE: String(remoteSource).trim() } : {}),
      ...(sourceToken ? { TOKEN: String(sourceToken).trim() } : {})
    };
  }

  return Object.keys(normalized).length ? normalized : null;
}

function validateConfigInput(input) {
  if (!input || typeof input !== "object") {
    throw new Error("Payload de configuração inválido");
  }

  const source = input.LOG_CONFIG || {};
  const fallbackPath = typeof source.PATH === "string" ? source.PATH : "";
  const port = normalizePositiveInteger(input.PORT_SERVER, "PORT_SERVER");
  if (port > 65535) {
    throw new Error("Campo inválido: PORT_SERVER");
  }

  const logSources = normalizeLogSources(input.LOG_SOURCES, fallbackPath);
  const activeLogSource = typeof input.ACTIVE_LOG_SOURCE === "string" && input.ACTIVE_LOG_SOURCE.trim()
    ? input.ACTIVE_LOG_SOURCE.trim()
    : null;

  return {
    LOG_CONFIG: {
      PATH: normalizeString(source.PATH, "LOG_CONFIG.PATH"),
      ENCODING: normalizeString(source.ENCODING, "LOG_CONFIG.ENCODING"),
      MAX_BYTES: normalizePositiveInteger(source.MAX_BYTES, "LOG_CONFIG.MAX_BYTES"),
      MAX_LINES_PER_READ: normalizePositiveInteger(source.MAX_LINES_PER_READ, "LOG_CONFIG.MAX_LINES_PER_READ")
    },
    ...(logSources ? { LOG_SOURCES: logSources } : {}),
    ...(activeLogSource ? { ACTIVE_LOG_SOURCE: activeLogSource } : {}),
    PORT_SERVER: port
  };
}

function serializeLogSources(logSources) {
  const entries = Object.entries(logSources || {});
  if (!entries.length) return "";

  const lines = entries.map(([key, source]) => {
    const label = JSON.stringify(source?.label || key);
    const type = JSON.stringify(source?.type || (source?.URL ? "remote-http" : "local"));
    const urlValue = source?.URL ? `, URL: ${JSON.stringify(source.URL)}` : "";
    const tokenValue = source?.TOKEN ? `, TOKEN: ${JSON.stringify(source.TOKEN)}` : "";
    const sourceValue = source?.SOURCE ? `, SOURCE: ${JSON.stringify(source.SOURCE)}` : "";
    if ((source?.type || (source?.URL ? "remote-http" : "local")) === "remote-http") {
      return `  ${JSON.stringify(key)}: { label: ${label}, type: ${type}${urlValue}${sourceValue}${tokenValue} }`;
    }

    const pathValue = JSON.stringify(source?.PATH || "");
    return `  ${JSON.stringify(key)}: { label: ${label}, type: ${type}, PATH: ${pathValue}${tokenValue} }`;
  });

  return `export const LOG_SOURCES = {
${lines.join(",\n")}
};\n\n`;
}

function serializeConfig(config) {
  return serializeLogSources(config.LOG_SOURCES) +
    `export const ACTIVE_LOG_SOURCE = ${JSON.stringify(config.ACTIVE_LOG_SOURCE || "")};\n\n` +
    `export const LOG_CONFIG = {\n` +
    `  PATH: ${JSON.stringify(config.LOG_CONFIG.PATH)},\n` +
    `  ENCODING: ${JSON.stringify(config.LOG_CONFIG.ENCODING)},\n` +
    `  MAX_BYTES: ${config.LOG_CONFIG.MAX_BYTES},\n` +
    `  MAX_LINES_PER_READ: ${config.LOG_CONFIG.MAX_LINES_PER_READ}\n` +
    `};\n\n` +
    `export const PORT_SERVER = ${config.PORT_SERVER};\n`;
}

/**
 * Carrega ou recarrega o arquivo de configuração dinamicamente
 */
async function loadConfig() {
  try {
    // Ler arquivo do disco (não do snapshot pkg)
    if (!fs.existsSync(CONFIG_FILE)) {
      throw new Error(`Arquivo de configuração não encontrado: ${CONFIG_FILE}`);
    }
    
    const configContent = fs.readFileSync(CONFIG_FILE, 'utf-8');
    
    // Criar um módulo temporário para avaliar o conteúdo
    const module = { exports: {} };
    const func = new Function('exports', 'module',
      configContent.replace(/export const/g, 'const') + '\nmodule.exports = { LOG_CONFIG, PORT_SERVER, LOG_SOURCES: typeof LOG_SOURCES !== "undefined" ? LOG_SOURCES : undefined, ACTIVE_LOG_SOURCE: typeof ACTIVE_LOG_SOURCE !== "undefined" ? ACTIVE_LOG_SOURCE : undefined };'
    );
    func(module.exports, module);
    
    const newConfig = {
      LOG_CONFIG: module.exports.LOG_CONFIG,
      PORT_SERVER: module.exports.PORT_SERVER,
      ...(module.exports.LOG_SOURCES ? { LOG_SOURCES: module.exports.LOG_SOURCES } : {}),
      ...(module.exports.ACTIVE_LOG_SOURCE ? { ACTIVE_LOG_SOURCE: module.exports.ACTIVE_LOG_SOURCE } : {})
    };

    currentConfig = newConfig;
    return currentConfig;
  } catch (err) {
    // Se não tiver config, tenta carregar a padrão de backend/configLogs.js
    if (!currentConfig) {
      try {
        const fallbackModule = await import("./configLogs.js");
        const newConfig = {
          LOG_CONFIG: fallbackModule.LOG_CONFIG,
          PORT_SERVER: fallbackModule.PORT_SERVER,
          ...(fallbackModule.LOG_SOURCES ? { LOG_SOURCES: fallbackModule.LOG_SOURCES } : {}),
          ...(fallbackModule.ACTIVE_LOG_SOURCE ? { ACTIVE_LOG_SOURCE: fallbackModule.ACTIVE_LOG_SOURCE } : {})
        };
        currentConfig = newConfig;
        return currentConfig;
      } catch (fallbackErr) {
        throw new Error("Não foi possível carregar a configuração inicial");
      }
    }
    return currentConfig;
  }
}

/**
 * Retorna a configuração atual (lazy load)
 */
export async function getConfig() {
  if (!currentConfig) {
    await loadConfig();
  }
  return currentConfig;
}

export function getConfigFilePath() {
  return CONFIG_FILE;
}

export async function saveConfig(nextConfig) {
  const previousPort = currentConfig?.PORT_SERVER;
  const normalized = validateConfigInput(nextConfig);
  if (!normalized.LOG_SOURCES && currentConfig?.LOG_SOURCES) {
    normalized.LOG_SOURCES = currentConfig.LOG_SOURCES;
  }
  if (!normalized.ACTIVE_LOG_SOURCE && currentConfig?.ACTIVE_LOG_SOURCE) {
    normalized.ACTIVE_LOG_SOURCE = currentConfig.ACTIVE_LOG_SOURCE;
  }
  suppressWatchRestartUntil = Date.now() + 5000;
  writeConfigAtomically(serializeConfig(normalized));
  await reloadConfig({ allowRestart: false });

  const portChanged = previousPort !== undefined && previousPort !== normalized.PORT_SERVER;
  if (portChanged && restartCallback && isRestartEnabled()) {
    logger.info(`Porta alterada de ${previousPort} para ${normalized.PORT_SERVER}; solicitando reinício controlado...`);
    restartCallback();
  } else {
    logger.info("Configuração salva e aplicada sem reinício do servidor.");
  }

  return currentConfig;
}

function writeConfigAtomically(content) {
  const configDir = path.dirname(CONFIG_FILE);
  const configName = path.basename(CONFIG_FILE);
  const tempFile = path.join(
    configDir,
    `.${configName}.${process.pid}.${Date.now()}.tmp`
  );
  const backupFile = path.join(configDir, `${configName}.backup`);

  try {
    fs.writeFileSync(tempFile, content, { encoding: "utf-8", flag: "wx" });

    // Mantém a última versão válida para recuperação manual.
    if (fs.existsSync(CONFIG_FILE)) {
      fs.copyFileSync(CONFIG_FILE, backupFile);
    }

    fs.renameSync(tempFile, CONFIG_FILE);
  } catch (err) {
    try {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    } catch (_) {
      // A falha original é mais relevante.
    }
    throw err;
  }
}

/**
 * Força recarga da configuração
 */
export async function reloadConfig(options = {}) {
  const allowRestart = options.allowRestart !== false;
  const beforeHash = lastConfigHash;
  await loadConfig();
  const afterHash = JSON.stringify(currentConfig);

  // Só reinicia se mudou de fato
  if (beforeHash !== afterHash) {
    lastConfigHash = afterHash;
    if (allowRestart && restartCallback && isRestartEnabled()) {
      logger.info("Config alterada, solicitando restart do servidor...");
      restartCallback();
    } else {
      logger.info("Config alterada aplicada sem restart. - "+ CONFIG_FILE);
    }
  } else {
    return;
  }
}

/**
 * Inicia monitoramento do arquivo de configuração
 */
export function watchConfig() {
  function scheduleReload() {
    if (configReloadTimer) clearTimeout(configReloadTimer);
    configReloadTimer = setTimeout(async () => {
      configReloadTimer = null;
      try {
        await reloadConfig({
          allowRestart: Date.now() > suppressWatchRestartUntil
        });
      } catch (err) {
        logger.error("Falha ao recarregar configuração monitorada:", err);
      }
    }, 400);
  }

  function attachWatcher() {
    if (configWatcher || !fs.existsSync(CONFIG_FILE)) return;

    try {
      configWatcher = fs.watch(CONFIG_FILE, (event) => {
        if (event === "change" || event === "rename") {
          scheduleReload();

          // Escritas atômicas substituem o inode; recria o watcher no arquivo novo.
          if (event === "rename") {
            configWatcher?.close();
            configWatcher = null;
            setTimeout(attachWatcher, 500);
          }
        }
      });

      configWatcher.on("error", (err) => {
        logger.error("Watcher da configuração falhou:", err);
        configWatcher?.close();
        configWatcher = null;
        setTimeout(attachWatcher, 2000);
      });
    } catch (err) {
      logger.error("Não foi possível monitorar a configuração:", err);
      configWatcher = null;
      setTimeout(attachWatcher, 2000);
    }
  }

  attachWatcher();

  // Recarga periódica: apenas verifica diffs; não força restart se idêntico
  setInterval(async () => {
    try {
      await reloadConfig();
      attachWatcher();
    } catch (err) {
      logger.error("Falha na verificação periódica da configuração:", err);
    }
  }, RELOAD_INTERVAL);
}

/**
 * Registra callback para restart quando config mudar
 */
export function onConfigChange(callback) {
  restartCallback = callback;
}

// Carregar configuração inicial (sem top-level await)
loadConfig()
  .then(cfg => { lastConfigHash = JSON.stringify(cfg); })
  .catch(err => { /* silencioso */ });
