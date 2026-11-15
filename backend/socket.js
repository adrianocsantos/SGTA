import { watchLog } from "./logReader.js";
import { logger } from "./logger.js";
import { openRemoteTerminal } from "./remoteAgentExec.js";
import { isRemoteOperationsTokenValid } from "./remoteOperationsAuth.js";

export function initSocket(io) {
  const shouldLogSocketEvents = process.env.LOG_SOCKET_EVENTS === "1";
  const sharedWatchers = new Map();

  function sourceRegistryKey(sourceKey) {
    return sourceKey || "__active_source__";
  }

  function closeSharedWatcherIfUnused(key, entry) {
    if (entry.subscribers.size > 0 || entry.opening) return;

    try {
      entry.watcher?.close();
    } catch (err) {
      logger.error("Erro ao encerrar watcher compartilhado:", err);
    }
    entry.watcher = null;
    if (sharedWatchers.get(key) === entry) sharedWatchers.delete(key);
  }

  async function subscribe(socket, sourceKey) {
    const key = sourceRegistryKey(sourceKey);
    let entry = sharedWatchers.get(key);

    if (!entry) {
      entry = {
        sourceKey,
        subscribers: new Set(),
        watcher: null,
        opening: null
      };
      sharedWatchers.set(key, entry);
    }

    entry.subscribers.add(socket);

    if (!entry.watcher && !entry.opening) {
      entry.opening = watchLog((chunk) => {
        for (const subscriber of entry.subscribers) {
          subscriber.emit("log:new-line", { source: sourceKey, chunk });
        }
      }, sourceKey);

      try {
        entry.watcher = await entry.opening;
      } catch (err) {
        entry.subscribers.delete(socket);
        if (sharedWatchers.get(key) === entry) sharedWatchers.delete(key);
        throw err;
      } finally {
        entry.opening = null;
        closeSharedWatcherIfUnused(key, entry);
      }
    } else if (entry.opening) {
      await entry.opening;
    }

    return { key, entry };
  }

  function unsubscribe(subscription, socket) {
    if (!subscription) return;
    const { key, entry } = subscription;
    entry.subscribers.delete(socket);
    closeSharedWatcherIfUnused(key, entry);
  }

  io.on("connection", (socket) => {
    let subscription = null;
    let subscriptionVersion = 0;
    let remoteTerminal = null;

    function closeRemoteTerminal() {
      if (!remoteTerminal) return;
      remoteTerminal.emit("terminal:stop");
      remoteTerminal.disconnect();
      remoteTerminal = null;
    }

    function closeWatcher() {
      subscriptionVersion += 1;
      unsubscribe(subscription, socket);
      subscription = null;
    }

    socket.on("log:watch", async (payload = {}) => {
      closeWatcher();
      const sourceKey = typeof payload.source === "string" && payload.source.trim()
        ? payload.source.trim()
        : null;
      const requestedVersion = subscriptionVersion;

      try {
        const nextSubscription = await subscribe(socket, sourceKey);
        if (requestedVersion !== subscriptionVersion || !socket.connected) {
          unsubscribe(nextSubscription, socket);
          return;
        }
        subscription = nextSubscription;
      } catch (err) {
        logger.error("Erro ao iniciar watchLog: " + err.message);
        socket.emit("log:error", { source: sourceKey, error: err.message });
      }
    });

    socket.on("log:unwatch", closeWatcher);

    socket.on("terminal:start", async (payload = {}, acknowledge = () => {}) => {
      closeRemoteTerminal();
      const sourceKey = String(payload.source || "").trim();
      logger.info(`Pedido de terminal recebido: cliente=${socket.id}, fonte=${sourceKey || "não informada"}`);
      if (!isRemoteOperationsTokenValid(payload.authToken)) {
        logger.warn(`Terminal recusado por falta de autenticação: cliente=${socket.id}`);
        acknowledge({ ok: false, error: "Autenticação necessária para operações remotas." });
        return;
      }
      try {
        if (!sourceKey) throw new Error("Selecione um agente remoto.");
        const upstream = await openRemoteTerminal(sourceKey);
        remoteTerminal = upstream;
        let answered = false;
        const answer = (result) => {
          if (answered) return;
          answered = true;
          acknowledge(result);
        };
        upstream.on("terminal:data", data => socket.emit("terminal:data", data));
        upstream.on("terminal:exit", data => socket.emit("terminal:exit", data));
        upstream.on("connect_error", err => {
          logger.error(`WebSocket do agente falhou: fonte=${sourceKey}, cliente=${socket.id}, erro=${err.message}`);
          answer({ ok: false, error: err.message });
          closeRemoteTerminal();
        });
        upstream.on("disconnect", reason => {
          socket.emit("terminal:disconnected", { reason });
          if (remoteTerminal === upstream) remoteTerminal = null;
        });
        upstream.on("connect", () => {
          logger.info(`WebSocket do agente conectado: fonte=${sourceKey}, cliente=${socket.id}`);
          upstream.emit("terminal:start", {
            cwd: payload.cwd || "",
            cols: payload.cols,
            rows: payload.rows
          }, result => {
            if (!result?.ok) logger.warn(`Agente recusou terminal: fonte=${sourceKey}, cliente=${socket.id}, erro=${result?.error || "sem detalhes"}`);
            else logger.info(`Terminal iniciado: fonte=${sourceKey}, cliente=${socket.id}, pid=${result.pid ?? "n/a"}`);
            answer(result);
          });
        });
        upstream.connect();
      } catch (err) {
        logger.error(`Erro ao abrir terminal remoto: fonte=${sourceKey || "não informada"}, cliente=${socket.id}, erro=${err.message}`);
        acknowledge({ ok: false, error: err.message });
      }
    });
    socket.on("terminal:input", data => remoteTerminal?.emit("terminal:input", data));
    socket.on("terminal:resize", size => remoteTerminal?.emit("terminal:resize", size));
    socket.on("terminal:stop", closeRemoteTerminal);

    socket.on("disconnect", () => {
      closeWatcher();
      closeRemoteTerminal();
      logger.info(`Cliente desconectado: ${socket.id}`);
    });
  });
}
