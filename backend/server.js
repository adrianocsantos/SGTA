import express from "express";
import http from "http";
import { Server } from "socket.io";
import { createFullLogStream, readTailIncremental } from "./logReader.js";
import { initSocket } from "./socket.js";
import { logger, getRuntimeDiagnostics } from "./logger.js";
import { watchConfig, onConfigChange, getConfig, isRestartEnabled, saveConfig, getConfigFilePath } from "./configManager.js";
import { FRONTEND_HTML } from "./frontendEmbed.js";
import { getCargaTabelasStatus, parseCargaTabelas } from "./cargaTabelasParser.js";
import { license, checkLicense, updateLicenseFile } from "./licenseManager.js";
import { APP_VERSION } from "./version.js";
import { readRemoteAgentConfig, saveRemoteAgentConfig } from "./remoteAgentConfig.js";
import { callRemoteAgentBinaryUpdate, stageRemoteAgentBinaryUpdate } from "./remoteAgentExec.js";
import { listRemoteDirectory, readRemoteFile, writeRemoteFile, uploadRemoteAgentFile } from "./remoteAgentFs.js";
import { listDemands, createDemand, updateDemand, moveDemand, deleteDemand } from "./demandManager.js";
import { createBinaryUpdateSession, requestBinaryUpdate, listBinaryUpdateSessions, decodeBase64Payload, validateExecutableBuffer } from "./binaryUpdate.js";
import { MAX_UPLOAD_FILE_BYTES, saveUploadedFile, validateUploadFileName } from "./fileUpload.js";
import {
  authenticateRemoteOperations,
  extractToken,
  createRemoteOperationsCredential,
  getRemoteOperationsAuthStatus,
  isRemoteOperationsAdminTokenValid,
  isRemoteOperationsTokenValid,
  listRemoteOperationsCredentials,
  requireRemoteOperationsAuth,
  revokeRemoteOperationsToken,
  revokeRemoteOperationsCredential,
  setupRemoteOperationsAdmin
} from "./remoteOperationsAuth.js";
import path from "node:path";
import { getAppDir } from "./paths.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const SUPERVISOR_RESTART_EXIT_CODE = 75;
const BINARY_UPDATE_EXIT_CODE = 76;
let binaryUpdateRestartScheduled = false;

function restartForBinaryUpdate() {
  if (binaryUpdateRestartScheduled) return;
  binaryUpdateRestartScheduled = true;
  logger.info("Encerrando worker para atualizar o executável; o supervisor reiniciará o serviço.");
  const finish = () => process.exit(BINARY_UPDATE_EXIT_CODE);
  io.disconnectSockets(true);
  io.close(finish);
  if (server.listening) server.close(finish);
  const forceTimer = setTimeout(finish, 5_000);
  forceTimer.unref();
}

app.use(express.json({ limit: "4mb" }));

server.on("error", (err) => {
  shutdownAfterFatalError("Erro fatal no servidor HTTP", err);
});

// Endpoint livre de licença para exibir diagnóstico para o usuário na tela.
app.get("/runtime/diagnostics", (req, res) => {
  res.json({
    appVersion: APP_VERSION,
    ...getRuntimeDiagnostics()
  });
});

/**
 * 🔹 LICENÇA - consulta simples
 */
