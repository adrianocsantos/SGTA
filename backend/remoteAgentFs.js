import { getConfig } from "./configManager.js";

const TIMEOUT_MS = 15_000;
const UPLOAD_TIMEOUT_MS = 120_000;

async function getRemoteSource(sourceKey) {
  const config = await getConfig();
  const source = config.LOG_SOURCES?.[sourceKey];
  const isRemote = source && (source.type === "remote-http" || !!source.URL);
  if (!isRemote || !source.URL) {
    throw new Error("Fonte remota não encontrada na configuração central.");
  }
  return source;
}

export async function listRemoteDirectory(sourceKey, dirPath) {
  const source = await getRemoteSource(sourceKey);
  const url = new URL("api/fs/list", source.URL.endsWith("/") ? source.URL : `${source.URL}/`);
  if (dirPath) url.searchParams.set("path", dirPath);
  const response = await fetch(url, {
    headers: {
      ...(source.TOKEN ? { "x-sgta-token": source.TOKEN } : {})
    },
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Agente respondeu HTTP ${response.status}`);
  return data;
}

export async function readRemoteFile(sourceKey, filePath) {
  const source = await getRemoteSource(sourceKey);
  const url = new URL("api/fs/file", source.URL.endsWith("/") ? source.URL : `${source.URL}/`);
  url.searchParams.set("path", filePath);
  const response = await fetch(url, {
    headers: { ...(source.TOKEN ? { "x-sgta-token": source.TOKEN } : {}) },
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Agente respondeu HTTP ${response.status}`);
  return data;
}

export async function writeRemoteFile(sourceKey, filePath, content) {
  const source = await getRemoteSource(sourceKey);
  const url = new URL("api/fs/file", source.URL.endsWith("/") ? source.URL : `${source.URL}/`);
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      ...(source.TOKEN ? { "x-sgta-token": source.TOKEN } : {}),
      "content-type": "application/json"
    },
    body: JSON.stringify({ path: filePath, content }),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Agente respondeu HTTP ${response.status}`);
  return data;
}

export async function uploadRemoteAgentFile(sourceKey, fileName, content) {
  const source = await getRemoteSource(sourceKey);
  const url = new URL("api/fs/upload", source.URL.endsWith("/") ? source.URL : `${source.URL}/`);
  url.searchParams.set("filename", fileName);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...(source.TOKEN ? { "x-sgta-token": source.TOKEN } : {}),
      "content-type": "application/octet-stream"
    },
    body: content,
    signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw Object.assign(
      new Error(data.error || `Agente respondeu HTTP ${response.status}`),
      { status: response.status }
    );
  }
  return data;
}
