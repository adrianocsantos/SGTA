import fs from "fs";
import crypto from "crypto";
import path from "path";
import { key, iv } from "../license/private.js";
import { logger } from "./logger.js";
import { getAppDir } from "./paths.js";

export const LICENSE_EXIT_CODE = 78;

// No executável, aceita exclusivamente license.lic ao lado do binário. Em
// desenvolvimento, mantém compatibilidade com a pasta license/ já existente.
const externalLicenseFile = path.join(getAppDir(), "license.lic");
const developmentLicenseFile = path.join(getAppDir(), "license", "license.lic");
const LICENSE_FILE = process.pkg || fs.existsSync(externalLicenseFile)
  ? externalLicenseFile
  : developmentLicenseFile;

export function getLicenseFilePath() {
  return LICENSE_FILE;
}

export function license() {
  try {
    const encryptedLicense = fs.readFileSync(LICENSE_FILE, "utf8").trim();
    const decryptedLicense = decryptData(
      encryptedLicense,
      key.toString().trim(),
      iv.toString().trim()
    );
    const expDateLicense = decryptedLicense.expirationDate;
    const validation = formatDate(new Date()) <= expDateLicense;

    return { validation, expDateLicense };
  } catch (error) {
    const detail = error?.message || String(error);
    logger.error(`Erro ao validar licença externa em ${LICENSE_FILE}: ${detail}`);
    const licenseError = new Error(`Não foi possível carregar a licença externa: ${LICENSE_FILE}`);
    licenseError.code = "LICENSE_UNAVAILABLE";
    throw licenseError;
  }
}

export function validateLicenseContent(content) {
  const encryptedLicense = Buffer.isBuffer(content)
    ? content.toString("utf8").trim()
    : String(content || "").trim();
  if (!encryptedLicense || !/^(?:[0-9a-f]{2})+$/i.test(encryptedLicense)) {
    throw new Error("Arquivo de licença inválido.");
  }

  let licenseData;
  try {
    licenseData = decryptData(
      encryptedLicense,
      key.toString().trim(),
      iv.toString().trim()
    );
  } catch {
    throw new Error("Arquivo inválido ou incompatível com a licença TBB deste servidor.");
  }

  const expirationDate = licenseData?.expirationDate;
  if (typeof expirationDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(expirationDate)) {
    throw new Error("A licença não contém uma data de expiração válida.");
  }
  const parsedDate = new Date(`${expirationDate}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== expirationDate) {
    throw new Error("A licença não contém uma data de expiração válida.");
  }
  if (formatDate(new Date()) > expirationDate) {
    throw new Error(`A licença enviada já está expirada (${expirationDate}).`);
  }

  return { encryptedLicense, expDateLicense: expirationDate };
}

export function updateLicenseFile(content) {
  const { encryptedLicense, expDateLicense } = validateLicenseContent(content);
  const temporaryFile = `${LICENSE_FILE}.${process.pid}.${crypto.randomUUID()}.tmp`;
  fs.mkdirSync(path.dirname(LICENSE_FILE), { recursive: true });

  try {
    fs.writeFileSync(temporaryFile, `${encryptedLicense}\n`, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600
    });
    fs.renameSync(temporaryFile, LICENSE_FILE);
  } catch (error) {
    try { fs.rmSync(temporaryFile, { force: true }); } catch {}
    throw new Error(`Não foi possível substituir o arquivo de licença: ${error.message}`);
  }

  return { validation: true, expDateLicense };
}

function decryptData(encryptedData, encryptionKey, encryptionIv) {
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(encryptionKey),
    Buffer.from(encryptionIv, "hex")
  );
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return JSON.parse(decrypted);
}

function formatDate(date) {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function checkLicense(dtSys, dtLicense) {
  if (dtSys > dtLicense) {
    logger.error("Licença expirada, contate o fornecedor.");
    console.log("Licença expirada, contate o fornecedor - AS Solutions.");
    process.exit(LICENSE_EXIT_CODE);
  }
}

export default { license, checkLicense, getLicenseFilePath };
