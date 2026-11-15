import { spawn } from "child_process";
import { logger } from "./logger.js";
import { APP_VERSION } from "./version.js";
import { completePendingBinaryUpdate, listBinaryUpdateSessions, startWindowsBinaryUpdate } from "./binaryUpdate.js";

const WORKER_FLAG = "--sgta-worker";
const WORKER_ENV = "SGTA_WORKER";
const RESTART_EXIT_CODE = 75;
const LICENSE_EXIT_CODE = 78;
const BINARY_UPDATE_EXIT_CODE = 76;
const STABLE_UPTIME_MS = 60_000;
const RESTART_DELAYS_MS = [1_000, 2_000, 5_000, 10_000, 30_000];
const CRASH_LOOP_THRESHOLD = 10;
const CRASH_LOOP_DELAY_MS = 5 * 60_000;

const isWorker =
  process.env[WORKER_ENV] === "1" ||
  process.argv.includes(WORKER_FLAG);

if (isWorker) {
  import("./server.js").catch((err) => {
    logger.error("Falha ao iniciar processo servidor:", err?.stack || err);
    process.exit(err?.code === "LICENSE_UNAVAILABLE" ? LICENSE_EXIT_CODE : 1);
  });
} else {
  startSupervisor();
}

function startSupervisor() {
  let child = null;
  let stopping = false;
  let restartTimer = null;
  let consecutiveFailures = 0;

  logger.info(`SGTA v${APP_VERSION}`);

  function getWorkerCommand() {
    if (process.pkg) {
      return {
        command: process.execPath,
        // O bootstrap do pkg exige argv[1]. Reutilizamos o entrypoint interno
        // do snapshot; SGTA_WORKER diferencia supervisor e worker.
        args: [process.pkg.entrypoint || process.pkg.defaultEntrypoint]
      };
    }

    return {
      command: process.execPath,
      args: [process.argv[1], WORKER_FLAG]
    };
  }

  function launchWorker() {
    if (stopping) return;

    const startedAt = Date.now();
    const { command, args } = getWorkerCommand();

    logger.info(
      consecutiveFailures
        ? `Supervisor iniciando servidor novamente (tentativa ${consecutiveFailures + 1})...`
        : "Supervisor iniciando servidor..."
    );

    child = spawn(command, args, {
      env: {
        ...process.env,
        [WORKER_ENV]: "1"
      },
      stdio: ["ignore", "inherit", "inherit"],
      windowsHide: true
    });

    let workerFinished = false;
    function handleWorkerExit(code, signal, spawnError = null) {
      if (workerFinished) return;
      workerFinished = true;
      child = null;
      if (stopping) return;

      const uptime = Date.now() - startedAt;
      if (uptime >= STABLE_UPTIME_MS) consecutiveFailures = 0;

      if (code === 0) {
        logger.info("Servidor encerrado normalmente; supervisor será finalizado.");
        process.exit(0);
        return;
      }

      if (code === RESTART_EXIT_CODE) {
        consecutiveFailures = 0;
        logger.info("Servidor solicitou reinício controlado.");
        restartTimer = setTimeout(launchWorker, 250);
        return;
      }

      if (code === BINARY_UPDATE_EXIT_CODE) {
        consecutiveFailures = 0;
        try {
          if (process.platform === "win32" && process.pkg) {
            const pending = listBinaryUpdateSessions().reverse().find(session =>
              session.targetPath === process.execPath && ["apply_requested", "rollback_requested"].includes(session.status)
            );
            if (!pending) throw new Error("Nenhuma atualização pendente encontrada para o executável do servidor.");
            startWindowsBinaryUpdate(pending.id, process.execPath);
            logger.info("Atualização delegada ao atualizador Windows; o serviço será iniciado novamente após a troca do executável.");
            process.exit(0);
            return;
          }
          const session = completePendingBinaryUpdate(process.execPath);
          if (!session) throw new Error("Nenhuma atualização pendente encontrada para o executável do servidor.");
          logger.info(`Executável do servidor atualizado (${session.status}); iniciando nova versão.`);
          restartTimer = setTimeout(launchWorker, 250);
        } catch (updateError) {
          logger.error("Falha ao aplicar atualização do servidor:", updateError.message);
          restartTimer = setTimeout(launchWorker, 1_000);
        }
        return;
      }

      if (code === LICENSE_EXIT_CODE) {
        logger.error("Servidor interrompido por licença ausente, inválida ou expirada. O supervisor não tentará reiniciar.");
        process.exit(LICENSE_EXIT_CODE);
        return;
      }

      const crashLoop = consecutiveFailures >= CRASH_LOOP_THRESHOLD;
      const delayIndex = Math.min(consecutiveFailures, RESTART_DELAYS_MS.length - 1);
      const delay = crashLoop
        ? CRASH_LOOP_DELAY_MS
        : RESTART_DELAYS_MS[delayIndex];
      consecutiveFailures += 1;

      if (spawnError) {
        logger.error("Supervisor não conseguiu criar o processo servidor:", spawnError);
      }
      logger.error(
        `Servidor encerrou inesperadamente (código ${code ?? "n/a"}, sinal ${signal || "n/a"}). ` +
        (crashLoop
          ? `Modo de recuperação ativado; nova tentativa em ${delay / 60_000} min.`
          : `Reinício em ${delay / 1000}s.`)
      );
      restartTimer = setTimeout(launchWorker, delay);
    }

    child.once("error", (err) => handleWorkerExit(null, null, err));
    child.once("exit", (code, signal) => handleWorkerExit(code, signal));
  }

  function stopSupervisor(signal) {
    if (stopping) return;
    stopping = true;

    if (restartTimer) {
      clearTimeout(restartTimer);
      restartTimer = null;
    }

    logger.info(`Supervisor recebeu ${signal}; encerrando servidor.`);

    if (!child) {
      process.exit(0);
      return;
    }

    const forceTimer = setTimeout(() => {
      if (child) child.kill("SIGKILL");
      process.exit(1);
    }, 5_000);
    forceTimer.unref();

    child.once("exit", () => process.exit(0));
    child.kill("SIGTERM");
  }

  process.on("SIGINT", () => stopSupervisor("SIGINT"));
  process.on("SIGTERM", () => stopSupervisor("SIGTERM"));

  launchWorker();
}
