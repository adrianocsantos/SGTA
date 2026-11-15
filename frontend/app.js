// Use http://IP:3000 se acessar de outra máquina
const SERVER_URL = "";

const logElement = document.getElementById("log");
const systemSelect = document.getElementById("systemSelect");
const reloadBtn = document.getElementById("reload");
const tailBtn = document.getElementById("tailRealtime");
const stopBtn = document.getElementById("stopTail");
const exportBtn = document.getElementById("exportTail");
const statusLabel = document.getElementById("statusLabel");
const licenseInfo = document.getElementById("licenseInfo");
const licenseWarning = document.getElementById("licenseWarning");
const moduleTabs = Array.from(document.querySelectorAll(".module-tab"));
const viewPanels = Array.from(document.querySelectorAll(".view-panel"));
const cargaTabelasStatus = document.getElementById("cargaTabelasStatus");
const cargaTabelasOutput = document.getElementById("cargaTabelasOutput");
const cargaTabelasWarnings = document.getElementById("cargaTabelasWarnings");
const refreshCargaTabelasStatusBtn = document.getElementById("refreshCargaTabelasStatus");
const processCargaTabelasBtn = document.getElementById("processCargaTabelas");
const cargaTabelasTipo = document.getElementById("cargaTabelasTipo");
const cargaTabelasInput = document.getElementById("cargaTabelasInput");
const cargaTabelasCount = document.getElementById("cargaTabelasCount");
const cargaTabelasSummary = document.getElementById("cargaTabelasSummary");
const cargaTabelasSearch = document.getElementById("cargaTabelasSearch");
const cargaTabelasRecordTools = document.getElementById("cargaTabelasRecordTools");
const clearCargaTabelasBtn = document.getElementById("clearCargaTabelas");
let cargaTabelasResult = null;
let cargaTabelasRequestId = 0;
let cargaTabelasStatusRequestId = 0;
const parsedRecordsContainer = document.getElementById("parsedRecordsContainer");
const expandAllParsedGroupsBtn = document.getElementById("expandAllParsedGroups");
const collapseAllParsedGroupsBtn = document.getElementById("collapseAllParsedGroups");
const isoParserProfile = document.getElementById("isoParserProfile");
const isoParserInputFormat = document.getElementById("isoParserInputFormat");
const isoPinBlockEncoding = document.getElementById("isoPinBlockEncoding");
const isoMessageInput = document.getElementById("isoMessageInput");
const parseIsoMessageBtn = document.getElementById("parseIsoMessage");
const clearIsoMessageBtn = document.getElementById("clearIsoMessage");
const isoParserStatus = document.getElementById("isoParserStatus");
const isoParserResults = document.getElementById("isoParserResults");
const configForm = document.getElementById("configForm");
const configStatusBadge = document.getElementById("configStatusBadge");
const configRestartHint = document.getElementById("configRestartHint");
const configPathInput = document.getElementById("configPath");
const configEncodingInput = document.getElementById("configEncoding");
const configMaxBytesInput = document.getElementById("configMaxBytes");
const configMaxLinesInput = document.getElementById("configMaxLines");
const configPortInput = document.getElementById("configPort");
const configSourcesList = document.getElementById("configSourcesList");
const addConfigSourceBtn = document.getElementById("addConfigSource");
const saveConfigBtn = document.getElementById("saveConfig");
const reloadConfigBtn = document.getElementById("reloadConfig");
const resetConfigBtn = document.getElementById("resetConfig");
const configFeedback = document.getElementById("configFeedback");
const configFilePath = document.getElementById("configFilePath");
const licenseUploadFile = document.getElementById("licenseUploadFile");
const uploadLicenseBtn = document.getElementById("uploadLicense");
const licenseUploadFeedback = document.getElementById("licenseUploadFeedback");
const genericUploadTarget = document.getElementById("genericUploadTarget");
const genericUploadFile = document.getElementById("genericUploadFile");
const uploadGenericFileBtn = document.getElementById("uploadGenericFile");
const genericUploadFeedback = document.getElementById("genericUploadFeedback");
const agentConfigSource = document.getElementById("agentConfigSource");
const loadAgentConfigBtn = document.getElementById("loadAgentConfig");
const saveAgentConfigBtn = document.getElementById("saveAgentConfig");
const agentConfigEditor = document.getElementById("agentConfigEditor");
const agentConfigFeedback = document.getElementById("agentConfigFeedback");
const binaryUpdateTarget = document.getElementById("binaryUpdateTarget");
const binaryUpdateFile = document.getElementById("binaryUpdateFile");
const stageBinaryUpdateBtn = document.getElementById("stageBinaryUpdate");
const applyBinaryUpdateBtn = document.getElementById("applyBinaryUpdate");
const rollbackBinaryUpdateBtn = document.getElementById("rollbackBinaryUpdate");
const binaryUpdateSession = document.getElementById("binaryUpdateSession");
const binaryUpdateFeedback = document.getElementById("binaryUpdateFeedback");
const execAgentSource = document.getElementById("execAgentSource");
const interactiveTerminal = document.getElementById("interactiveTerminal");
const expandTerminalBtn = document.getElementById("expandTerminal");
const fullscreenTerminalBtn = document.getElementById("fullscreenTerminal");
const terminalScrollBottomBtn = document.getElementById("terminalScrollBottom");
const terminalConnectBtn = document.getElementById("terminalConnectBtn");
const terminalDisconnectBtn = document.getElementById("terminalDisconnectBtn");
const terminalStatus = document.getElementById("terminalStatus");
const terminalFeedback = document.getElementById("terminalFeedback");
const remoteAgentIdentity = document.getElementById("remoteAgentIdentity");
const remoteWorkspaceTabs = Array.from(document.querySelectorAll("[data-remote-tab]"));
const remoteWorkspacePanels = Array.from(document.querySelectorAll("[data-remote-panel]"));
const fsBrowseForm = document.getElementById("fsBrowseForm");
const fsBrowsePath = document.getElementById("fsBrowsePath");
const fsBrowseBtn = document.getElementById("fsBrowseBtn");
const fsBrowseUpBtn = document.getElementById("fsBrowseUpBtn");
const fsBrowseFeedback = document.getElementById("fsBrowseFeedback");
const fsBrowseList = document.getElementById("fsBrowseList");
const fsEditor = document.getElementById("fsEditor");
const fsEditorPath = document.getElementById("fsEditorPath");
const fsEditorContent = document.getElementById("fsEditorContent");
const fsEditorSaveBtn = document.getElementById("fsEditorSaveBtn");
const fsEditorCancelBtn = document.getElementById("fsEditorCancelBtn");
const viewTitle = document.getElementById("viewTitle");
const appVersion = document.getElementById("appVersion");
const overviewApplications = document.getElementById("overviewApplications");
const overviewAgents = document.getElementById("overviewAgents");
const overviewLicense = document.getElementById("overviewLicense");
const overviewLicenseDetail = document.getElementById("overviewLicenseDetail");
const overviewVersion = document.getElementById("overviewVersion");
const logSearch = document.getElementById("logSearch");
const logLevelFilter = document.getElementById("logLevelFilter");
const logMatchCount = document.getElementById("logMatchCount");
const logErrorCount = document.getElementById("logErrorCount");
const logWarnCount = document.getElementById("logWarnCount");
const toggleLogWrap = document.getElementById("toggleLogWrap");
const scrollLogBottom = document.getElementById("scrollLogBottom");
const decreaseLogFont = document.getElementById("decreaseLogFont");
const increaseLogFont = document.getElementById("increaseLogFont");
const pauseLogDisplay = document.getElementById("pauseLogDisplay");
const toggleAutoScroll = document.getElementById("toggleAutoScroll");
const copyLogLine = document.getElementById("copyLogLine");
const maximizeLog = document.getElementById("maximizeLog");
const logPanel = document.getElementById("logPanel");
const remoteOperationsAuthDialog = document.getElementById("remoteOperationsAuthDialog");
const remoteOperationsAuthForm = document.getElementById("remoteOperationsAuthForm");
const remoteOperationsAuthTitle = document.getElementById("remoteOperationsAuthTitle");
const remoteOperationsAuthDescription = document.getElementById("remoteOperationsAuthDescription");
const remoteOperationsPassword = document.getElementById("remoteOperationsPassword");
const remoteOperationsPasswordConfirmField = document.getElementById("remoteOperationsPasswordConfirmField");
const remoteOperationsPasswordConfirm = document.getElementById("remoteOperationsPasswordConfirm");
const remoteOperationsAuthFeedback = document.getElementById("remoteOperationsAuthFeedback");
const remoteOperationsAuthSubmit = document.getElementById("remoteOperationsAuthSubmit");
const remoteOperationsAuthCancel = document.getElementById("remoteOperationsAuthCancel");
const remoteOperationsAuthBanner = document.getElementById("remoteOperationsAuthBanner");
const remoteOperationsLoginBtn = document.getElementById("remoteOperationsLoginBtn");
const remoteOperationsLogoutBtn = document.getElementById("remoteOperationsLogout");
const remoteOperationsManagePasswordsBtn = document.getElementById("remoteOperationsManagePasswords");
const remoteOperationsControls = document.getElementById("remoteOperationsControls");
const configurationAuthBanner = document.getElementById("configurationAuthBanner");
const configurationControls = document.getElementById("configurationControls");
const configurationLogoutBtn = document.getElementById("configurationLogout");
const licenseUploadSection = document.getElementById("licenseUploadTitle")?.closest(".config-disclosure");
const genericUploadSection = document.getElementById("genericUploadSection");
const remoteOperationsUsername = document.getElementById("remoteOperationsUsername");
const remoteOperationsCredentialsDialog = document.getElementById("remoteOperationsCredentialsDialog");
const remoteOperationsCredentialsForm = document.getElementById("remoteOperationsCredentialsForm");
const remoteOperationsCredentialsClose = document.getElementById("remoteOperationsCredentialsClose");
const remoteCredentialUsername = document.getElementById("remoteCredentialUsername");
const remoteCredentialPassword = document.getElementById("remoteCredentialPassword");
const remoteCredentialExpiry = document.getElementById("remoteCredentialExpiry");
const remoteCredentialCreateBtn = document.getElementById("remoteCredentialCreateBtn");
const remoteCredentialFeedback = document.getElementById("remoteCredentialFeedback");
const remoteCredentialsList = document.getElementById("remoteCredentialsList");
const kanbanBoard = document.getElementById("kanbanBoard");
const newDemandBtn = document.getElementById("newDemand");
const demandSearch = document.getElementById("demandSearch");
const demandProjectFilter = document.getElementById("demandProjectFilter");
const demandPriorityFilter = document.getElementById("demandPriorityFilter");
const demandSummary = document.getElementById("demandSummary");
const demandFeedback = document.getElementById("demandFeedback");
const demandDialog = document.getElementById("demandDialog");
const demandForm = document.getElementById("demandForm");
const demandDialogTitle = document.getElementById("demandDialogTitle");
const demandId = document.getElementById("demandId");
const demandTitle = document.getElementById("demandTitle");
const demandProject = document.getElementById("demandProject");
const demandProjectOptions = document.getElementById("demandProjectOptions");
const demandDescription = document.getElementById("demandDescription");
const demandAssignee = document.getElementById("demandAssignee");
const demandCategory = document.getElementById("demandCategory");
const demandPriority = document.getElementById("demandPriority");
const demandDueDate = document.getElementById("demandDueDate");
const demandStatus = document.getElementById("demandStatus");
const demandTags = document.getElementById("demandTags");
const subtaskList = document.getElementById("subtaskList");
const subtaskSummary = document.getElementById("subtaskSummary");
const addSubtaskBtn = document.getElementById("addSubtask");
const closeDemandDialog = document.getElementById("closeDemandDialog");
const cancelDemand = document.getElementById("cancelDemand");
const deleteDemandBtn = document.getElementById("deleteDemand");
let tailInterval = null;
let tailCursor = 0;
let isTailing = false;
let clientId = Math.random().toString(36).substring(7); // ID único para rastreamento de atividade
let activeView = "overview";
let configSnapshot = null;
let logRawText = "";
let selectedLogLine = "";
let logFontSize = 13;
let isLogDisplayPaused = false;
let autoScrollLog = true;
let logRenderTimer = null;
const MAX_RENDERED_LOG_LINES = 1500;
const LOG_RENDER_INTERVAL_MS = 250;
let lastLogStatsUpdate = 0;
let demands = [];
let draggedDemandId = null;
let webTerminal = null;
let terminalConnected = false;
let terminalResizeObserver = null;
let terminalFollowOutput = true;
let currentRemoteFile = null;
let remoteOperationsToken = sessionStorage.getItem("sgta.remoteOperationsToken") || "";
let remoteOperationsIsAdmin = false;
let remoteOperationsNeedsSetup = false;

const DEFAULT_LOG_SOURCE = "aas";

let socket = null;
try {
  if (typeof io === "function") {
    socket = io(SERVER_URL);
    socket.on("connect", () => {
      console.info("[SGTA Socket.IO] conectado ao central", {
        socketId: socket.id,
        transport: socket.io.engine?.transport?.name,
        origin: window.location.origin
      });
    });
    socket.on("connect_error", error => {
      console.error("[SGTA Socket.IO] falha ao conectar ao central", {
        message: error.message,
        origin: window.location.origin
      });
    });
    socket.on("disconnect", reason => {
      console.warn("[SGTA Socket.IO] desconectado do central", { reason });
    });
  } else {
    console.warn("socket.io client indisponível; usando fallback por polling");
  }
} catch (err) {
  console.warn("Falha ao inicializar socket.io; usando fallback por polling", err);
}

function setTerminalState(connected, message) {
  terminalConnected = connected;
  if (terminalStatus) {
    terminalStatus.textContent = message || (connected ? "Conectado" : "Desconectado");
    terminalStatus.dataset.state = connected ? "connected" : "disconnected";
  }
  terminalConnectBtn?.classList.toggle("hidden", connected);
  terminalDisconnectBtn?.classList.toggle("hidden", !connected);
  if (terminalConnectBtn) terminalConnectBtn.disabled = false;
}

function setTerminalFeedback(message, tone = "info") {
  if (!terminalFeedback) return;
  terminalFeedback.textContent = message || "";
  terminalFeedback.dataset.tone = tone;
  terminalFeedback.classList.toggle("hidden", !message);
}

function switchRemoteWorkspace(tabName) {
  remoteWorkspaceTabs.forEach(tab => {
    const selected = tab.dataset.remoteTab === tabName;
    tab.classList.toggle("active", selected);
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  remoteWorkspacePanels.forEach(panel => {
    const selected = panel.dataset.remotePanel === tabName;
    panel.classList.toggle("active", selected);
    panel.hidden = !selected;
  });
  if (tabName === "terminal" && webTerminal) {
    requestAnimationFrame(() => {
      const size = terminalDimensions();
      webTerminal.resize(size.cols, size.rows);
      if (terminalConnected) socket?.emit("terminal:resize", size);
    });
  }
}

remoteWorkspaceTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => switchRemoteWorkspace(tab.dataset.remoteTab));
  tab.addEventListener("keydown", event => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === "Home" ? 0
      : event.key === "End" ? remoteWorkspaceTabs.length - 1
        : (index + (event.key === "ArrowRight" ? 1 : -1) + remoteWorkspaceTabs.length) % remoteWorkspaceTabs.length;
    remoteWorkspaceTabs[nextIndex]?.focus();
    switchRemoteWorkspace(remoteWorkspaceTabs[nextIndex]?.dataset.remoteTab);
  });
});