app.get("/api/license", (req, res) => {
  try {
    const info = license();
    res.json(info);
  } catch (err) {
    logger.error("Erro ao checar licença:", err && err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 🔹 LICENÇA - check que utiliza `checkLicense` e pode encerrar o processo
 */
app.get("/api/license/check", (req, res) => {
  try {
    const info = license();
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    const dtSys = `${year}-${month}-${day}`;

    // checkLicense vai encerrar o processo se expirado
    checkLicense(dtSys, info.expDateLicense);

    res.json(info);
  } catch (err) {
    logger.error("Erro ao checar licença (check):", err && err.message);
    res.status(500).json({ error: err.message });
  }
});

// Middleware para verificar licença em cada interação do usuário nas rotas /api
async function licenseMiddleware(req, res, next) {
  if ([
    "/license",
    "/license/check",
    "/license/upload",
    "/remote-operations/auth/status",
    "/remote-operations/auth/login",
    "/remote-operations/auth/setup",
    "/remote-operations/auth/logout"
  ].includes(req.path)) {
    return next();
  }

  try {
    const info = license();
    if (!info || !info.validation) {
      logger.error("Licença inválida ao atender requisição. Enviando 503 e encerrando.");
      res.status(503).type('text/plain').send('Licença expirada. Entre em contato com o fornecedor.');

      // agendar check que encerra o processo logo após enviar a resposta
      setTimeout(() => {
        const now = new Date();
        const day = now.getDate().toString().padStart(2, '0');
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const year = now.getFullYear();
        const dtSys = `${year}-${month}-${day}`;
        try { checkLicense(dtSys, info ? info.expDateLicense : null); } catch (_) { /* checkLicense may exit */ }
      }, 800);
      return;
    }
    return next();
  } catch (err) {
    logger.error('Erro ao verificar licença (middleware): ' + (err && err.message));
    res.status(500).type('text/plain').send('Erro ao verificar licença');
    setTimeout(() => process.exit(1), 1200);
  }
}

// Aplicar middleware somente nas rotas /api
app.use('/api', licenseMiddleware);

app.get("/api/remote-operations/auth/status", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json(getRemoteOperationsAuthStatus(extractToken(req)));
});

app.post("/api/remote-operations/auth/login", (req, res) => {
  res.set("Cache-Control", "no-store");
  const result = authenticateRemoteOperations(req.body?.username, req.body?.password, req.ip);
  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  res.json({
    token: result.token,
    expiresAt: result.expiresAt,
    username: result.username,
    isAdmin: result.isAdmin
  });
});

app.post("/api/remote-operations/auth/setup", (req, res) => {
  res.set("Cache-Control", "no-store");
  const result = setupRemoteOperationsAdmin(req.body?.password, req.ip);
  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  logger.warn(`Senha mestra admin configurada pelo bootstrap inicial a partir do cliente ${req.ip}.`);
  res.status(201).json({
    token: result.token,
    expiresAt: result.expiresAt,
    username: result.username,
    isAdmin: result.isAdmin
  });
});

app.post("/api/remote-operations/auth/logout", (req, res) => {
  revokeRemoteOperationsToken(extractToken(req));
  res.json({ ok: true });
});

function requireRemoteOperationsAdmin(req, res, next) {
  if (!isRemoteOperationsAdminTokenValid(extractToken(req))) {
    return res.status(403).json({ error: "Somente o administrador pode gerenciar senhas." });
  }
  return next();
}

app.get("/api/remote-operations/auth/credentials", requireRemoteOperationsAuth, requireRemoteOperationsAdmin, (req, res) => {
  try { res.json({ credentials: listRemoteOperationsCredentials() }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/remote-operations/auth/credentials", requireRemoteOperationsAuth, requireRemoteOperationsAdmin, (req, res) => {
  try {
    const credential = createRemoteOperationsCredential(extractToken(req), req.body || {});
    res.status(201).json({ credential });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

app.delete("/api/remote-operations/auth/credentials/:id", requireRemoteOperationsAuth, requireRemoteOperationsAdmin, (req, res) => {
  try {
    res.json(revokeRemoteOperationsCredential(extractToken(req), req.params.id));
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

app.use([
  "/api/config",
  "/api/license/upload",
  "/api/files/upload",
  "/api/agent-files",
  "/api/binary-update/server",
  "/api/agent-config",
  "/api/agent-exec",
  "/api/agent-fs",
  "/api/agent-binary-update"
], requireRemoteOperationsAuth);

app.post(
  "/api/files/upload",
  requireRemoteOperationsAdmin,
  express.raw({ type: "application/octet-stream", limit: MAX_UPLOAD_FILE_BYTES }),
  (req, res) => {
    try {
      if (!Buffer.isBuffer(req.body)) {
        return res.status(400).json({ error: "Envie um arquivo como application/octet-stream." });
      }
      const result = saveUploadedFile(
        path.join(getAppDir(), "uploads"),
        req.query.filename,
        req.body
      );
      logger.info(`Arquivo recebido na pasta uploads do servidor central: ${result.fileName} (${result.size} bytes).`);
      return res.status(201).json({
        ok: true,
        ...result,
        message: `Arquivo ${result.fileName} enviado para uploads/ no servidor central.`
      });
    } catch (err) {
      logger.error("Erro ao receber arquivo no servidor central:", err.message);
      return res.status(err.message.startsWith("O arquivo excede") ? 413 : 400).json({ error: err.message });
    }
  }
);

app.post(
  "/api/agent-files/:source/upload",
  requireRemoteOperationsAdmin,
  express.raw({ type: "application/octet-stream", limit: MAX_UPLOAD_FILE_BYTES }),
  async (req, res) => {
    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json({ error: "Envie um arquivo como application/octet-stream." });
    }

    let fileName;
    try {
      fileName = validateUploadFileName(req.query.filename);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const result = await uploadRemoteAgentFile(req.params.source, fileName, req.body);
      return res.status(201).json({
        ok: true,
        ...result,
        message: `Arquivo ${fileName} enviado para uploads/ no agente remoto.`
      });
    } catch (err) {
      logger.error("Erro ao enviar arquivo ao agente remoto:", err.message);
      const remoteStatus = err?.status;
      const status = remoteStatus === 413 || (remoteStatus >= 400 && remoteStatus < 500)
        ? remoteStatus
        : 502;
      return res.status(status).json({ error: err?.message || String(err) });
    }
  }
);

app.post(
  "/api/license/upload",
  express.raw({ type: "application/octet-stream", limit: "1mb" }),
  requireRemoteOperationsAdmin,
  (req, res) => {
    try {
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({ error: "Selecione um arquivo de licença." });
      }
      const updatedLicense = updateLicenseFile(req.body);
      logger.info(`Licença TBB atualizada. Válida até ${updatedLicense.expDateLicense}.`);
      return res.json({
        ok: true,
        ...updatedLicense,
        message: `Licença atualizada. Válida até ${updatedLicense.expDateLicense}.`
      });
    } catch (err) {
      logger.error("Erro ao atualizar licença TBB:", err.message);
      return res.status(400).json({ error: err.message });
    }
  }
);

app.get("/api/demands", (req, res) => {
  try { res.json(listDemands()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/demands", (req, res) => {
  try { res.status(201).json(createDemand(req.body || {})); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

app.put("/api/demands/:id", (req, res) => {
  try { res.json(updateDemand(req.params.id, req.body || {})); }
  catch (err) { res.status(err.message === "Demanda não encontrada." ? 404 : 400).json({ error: err.message }); }
});

app.patch("/api/demands/:id/move", (req, res) => {
  try { res.json(moveDemand(req.params.id, req.body?.status, req.body?.position)); }
  catch (err) { res.status(err.message === "Demanda não encontrada." ? 404 : 400).json({ error: err.message }); }
});

app.delete("/api/demands/:id", (req, res) => {
  try { deleteDemand(req.params.id); res.status(204).end(); }
  catch (err) { res.status(404).json({ error: err.message }); }
});

/* Log start */
logger.info("Inicializando servidor...");

/* Erros não tratados */
let fatalShutdownStarted = false;

function shutdownAfterFatalError(kind, err) {
  if (fatalShutdownStarted) return;
  fatalShutdownStarted = true;

  const detail = err?.stack || err?.message || String(err);
  logger.error(`${kind}: ${detail}`);

  // Após uma exceção não tratada o processo pode estar inconsistente. Parar de
  // aceitar conexões evita que o serviço permaneça vivo, porém travado.
  const exitTimer = setTimeout(() => process.exit(1), 1500);
  exitTimer.unref();

  if (server.listening) {
    server.close(() => process.exit(1));
  } else {
    process.exitCode = 1;
  }
}

process.on("uncaughtException", err => {
  shutdownAfterFatalError("UncaughtException", err);
});

process.on("unhandledRejection", err => {
  shutdownAfterFatalError("UnhandledRejection", err);
});

process.on("SIGINT", () => {
  logger.warn("Processo recebeu SIGINT (interrupcao manual). Encerrando servidor.");
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.warn("Processo recebeu SIGTERM. Encerrando servidor.");
  process.exit(0);
});

process.on("exit", (code) => {
  logger.warn(`Processo encerrado com codigo ${code}`);
});

/**
 * 🔹 API
 */
app.get("/api/log", async (req, res) => {
  try {
    const { stream, encoding } = await createFullLogStream(req.query.source || null);
    res.setHeader("Content-Type", `text/plain; charset=${encoding || "utf-8"}`);
    stream.on("error", (err) => {
      if (!res.headersSent) {
        res.status(500).json({ error: err.message });
      } else {
        res.destroy(err);
      }
    });
    stream.pipe(res);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/log-sources", async (req, res) => {
  try {
    const config = await getConfig();
    const sources = Object.entries(config.LOG_SOURCES || {}).map(([key, source]) => ({
      key,
      label: typeof source?.label === "string" && source.label.trim() ? source.label : key
    }));
    res.json({
      activeSource: config.ACTIVE_LOG_SOURCE || sources[0]?.key || "aas",
      sources: sources.length ? sources : [{ key: config.ACTIVE_LOG_SOURCE || "aas", label: config.ACTIVE_LOG_SOURCE || "aas" }]
    });
  } catch (err) {
    logger.error("Erro ao carregar fontes de log:", err && err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/config", async (req, res) => {
  try {
    const config = await getConfig();
    res.json({
      ...config,
      restartEnabled: isRestartEnabled(),
      configFile: getConfigFilePath()
    });
  } catch (err) {
    logger.error("Erro ao carregar configuração:", err && err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/config", async (req, res) => {
  try {
    const previousConfig = await getConfig();
    const config = await saveConfig(req.body || {});
    const restartRequired = previousConfig.PORT_SERVER !== config.PORT_SERVER && isRestartEnabled();
    res.json({
      ok: true,
      message: restartRequired
        ? `Configuração salva. O servidor será reiniciado na porta ${config.PORT_SERVER}.`
        : "Configuração salva e aplicada sem reiniciar o servidor.",
      config,
      restartEnabled: isRestartEnabled(),
      restartRequired,
      configFile: getConfigFilePath()
    });
  } catch (err) {
    logger.error("Erro ao salvar configuração:", err && err.message);
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/agent-config/:source", async (req, res) => {
  try {
    res.json(await readRemoteAgentConfig(req.params.source));
  } catch (err) {
    logger.error("Erro ao carregar configuração do agente:", err.message);
    res.status(502).json({ error: err.message });
  }
});

app.put("/api/agent-config/:source", async (req, res) => {
  try {
    res.json(await saveRemoteAgentConfig(req.params.source, req.body || {}));
  } catch (err) {
    logger.error("Erro ao salvar configuração do agente:", err.message);
    res.status(502).json({ error: err.message });
  }
});

app.get("/api/agent-fs/:source", async (req, res) => {
  try {
    const result = await listRemoteDirectory(req.params.source, String(req.query.path || "").trim());
    res.json(result);
  } catch (err) {
    logger.error("Erro ao listar pasta no agente:", err.message);
    res.status(502).json({ error: err.message });
  }
});

app.get("/api/agent-fs/:source/file", async (req, res) => {
  try {
    res.json(await readRemoteFile(req.params.source, String(req.query.path || "").trim()));
  } catch (err) {
    logger.error("Erro ao ler arquivo do agente:", err.message);
    res.status(502).json({ error: err.message });
  }
});

app.put("/api/agent-fs/:source/file", async (req, res) => {
  try {
    res.json(await writeRemoteFile(
      req.params.source,
      String(req.body?.path || "").trim(),
      req.body?.content
    ));
  } catch (err) {
    logger.error("Erro ao salvar arquivo no agente:", err.message);
    res.status(502).json({ error: err.message });
  }
});

function getServerBinaryTarget() {
  if (process.pkg) return process.execPath;
  return path.resolve(process.cwd(), "backend", "launcher.js");
}

async function resolveRemoteSource(sourceKey) {
  const config = await getConfig();
  const source = config.LOG_SOURCES?.[sourceKey];
  const isRemote = source && (source.type === "remote-http" || !!source.URL);
  if (!isRemote || !source.URL) {
    throw new Error("Fonte remota não encontrada na configuração central.");
  }
  return source;
}

app.get("/api/binary-update/server/sessions", (req, res) => {
  try {
    res.json(listBinaryUpdateSessions());
  } catch (err) {
    logger.error("Erro ao listar sessões de atualização do servidor:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/binary-update/server/stage", express.raw({ type: "application/octet-stream", limit: "1024mb" }), (req, res) => {
  try {
    if (!process.pkg) throw new Error("A atualização do servidor exige que o SGTA esteja rodando pelo executável empacotado.");
    const stagedContent = Buffer.isBuffer(req.body)
      ? req.body
      : decodeBase64Payload(req.body?.binaryBase64 ?? req.body?.binary, "servidor");
    const session = createBinaryUpdateSession({
      targetPath: getServerBinaryTarget(),
      stagedContent: validateExecutableBuffer(stagedContent),
      label: String(req.query.label || req.body?.label || "server")
    });
    res.status(201).json(session);
  } catch (err) {
    logger.error("Erro ao preparar atualização do servidor:", err.message);
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/binary-update/server/apply", (req, res) => {
  try {
    if (!process.pkg || !isRestartEnabled()) {
      throw new Error("A atualização automática exige o executável SGTA rodando sob o supervisor.");
    }
    const sessionId = String(req.body?.sessionId || "").trim();
    if (!sessionId) throw new Error("Informe o sessionId.");
    const session = requestBinaryUpdate(sessionId, "apply");
    res.json({ ok: true, sessionId: session.id, status: session.status, message: "Atualização aceita. O servidor será reiniciado para carregar a nova versão." });
    setTimeout(restartForBinaryUpdate, 250);
  } catch (err) {
    logger.error("Erro ao aplicar atualização do servidor:", err.message);
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/binary-update/server/rollback", (req, res) => {
  try {
    if (!process.pkg || !isRestartEnabled()) {
      throw new Error("A reversão automática exige o executável SGTA rodando sob o supervisor.");
    }
    const sessionId = String(req.body?.sessionId || "").trim();
    if (!sessionId) throw new Error("Informe o sessionId.");
    const session = requestBinaryUpdate(sessionId, "rollback");
    res.json({ ok: true, sessionId: session.id, status: session.status, message: "Reversão aceita. O servidor será reiniciado para restaurar o backup." });
    setTimeout(restartForBinaryUpdate, 250);
  } catch (err) {
    logger.error("Erro ao reverter atualização do servidor:", err.message);
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/agent-binary-update/:source/sessions", async (req, res) => {
  try {
    const data = await callRemoteAgentBinaryUpdate(req.params.source, "sessions");
    res.json(data);
  } catch (err) {
    logger.error("Erro ao listar sessões de atualização do agente:", err.message);
    res.status(502).json({ error: err.message });
  }
});

app.post("/api/agent-binary-update/:source/stage", express.raw({ type: "application/octet-stream", limit: "1024mb" }), async (req, res) => {
  try {
    if (!Buffer.isBuffer(req.body)) throw new Error("Envie o binário como application/octet-stream.");
    const data = await stageRemoteAgentBinaryUpdate(
      req.params.source,
      req.body,
      String(req.query.label || `${req.params.source}-agent`)
    );
    res.status(201).json(data);
  } catch (err) {
    logger.error("Erro ao preparar atualização do agente via central:", err.message);
    res.status(502).json({ error: err.message });
  }
});

app.post("/api/agent-binary-update/:source/apply", async (req, res) => {
  try {
    const data = await callRemoteAgentBinaryUpdate(req.params.source, "apply", { sessionId: req.body?.sessionId });
    res.json(data);
  } catch (err) {
    logger.error("Erro ao aplicar atualização do agente via central:", err.message);
    res.status(502).json({ error: err.message });
  }
});

app.post("/api/agent-binary-update/:source/rollback", async (req, res) => {
  try {
    const data = await callRemoteAgentBinaryUpdate(req.params.source, "rollback", { sessionId: req.body?.sessionId });
    res.json(data);
  } catch (err) {
    logger.error("Erro ao reverter atualização do agente via central:", err.message);
    res.status(502).json({ error: err.message });
  }
});

app.get("/api/parsers/carga-tabelas", (req, res) => {
  try {
    res.json(getCargaTabelasStatus());
  } catch (err) {
    logger.error("Erro ao consultar parser de Carga de Tabelas:", err && err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/parsers/carga-tabelas/parse", (req, res) => {
  try {
    const result = parseCargaTabelas(req.body || {});
    const statusCode = result.ok ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (err) {
    logger.error("Erro ao processar parser de Carga de Tabelas:", err && err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 🔹 FRONTEND EMBUTIDO
 */
app.get(["/", "/index.html"], (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(FRONTEND_HTML);
});

// Map para controlar última atividade de cada cliente tail
const tailActivity = new Map();
const TAIL_TIMEOUT = 5 * 60 * 1000; // 5 minutos

// Limpar clientes inativos a cada 1 minuto
setInterval(() => {
  const now = Date.now();
  for (const [clientId, lastActivity] of tailActivity.entries()) {
    if (now - lastActivity > TAIL_TIMEOUT) {
      logger.info(`Cliente tail ${clientId} inativo há mais de 5 min, removendo...`);
      tailActivity.delete(clientId);
    }
  }
}, 60000);

// Além disso, checar licença periodicamente com o mesmo ritmo de inatividade
setInterval(() => {
  try {
    const info = license();
    if (!info || !info.validation) {
      logger.error('Licença expirada detectada no check periódico. Encerrando servidor.');
      const now = new Date();
      const day = now.getDate().toString().padStart(2, '0');
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const year = now.getFullYear();
      const dtSys = `${year}-${month}-${day}`;
      setTimeout(() => {
        try { checkLicense(dtSys, info ? info.expDateLicense : null); } catch (_) {}
      }, 800);
    }
  } catch (e) {
    logger.error('Erro no check periódico de licença: ' + (e && e.message));
  }
}, 60000);

app.get("/api/log/tail/realtime", async (req, res) => {
  try {
    const cursor = Number(req.query.cursor || 0);
    const clientId = req.query.clientId || req.ip;
    const source = req.query.source || null;
    
    // Atualizar atividade do cliente
    tailActivity.set(clientId, Date.now());

    const data = await readTailIncremental(cursor, 50, source);

    res.json(data);
  } catch (err) {
    logger.error("Erro tail realtime:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 🔹 SOCKET
 */
initSocket(io);

/**
 * 🔹 START
 */
async function startServer() {
  const config = await getConfig();
  const PORT = config.PORT_SERVER || 3000;
  
  server.listen(PORT, "0.0.0.0", () => {
    logger.info(`Servidor escutando na porta ${PORT}`);
  });
}

const verifyLicense = license();
if(verifyLicense.validation){
  logger.info("Iniciando servidor...");
  startServer();
} else {
  logger.error("Licença inválida contate o fornecedor AS Solutions.");
  logger.error(`Data de Expiração da Licença: ${verifyLicense.expDateLicense}`);
  logger.error("Encerrando aplicação...");
  process.exit(78);
}

// Iniciar monitoramento de configuração
watchConfig();

// Configurar reinício automático quando a configuração mudar.
if (isRestartEnabled()) {
  let restartScheduled = false;
  onConfigChange(() => {
    if (restartScheduled) return;
    restartScheduled = true;
    logger.info("🔄 Reiniciando servidor em 2 segundos...");
    setTimeout(() => {
      let restartFinished = false;
      const finishRestart = () => {
        if (restartFinished) return;
        restartFinished = true;
        logger.info("✅ Servidor encerrado, reiniciando processo...");
        process.exit(SUPERVISOR_RESTART_EXIT_CODE);
      };

      // Impede conexões WebSocket persistentes de bloquearem server.close().
      io.disconnectSockets(true);
      io.close(() => finishRestart());
      if (server.listening) server.close(() => finishRestart());

      // Garantia para conexões HTTP que não encerrarem dentro do prazo.
      setTimeout(() => {
        logger.warn("Tempo limite de encerramento atingido; forçando reinício controlado.");
        finishRestart();
      }, 3000);
    }, 2000);
  });
}
