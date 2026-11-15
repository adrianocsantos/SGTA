import { getConfig } from "./configManager.js";
import { io as connectSocket } from "socket.io-client";

const TIMEOUT_MS = 35_000;

async function getRemoteSource(sourceKey) {
  const config = await getConfig();
  const source = config.LOG_SOURCES?.[sourceKey];
  const isRemote = source && (source.type === "remote-http" || !!source.URL);
  if (!isRemote || !source.URL) {
    throw new Error("Fonte remota não encontrada na configuração central.");
  }
  return source;
}

export async function execOnRemoteAgent(sourceKey, command, cwd = "") {
  const source = await getRemoteSource(sourceKey);
  const url = new URL("api/exec", source.URL.endsWith("/") ? source.URL : `${source.URL}/`);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...(source.TOKEN ? { "x-sgta-token": source.TOKEN } : {}),
      "content-type": "application/json"
    },
    body: JSON.stringify({ command, cwd }),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Agente respondeu HTTP ${response.status}`);
  return data;
}

export async function callRemoteAgentBinaryUpdate(sourceKey, action, payload = {}) {
  const source = await getRemoteSource(sourceKey);
  const url = new URL(`api/binary-update/${action}`, source.URL.endsWith("/") ? source.URL : `${source.URL}/`);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...(source.TOKEN ? { "x-sgta-token": source.TOKEN } : {}),
      "content-type": "application/json"
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Agente respondeu HTTP ${response.status}`);
  return data;
}

export async function stageRemoteAgentBinaryUpdate(sourceKey, binary, label = "agent") {
  const source = await getRemoteSource(sourceKey);
  const baseUrl = source.URL.endsWith("/") ? source.URL : `${source.URL}/`;
  const url = new URL("api/binary-update/stage", baseUrl);
  url.searchParams.set("label", label);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...(source.TOKEN ? { "x-sgta-token": source.TOKEN } : {}),
      "content-type": "application/octet-stream"
    },
    body: binary,
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Agente respondeu HTTP ${response.status}`);
  return data;
}

export async function openRemoteTerminal(sourceKey) {
  const source = await getRemoteSource(sourceKey);
  return connectSocket(source.URL, {
    auth: { token: source.TOKEN || "" },
    transports: ["websocket"],
    autoConnect: false,
    reconnection: false,
    timeout: 10_000
  });
}