function updateRemoteAgentIdentity() {
  const option = execAgentSource.selectedOptions[0];
  if (remoteAgentIdentity) remoteAgentIdentity.textContent = option?.value
    ? `${option.textContent} · ${option.value}`
    : "Nenhum agente selecionado";
}

execAgentSource?.addEventListener("change", updateRemoteAgentIdentity);

function describeTerminalError(error) {
  if (String(error || "").toLowerCase() === "timeout") {
    return "O agente remoto não respondeu. Verifique se o serviço está ativo e se a URL e a porta do agente estão acessíveis pelo servidor central.";
  }
  return error || "Falha ao abrir terminal.";
}

function terminalDimensions() {
  if (!interactiveTerminal) return { cols: 80, rows: 24 };

  const styles = getComputedStyle(interactiveTerminal);
  const availableWidth = interactiveTerminal.clientWidth
    - parseFloat(styles.paddingLeft)
    - parseFloat(styles.paddingRight);
  const availableHeight = interactiveTerminal.clientHeight
    - parseFloat(styles.paddingTop)
    - parseFloat(styles.paddingBottom);
  const charMeasure = interactiveTerminal.querySelector(".xterm-char-measure-element");
  const screen = interactiveTerminal.querySelector(".xterm-screen");
  const measuredChar = charMeasure?.getBoundingClientRect();
  const measuredScreen = screen?.getBoundingClientRect();
  const cellWidth = measuredChar?.width ? measuredChar.width / 32 : 8.4;
  const cellHeight = measuredScreen?.height && webTerminal?.rows
    ? measuredScreen.height / webTerminal.rows
    : (measuredChar?.height || 14) * 1.15;
  return {
    cols: Math.max(20, Math.floor(availableWidth / cellWidth)),
    rows: Math.max(5, Math.floor(availableHeight / cellHeight) - 2)
  };
}

function requestTerminalResize() {
  requestAnimationFrame(() => {
    if (!webTerminal || !interactiveTerminal?.clientWidth || !interactiveTerminal?.clientHeight) return;
    resizeWebTerminal();
  });
}

function resizeWebTerminal() {
  if (!webTerminal) return;
  const size = terminalDimensions();
  if (webTerminal.cols !== size.cols || webTerminal.rows !== size.rows) {
    webTerminal.resize(size.cols, size.rows);
    if (terminalConnected) socket?.emit("terminal:resize", size);
  }
}

function ensureWebTerminal() {
  if (webTerminal || !interactiveTerminal || typeof Terminal !== "function") return webTerminal;
  webTerminal = new Terminal({
    cursorBlink: true,
    convertEol: false,
    fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
    fontSize: 14,
    lineHeight: 1.15,
    scrollback: 5000,
    theme: { background: "#05070f", foreground: "#d7e2f1", cursor: "#7ef7c5" }
  });
  webTerminal.open(interactiveTerminal);
  webTerminal.onData(data => {
    if (terminalConnected) socket?.emit("terminal:input", data);
  });
  terminalResizeObserver = new ResizeObserver(() => {
    resizeWebTerminal();
  });
  terminalResizeObserver.observe(interactiveTerminal);
  webTerminal.onScroll(() => {
    const buffer = webTerminal.buffer.active;
    terminalFollowOutput = buffer.viewportY >= buffer.baseY - 1;
  });
  const size = terminalDimensions();
  webTerminal.resize(size.cols, size.rows);
  return webTerminal;
}

function openInteractiveTerminal() {
  const source = execAgentSource?.value;
  if (!source) return setTerminalFeedback("Selecione um agente remoto.", "danger");
  if (!socket?.connected) {
    const details = {
      connected: Boolean(socket?.connected),
      readyState: socket?.io?.readyState || "indisponível",
      transport: socket?.io?.engine?.transport?.name || "indisponível",
      origin: window.location.origin
    };
    console.error("[SGTA Terminal] clique não enviado: WebSocket central desconectado", details);
    return setTerminalFeedback(`WebSocket do servidor central indisponível (${details.readyState}). Consulte o console do navegador e confirme a origem ${details.origin}.`, "danger");
  }
  console.info("[SGTA Terminal] solicitando abertura", { source, socketId: socket.id });
  const terminal = ensureWebTerminal();
  if (!terminal) return setTerminalFeedback("Emulador de terminal indisponível.", "danger");
  setTerminalFeedback("");
  terminalConnectBtn.disabled = true;
  if (terminalStatus) {
    terminalStatus.textContent = "Conectando…";
    terminalStatus.dataset.state = "connecting";
  }
  terminal.clear();
  terminal.write("\x1b[90mAbrindo terminal no agente...\x1b[0m\r\n");
  const size = terminalDimensions();
  socket.timeout(15_000).emit("terminal:start", {
    source,
    authToken: remoteOperationsToken,
    ...size
  }, (timeoutError, result) => {
    terminalConnectBtn.disabled = false;
    if (timeoutError || !result?.ok) {
      console.error("[SGTA Terminal] falha na solicitação", {
        source,
        timeout: Boolean(timeoutError),
        error: result?.error || null
      });
      if (String(result?.error || "").toLowerCase().includes("autenticação necessária")) {
        remoteOperationsToken = "";
        sessionStorage.removeItem("sgta.remoteOperationsToken");
        void openRemoteOperationsLogin();
      }
      const message = timeoutError
        ? "O servidor central não respondeu ao pedido de abertura do terminal."
        : describeTerminalError(result?.error);
      terminal.write(`\r\n\x1b[31m${message}\x1b[0m\r\n`);
      setTerminalFeedback(message, "danger");
      setTerminalState(false, String(result?.error || "").toLowerCase() === "timeout" ? "Agente sem resposta" : "Falha na conexão");
      return;
    }
    setTerminalFeedback("");
    setTerminalState(true, `Conectado · PID ${result.pid}`);
    terminal.focus();
  });
}

function closeInteractiveTerminal() {
  socket?.emit("terminal:stop");
  setTerminalState(false, "Desconectado");
  webTerminal?.write("\r\n\x1b[90m[terminal encerrado]\x1b[0m\r\n");
}

socket?.on("terminal:data", data => {
  const terminal = ensureWebTerminal();
  if (!terminal) return;
  terminal.write(String(data || ""), () => {
    if (terminalFollowOutput) terminal.scrollToBottom();
  });
});
socket?.on("terminal:exit", data => {
  setTerminalState(false, `Encerrado · código ${data?.exitCode ?? 0}`);
  webTerminal?.write(`\r\n\x1b[90m[processo encerrado: ${data?.exitCode ?? 0}]\x1b[0m\r\n`);
});
socket?.on("terminal:error", data => {
  const message = describeTerminalError(data?.error || "Erro no terminal remoto.");
  setTerminalState(false, String(data?.error || "").toLowerCase() === "timeout" ? "Agente sem resposta" : "Erro");
  ensureWebTerminal()?.write(`\r\n\x1b[31m${message}\x1b[0m\r\n`);
});
socket?.on("terminal:disconnected", () => {
  if (terminalConnected) setTerminalState(false, "Conexão encerrada");
});
terminalConnectBtn?.addEventListener("click", openInteractiveTerminal);
terminalDisconnectBtn?.addEventListener("click", closeInteractiveTerminal);
terminalScrollBottomBtn?.addEventListener("click", () => {
  if (!webTerminal) return;
  terminalFollowOutput = true;
  webTerminal.scrollToBottom();
  webTerminal.focus();
});
expandTerminalBtn?.addEventListener("click", () => {
  const expanded = interactiveTerminal?.classList.toggle("terminal-expanded") || false;
  expandTerminalBtn.setAttribute("aria-pressed", String(expanded));
  expandTerminalBtn.setAttribute("aria-label", expanded ? "Restaurar área do terminal" : "Expandir área do terminal");
  expandTerminalBtn.title = expanded ? "Restaurar área do terminal" : "Expandir área do terminal";
  requestTerminalResize();
});
fullscreenTerminalBtn?.addEventListener("click", async () => {
  try {
    if (document.fullscreenElement === interactiveTerminal) {
      await document.exitFullscreen();
    } else if (interactiveTerminal?.requestFullscreen) {
      await interactiveTerminal.requestFullscreen();
    } else {
      interactiveTerminal?.classList.toggle("terminal-expanded");
      expandTerminalBtn?.setAttribute("aria-pressed", String(interactiveTerminal?.classList.contains("terminal-expanded")));
    }
  } catch (error) {
    setTerminalFeedback(`Não foi possível abrir tela cheia: ${error.message}`, "danger");
  }
});
document.addEventListener("fullscreenchange", () => {
  const fullscreen = document.fullscreenElement === interactiveTerminal;
  fullscreenTerminalBtn?.setAttribute("aria-label", fullscreen ? "Sair da tela cheia" : "Abrir terminal em tela cheia");
  if (fullscreenTerminalBtn) fullscreenTerminalBtn.title = fullscreen ? "Sair da tela cheia" : "Abrir terminal em tela cheia";
  requestTerminalResize();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && interactiveTerminal?.classList.contains("terminal-expanded")) {
    interactiveTerminal.classList.remove("terminal-expanded");
    expandTerminalBtn?.setAttribute("aria-pressed", "false");
    expandTerminalBtn?.setAttribute("aria-label", "Expandir área do terminal");
    if (expandTerminalBtn) expandTerminalBtn.title = "Expandir área do terminal";
    requestTerminalResize();
  }
});
execAgentSource?.addEventListener("change", () => {
  if (terminalConnected) closeInteractiveTerminal();
});

// Estado inicial
stopBtn.style.display = "none";
setStatus("Pronto", "muted");

// Buscar e exibir informação da licença
async function fetchLicenseInfo() {
  if (!licenseInfo) return;
  try {
    const res = await fetch(`${SERVER_URL}/api/license`);
    if (!res.ok) {
      licenseInfo.textContent = 'Licença: erro ao obter';
      licenseWarning.classList.add('hidden');
      return;
    }
    const data = await res.json();
    // data.expDateLicense esperado em YYYY-MM-DD
    if (!data || !data.expDateLicense) {
      licenseInfo.textContent = 'Licença: informação indisponível';
      licenseWarning.classList.add('hidden');
      return;
    }

    const exp = data.expDateLicense;
    const formatted = formatToDDMMYYYY(exp);
    const valid = !!data.validation;
    licenseInfo.textContent = valid ? `Licença válida até ${formatted}` : `Licença expirada em ${formatted}`;
    if (overviewLicense) overviewLicense.textContent = valid ? "Válida" : "Expirada";
    if (overviewLicenseDetail) overviewLicenseDetail.textContent = `até ${formatted}`;

    const days = daysUntil(exp);
    if (days <= 5 && days >= 0) {
      licenseWarning.textContent = `Aviso: sua licença vence em ${days} dia(s). Entre em contato com o fornecedor.`;
      licenseWarning.classList.remove('hidden');
    } else {
      licenseWarning.classList.add('hidden');
      licenseWarning.textContent = '';
    }
  } catch (err) {
    licenseInfo.textContent = 'Licença: erro na conexão';
    licenseWarning.classList.add('hidden');
  }
}

function formatToDDMMYYYY(iso) {
  // iso formato YYYY-MM-DD
  const parts = (iso || '').split('-');
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function daysUntil(iso) {
  try {
    const today = new Date();
    const exp = new Date(`${iso}T00:00:00`);
    // zerar horas para cálculo de dias inteiros
    const t0 = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const t1 = Date.UTC(exp.getFullYear(), exp.getMonth(), exp.getDate());
    return Math.ceil((t1 - t0) / (1000 * 60 * 60 * 24));
  } catch (e) { return Infinity; }
}

// Inicializa as buscas e atualiza periodicamente
fetchLicenseInfo();
setInterval(fetchLicenseInfo, 60 * 1000);

function setRemoteOperationsAuthFeedback(message, tone = "info") {
  if (!remoteOperationsAuthFeedback) return;
  remoteOperationsAuthFeedback.textContent = message || "";
  remoteOperationsAuthFeedback.dataset.tone = tone;
  remoteOperationsAuthFeedback.classList.toggle("hidden", !message);
}

function setRemoteOperationsUnlocked(unlocked, isAdmin = false) {
  remoteOperationsControls?.classList.toggle("hidden", !unlocked);
  remoteOperationsAuthBanner?.classList.toggle("hidden", unlocked);
  remoteOperationsLogoutBtn?.classList.toggle("hidden", !unlocked);
  remoteOperationsManagePasswordsBtn?.classList.toggle("hidden", !unlocked || !isAdmin);
  configurationControls?.classList.toggle("hidden", !unlocked);
  configurationAuthBanner?.classList.toggle("hidden", unlocked);
  configurationLogoutBtn?.classList.toggle("hidden", !unlocked);
  licenseUploadSection?.classList.toggle("hidden", !unlocked || !isAdmin);
  genericUploadSection?.classList.toggle("hidden", !unlocked || !isAdmin);
  remoteOperationsIsAdmin = unlocked && isAdmin;
}

async function openRemoteOperationsLogin() {
  setRemoteOperationsUnlocked(false);
  setRemoteOperationsAuthFeedback("");
  remoteOperationsPassword?.setCustomValidity("");

  try {
    const headers = remoteOperationsToken ? { Authorization: `Bearer ${remoteOperationsToken}` } : {};
    const response = await fetch(`${SERVER_URL}/api/remote-operations/auth/status`, { headers });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Não foi possível verificar a autenticação.");
    if (data.setupRequired) {
      remoteOperationsNeedsSetup = true;
      remoteOperationsAuthTitle.textContent = "Criar senha mestra";
      remoteOperationsAuthDescription.textContent = "A primeira pessoa que concluir esta configuração será o administrador. Faça isso apenas em uma rede controlada.";
      remoteOperationsUsername?.classList.add("hidden");
      remoteOperationsPasswordConfirmField?.classList.remove("hidden");
      remoteOperationsPasswordConfirm?.setAttribute("required", "");
      if (remoteOperationsAuthSubmit) {
        remoteOperationsAuthSubmit.classList.remove("hidden");
        remoteOperationsAuthSubmit.textContent = "Criar admin";
      }
      if (remoteOperationsPassword) remoteOperationsPassword.classList.remove("hidden");
      if (remoteOperationsAuthCancel) remoteOperationsAuthCancel.textContent = "Voltar";
      setRemoteOperationsAuthFeedback("Configuração inicial disponível uma única vez. Use uma senha forte com pelo menos 16 caracteres.", "info");
      if (remoteOperationsAuthDialog && !remoteOperationsAuthDialog.open) remoteOperationsAuthDialog.showModal();
    } else if (!data.enabled) {
      remoteOperationsNeedsSetup = false;
      remoteOperationsAuthTitle.textContent = "Operações Remotas indisponíveis";
      remoteOperationsAuthDescription.textContent = "A autenticação não está habilitada neste servidor.";
      if (remoteOperationsAuthSubmit) remoteOperationsAuthSubmit.classList.add("hidden");
      if (remoteOperationsUsername) remoteOperationsUsername.classList.add("hidden");
      if (remoteOperationsPassword) remoteOperationsPassword.classList.add("hidden");
      remoteOperationsPasswordConfirmField?.classList.add("hidden");
      if (remoteOperationsAuthCancel) remoteOperationsAuthCancel.textContent = "Voltar";
      setRemoteOperationsAuthFeedback("Configure SGTA_REMOTE_OPERATIONS_PASSWORD no servidor e reinicie o SGTA, ou confirme que a configuração inicial ainda não foi usada.", "danger");
      if (remoteOperationsAuthDialog && !remoteOperationsAuthDialog.open) remoteOperationsAuthDialog.showModal();
    } else if (remoteOperationsAuthSubmit) {
      remoteOperationsNeedsSetup = false;
      remoteOperationsAuthTitle.textContent = "Autenticar Operações Remotas";
      remoteOperationsAuthDescription.textContent = "O administrador entra como admin com a senha mestra. Outras contas usam o nome e a senha criados pelo administrador.";
      remoteOperationsAuthSubmit.classList.remove("hidden");
      remoteOperationsAuthSubmit.textContent = "Entrar";
      remoteOperationsUsername?.classList.remove("hidden");
      remoteOperationsPassword?.classList.remove("hidden");
      remoteOperationsPasswordConfirmField?.classList.add("hidden");
      remoteOperationsPasswordConfirm?.removeAttribute("required");
      if (remoteOperationsAuthCancel) remoteOperationsAuthCancel.textContent = "Voltar";
      if (data.authenticated) {
        setRemoteOperationsUnlocked(true, data.isAdmin);
        if (activeView === "config") fetchConfig();
        return true;
      }
      remoteOperationsToken = "";
      sessionStorage.removeItem("sgta.remoteOperationsToken");
      if (remoteOperationsAuthDialog && !remoteOperationsAuthDialog.open) remoteOperationsAuthDialog.showModal();
      remoteOperationsPassword?.focus();
    }
  } catch (error) {
    setRemoteOperationsAuthFeedback(error.message, "danger");
    if (remoteOperationsAuthDialog && !remoteOperationsAuthDialog.open) remoteOperationsAuthDialog.showModal();
  }
  return false;
}

async function remoteOperationsFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  if (remoteOperationsToken) headers.set("Authorization", `Bearer ${remoteOperationsToken}`);
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    remoteOperationsToken = "";
    sessionStorage.removeItem("sgta.remoteOperationsToken");
    setRemoteOperationsUnlocked(false);
    void openRemoteOperationsLogin();
  }
  return response;
}

