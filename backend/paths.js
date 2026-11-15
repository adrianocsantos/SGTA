import path from "path";
import { fileURLToPath } from "url";

// Detecta se está rodando como executável gerado pelo pkg
const isPkg = typeof process !== "undefined" && process.pkg;

let APP_DIR;
if (isPkg) {
  // Quando empacotado com pkg, o executável está em process.execPath
  APP_DIR = path.dirname(process.execPath);
} else {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    // Ao executar em desenvolvimento, o backend fica em backend/
    // então o diretório da aplicação é um nível acima
    APP_DIR = path.resolve(__dirname, "..");
  } catch (err) {
    // Fallback: use o cwd atual
    APP_DIR = process.cwd();
  }
}

export function getAppDir() {
  return APP_DIR;
}

export function resolvePath(relativePath) {
  const pathValue = String(relativePath || "");
  // Preserva caminhos absolutos Windows mesmo quando o serviço roda em Linux/macOS.
  if (/^[a-zA-Z]:[\\/]/.test(pathValue) || /^\\\\/.test(pathValue)) {
    return pathValue;
  }

  // Se o caminho é absoluto, usa direto
  if (path.isAbsolute(pathValue)) {
    return pathValue;
  }
  // Caso contrário, resolve relativo ao APP_DIR
  return path.resolve(APP_DIR, pathValue);
}

export const LOGS_DIR = resolvePath("logs");
export const CONFIG_PATH = resolvePath("configLogs.js");
