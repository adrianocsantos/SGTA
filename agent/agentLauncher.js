import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { createAgentLogger } from "./agentLogger.js";
import { completePendingBinaryUpdate, listBinaryUpdateSessions, startWindowsBinaryUpdate } from "../backend/binaryUpdate.js";

const log = createAgentLogger("supervisor");

const WORKER_ENV = "SGTA_AGENT_WORKER";
const WORKER_FLAG = "--sgta-agent-worker";
const BINARY_UPDATE_EXIT_CODE = 76;
const RESTART_DELAYS_MS = [1_000, 2_000, 5_000, 10_000, 30_000];
const STABLE_UPTIME_MS = 60_000;

const isWorker = process.env[WORKER_ENV] === "1" || process.argv.includes(WORKER_FLAG);

if (isWorker) {
  import("./logAgent.js").catch((err) => {
    log.error("Falha ao iniciar agente:", err?.stack || err);
    process.exit(1);
  });
} else {
  startSupervisor();
}

function getAgentDir() {
  if (process.pkg) return path.dirname(process.execPath);
  return path.dirname(fileURLToPath(import.meta.url));
}

function getConfigFilePath() {
  return process.env.SGTA_AGENT_CONFIG || path.join(getAgentDir(), "agent.config.js");
}

function getWorkerCommand() {
  if (process.pkg) {
    return {
      command: process.execPath,
      args: [process.pkg.entrypoint || process.pkg.defaultEntrypoint]
    };
  }
  return { command: process.execPath, args: [process.argv[1], WORKER_FLAG] };
}

function startSupervisor() {
  let child = null;
  let stopping = false;
  let restartTimer = null;
  let configTimer = null;
  let failures = 0;
  let configRestartPending = false;
  const configFile = getConfigFilePath();

  function scheduleLaunch(delay) {
    if (restartTimer) clearTimeout(restartTimer);
    restartTimer = setTimeout(launchWorker, delay);
  }

  function launchWorker() {
    if (stopping) return;
    restartTimer = null;
    const startedAt = Date.now();
    const { command, args } = getWorkerCommand();
    log.info(failures ? `Reiniciando SGTA Agent (tentativa ${failures + 1})...` : "Iniciando SGTA Agent...");

    child = spawn(command, args, {
      env: { ...process.env, [WORKER_ENV]: "1" },
      stdio: ["ignore", "inherit", "inherit"],
      windowsHide: true
    });

    let finished = false;
    function onExit(code, signal, error = null) {
      if (finished) return;
      finished = true;
      child = null;
      if (stopping) return;
      if (configRestartPending) {
        configRestartPending = false;
        scheduleLaunch(250);
        return;
      }
      if (code === BINARY_UPDATE_EXIT_CODE) {
        failures = 0;
        try {
          if (process.platform === "win32" && process.pkg) {
            const pending = listBinaryUpdateSessions().reverse().find(session =>
              session.targetPath === process.execPath && ["apply_requested", "rollback_requested"].includes(session.status)
            );
            if (!pending) throw new Error("Nenhuma atualização pendente encontrada para o executável do agente.");
            startWindowsBinaryUpdate(
              pending.id,
              process.execPath,
              path.join(path.dirname(process.execPath), "SGTAAgentService.exe")
            );
            log.info("Atualização delegada ao atualizador Windows; o agente será iniciado novamente após a troca do executável.");
            process.exit(0);
            return;
          }
          const session = completePendingBinaryUpdate(process.execPath);
          if (!session) throw new Error("Nenhuma atualização pendente encontrada para o executável do agente.");
          log.info(`Executável do agente atualizado (${session.status}); iniciando nova versão.`);
          scheduleLaunch(250);
        } catch (updateError) {
          log.error("Falha ao aplicar atualização do agente:", updateError.message);
          scheduleLaunch(1_000);
        }
        return;
      }
      if (Date.now() - startedAt >= STABLE_UPTIME_MS) failures = 0;
      if (code === 0) return process.exit(0);
      if (error) log.error("Falha ao criar processo do agente:", error.message);
      const delay = RESTART_DELAYS_MS[Math.min(failures, RESTART_DELAYS_MS.length - 1)];
      failures += 1;
      log.error(`Agente encerrou inesperadamente (código ${code ?? "n/a"}, sinal ${signal || "n/a"}). Reinício em ${delay / 1000}s.`);
      scheduleLaunch(delay);
    }

    child.once("error", (err) => onExit(null, null, err));
    child.once("exit", (code, signal) => onExit(code, signal));
  }

  function restartForConfigChange() {
    if (stopping) return;
    log.info(`Configuração alterada; reiniciando agente: ${configFile}`);
    failures = 0;
    if (restartTimer) {
      clearTimeout(restartTimer);
      restartTimer = null;
    }
    if (!child) return scheduleLaunch(250);
    configRestartPending = true;
    child.kill("SIGTERM");
  }

  function watchConfig() {
    // watchFile usa stat periódico e evita manter um descritor aberto. Isso é
    // mais resiliente em servidores com limite baixo de arquivos (EMFILE).
    fs.watchFile(configFile, { interval: 1_000, persistent: true }, (current, previous) => {
      if (current.mtimeMs === previous.mtimeMs && current.size === previous.size) return;
      if (configTimer) clearTimeout(configTimer);
      configTimer = setTimeout(restartForConfigChange, 500);
    });
    log.info(`Monitorando configuração: ${configFile}`);
  }

  function stop(signal) {
    if (stopping) return;
    stopping = true;
    if (restartTimer) clearTimeout(restartTimer);
    if (configTimer) clearTimeout(configTimer);
    fs.unwatchFile(configFile);
    log.info(`Supervisor do agente recebeu ${signal}; encerrando.`);
    if (!child) return process.exit(0);
    child.once("exit", () => process.exit(0));
    child.kill("SIGTERM");
  }

  process.on("SIGINT", () => stop("SIGINT"));
  process.on("SIGTERM", () => stop("SIGTERM"));
  watchConfig();
  launchWorker();
}
