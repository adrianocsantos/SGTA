import fs from "node:fs";
import path from "node:path";

export const MAX_UPLOAD_FILE_BYTES = 100 * 1024 * 1024;

export function validateUploadFileName(fileName) {
  const normalizedName = String(fileName || "").trim();
  if (
    !normalizedName
    || normalizedName === "."
    || normalizedName === ".."
    || /[\\/\x00-\x1f\x7f<>:"|?*]/.test(normalizedName)
    || /[. ]$/.test(normalizedName)
    || Buffer.byteLength(normalizedName, "utf8") > 255
    || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(normalizedName)
  ) {
    throw new Error("Nome de arquivo inválido.");
  }
  return normalizedName;
}

export function saveUploadedFile(uploadDirectory, fileName, content) {
  const normalizedName = validateUploadFileName(fileName);
  if (!Buffer.isBuffer(content) || content.length === 0) {
    throw new Error("O arquivo enviado está vazio.");
  }
  if (content.length > MAX_UPLOAD_FILE_BYTES) {
    throw new Error("O arquivo excede o limite de 100 MB.");
  }

  fs.mkdirSync(uploadDirectory, { recursive: true, mode: 0o700 });
  if (!fs.lstatSync(uploadDirectory).isDirectory()) {
    throw new Error("O destino de uploads não é uma pasta válida.");
  }

  const destinationPath = path.join(uploadDirectory, normalizedName);
  let descriptor;
  let created = false;
  try {
    descriptor = fs.openSync(destinationPath, "wx", 0o600);
    created = true;
    fs.writeFileSync(descriptor, content);
    fs.closeSync(descriptor);
    descriptor = undefined;
  } catch (error) {
    if (descriptor !== undefined) {
      try { fs.closeSync(descriptor); } catch {}
    }
    if (created) {
      try { fs.rmSync(destinationPath, { force: true }); } catch {}
    }
    if (error.code === "EEXIST") {
      throw new Error("Já existe um arquivo com esse nome na pasta uploads.");
    }
    throw new Error(`Não foi possível salvar o arquivo: ${error.message}`);
  }

  return { fileName: normalizedName, size: content.length };
}
