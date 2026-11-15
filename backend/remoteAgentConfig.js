import { getConfig } from "./configManager.js";

const TIMEOUT_MS = 10_000;

async function getRemoteSource(sourceKey) {
  const config = await getConfig();
  const source = config.LOG_SOURCES?.[sourceKey];
  const isRemote = source && (source.type === "remote-http" || !!source.URL);
  if (!isRemote || !source.URL) {
    throw new Error("Fonte remota não encontrada na configuração central.");
  }
  return source;
}

async function requestAgentConfig(sourceKey, method, body) {
  const source = await getRemoteSource(sourceKey);
  const url = new URL("api/config", source.URL.endsWith("/") ? source.URL : `${source.URL}/`);
  const response = await fetch(url, {
    method,
    headers: {
      ...(source.TOKEN ? { "x-sgta-token": source.TOKEN } : {}),
      ...(body ? { "content-type": "application/json" } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Agente respondeu HTTP ${response.status}`);
  return data;
}

export function readRemoteAgentConfig(sourceKey) {
  return requestAgentConfig(sourceKey, "GET");
}

export function saveRemoteAgentConfig(sourceKey, config) {
  return requestAgentConfig(sourceKey, "PUT", config);
}