remoteOperationsAuthForm?.addEventListener("submit", async event => {
  event.preventDefault();
  const username = remoteOperationsUsername?.value.trim() || "";
  const password = remoteOperationsPassword?.value || "";
  if (!password) {
    setRemoteOperationsAuthFeedback("Informe usuário e senha.", "danger");
    return;
  }
  if (remoteOperationsNeedsSetup) {
    if (password.length < 16) {
      setRemoteOperationsAuthFeedback("A senha mestra deve ter pelo menos 16 caracteres.", "danger");
      return;
    }
    if (password !== (remoteOperationsPasswordConfirm?.value || "")) {
      setRemoteOperationsAuthFeedback("As senhas não coincidem.", "danger");
      return;
    }
  }
  remoteOperationsAuthSubmit.disabled = true;
  setRemoteOperationsAuthFeedback(remoteOperationsNeedsSetup ? "Criando administrador..." : "Autenticando...", "info");
  try {
    const setupMode = remoteOperationsNeedsSetup;
    const response = await fetch(`${SERVER_URL}/api/remote-operations/auth/${setupMode ? "setup" : "login"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(setupMode ? { password } : { username, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Falha na autenticação.");
    remoteOperationsToken = data.token;
    remoteOperationsIsAdmin = Boolean(data.isAdmin);
    remoteOperationsNeedsSetup = false;
    sessionStorage.setItem("sgta.remoteOperationsToken", remoteOperationsToken);
    remoteOperationsPassword.value = "";
    if (remoteOperationsPasswordConfirm) remoteOperationsPasswordConfirm.value = "";
    remoteOperationsAuthDialog?.close();
    setRemoteOperationsAuthFeedback("");
    setRemoteOperationsUnlocked(true, remoteOperationsIsAdmin);
    if (activeView === "config") fetchConfig();
  } catch (error) {
    setRemoteOperationsAuthFeedback(error.message, "danger");
    remoteOperationsPassword?.select();
  } finally {
    remoteOperationsAuthSubmit.disabled = false;
  }
});

remoteOperationsAuthCancel?.addEventListener("click", () => {
  remoteOperationsAuthDialog?.close();
  if (activeView === "ssh" || activeView === "config") switchView("overview");
});

remoteOperationsLoginBtn?.addEventListener("click", () => void openRemoteOperationsLogin());
document.querySelectorAll("[data-remote-auth-open]").forEach(button => {
  button.addEventListener("click", () => void openRemoteOperationsLogin());
});

remoteOperationsAuthDialog?.addEventListener("cancel", event => event.preventDefault());

async function logoutRemoteOperations(showLogin = true) {
  if (remoteOperationsToken) {
    await fetch(`${SERVER_URL}/api/remote-operations/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${remoteOperationsToken}` }
    }).catch(() => {});
  }
  remoteOperationsToken = "";
  remoteOperationsIsAdmin = false;
  sessionStorage.removeItem("sgta.remoteOperationsToken");
  setRemoteOperationsUnlocked(false);
  if (showLogin) void openRemoteOperationsLogin();
}

remoteOperationsLogoutBtn?.addEventListener("click", () => logoutRemoteOperations());

configurationLogoutBtn?.addEventListener("click", async () => {
  await logoutRemoteOperations(false);
  if (activeView === "config") switchView("overview");
});

function setRemoteCredentialFeedback(message, tone = "info") {
  if (!remoteCredentialFeedback) return;
  remoteCredentialFeedback.textContent = message || "";
  remoteCredentialFeedback.dataset.tone = tone;
  remoteCredentialFeedback.classList.toggle("hidden", !message);
}

function renderRemoteCredentials(credentials = []) {
  if (!remoteCredentialsList) return;
  remoteCredentialsList.replaceChildren();
  if (!credentials.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Nenhum acesso adicional ativo.";
    remoteCredentialsList.appendChild(empty);
    return;
  }
  for (const credential of credentials) {
    const row = document.createElement("div");
    row.className = "remote-credential-row";
    const details = document.createElement("div");
    const username = document.createElement("strong");
    username.textContent = credential.username;
    const expiry = document.createElement("small");
    expiry.textContent = credential.expiresAt
      ? `Expira ${new Date(credential.expiresAt).toLocaleString("pt-BR")}`
      : "Permanente";
    details.append(username, expiry);
    const revoke = document.createElement("button");
    revoke.className = "danger compact";
    revoke.type = "button";
    revoke.textContent = "Revogar";
    revoke.addEventListener("click", () => revokeRemoteCredential(credential));
    row.append(details, revoke);
    remoteCredentialsList.appendChild(row);
  }
}

async function loadRemoteCredentials() {
  try {
    const response = await remoteOperationsFetch(`${SERVER_URL}/api/remote-operations/auth/credentials`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Não foi possível carregar os acessos.");
    renderRemoteCredentials(data.credentials);
  } catch (error) {
    setRemoteCredentialFeedback(error.message, "danger");
  }
}

async function revokeRemoteCredential(credential) {
  if (!window.confirm(`Revogar o acesso de ${credential.username}?`)) return;
  try {
    const response = await remoteOperationsFetch(`${SERVER_URL}/api/remote-operations/auth/credentials/${encodeURIComponent(credential.id)}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Não foi possível revogar o acesso.");
    setRemoteCredentialFeedback(`Acesso ${credential.username} revogado.`, "ok");
    await loadRemoteCredentials();
  } catch (error) {
    setRemoteCredentialFeedback(error.message, "danger");
  }
}

remoteOperationsManagePasswordsBtn?.addEventListener("click", async () => {
  if (!remoteOperationsIsAdmin) return;
  setRemoteCredentialFeedback("");
  remoteOperationsCredentialsDialog?.showModal();
  await loadRemoteCredentials();
});

remoteOperationsCredentialsClose?.addEventListener("click", () => remoteOperationsCredentialsDialog?.close());

remoteOperationsCredentialsForm?.addEventListener("submit", async event => {
  event.preventDefault();
  if (!remoteOperationsIsAdmin) return setRemoteCredentialFeedback("Apenas o administrador pode criar acessos.", "danger");
  remoteCredentialCreateBtn.disabled = true;
  setRemoteCredentialFeedback("Criando acesso...", "info");
  try {
    const response = await remoteOperationsFetch(`${SERVER_URL}/api/remote-operations/auth/credentials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: remoteCredentialUsername.value.trim(),
        password: remoteCredentialPassword.value,
        expiresInHours: Number(remoteCredentialExpiry.value)
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Não foi possível criar o acesso.");
    const validity = data.credential.expiresAt
      ? `até ${new Date(data.credential.expiresAt).toLocaleString("pt-BR")}`
      : "permanentemente";
    setRemoteCredentialFeedback(`Acesso ${data.credential.username} criado ${validity}. Anote a senha; ela não será exibida novamente.`, "ok");
    remoteOperationsCredentialsForm.reset();
    await loadRemoteCredentials();
  } catch (error) {
    setRemoteCredentialFeedback(error.message, "danger");
  } finally {
    remoteCredentialCreateBtn.disabled = false;
  }
});

function switchView(view) {
  activeView = view;

  moduleTabs.forEach(tab => {
    tab.classList.toggle("active", tab.dataset.view === view);
    tab.setAttribute("aria-selected", String(tab.dataset.view === view));
  });

  viewPanels.forEach(panel => {
    panel.classList.toggle("active", panel.dataset.panel === view);
  });

  const titles = { overview: "Visão geral", "log-reader": "Leitor de logs", "carga-tabelas": "Carga de tabelas", "iso-parser": "Parser ISO", ssh: "Operações remotas", demands: "Gestão de demandas", config: "Configurações" };
  if (viewTitle) viewTitle.textContent = titles[view] || "SGTA";

  if (view === "overview") {
    stopTail();
    setStatus("Sistema online", "ok");
    return;
  }

  if (view === "carga-tabelas") {
    stopTail();
    setStatus("Carga de Tabelas", "info");
    fetchCargaTabelasStatus();
    return;
  }

  if (view === "iso-parser") {
    stopTail();
    setStatus("Parser ISO", "info");
    return;
  }

  if (view === "ssh") {
    stopTail();
    setStatus("Operações remotas", "info");
    void openRemoteOperationsLogin();
    return;
  }

  if (view === "demands") {
    stopTail();
    setStatus("Gestão de demandas", "info");
    fetchDemands();
    return;
  }

  if (view === "config") {
    stopTail();
    setStatus("Configuração", "info");
    void openRemoteOperationsLogin();
    return;
  }

  setStatus("Pronto", "muted");
}

function setStatus(text, tone = "muted") {
  statusLabel.textContent = text;
  statusLabel.dataset.tone = tone;
}

function getSelectedLogSource() {
  return systemSelect?.value || configSnapshot?.ACTIVE_LOG_SOURCE || DEFAULT_LOG_SOURCE;
}

function getLogSources() {
  return configSnapshot && typeof configSnapshot.LOG_SOURCES === "object"
    ? configSnapshot.LOG_SOURCES
    : null;
}

function normalizeSourceEntry(sourceKey, sourceValue, fallbackPath = "") {
  if (typeof sourceValue === "string") {
    return {
      key: sourceKey,
      label: sourceKey,
      PATH: sourceValue
    };
  }

  const source = sourceValue && typeof sourceValue === "object" ? sourceValue : {};
  return {
    key: sourceKey,
    label: typeof source.label === "string" && source.label.trim() ? source.label : sourceKey,
    type: source.type || (source.URL || source.url ? "remote-http" : "local"),
    PATH: source.PATH || source.path || fallbackPath,
    URL: source.URL || source.url || "",
    SOURCE: source.SOURCE || source.source || "",
    TOKEN: source.TOKEN || source.token || ""
  };
}

function getSourceEntries(config = configSnapshot) {
  const fallbackPath = config?.LOG_CONFIG?.PATH || "";
  const sources = config && typeof config.LOG_SOURCES === "object" ? config.LOG_SOURCES : null;
  const entries = sources
    ? Object.entries(sources).map(([key, value]) => normalizeSourceEntry(key, value, fallbackPath))
    : [];

  if (!entries.length) {
    entries.push({
      key: config?.ACTIVE_LOG_SOURCE || DEFAULT_LOG_SOURCE,
      label: config?.ACTIVE_LOG_SOURCE || DEFAULT_LOG_SOURCE,
      PATH: fallbackPath
    });
  }

  return entries;
}

function createSourceKey(label, existingKeys = []) {
  const fallback = `app-${existingKeys.length + 1}`;
  const base = String(label || fallback)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || fallback;

  let key = base;
  let suffix = 2;
  while (existingKeys.includes(key)) {
    key = `${base}-${suffix}`;
    suffix += 1;
  }
  return key;
}

function createFileSafeName(value, fallback = "aplicacao") {
  return String(value || fallback)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || fallback;
}

function getSelectedLogLabel() {
  const selectedOption = systemSelect?.selectedOptions?.[0];
  return selectedOption?.textContent || getSelectedLogSource();
}

function renderSystemOptions(config = configSnapshot) {
  if (!systemSelect) return;

  const previousValue = systemSelect.value;
  const entries = getSourceEntries(config);
  const activeSource = config?.ACTIVE_LOG_SOURCE || previousValue || DEFAULT_LOG_SOURCE;

  systemSelect.innerHTML = "";
  entries.forEach(source => {
    const option = document.createElement("option");
    option.value = source.key;
    option.textContent = source.label || source.key;
    systemSelect.appendChild(option);
  });

  if (!entries.some(source => source.key === activeSource)) {
    const option = document.createElement("option");
    option.value = activeSource;
    option.textContent = activeSource;
    systemSelect.appendChild(option);
  }

  systemSelect.value = activeSource;
}

async function fetchLogSources() {
  if (!systemSelect) return;

  try {
    const response = await fetch(`${SERVER_URL}/api/log-sources`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Falha ao carregar aplicações.");

    const previousValue = systemSelect.value;
    systemSelect.innerHTML = "";
    (data.sources || []).forEach(source => {
      const option = document.createElement("option");
      option.value = source.key;
      option.textContent = source.label || source.key;
      systemSelect.appendChild(option);
    });
    systemSelect.value = (data.sources || []).some(source => source.key === previousValue)
      ? previousValue
      : data.activeSource;
  } catch (error) {
    systemSelect.innerHTML = "";
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Falha ao carregar aplicações";
    systemSelect.appendChild(option);
    setStatus(error.message, "danger");
  }
}

function getSelectedLogPath() {
  const selectedSource = getSelectedLogSource();
  const sources = getLogSources();
  const source = sources && sources[selectedSource];
  if (!source) return configSnapshot?.LOG_CONFIG?.PATH || "";

  if (typeof source === "string") return source;
  return source.PATH || source.path || configSnapshot?.LOG_CONFIG?.PATH || "";
}

function buildLogQueryParams() {
  const params = new URLSearchParams();
  const selectedSource = getSelectedLogSource();
  if (selectedSource) {
    params.set("source", selectedSource);
  }
  return params.toString();
}

function syncSelectedLogToConfigField() {
  if (configPathInput) {
    configPathInput.value = getSelectedLogPath();
  }
}

function renderConfigSources(config) {
  if (!configSourcesList) return;

  configSourcesList.innerHTML = "";
  const activeSource = config?.ACTIVE_LOG_SOURCE || DEFAULT_LOG_SOURCE;
  const entries = getSourceEntries(config);

  entries.forEach(source => {
    appendConfigSourceRow(source, source.key === activeSource);
  });

  if (!configSourcesList.querySelector('input[name="activeLogSource"]:checked')) {
    const firstRadio = configSourcesList.querySelector('input[name="activeLogSource"]');
    if (firstRadio) firstRadio.checked = true;
  }
}

function appendConfigSourceRow(source, isActive = false) {
  if (!configSourcesList) return;

  const row = document.createElement("div");
  row.className = "config-source-row";
  row.dataset.sourceKey = source.key;

  const activeLabel = document.createElement("label");
  activeLabel.className = "config-source-active";
  activeLabel.title = "Fonte ativa";

  const activeInput = document.createElement("input");
  activeInput.type = "radio";
  activeInput.name = "activeLogSource";
  activeInput.value = source.key;
  activeInput.checked = isActive;
  activeInput.addEventListener("change", () => {
    if (systemSelect) systemSelect.value = source.key;
    if (configPathInput) configPathInput.value = pathInput.value;
  });

  const keyInput = document.createElement("input");
  keyInput.className = "config-source-key";
  keyInput.type = "text";
  keyInput.value = source.key;
  keyInput.readOnly = true;
  keyInput.title = "Chave da fonte";

  const labelInput = document.createElement("input");
  labelInput.className = "config-source-label";
  labelInput.type = "text";
  labelInput.value = source.label || source.key;
  labelInput.placeholder = "Nome";
  labelInput.title = "Nome exibido";

  const typeSelect = document.createElement("select");
  typeSelect.className = "config-source-type";
  typeSelect.title = "Tipo da fonte";

  const localOption = document.createElement("option");
  localOption.value = "local";
  localOption.textContent = "Local";

  const remoteOption = document.createElement("option");
  remoteOption.value = "remote-http";
  remoteOption.textContent = "Agente";

  typeSelect.append(localOption, remoteOption);
  typeSelect.value = source.type || (source.URL ? "remote-http" : "local");

  const pathInput = document.createElement("input");
  pathInput.className = "config-source-path";
  pathInput.type = "text";
  pathInput.value = source.PATH || "";
  pathInput.placeholder = "Caminho do log";
  pathInput.title = "Caminho do log";
  pathInput.addEventListener("input", () => {
    const checked = configSourcesList.querySelector('input[name="activeLogSource"]:checked');
    if (checked && checked.value === source.key && configPathInput) {
      configPathInput.value = pathInput.value;
    }
  });

  const urlInput = document.createElement("input");
  urlInput.className = "config-source-url";
  urlInput.type = "url";
  urlInput.value = source.URL || "";
  urlInput.placeholder = "http://servidor-agente:3100";
  urlInput.title = "URL do agente";

  const tokenInput = document.createElement("input");
  tokenInput.className = "config-source-token";
  tokenInput.type = "password";
  tokenInput.value = source.TOKEN || "";
  tokenInput.placeholder = "Token";
  tokenInput.title = "Token do agente";

  const remoteSourceInput = document.createElement("input");
  remoteSourceInput.className = "config-source-remote-key";
  remoteSourceInput.type = "text";
  remoteSourceInput.value = source.SOURCE || source.source || "";
  remoteSourceInput.placeholder = "Fonte no agente (opcional)";
  remoteSourceInput.title = "Chave configurada em LOG_SOURCES no agente";

  function syncSourceTypeFields() {
    const isRemote = typeSelect.value === "remote-http";
    pathInput.disabled = isRemote;
    pathInput.classList.toggle("hidden", isRemote);
    pathInput.placeholder = "Caminho do log";
    urlInput.classList.toggle("hidden", !isRemote);
    remoteSourceInput.classList.toggle("hidden", !isRemote);
    tokenInput.classList.toggle("hidden", !isRemote);
  }

  typeSelect.addEventListener("change", syncSourceTypeFields);
  syncSourceTypeFields();

  const removeBtn = document.createElement("button");
  removeBtn.className = "ghost config-source-remove";
  removeBtn.type = "button";
  removeBtn.textContent = "Remover";
  removeBtn.addEventListener("click", () => {
    const rows = Array.from(configSourcesList.querySelectorAll(".config-source-row"));
    if (rows.length <= 1) {
      setConfigFeedback("Mantenha ao menos uma aplicação configurada.", "info");
      return;
    }

    const wasActive = activeInput.checked;
    row.remove();

    if (wasActive) {
      const firstRadio = configSourcesList.querySelector('input[name="activeLogSource"]');
      if (firstRadio) {
        firstRadio.checked = true;
        firstRadio.dispatchEvent(new Event("change"));
      }
    }
  });

  activeLabel.appendChild(activeInput);
  row.append(activeLabel, keyInput, labelInput, typeSelect, pathInput, urlInput, remoteSourceInput, tokenInput, removeBtn);
  configSourcesList.appendChild(row);
}

function addConfigSource() {
  if (!configSourcesList) return;

  const existingKeys = Array.from(configSourcesList.querySelectorAll(".config-source-row"))
    .map(row => row.dataset.sourceKey)
    .filter(Boolean);
  const key = createSourceKey("nova-aplicacao", existingKeys);
  const source = {
    key,
    label: "Nova aplicação",
    type: "local",
    PATH: "",
    URL: "",
    TOKEN: ""
  };

  configSourcesList.querySelectorAll('input[name="activeLogSource"]').forEach(input => {
    input.checked = false;
  });
  appendConfigSourceRow(source, true);
  if (systemSelect) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = source.label;
    systemSelect.appendChild(option);
    systemSelect.value = key;
  }
  if (configPathInput) configPathInput.value = "";
  const newRow = configSourcesList.querySelector(`[data-source-key="${key}"]`);
  newRow?.querySelector(".config-source-label")?.focus();
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderRawOutput(content) {
  if (cargaTabelasSummary) {
    cargaTabelasSummary.classList.add("hidden");
    cargaTabelasSummary.innerHTML = "";
  }
  if (cargaTabelasRecordTools) cargaTabelasRecordTools.classList.add("hidden");
  if (cargaTabelasWarnings) {
    cargaTabelasWarnings.classList.add("hidden");
    cargaTabelasWarnings.innerHTML = "";
  }
  if (parsedRecordsContainer) {
    parsedRecordsContainer.innerHTML = "";
  }
  if (cargaTabelasOutput) {
    cargaTabelasOutput.classList.remove("hidden");
    cargaTabelasOutput.textContent = content;
  }
}

function renderWarnings(payload) {
  if (!cargaTabelasWarnings) return;

  const warnings = Array.isArray(payload && payload.warnings) ? payload.warnings : [];
  if (!warnings.length) {
    cargaTabelasWarnings.classList.add("hidden");
    cargaTabelasWarnings.innerHTML = "";
    return;
  }

  const items = warnings
    .map((warning, idx) => {
      const position = Number.isInteger(warning.position) && warning.position >= 0 ? warning.position : "?";
      const recordId = warning.recordId ? ` [${escapeHtml(String(warning.recordId))}]` : "";
      const message = escapeHtml(warning.message || "Alerta sem descrição.");
      const precedingExcerpt = typeof warning.precedingExcerpt === "string" ? warning.precedingExcerpt : "";
      const excerpt = typeof warning.excerpt === "string" && warning.excerpt.length
        ? `<div>Trecho ao redor da posição (até 20 caracteres antes e depois): <code class="parser-warning-excerpt">${escapeHtml(precedingExcerpt)}<mark>${escapeHtml(warning.excerpt.slice(0, 1))}</mark>${escapeHtml(warning.excerpt.slice(1))}</code></div>`
        : "";
      const action = position !== "?" ? `<button type="button" class="ghost carga-warning-action" data-carga-position="${position}">Ir para o ponto</button>` : "";
      return `<li><div class="carga-warning-heading"><span>#${idx + 1} · Posição ${position}${recordId}: ${message}</span>${action}</div>${excerpt}</li>`;
    })
    .join("");

  cargaTabelasWarnings.innerHTML = `<strong>${warnings.length} alerta(s) encontrados</strong><ul>${items}</ul>`;
  cargaTabelasWarnings.classList.remove("hidden");
}

function renderCargaSummary(payload) {
  if (!cargaTabelasSummary) return;
  const metrics = [
    ["Formato", (payload.detectedMode || payload.selectedMode || "—").toUpperCase()],
    ["Registros", payload.recordCount],
    ["Tipos", Object.keys(payload.summary || {}).length],
    ["Alertas", Array.isArray(payload.warnings) ? payload.warnings.length : 0]
  ];
  cargaTabelasSummary.innerHTML = metrics.map(([label, value]) =>
    `<div class="carga-metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`
  ).join("");
  cargaTabelasSummary.classList.remove("hidden");
}

function renderParsedGroups(payload) {
  if (!parsedRecordsContainer || !cargaTabelasOutput) {
    renderRawOutput(JSON.stringify(payload, null, 2));
    renderWarnings(payload);
    return;
  }

  const records = Array.isArray(payload.records) ? payload.records : [];
  if (!records.length) {
    renderRawOutput(JSON.stringify(payload, null, 2));
    renderCargaSummary(payload);
    renderWarnings(payload);
    return;
  }

  renderCargaSummary(payload);
  renderWarnings(payload);
  if (cargaTabelasRecordTools) cargaTabelasRecordTools.classList.remove("hidden");
  const query = (cargaTabelasSearch?.value || "").trim().toLocaleLowerCase();
  const grouped = new Map();
  records.forEach((record, idx) => {
    const type = record.recordType || "?";
    const name = record.recordName || "sem-nome";
    if (query && !`${type} ${name} ${JSON.stringify(record.data)}`.toLocaleLowerCase().includes(query)) return;
    const key = `${type} - ${name}`;
    if (!grouped.has(key)) {
      grouped.set(key, { type, name, items: [] });
    }
    grouped.get(key).items.push({ index: idx + 1, data: record.data });
  });

  const sections = Array.from(grouped.values()).map(group => {
    const header = `Tipo ${escapeHtml(group.type)}  |  ${escapeHtml(group.name)} (${group.items.length})`;
    const itemsHtml = group.items
      .map(item => {
        const fields = Object.entries(item.data || {}).map(([key, value]) => {
          const text = value !== null && typeof value === "object" ? JSON.stringify(value) : String(value);
          return `<div class="carga-field"><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(text)}</dd></div>`;
        }).join("");
        return `<article class="carga-record"><h4>Registro ${item.index}</h4><dl>${fields}</dl></article>`;
      })
      .join("");

    return `<details class="parsed-group"${query ? " open" : ""}><summary>${header}</summary><div class="parsed-group-body">${itemsHtml}</div></details>`;
  });

  parsedRecordsContainer.innerHTML = sections.length ? sections.join("") : '<p class="carga-empty">Nenhum registro corresponde à busca.</p>';
  cargaTabelasOutput.classList.add("hidden");
}

function cargaRawPosition(raw, position) {
  if (!Number.isInteger(position) || position < 0) return null;
  let normalized = "";
  const indices = [];
  for (let i = 0; i < raw.length; i += 1) {
    if (raw[i] === "\r" && raw[i + 1] === "\n") {
      i += 1;
    } else if (raw[i] !== "\n") {
      normalized += raw[i];
      indices.push(i);
    }
  }
  const leading = normalized.length - normalized.trimStart().length;
  if (position >= normalized.trim().length) return null;
  return indices[leading + position];
}

function resetCargaResult(message) {
  cargaTabelasRequestId += 1;
  cargaTabelasResult = null;
  if (cargaTabelasSearch) cargaTabelasSearch.value = "";
  renderRawOutput(message);
}

function updateCargaInput() {
  if (cargaTabelasCount && cargaTabelasInput) {
    const count = cargaTabelasInput.value.length;
    cargaTabelasCount.textContent = `${count.toLocaleString("pt-BR")} ${count === 1 ? "caractere" : "caracteres"}`;
  }
  resetCargaResult("A entrada foi alterada. Processe a carga para atualizar a análise.");
  if (cargaTabelasStatus) cargaTabelasStatus.textContent = "Entrada alterada";
}

function setConfigFeedback(message, tone = "info") {
  if (!configFeedback) return;
  if (!message) {
    configFeedback.classList.add("hidden");
    configFeedback.textContent = "";
    configFeedback.dataset.tone = "";
    return;
  }

  configFeedback.textContent = message;
  configFeedback.dataset.tone = tone;
  configFeedback.classList.remove("hidden");
}

function setLicenseUploadFeedback(message, tone = "info") {
  if (!licenseUploadFeedback) return;
  licenseUploadFeedback.textContent = message || "";
  licenseUploadFeedback.dataset.tone = tone;
  licenseUploadFeedback.classList.toggle("hidden", !message);
}

function setGenericUploadFeedback(message, tone = "info") {
  if (!genericUploadFeedback) return;
  genericUploadFeedback.textContent = message || "";
  genericUploadFeedback.dataset.tone = tone;
  genericUploadFeedback.classList.toggle("hidden", !message);
}

async function uploadLicense() {
  const file = licenseUploadFile?.files?.[0];
  if (!file) {
    setLicenseUploadFeedback("Selecione o arquivo de licença TBB.", "danger");
    return;
  }
  if (file.size > 1024 * 1024) {
    setLicenseUploadFeedback("O arquivo de licença deve ter no máximo 1 MB.", "danger");
    return;
  }

  if (uploadLicenseBtn) uploadLicenseBtn.disabled = true;
  setLicenseUploadFeedback("Validando e atualizando a licença no servidor...", "info");
  try {
    const response = await remoteOperationsFetch(`${SERVER_URL}/api/license/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: file
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Falha ao atualizar a licença.");
    licenseUploadFile.value = "";
    setLicenseUploadFeedback(
      `Licença atualizada. Válida até ${formatToDDMMYYYY(data.expDateLicense)}.`,
      "ok"
    );
    fetchLicenseInfo();
  } catch (err) {
    setLicenseUploadFeedback(err.message, "danger");
  } finally {
    if (uploadLicenseBtn) uploadLicenseBtn.disabled = false;
  }
}

async function uploadGenericFile() {
  const file = genericUploadFile?.files?.[0];
  if (!file) {
    setGenericUploadFeedback("Selecione um arquivo para enviar.", "danger");
    return;
  }
  if (!file.size) {
    setGenericUploadFeedback("O arquivo selecionado está vazio.", "danger");
    return;
  }
  if (file.size > 100 * 1024 * 1024) {
    setGenericUploadFeedback("O arquivo deve ter no máximo 100 MB.", "danger");
    return;
  }

  const target = genericUploadTarget?.value || "server";
  const filename = encodeURIComponent(file.name);
  const endpoint = target === "server"
    ? `/api/files/upload?filename=${filename}`
    : `/api/agent-files/${encodeURIComponent(target.slice("agent:".length))}/upload?filename=${filename}`;

  if (uploadGenericFileBtn) uploadGenericFileBtn.disabled = true;
  setGenericUploadFeedback("Enviando arquivo...", "info");
  try {
    const response = await remoteOperationsFetch(`${SERVER_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: file
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 413) throw new Error("O arquivo excede o limite de 100 MB.");
    if (!response.ok) throw new Error(data.error || "Falha ao enviar o arquivo.");
    genericUploadFile.value = "";
    setGenericUploadFeedback(data.message || `Arquivo ${file.name} enviado.`, "ok");
  } catch (err) {
    setGenericUploadFeedback(err.message, "danger");
  } finally {
    if (uploadGenericFileBtn) uploadGenericFileBtn.disabled = false;
  }
}

function updateConfigHints(payload) {
  if (configStatusBadge) {
    configStatusBadge.textContent = payload.statusText || "Configuração carregada";
  }

  if (configRestartHint) {
    configRestartHint.textContent = payload.restartEnabled
      ? "Logs e agentes são aplicados sem reinício; somente a troca de porta reinicia o servidor."
      : "As mudanças são aplicadas sem reinício automático neste modo.";
  }

  if (configFilePath) {
    configFilePath.textContent = `Arquivo: ${payload.configFile || "não identificado"}`;
  }
}

function fillConfigForm(config) {
  if (!config) return;
  renderSystemOptions(config);
  renderConfigSources(config);
  syncSelectedLogToConfigField();
  if (configEncodingInput) configEncodingInput.value = config.LOG_CONFIG?.ENCODING || "";
  if (configMaxBytesInput) configMaxBytesInput.value = config.LOG_CONFIG?.MAX_BYTES ?? "";
  if (configMaxLinesInput) configMaxLinesInput.value = config.LOG_CONFIG?.MAX_LINES_PER_READ ?? "";
  if (configPortInput) configPortInput.value = config.PORT_SERVER ?? "";
  renderAgentConfigOptions(config);
}

function renderAgentConfigOptions(config) {
  const remoteSources = getSourceEntries(config).filter(source => source.type === "remote-http");

  [agentConfigSource, execAgentSource].forEach(select => {
    if (!select) return;
    const selected = select.value;
    select.innerHTML = '<option value="">Selecione um agente</option>';
    remoteSources.forEach(source => {
      const option = document.createElement("option");
      option.value = source.key;
      option.textContent = source.label || source.key;
      select.appendChild(option);
    });
    if (Array.from(select.options).some(option => option.value === selected)) select.value = selected;
  });
  updateRemoteAgentIdentity();

  if (binaryUpdateTarget) {
    const selected = binaryUpdateTarget.value;
    binaryUpdateTarget.innerHTML = '<option value="server">Servidor central</option>';
    remoteSources.forEach(source => {
      const option = document.createElement("option");
      option.value = `agent:${source.key}`;
      option.textContent = `Agente: ${source.label || source.key}`;
      binaryUpdateTarget.appendChild(option);
    });
    binaryUpdateTarget.value = Array.from(binaryUpdateTarget.options).some(option => option.value === selected) ? selected : "server";
  }

  if (genericUploadTarget) {
    const selected = genericUploadTarget.value;
    genericUploadTarget.innerHTML = '<option value="server">Servidor central</option>';
    remoteSources.forEach(source => {
      const option = document.createElement("option");
      option.value = `agent:${source.key}`;
      option.textContent = `Agente: ${source.label || source.key}`;
      genericUploadTarget.appendChild(option);
    });
    genericUploadTarget.value = Array.from(genericUploadTarget.options).some(option => option.value === selected) ? selected : "server";
  }
}

function setBinaryUpdateFeedback(message, tone = "info") {
  if (!binaryUpdateFeedback) return;
  binaryUpdateFeedback.textContent = message || "";
  binaryUpdateFeedback.dataset.tone = tone;
  binaryUpdateFeedback.classList.toggle("hidden", !message);
}

function selectedBinaryUpdateUrl(action) {
  const target = binaryUpdateTarget?.value || "server";
  if (target === "server") return `/api/binary-update/server/${action}`;
  return `/api/agent-binary-update/${encodeURIComponent(target.slice("agent:".length))}/${action}`;
}

async function stageBinaryUpdate() {
  const file = binaryUpdateFile?.files?.[0];
  if (!file) return setBinaryUpdateFeedback("Selecione o novo binário.", "danger");
  stageBinaryUpdateBtn.disabled = true;
  setBinaryUpdateFeedback("Preparando binário e criando backup...", "info");
  try {
    const response = await remoteOperationsFetch(`${SERVER_URL}${selectedBinaryUpdateUrl("stage")}?label=${encodeURIComponent(file.name)}`, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: file
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Falha ao preparar atualização.");
    binaryUpdateSession.value = data.id;
    setBinaryUpdateFeedback(`Sessão ${data.id} preparada. Backup salvo em ${data.backupPath}.`, "ok");
  } catch (err) {
    setBinaryUpdateFeedback(err.message, "danger");
  } finally {
    stageBinaryUpdateBtn.disabled = false;
  }
}

async function runBinaryUpdateAction(action) {
  const sessionId = binaryUpdateSession?.value.trim();
  if (!sessionId) return setBinaryUpdateFeedback("Prepare uma atualização antes de aplicar ou reverter.", "danger");
  setBinaryUpdateFeedback(action === "apply" ? "Aplicando atualização..." : "Restaurando backup...", "info");
  try {
    const response = await remoteOperationsFetch(`${SERVER_URL}${selectedBinaryUpdateUrl(action)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Falha ao executar atualização.");
    setBinaryUpdateFeedback(data.message || (action === "apply"
      ? "Atualização aceita. O serviço será reiniciado automaticamente."
      : "Reversão aceita. O serviço será reiniciado automaticamente."), "ok");
  } catch (err) {
    setBinaryUpdateFeedback(err.message, "danger");
  }
}

function setAgentConfigFeedback(message, tone = "info") {
  if (!agentConfigFeedback) return;
  agentConfigFeedback.textContent = message || "";
  agentConfigFeedback.dataset.tone = tone;
  agentConfigFeedback.classList.toggle("hidden", !message);
}

async function loadRemoteAgentConfig() {
  const source = agentConfigSource?.value;
  if (!source) return setAgentConfigFeedback("Selecione um agente remoto.", "danger");
  setAgentConfigFeedback("Carregando configuração do agente...", "info");
  try {
    const response = await remoteOperationsFetch(`${SERVER_URL}/api/agent-config/${encodeURIComponent(source)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Falha ao carregar agente.");
    agentConfigEditor.value = JSON.stringify(data.config, null, 2);
    setAgentConfigFeedback(`Configuração carregada de ${data.configFile || source}.`, "ok");
  } catch (err) {
    setAgentConfigFeedback(err.message, "danger");
  }
}

async function saveRemoteAgentConfig() {
  const source = agentConfigSource?.value;
  if (!source) return setAgentConfigFeedback("Selecione um agente remoto.", "danger");
  let config;
  try { config = JSON.parse(agentConfigEditor?.value || ""); }
  catch (_) { return setAgentConfigFeedback("O conteúdo deve ser um JSON válido.", "danger"); }
  setAgentConfigFeedback("Salvando configuração no agente...", "info");
  try {
    const response = await remoteOperationsFetch(`${SERVER_URL}/api/agent-config/${encodeURIComponent(source)}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Falha ao salvar agente.");
    agentConfigEditor.value = JSON.stringify(data.config, null, 2);
    setAgentConfigFeedback(data.message || "Configuração salva no agente.", "ok");
  } catch (err) {
    setAgentConfigFeedback(err.message, "danger");
  }
}

function readConfigForm() {
  const selectedSource = configSourcesList?.querySelector('input[name="activeLogSource"]:checked')?.value || getSelectedLogSource();
  const logSources = {};

  if (configSourcesList) {
    configSourcesList.querySelectorAll(".config-source-row").forEach(row => {
      const key = row.dataset.sourceKey;
      const label = (row.querySelector(".config-source-label")?.value || "").trim();
      const type = row.querySelector(".config-source-type")?.value || "local";
      const path = (row.querySelector(".config-source-path")?.value || "").trim();
      const url = (row.querySelector(".config-source-url")?.value || "").trim();
      const token = (row.querySelector(".config-source-token")?.value || "").trim();
      const remoteSource = (row.querySelector(".config-source-remote-key")?.value || "").trim();
      if (key) {
        logSources[key] = {
          label: label || key,
          type,
          ...(type === "remote-http" ? {} : { PATH: path }),
          ...(type === "remote-http" ? { URL: url } : {}),
          ...(type === "remote-http" && remoteSource ? { SOURCE: remoteSource } : {}),
          ...(token ? { TOKEN: token } : {})
        };
      }
    });
  }

  if (!Object.keys(logSources).length && selectedSource) {
    logSources[selectedSource] = {
      label: selectedSource,
      PATH: configPathInput?.value || ""
    };
  }

  if (selectedSource && logSources[selectedSource] && configPathInput) {
    configPathInput.value = logSources[selectedSource].PATH || "";
  }

  return {
    LOG_CONFIG: {
      PATH: configPathInput?.value || configSnapshot?.LOG_CONFIG?.PATH || ".",
      ENCODING: configEncodingInput?.value || "",
      MAX_BYTES: Number(configMaxBytesInput?.value || 0),
      MAX_LINES_PER_READ: Number(configMaxLinesInput?.value || 0)
    },
    LOG_SOURCES: logSources,
    ACTIVE_LOG_SOURCE: selectedSource,
    PORT_SERVER: Number(configPortInput?.value || 0)
  };
}

function validateConfigForm() {
  const config = readConfigForm();

  if (!Object.keys(config.LOG_SOURCES || {}).length) {
    throw new Error("Cadastre ao menos uma aplicação para leitura.");
  }

  if (!config.LOG_CONFIG.PATH.trim()) {
    throw new Error("Informe o caminho do arquivo de log.");
  }

  for (const [sourceKey, source] of Object.entries(config.LOG_SOURCES || {})) {
    if (!source.label.trim()) {
      throw new Error(`Informe o nome da aplicação ${sourceKey}.`);
    }
    if (source.type === "remote-http") {
      if (!source.URL || !source.URL.trim()) {
        throw new Error(`Informe a URL do agente para ${source.label || sourceKey}.`);
      }
      continue;
    }
    if (!source.PATH || !source.PATH.trim()) {
      throw new Error(`Informe o caminho da fonte ${source.label || sourceKey}.`);
    }
  }

  if (!config.LOG_CONFIG.ENCODING.trim()) {
    throw new Error("Informe o encoding utilizado na leitura.");
  }

  if (!Number.isInteger(config.LOG_CONFIG.MAX_BYTES) || config.LOG_CONFIG.MAX_BYTES <= 0) {
    throw new Error("Informe um tamanho máximo válido em bytes.");
  }

  if (!Number.isInteger(config.LOG_CONFIG.MAX_LINES_PER_READ) || config.LOG_CONFIG.MAX_LINES_PER_READ <= 0) {
    throw new Error("Informe uma quantidade válida de linhas por leitura.");
  }

  if (!Number.isInteger(config.PORT_SERVER) || config.PORT_SERVER <= 0 || config.PORT_SERVER > 65535) {
    throw new Error("Informe uma porta válida entre 1 e 65535.");
  }

  return config;
}

async function fetchConfig() {
  if (!configStatusBadge) return;

  configStatusBadge.textContent = "Carregando configuração...";
  setConfigFeedback("");

  try {
    const res = await remoteOperationsFetch(`${SERVER_URL}/api/config`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Falha ao carregar configuração.");
    }

    configSnapshot = data;
    updateOverview(data);
    fillConfigForm(data);
    updateConfigHints({
      statusText: "Configuração carregada",
      restartEnabled: !!data.restartEnabled,
      configFile: data.configFile
    });
  } catch (err) {
    updateConfigHints({
      statusText: "Falha ao carregar",
      restartEnabled: false,
      configFile: "indisponível"
    });
    setConfigFeedback(err.message, "danger");
  }
}

function updateOverview(config) {
  const entries = getSourceEntries(config);
  const agents = entries.filter(source => source.type === "remote-http");
  if (overviewApplications) overviewApplications.textContent = String(entries.length);
  if (overviewAgents) overviewAgents.textContent = String(agents.length);
}

async function fetchRuntimeInfo() {
  try {
    const res = await fetch(`${SERVER_URL}/runtime/diagnostics`);
    if (!res.ok) return;
    const data = await res.json();
    const version = data.appVersion || "1.0.0";
    if (appVersion) appVersion.textContent = `SGTA v${version}`;
    if (overviewVersion) overviewVersion.textContent = version;
  } catch (_) {
    // Mantém a versão estática quando o diagnóstico estiver indisponível.
  }
}

async function saveConfig() {
  if (!configForm) return;

  let payload;
  try {
    payload = validateConfigForm();
  } catch (err) {
    setConfigFeedback(err.message, "danger");
    return;
  }

  configStatusBadge.textContent = "Salvando...";
  setConfigFeedback("Persistindo alterações...", "info");

  try {
    const res = await remoteOperationsFetch(`${SERVER_URL}/api/config`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Falha ao salvar configuração.");
    }

    configSnapshot = {
      ...data.config,
      restartEnabled: data.restartEnabled,
      configFile: data.configFile
    };
    fillConfigForm(data.config);
    updateConfigHints({
      statusText: "Configuração salva",
      restartEnabled: !!data.restartEnabled,
      configFile: data.configFile
    });
    setConfigFeedback(data.message || "Configuração salva com sucesso.", "ok");
  } catch (err) {
    updateConfigHints({
      statusText: "Falha ao salvar",
      restartEnabled: !!(configSnapshot && configSnapshot.restartEnabled),
      configFile: configSnapshot && configSnapshot.configFile
    });
    setConfigFeedback(err.message, "danger");
  }
}

function resetConfigForm() {
  if (!configSnapshot) {
    setConfigFeedback("Nenhuma configuração foi carregada ainda.", "info");
    return;
  }

  fillConfigForm(configSnapshot);
  updateConfigHints({
    statusText: "Valores restaurados",
    restartEnabled: !!configSnapshot.restartEnabled,
    configFile: configSnapshot.configFile
  });
  setConfigFeedback("Valores restaurados para o último estado carregado.", "info");
}

let pendingLines = [];
let rafScheduled = false;

function flushPendingLines() {
  rafScheduled = false;
  if (!pendingLines.length) return;

  const wasAtBottom = logElement.scrollHeight - logElement.scrollTop - logElement.clientHeight < 40;
  const previousScrollTop = logElement.scrollTop;

  const chunk = pendingLines.join("");
  pendingLines = [];
  logRawText += chunk;
  if (!isLogDisplayPaused) scheduleLogRender();

  if (!isLogDisplayPaused && autoScrollLog && wasAtBottom) {
    logElement.scrollTop = logElement.scrollHeight;
  } else if (!isLogDisplayPaused) {
    logElement.scrollTop = previousScrollTop;
  }
}

function appendMessage(msg) {
  pendingLines.push(msg);
  if (!rafScheduled) {
    rafScheduled = true;
    requestAnimationFrame(flushPendingLines);
  }
}

function clearLogDisplay() {
  if (logRenderTimer) {
    clearTimeout(logRenderTimer);
    logRenderTimer = null;
  }
  pendingLines = [];
  rafScheduled = false;
  logElement.textContent = "";
  logRawText = "";
  selectedLogLine = "";
  if (copyLogLine) copyLogLine.disabled = true;
  logElement.scrollTop = 0;
  updateLogCount(0);
  updateLogLevelCounts([]);
}

function updateLogCount(visibleCount, totalCount = visibleCount) {
  if (!logMatchCount) return;
  const totalLabel = `${totalCount} linha${totalCount === 1 ? "" : "s"}`;
  logMatchCount.textContent = totalCount > visibleCount
    ? `${visibleCount} de ${totalLabel}`
    : totalLabel;
}

function scheduleLogRender(delay = LOG_RENDER_INTERVAL_MS) {
  if (isLogDisplayPaused) return;
  if (logRenderTimer) clearTimeout(logRenderTimer);
  logRenderTimer = setTimeout(() => {
    logRenderTimer = null;
    applyLogFilters();
    if (autoScrollLog) logElement.scrollTop = logElement.scrollHeight;
  }, delay);
}

function applyLogFilters() {
  if (!logElement) return;
  const query = (logSearch?.value || "").trim().toLocaleLowerCase("pt-BR");
  const level = logLevelFilter?.value || "";
  const lines = logRawText ? logRawText.split("\n") : [];
  const filtered = lines.filter(line => {
    if (level && !line.toUpperCase().includes(level)) return false;
    return !query || line.toLocaleLowerCase("pt-BR").includes(query);
  });
  const totalCount = filtered.filter(Boolean).length;
  const visibleLines = filtered.slice(-MAX_RENDERED_LOG_LINES);
  const fragment = document.createDocumentFragment();
  visibleLines.forEach(line => fragment.appendChild(createLogLine(line, query)));
  logElement.replaceChildren(fragment);
  updateLogCount(visibleLines.filter(Boolean).length, totalCount);
  updateLogLevelCounts(lines);
}

function detectLogLevel(line) {
  const match = String(line).match(/\b(FATAL|ERROR|WARN(?:ING)?|INFO|DEBUG|SUCCESS|OK)\b/i);
  if (!match) return "";
  const level = match[1].toLowerCase();
  if (level === "warning") return "warn";
  if (level === "ok") return "success";
  return level;
}

function appendHighlightedText(container, text, query) {
  if (!query) {
    container.appendChild(document.createTextNode(text));
    return;
  }
  const lower = text.toLocaleLowerCase("pt-BR");
  let cursor = 0;
  let index = lower.indexOf(query);
  while (index !== -1) {
    if (index > cursor) container.appendChild(document.createTextNode(text.slice(cursor, index)));
    const mark = document.createElement("mark");
    mark.className = "log-search-hit";
    mark.textContent = text.slice(index, index + query.length);
    container.appendChild(mark);
    cursor = index + query.length;
    index = lower.indexOf(query, cursor);
  }
  if (cursor < text.length) container.appendChild(document.createTextNode(text.slice(cursor)));
}

function createLogLine(line, query) {
  const element = document.createElement("span");
  element.className = "log-line";
  const level = detectLogLevel(line);
  if (level) element.classList.add(`level-${level}`);
  if (selectedLogLine && selectedLogLine === line) element.classList.add("selected");
  element.dataset.line = line;

  const timestamp = line.match(/^(\[[^\]]*\d{2}[:/]\d{2}[^\]]*\]\s*)/);
  if (timestamp) {
    const stamp = document.createElement("span");
    stamp.className = "log-timestamp";
    appendHighlightedText(stamp, timestamp[1], query);
    element.appendChild(stamp);
    appendHighlightedText(element, line.slice(timestamp[1].length), query);
  } else {
    appendHighlightedText(element, line, query);
  }
  return element;
}

function updateLogLevelCounts(lines) {
  const now = Date.now();
  if (lines.length && now - lastLogStatsUpdate < 1500) return;
  lastLogStatsUpdate = now;
  let errors = 0;
  let warnings = 0;
  lines.forEach(line => {
    const level = detectLogLevel(line);
    if (level === "error" || level === "fatal") errors += 1;
    if (level === "warn") warnings += 1;
  });
  if (logErrorCount) logErrorCount.textContent = `${errors} erro${errors === 1 ? "" : "s"}`;
  if (logWarnCount) logWarnCount.textContent = `${warnings} alerta${warnings === 1 ? "" : "s"}`;
}

async function loadFullLog() {
  if (activeView !== "log-reader") return;

  stopTail();
  setStatus("Carregando log...", "info");
  logRawText = "Carregando log completo...\n";
  applyLogFilters();

  try {
    const query = buildLogQueryParams();
    const res = await fetch(`${SERVER_URL}/api/log${query ? `?${query}` : ""}`);

    if (!res.ok) {
      const errorText = await res.text();
      logRawText = `Erro ${res.status}: ${errorText}`;
      applyLogFilters();
      setStatus("Falhou ao carregar", "danger");
      return;
    }

    const text = await res.text();
    logRawText = text;
    applyLogFilters();
    logElement.scrollTop = logElement.scrollHeight;
    setStatus("Pronto", "ok");
  } catch (err) {
    logRawText = "Erro ao carregar log: " + err.message;
    applyLogFilters();
    setStatus("Erro na conexão", "danger");
  }
}

function startTail() {
  if (activeView !== "log-reader") return;
  if (isTailing) return;

  // Pergunta se deseja limpar a tela quando já há conteúdo
  if (logElement.textContent.trim().length > 0) {
    const clear = window.confirm("Deseja limpar a tela antes de iniciar o tail?");
    if (clear) {
      clearLogDisplay();
      tailCursor = 0;
    }
    // Se não limpar, mantém tailCursor atual para continuar de onde parou
  } else {
    tailCursor = 0;
  }

  isTailing = true;
  appendMessage("Tail em tempo real iniciado...\n");
  setStatus("Recebendo em tempo real", "ok");

  tailBtn.style.display = "none";
  stopBtn.style.display = "inline-block";

  // Carrega as últimas linhas via HTTP e depois recebe atualizações pelo WebSocket.
  fetchInitialTail();

  if (socket) {
    socket.emit("log:watch", { source: getSelectedLogSource() });
    socket.on("log:new-line", onSocketLine);
    socket.on("log:error", onSocketError);
  } else {
    tailInterval = setInterval(fetchInitialTail, 1500);
  }
}

function onSocketLine(payload) {
  if (!isTailing) return;
  const selectedSource = getSelectedLogSource();
  const chunk = typeof payload === "object" ? payload?.chunk : null;
  const line = typeof payload === "string" ? payload : payload?.line;
  const source = typeof payload === "object" ? payload?.source : selectedSource;
  if (source && selectedSource && source !== selectedSource) return;
  if (chunk) {
    appendMessage(chunk);
  } else if (line) {
    appendMessage(line + "\n");
  } else {
    return;
  }
  setStatus("Recebendo em tempo real", "ok");
}

function onSocketError(payload) {
  if (!isTailing) return;
  const message = payload?.error || "Erro desconhecido no watcher.";
  appendMessage(`\n[ERRO] ${message}\n`);
  setStatus("Erro no tail", "danger");
}

async function fetchInitialTail() {
  try {
    const query = buildLogQueryParams();
    const res = await fetch(
      `${SERVER_URL}/api/log/tail/realtime?cursor=${tailCursor}&clientId=${clientId}${query ? `&${query}` : ""}`
    );

    if (!res.ok) {
      const error = await res.json();
      appendMessage(`\n[ERRO ${res.status}] ${error.error || "Erro desconhecido"}\n`);
      setStatus("Erro no tail", "danger");
      return;
    }

    const data = await res.json();

    tailCursor = data.cursor;
    if (Array.isArray(data.chunks)) {
      data.chunks.forEach(chunk => appendMessage(chunk));
      return;
    }

    if (Array.isArray(data.lines)) {
      data.lines.forEach(line => appendMessage(line + "\n"));
    }
  } catch (err) {
    appendMessage(`\n[ERRO] ${err.message}\n`);
    setStatus("Erro na conexão", "danger");
    stopTail();
  }
}
function setFsBrowseFeedback(message, tone = "info") {
  if (!fsBrowseFeedback) return;
  fsBrowseFeedback.textContent = message || "";
  fsBrowseFeedback.dataset.tone = tone;
  fsBrowseFeedback.classList.toggle("hidden", !message);
}

function formatBytes(bytes) {
  if (bytes === null || bytes === undefined) return "";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = -1;
  do {
    value /= 1024;
    unitIndex += 1;
  } while (value >= 1024 && unitIndex < units.length - 1);
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function joinRemotePath(basePath, name) {
  const separator = basePath.includes("\\") && !basePath.includes("/") ? "\\" : "/";
  return basePath.endsWith(separator) ? `${basePath}${name}` : `${basePath}${separator}${name}`;
}

function parentRemotePath(currentPath) {
  const separator = currentPath.includes("\\") && !currentPath.includes("/") ? "\\" : "/";
  const trimmed = currentPath.replace(/[\\/]+$/, "");
  const idx = trimmed.lastIndexOf(separator);
  if (idx <= 0) return trimmed.slice(0, idx + 1) || trimmed;
  return trimmed.slice(0, idx);
}

function remoteFileHasChanges() {
  return currentRemoteFile && fsEditorContent?.value !== currentRemoteFile.content;
}

function closeRemoteFileEditor(force = false) {
  if (!force && remoteFileHasChanges() && !window.confirm("Descartar as alterações não salvas?")) return false;
  currentRemoteFile = null;
  fsEditor?.classList.add("hidden");
  if (fsEditorContent) fsEditorContent.value = "";
  if (fsEditorPath) fsEditorPath.textContent = "";
  return true;
}

async function openRemoteFile(filePath) {
  const source = execAgentSource?.value;
  if (!source) return setFsBrowseFeedback("Selecione um agente remoto.", "danger");
  if (!closeRemoteFileEditor()) return;

  setFsBrowseFeedback(`Abrindo "${filePath}"...`, "info");
  try {
    const query = new URLSearchParams({ path: filePath });
    const response = await remoteOperationsFetch(`${SERVER_URL}/api/agent-fs/${encodeURIComponent(source)}/file?${query}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Falha ao abrir arquivo.");
    currentRemoteFile = { path: data.path, content: data.content };
    fsEditorPath.textContent = data.path;
    fsEditorContent.value = data.content;
    fsEditor?.classList.remove("hidden");
    setFsBrowseFeedback(`Arquivo aberto · ${formatBytes(data.size)} · UTF-8`, "ok");
  } catch (err) {
    setFsBrowseFeedback(err.message, "danger");
  }
}

async function saveRemoteFile() {
  if (!currentRemoteFile) return;
  const source = execAgentSource?.value;
  if (!source) return setFsBrowseFeedback("Selecione um agente remoto.", "danger");

  fsEditorSaveBtn.disabled = true;
  setFsBrowseFeedback(`Salvando "${currentRemoteFile.path}"...`, "info");
  try {
    const response = await remoteOperationsFetch(`${SERVER_URL}/api/agent-fs/${encodeURIComponent(source)}/file`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: currentRemoteFile.path, content: fsEditorContent.value })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Falha ao salvar arquivo.");
    currentRemoteFile.content = fsEditorContent.value;
    setFsBrowseFeedback(`Arquivo salvo · ${formatBytes(data.size)}`, "ok");
  } catch (err) {
    setFsBrowseFeedback(err.message, "danger");
  } finally {
    fsEditorSaveBtn.disabled = false;
  }
}

async function browseAgentFolder(targetPath) {
  const source = execAgentSource?.value;
  if (!source) return setFsBrowseFeedback("Selecione um agente remoto.", "danger");
  if (currentRemoteFile && !closeRemoteFileEditor()) return;

  const path = (targetPath ?? fsBrowsePath?.value ?? "").trim();
  if (!path) return setFsBrowseFeedback("Informe o caminho da pasta.", "danger");

  fsBrowseBtn.disabled = true;
  setFsBrowseFeedback(`Consultando "${path}"...`, "info");
  if (fsBrowseList) fsBrowseList.innerHTML = "";

  try {
    const query = new URLSearchParams({ path });
    const res = await remoteOperationsFetch(`${SERVER_URL}/api/agent-fs/${encodeURIComponent(source)}?${query.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Falha ao listar a pasta.");

    if (fsBrowsePath) fsBrowsePath.value = data.path || path;
    setFsBrowseFeedback(`${data.entries?.length ?? 0} item(ns) em ${data.path || path}`, "ok");
    renderFsEntries(data.path || path, data.entries || []);
  } catch (err) {
    setFsBrowseFeedback(err.message, "danger");
  } finally {
    fsBrowseBtn.disabled = false;
  }
}

function renderFsEntries(currentPath, entries) {
  if (!fsBrowseList) return;
  fsBrowseList.innerHTML = "";

  if (!entries.length) {
    fsBrowseList.innerHTML = '<div class="fs-browse-empty">Pasta vazia.</div>';
    return;
  }

  entries.forEach(entry => {
    const row = document.createElement("div");
    row.className = "fs-browse-row";

    const icon = entry.isDirectory ? "📁" : "📄";
    const meta = entry.isDirectory ? "" : formatBytes(entry.size);

    row.innerHTML = `
      <span class="fs-browse-icon">${icon}</span>
      <span class="fs-browse-name">${escapeHtml(entry.name)}</span>
      <span class="fs-browse-meta">${escapeHtml(meta)}</span>
    `;

    if (entry.isDirectory) {
      row.classList.add("fs-browse-row-dir");
      row.addEventListener("click", () => browseAgentFolder(joinRemotePath(currentPath, entry.name)));
    } else {
      row.classList.add("fs-browse-row-file");
      row.title = "Abrir arquivo de texto";
      row.addEventListener("click", () => openRemoteFile(joinRemotePath(currentPath, entry.name)));
    }

    fsBrowseList.appendChild(row);
  });
}

fsBrowseForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  browseAgentFolder();
});

fsBrowseUpBtn?.addEventListener("click", () => {
  const current = fsBrowsePath?.value.trim();
  if (!current) return setFsBrowseFeedback("Informe o caminho da pasta.", "danger");
  browseAgentFolder(parentRemotePath(current));
});

fsEditorSaveBtn?.addEventListener("click", saveRemoteFile);
fsEditorCancelBtn?.addEventListener("click", () => closeRemoteFileEditor());
execAgentSource?.addEventListener("change", () => closeRemoteFileEditor(true));


async function fetchCargaTabelasStatus() {
  if (!cargaTabelasStatus || !cargaTabelasOutput) return;

  const statusRequestId = ++cargaTabelasStatusRequestId;
  const analysisRequestId = cargaTabelasRequestId;
  cargaTabelasStatus.textContent = "Consultando serviço...";

  try {
    const res = await fetch(`${SERVER_URL}/api/parsers/carga-tabelas`);
    if (statusRequestId !== cargaTabelasStatusRequestId || analysisRequestId !== cargaTabelasRequestId) return;

    if (!res.ok) {
      const errorText = await res.text();
      if (statusRequestId !== cargaTabelasStatusRequestId || analysisRequestId !== cargaTabelasRequestId) return;
      cargaTabelasStatus.textContent = "Indisponível";
      if (!cargaTabelasResult) renderRawOutput(`Falha ao consultar o parser: ${errorText}`);
      return;
    }

    const data = await res.json();
    if (statusRequestId !== cargaTabelasStatusRequestId || analysisRequestId !== cargaTabelasRequestId) return;
    cargaTabelasStatus.textContent = data.statusLabel || "Disponível";
  } catch (err) {
    if (statusRequestId !== cargaTabelasStatusRequestId || analysisRequestId !== cargaTabelasRequestId) return;
    cargaTabelasStatus.textContent = "Erro de conexão";
    if (!cargaTabelasResult) renderRawOutput(`Erro ao consultar status do parser: ${err.message}`);
  }
}

async function processCargaTabelas() {
  if (!cargaTabelasInput || !cargaTabelasTipo || !cargaTabelasOutput || !cargaTabelasStatus) return;

  const raw = cargaTabelasInput.value || "";
  resetCargaResult("Executando parser...");
  const requestId = cargaTabelasRequestId;
  if (!raw.trim()) {
    cargaTabelasStatus.textContent = "Entrada vazia";
    renderRawOutput("Informe a string posicional para processar.");
    return;
  }

  cargaTabelasStatus.textContent = "Processando...";

  try {
    const res = await fetch(`${SERVER_URL}/api/parsers/carga-tabelas/parse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mode: cargaTabelasTipo.value,
        input: raw
      })
    });

    const data = await res.json();
    if (requestId !== cargaTabelasRequestId) return;

    if (!res.ok) {
      cargaTabelasStatus.textContent = data.statusLabel || "Falha no parser";
      renderRawOutput(JSON.stringify(data, null, 2));
      renderWarnings(data);
      return;
    }

    cargaTabelasStatus.textContent = data.statusLabel || "Processado";
    cargaTabelasResult = data;
    renderParsedGroups(data);
  } catch (err) {
    if (requestId !== cargaTabelasRequestId) return;
    cargaTabelasStatus.textContent = "Erro de conexão";
    renderRawOutput(`Erro ao processar a string: ${err.message}`);
  }
}

function setIsoParserStatus(message, tone = "muted") {
  if (!isoParserStatus) return;
  isoParserStatus.textContent = message;
  isoParserStatus.dataset.tone = tone;
}

function renderIsoParserResults(result) {
  if (!isoParserResults) return;
  isoParserResults.replaceChildren();

  const summary = document.createElement("p");
  summary.className = "parser-description";
  summary.textContent = `Perfil: ${result.profile} · MTI: ${result.fields.MTI} · Campos interpretados: ${result.fieldCount}`;

  const formats = document.createElement("details");
  formats.className = "iso-message-formats";
  formats.open = true;
  const formatsSummary = document.createElement("summary");
  formatsSummary.textContent = "Mensagem nos dois formatos";
  formats.appendChild(formatsSummary);
  for (const [label, value] of [
    ["Texto de bytes usado no parse", result.messageFormats.ascii],
    ["Hexadecimal", result.messageFormats.hex]
  ]) {
    const field = document.createElement("label");
    field.className = "parser-field";
    const fieldLabel = document.createElement("span");
    fieldLabel.textContent = label;
    const textarea = document.createElement("textarea");
    textarea.readOnly = true;
    textarea.spellcheck = false;
    textarea.value = value;
    field.append(fieldLabel, textarea);
    formats.appendChild(field);
  }

  const table = document.createElement("table");
  table.className = "iso-fields-table";
  const head = document.createElement("thead");
  const headerRow = document.createElement("tr");
  for (const label of ["Campo", "Descrição", "Valor"]) {
    const header = document.createElement("th");
    header.scope = "col";
    header.textContent = label;
    headerRow.appendChild(header);
  }
  head.appendChild(headerRow);
  const body = document.createElement("tbody");
  for (const entry of result.entries) {
    const row = document.createElement("tr");
    for (const value of [entry.key, entry.name]) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    }
    const valueCell = document.createElement("td");
    valueCell.appendChild(document.createTextNode(entry.value));
    if (entry.key === "DE122") {
      const details = document.createElement("details");
      details.className = "iso-tlv-details";
      const toggle = document.createElement("summary");
      toggle.textContent = "Expandir parse TLV";
      details.appendChild(toggle);
      try {
        const tlvs = globalThis.ISO8583Parser.parseDe122Tlv(entry.value);
        if (!tlvs.length) {
          const empty = document.createElement("p");
          empty.className = "iso-tlv-message";
          empty.textContent = "DE122 está vazio; nenhum item TLV para exibir.";
          details.appendChild(empty);
        } else {
          const tlvTable = document.createElement("table");
          tlvTable.className = "iso-fields-table iso-tlv-table";
          const tlvHead = document.createElement("thead");
          const tlvHeaderRow = document.createElement("tr");
          for (const label of ["Tag", "Length", "Value"]) {
            const header = document.createElement("th");
            header.scope = "col";
            header.textContent = label;
            tlvHeaderRow.appendChild(header);
          }
          tlvHead.appendChild(tlvHeaderRow);
          const tlvBody = document.createElement("tbody");
          for (const tlv of tlvs) {
            const tlvRow = document.createElement("tr");
            for (const value of [tlv.tag, String(tlv.length), tlv.value]) {
              const cell = document.createElement("td");
              cell.textContent = value;
              tlvRow.appendChild(cell);
            }
            tlvBody.appendChild(tlvRow);
          }
          tlvTable.append(tlvHead, tlvBody);
          details.appendChild(tlvTable);
        }
      } catch (error) {
        const warning = document.createElement("p");
        warning.className = "iso-tlv-message iso-tlv-error";
        warning.textContent = `Não foi possível interpretar o TLV do DE122: ${error.message}`;
        details.appendChild(warning);
      }
      valueCell.appendChild(details);
    }
    row.appendChild(valueCell);
    body.appendChild(row);
  }
  table.append(head, body);
  isoParserResults.append(summary, formats, table);

  if (result.unparsed) {
    const trailing = document.createElement("p");
    trailing.className = "iso-unparsed";
    trailing.textContent = `${result.unparsed.length} caractere(s) após o último campo não foram interpretados: ${result.unparsed}`;
    isoParserResults.appendChild(trailing);
  }
}

function processIsoMessage() {
  if (!isoMessageInput || !isoParserProfile || !isoParserInputFormat || !isoPinBlockEncoding || !isoParserResults) return;
  isoParserResults.replaceChildren();

  try {
    if (!globalThis.ISO8583Parser?.parseIsoMessage || !globalThis.ISO8583Parser?.convertIsoMessageInput) {
      throw new Error("O módulo do parser ISO não foi carregado. Atualize a página e tente novamente.");
    }
    const messageFormats = globalThis.ISO8583Parser.convertIsoMessageInput(isoMessageInput.value, isoParserInputFormat.value);
    const result = globalThis.ISO8583Parser.parseIsoMessage(messageFormats.ascii, isoParserProfile.value, {
      pinBlockEncoding: isoPinBlockEncoding.value
    });
    result.messageFormats = messageFormats;
    renderIsoParserResults(result);
    setIsoParserStatus(`Mensagem processada com sucesso · ${result.profile}.`, "ok");
  } catch (error) {
    setIsoParserStatus(error.message || "Falha ao processar a mensagem ISO.", "danger");
    const message = document.createElement("p");
    message.className = "empty-state";
    message.textContent = "Não foi possível interpretar a mensagem.";
    isoParserResults.appendChild(message);
  }
}

parseIsoMessageBtn?.addEventListener("click", processIsoMessage);
isoParserInputFormat?.addEventListener("change", () => {
  if (!isoMessageInput) return;
  isoMessageInput.placeholder = isoParserInputFormat.value === "hex"
    ? "Cole a mensagem ISO em hexadecimal (ex.: 30323030...), com ou sem espaços entre os bytes."
    : "Cole aqui a mensagem ISO8583 completa, começando pelo MTI.";
});
clearIsoMessageBtn?.addEventListener("click", () => {
  if (isoMessageInput) isoMessageInput.value = "";
  isoParserResults?.replaceChildren();
  setIsoParserStatus("Aguardando mensagem ISO.");
});

const DEMAND_STATUS_LABELS = {
  backlog: "Backlog",
  todo: "A Fazer",
  doing: "Em andamento",
  blocked: "Bloqueado",
  done: "Concluído"
};
const DEMAND_PRIORITY_LABELS = { low: "Baixa", medium: "Média", high: "Alta", urgent: "Urgente" };

function setDemandFeedback(message, tone = "info") {
  if (!demandFeedback) return;
  demandFeedback.textContent = message || "";
  demandFeedback.dataset.tone = tone;
  demandFeedback.classList.toggle("hidden", !message);
}

async function fetchDemands() {
  if (!kanbanBoard) return;
  setDemandFeedback("");
  try {
    const res = await fetch(`${SERVER_URL}/api/demands`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Falha ao carregar demandas.");
    demands = Array.isArray(data.demands) ? data.demands : [];
    refreshDemandProjects();
    renderDemandBoard();
  } catch (err) {
    setDemandFeedback(err.message, "danger");
  }
}

function getDemandProjects() {
  return [...new Set(demands.map(item => String(item.project || "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function refreshDemandProjects() {
  const projects = getDemandProjects();
  const selected = demandProjectFilter?.value || "";
  if (demandProjectFilter) {
    demandProjectFilter.replaceChildren(new Option("Todos os projetos", ""));
    projects.forEach(project => demandProjectFilter.add(new Option(project, project)));
    demandProjectFilter.value = projects.includes(selected) ? selected : "";
  }
  if (demandProjectOptions) {
    demandProjectOptions.replaceChildren(...projects.map(project => {
      const option = document.createElement("option");
      option.value = project;
      return option;
    }));
  }
}

function getFilteredDemands() {
  const query = (demandSearch?.value || "").trim().toLocaleLowerCase("pt-BR");
  const priority = demandPriorityFilter?.value || "";
  const project = demandProjectFilter?.value || "";
  return demands.filter(demand => {
    if (priority && demand.priority !== priority) return false;
    if (project && demand.project !== project) return false;
    if (!query) return true;
    return [demand.title, demand.project, demand.description, demand.assignee, demand.category, ...(demand.tags || []), ...(demand.subtasks || []).map(item => item.title)]
      .some(value => String(value || "").toLocaleLowerCase("pt-BR").includes(query));
  });
}

function createDemandCard(demand) {
  const card = document.createElement("article");
  card.className = "demand-card";
  card.draggable = true;
  card.dataset.demandId = demand.id;
  card.tabIndex = 0;

  const priority = document.createElement("span");
  priority.className = `demand-priority ${demand.priority || "medium"}`;
  priority.textContent = DEMAND_PRIORITY_LABELS[demand.priority] || "Média";
  const title = document.createElement("h3");
  title.className = "demand-card-title";
  title.textContent = demand.title;
  card.append(priority, title);

  if (demand.project) {
    const project = document.createElement("span");
    project.className = "demand-project";
    project.textContent = `▣ ${demand.project}`;
    card.appendChild(project);
  }

  if (demand.description) {
    const description = document.createElement("p");
    description.className = "demand-card-description";
    description.textContent = demand.description;
    card.appendChild(description);
  }

  const meta = document.createElement("div");
  meta.className = "demand-card-meta";
  [demand.category, ...(demand.tags || [])].filter(Boolean).slice(0, 4).forEach(value => {
    const chip = document.createElement("span");
    chip.className = "demand-chip";
    chip.textContent = value;
    meta.appendChild(chip);
  });
  if (meta.childNodes.length) card.appendChild(meta);

  const subtasks = Array.isArray(demand.subtasks) ? demand.subtasks : [];
  if (subtasks.length) {
    const completed = subtasks.filter(item => item.completed).length;
    const progress = document.createElement("div");
    progress.className = "demand-subtask-progress";
    progress.innerHTML = `<span><i style="width:${Math.round((completed / subtasks.length) * 100)}%"></i></span><small>☑ ${completed}/${subtasks.length}</small>`;
    card.appendChild(progress);
  }

  const footer = document.createElement("div");
  footer.className = "demand-card-footer";
  const assignee = document.createElement("span");
  assignee.textContent = demand.assignee ? `● ${demand.assignee}` : "Sem responsável";
  const due = document.createElement("span");
  due.className = "demand-due";
  if (demand.dueDate) {
    const date = new Date(`${demand.dueDate}T00:00:00`);
    due.textContent = date.toLocaleDateString("pt-BR");
    if (demand.status !== "done" && demand.dueDate < new Date().toISOString().slice(0, 10)) due.classList.add("overdue");
  } else {
    due.textContent = "Sem prazo";
  }
  footer.append(assignee, due);
  card.appendChild(footer);

  card.addEventListener("click", () => openDemandDialog(demand));
  card.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openDemandDialog(demand); }
  });
  card.addEventListener("dragstart", event => {
    draggedDemandId = demand.id;
    card.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", demand.id);
  });
  card.addEventListener("dragend", () => {
    draggedDemandId = null;
    card.classList.remove("dragging");
    document.querySelectorAll(".kanban-list.drag-over").forEach(list => list.classList.remove("drag-over"));
  });
  return card;
}

function renderDemandBoard() {
  if (!kanbanBoard) return;
  const filtered = getFilteredDemands();
  Object.keys(DEMAND_STATUS_LABELS).forEach(status => {
    const list = kanbanBoard.querySelector(`[data-demand-list="${status}"]`);
    const column = kanbanBoard.querySelector(`[data-status="${status}"]`);
    if (!list || !column) return;
    list.replaceChildren();
    const items = filtered.filter(item => item.status === status).sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
    column.querySelector("header b").textContent = String(items.length);
    items.forEach(item => list.appendChild(createDemandCard(item)));
    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "kanban-empty";
      empty.textContent = "Nenhuma demanda";
      list.appendChild(empty);
    }
  });
  if (demandSummary) demandSummary.textContent = `${filtered.length} de ${demands.length} demanda${demands.length === 1 ? "" : "s"}`;
}

function openDemandDialog(demand = null) {
  if (!demandDialog || !demandForm) return;
  demandForm.reset();
  demandId.value = demand?.id || "";
  demandTitle.value = demand?.title || "";
  demandProject.value = demand?.project || "";
  demandDescription.value = demand?.description || "";
  demandAssignee.value = demand?.assignee || "";
  demandCategory.value = demand?.category || "";
  demandPriority.value = demand?.priority || "medium";
  demandDueDate.value = demand?.dueDate || "";
  demandStatus.value = demand?.status || "backlog";
  demandTags.value = (demand?.tags || []).join(", ");
  renderSubtasks(demand?.subtasks || []);
  demandDialogTitle.textContent = demand ? "Editar demanda" : "Nova demanda";
  deleteDemandBtn.classList.toggle("hidden", !demand);
  demandDialog.showModal();
  setTimeout(() => demandTitle.focus(), 0);
}

function updateSubtaskSummary() {
  if (!subtaskList || !subtaskSummary) return;
  const rows = [...subtaskList.querySelectorAll(".subtask-row")];
  const completed = rows.filter(row => row.querySelector('input[type="checkbox"]')?.checked).length;
  subtaskSummary.textContent = `${completed} de ${rows.length} concluída${completed === 1 ? "" : "s"}`;
}

function addSubtaskRow(subtask = {}) {
  if (!subtaskList) return;
  const row = document.createElement("div");
  row.className = "subtask-row";
  row.dataset.subtaskId = subtask.id || (crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`);
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = Boolean(subtask.completed);
  checkbox.setAttribute("aria-label", "Marcar subtarefa como concluída");
  const input = document.createElement("input");
  input.type = "text";
  input.maxLength = 180;
  input.placeholder = "Descreva a subtarefa";
  input.value = subtask.title || "";
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "ghost icon-button subtask-remove";
  remove.setAttribute("aria-label", "Remover subtarefa");
  remove.textContent = "✕";
  checkbox.addEventListener("change", updateSubtaskSummary);
  remove.addEventListener("click", () => { row.remove(); updateSubtaskSummary(); });
  row.append(checkbox, input, remove);
  subtaskList.appendChild(row);
  updateSubtaskSummary();
  return input;
}

function renderSubtasks(subtasks = []) {
  if (!subtaskList) return;
  subtaskList.replaceChildren();
  subtasks.forEach(addSubtaskRow);
  updateSubtaskSummary();
}

function readSubtasks() {
  if (!subtaskList) return [];
  return [...subtaskList.querySelectorAll(".subtask-row")].map(row => ({
    id: row.dataset.subtaskId,
    title: row.querySelector('input[type="text"]')?.value.trim() || "",
    completed: Boolean(row.querySelector('input[type="checkbox"]')?.checked)
  })).filter(item => item.title);
}

function readDemandForm() {
  return {
    title: demandTitle.value.trim(),
    project: demandProject.value.trim(),
    description: demandDescription.value.trim(),
    assignee: demandAssignee.value.trim(),
    category: demandCategory.value.trim(),
    priority: demandPriority.value,
    dueDate: demandDueDate.value,
    status: demandStatus.value,
    tags: demandTags.value.split(",").map(tag => tag.trim()).filter(Boolean),
    subtasks: readSubtasks()
  };
}

async function saveDemand(event) {
  event.preventDefault();
  try {
    const id = demandId.value;
    const res = await fetch(`${SERVER_URL}/api/demands${id ? `/${encodeURIComponent(id)}` : ""}`, {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(readDemandForm())
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Falha ao salvar demanda.");
    demandDialog.close();
    await fetchDemands();
    setDemandFeedback(id ? "Demanda atualizada." : "Demanda criada.", "ok");
  } catch (err) {
    setDemandFeedback(err.message, "danger");
  }
}

async function removeDemand() {
  const id = demandId.value;
  if (!id || !window.confirm("Excluir esta demanda permanentemente?")) return;
  const res = await fetch(`${SERVER_URL}/api/demands/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json();
    return setDemandFeedback(data.error || "Falha ao excluir demanda.", "danger");
  }
  demandDialog.close();
  await fetchDemands();
  setDemandFeedback("Demanda excluída.", "ok");
}

async function moveDemandCard(id, status, position) {
  const demand = demands.find(item => item.id === id);
  if (!demand) return;
  const previous = { status: demand.status, order: demand.order };
  demand.status = status;
  demand.order = position;
  renderDemandBoard();
  try {
    const res = await fetch(`${SERVER_URL}/api/demands/${encodeURIComponent(id)}/move`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, position })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Falha ao mover demanda.");
    await fetchDemands();
  } catch (err) {
    demand.status = previous.status;
    demand.order = previous.order;
    renderDemandBoard();
    setDemandFeedback(err.message, "danger");
  }
}

function stopTail() {
  isTailing = false;

  if (tailInterval) {
    clearInterval(tailInterval);
    tailInterval = null;
  }

  if (socket) {
    socket.off("log:new-line", onSocketLine);
    socket.off("log:error", onSocketError);
    socket.emit("log:unwatch");
  }

  tailBtn.style.display = "inline-block";
  stopBtn.style.display = "none";
  setStatus("Pronto", "muted");
}

reloadBtn.addEventListener("click", loadFullLog);
tailBtn.addEventListener("click", startTail);
stopBtn.addEventListener("click", stopTail);
exportBtn.addEventListener("click", exportTail);
refreshCargaTabelasStatusBtn?.addEventListener("click", fetchCargaTabelasStatus);
processCargaTabelasBtn?.addEventListener("click", processCargaTabelas);
cargaTabelasInput?.addEventListener("input", updateCargaInput);
cargaTabelasTipo?.addEventListener("change", () => {
  resetCargaResult("O formato foi alterado. Processe a carga para atualizar a análise.");
  if (cargaTabelasStatus) cargaTabelasStatus.textContent = "Formato alterado";
});
clearCargaTabelasBtn?.addEventListener("click", () => {
  if (!cargaTabelasInput) return;
  cargaTabelasInput.value = "";
  updateCargaInput();
  renderRawOutput("Cole uma carga e selecione Processar carga para visualizar os resultados.");
  cargaTabelasInput.focus();
});
cargaTabelasSearch?.addEventListener("input", () => {
  if (cargaTabelasResult) renderParsedGroups(cargaTabelasResult);
});
cargaTabelasWarnings?.addEventListener("click", event => {
  const button = event.target.closest("button[data-carga-position]");
  if (!button || !cargaTabelasInput) return;
  const position = cargaRawPosition(cargaTabelasInput.value, Number(button.dataset.cargaPosition));
  if (position === null) {
    cargaTabelasStatus.textContent = "Não foi possível localizar a posição. Processe a carga novamente.";
    return;
  }
  cargaTabelasInput.focus();
  cargaTabelasInput.setSelectionRange(position, position + 1);
});
addConfigSourceBtn?.addEventListener("click", addConfigSource);
saveConfigBtn?.addEventListener("click", saveConfig);
reloadConfigBtn?.addEventListener("click", fetchConfig);
resetConfigBtn?.addEventListener("click", resetConfigForm);
uploadLicenseBtn?.addEventListener("click", uploadLicense);
uploadGenericFileBtn?.addEventListener("click", uploadGenericFile);
loadAgentConfigBtn?.addEventListener("click", loadRemoteAgentConfig);
saveAgentConfigBtn?.addEventListener("click", saveRemoteAgentConfig);
stageBinaryUpdateBtn?.addEventListener("click", stageBinaryUpdate);
applyBinaryUpdateBtn?.addEventListener("click", () => runBinaryUpdateAction("apply"));
rollbackBinaryUpdateBtn?.addEventListener("click", () => runBinaryUpdateAction("rollback"));
expandAllParsedGroupsBtn?.addEventListener("click", () => {
  if (!parsedRecordsContainer) return;
  parsedRecordsContainer.querySelectorAll("details.parsed-group").forEach(node => {
    node.open = true;
  });
});
collapseAllParsedGroupsBtn?.addEventListener("click", () => {
  if (!parsedRecordsContainer) return;
  parsedRecordsContainer.querySelectorAll("details.parsed-group").forEach(node => {
    node.open = false;
  });
});
moduleTabs.forEach(tab => {
  tab.addEventListener("click", () => switchView(tab.dataset.view));
  tab.addEventListener("keydown", event => {
    if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(event.key)) return;
    event.preventDefault();
    const direction = ['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1;
    const index = moduleTabs.indexOf(tab);
    const next = moduleTabs[(index + direction + moduleTabs.length) % moduleTabs.length];
    next.focus();
    switchView(next.dataset.view);
  });
});
document.querySelectorAll("[data-open-view]").forEach(button => {
  button.addEventListener("click", () => switchView(button.dataset.openView));
});
newDemandBtn?.addEventListener("click", () => openDemandDialog());
closeDemandDialog?.addEventListener("click", () => demandDialog?.close());
cancelDemand?.addEventListener("click", () => demandDialog?.close());
demandForm?.addEventListener("submit", saveDemand);
deleteDemandBtn?.addEventListener("click", removeDemand);
demandSearch?.addEventListener("input", renderDemandBoard);
demandPriorityFilter?.addEventListener("change", renderDemandBoard);
demandProjectFilter?.addEventListener("change", renderDemandBoard);
addSubtaskBtn?.addEventListener("click", () => addSubtaskRow()?.focus());
kanbanBoard?.querySelectorAll(".kanban-list").forEach(list => {
  list.addEventListener("dragover", event => {
    event.preventDefault();
    list.classList.add("drag-over");
    event.dataTransfer.dropEffect = "move";
  });
  list.addEventListener("dragleave", event => {
    if (!list.contains(event.relatedTarget)) list.classList.remove("drag-over");
  });
  list.addEventListener("drop", event => {
    event.preventDefault();
    list.classList.remove("drag-over");
    const id = draggedDemandId || event.dataTransfer.getData("text/plain");
    const targetCard = event.target.closest?.(".demand-card");
    const cards = Array.from(list.querySelectorAll(".demand-card")).filter(card => card.dataset.demandId !== id);
    const position = targetCard ? Math.max(0, cards.indexOf(targetCard)) : cards.length;
    if (id) moveDemandCard(id, list.dataset.demandList, position);
  });
});
logSearch?.addEventListener("input", () => scheduleLogRender(140));
logLevelFilter?.addEventListener("change", () => scheduleLogRender(0));
toggleLogWrap?.addEventListener("click", () => {
  const noWrap = logElement.classList.toggle("no-wrap");
  toggleLogWrap.setAttribute("aria-pressed", String(!noWrap));
  toggleLogWrap.textContent = noWrap ? "Sem quebra" : "Quebra de linha";
});
scrollLogBottom?.addEventListener("click", () => {
  logElement.scrollTop = logElement.scrollHeight;
});
logElement?.addEventListener("click", event => {
  const line = event.target.closest?.(".log-line");
  if (!line) return;
  logElement.querySelectorAll(".log-line.selected").forEach(item => item.classList.remove("selected"));
  line.classList.add("selected");
  selectedLogLine = line.dataset.line || line.textContent || "";
  if (copyLogLine) copyLogLine.disabled = !selectedLogLine;
});
copyLogLine?.addEventListener("click", async () => {
  if (!selectedLogLine) return;
  try {
    await navigator.clipboard.writeText(selectedLogLine);
    copyLogLine.textContent = "✓";
    setTimeout(() => { copyLogLine.textContent = "⧉"; }, 1200);
  } catch (_) {
    const input = document.createElement("textarea");
    input.value = selectedLogLine;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  }
});
decreaseLogFont?.addEventListener("click", () => {
  logFontSize = Math.max(10, logFontSize - 1);
  logElement.style.fontSize = `${logFontSize}px`;
});
increaseLogFont?.addEventListener("click", () => {
  logFontSize = Math.min(20, logFontSize + 1);
  logElement.style.fontSize = `${logFontSize}px`;
});
pauseLogDisplay?.addEventListener("click", () => {
  isLogDisplayPaused = !isLogDisplayPaused;
  pauseLogDisplay.setAttribute("aria-pressed", String(isLogDisplayPaused));
  pauseLogDisplay.textContent = isLogDisplayPaused ? "Retomar tela" : "Pausar tela";
  if (!isLogDisplayPaused) {
    applyLogFilters();
    if (autoScrollLog) logElement.scrollTop = logElement.scrollHeight;
  }
});
toggleAutoScroll?.addEventListener("click", () => {
  autoScrollLog = !autoScrollLog;
  toggleAutoScroll.setAttribute("aria-pressed", String(autoScrollLog));
  toggleAutoScroll.textContent = autoScrollLog ? "Auto-scroll" : "Auto-scroll off";
  if (autoScrollLog) logElement.scrollTop = logElement.scrollHeight;
});
maximizeLog?.addEventListener("click", async () => {
  try {
    if (document.fullscreenElement === logPanel) {
      await document.exitFullscreen();
    } else if (logPanel?.requestFullscreen) {
      await logPanel.requestFullscreen();
    } else {
      logPanel?.classList.toggle("log-maximized");
      syncLogMaximizeButton(logPanel?.classList.contains("log-maximized"));
    }
  } catch (_) {
    logPanel?.classList.toggle("log-maximized");
    syncLogMaximizeButton(logPanel?.classList.contains("log-maximized"));
  }
});
document.addEventListener("fullscreenchange", () => {
  syncLogMaximizeButton(document.fullscreenElement === logPanel);
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && logPanel?.classList.contains("log-maximized")) {
    logPanel.classList.remove("log-maximized");
    syncLogMaximizeButton(false);
  }
});

function syncLogMaximizeButton(maximized) {
  if (!maximizeLog) return;
  maximizeLog.textContent = maximized ? "✕" : "⛶";
  maximizeLog.setAttribute("aria-label", maximized ? "Restaurar caixa de leitura" : "Maximizar caixa de leitura");
  maximizeLog.title = maximized ? "Restaurar caixa de leitura" : "Maximizar caixa de leitura";
}
logElement?.addEventListener("wheel", event => {
  if (!logElement.classList.contains("no-wrap") || !event.shiftKey || !event.deltaY) return;
  event.preventDefault();
  logElement.scrollLeft += event.deltaY;
}, { passive: false });

systemSelect?.addEventListener("change", () => {
  syncSelectedLogToConfigField();
  clearLogDisplay();

  if (activeView !== "log-reader") {
    return;
  }

  if (isTailing) {
    stopTail();
  }
});

async function initializeApp() {
  await Promise.all([fetchRuntimeInfo(), fetchLogSources()]);
  switchView(activeView);
}

initializeApp();

function exportTail() {
  try {
    const text = logRawText || logElement.textContent || "";
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const sourceName = createFileSafeName(getSelectedLogLabel());
    a.href = url;
    a.download = `${sourceName}-log-tail-${stamp}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    appendMessage(`\n[ERRO] Falha ao exportar: ${err.message}\n`);
    setStatus("Falha ao exportar", "danger");
  }
}
