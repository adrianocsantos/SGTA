const unavailableStreams = new Set();

function monitor(stream) {
  if (!stream?.on) return;
  stream.on("error", () => unavailableStreams.add(stream));
}

monitor(process.stdout);
monitor(process.stderr);

function stringify(value) {
  if (value instanceof Error) return value.stack || value.message || String(value);
  if (typeof value === "object" && value !== null) {
    try { return JSON.stringify(value); } catch (_) { return String(value); }
  }
  return String(value);
}

function write(level, origin, parts) {
  const timestamp = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour12: false
  });
  const message = parts.map(stringify).join(" ");
  const line = `[${timestamp}] [${level}] [${origin}] ${message}\n`;
  const stream = level === "ERROR" || level === "WARN" ? process.stderr : process.stdout;
  if (unavailableStreams.has(stream) || stream?.destroyed) return;
  try { stream.write(line); } catch (_) { unavailableStreams.add(stream); }
}

export function createAgentLogger(origin) {
  return {
    info: (...parts) => write("INFO", origin, parts),
    warn: (...parts) => write("WARN", origin, parts),
    error: (...parts) => write("ERROR", origin, parts)
  };
}
