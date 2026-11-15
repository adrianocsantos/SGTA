import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const packageFile = path.join(rootDir, "package.json");
const lockFile = path.join(rootDir, "package-lock.json");
const versionFile = path.join(rootDir, "backend", "version.js");

const packageJson = JSON.parse(fs.readFileSync(packageFile, "utf-8"));
const versionMatch = String(packageJson.version || "").match(/^(\d+)\.(\d+)\.(\d+)$/);

if (!versionMatch) {
  throw new Error(`Versão inválida no package.json: ${packageJson.version}`);
}

const nextVersion = [
  Number(versionMatch[1]),
  Number(versionMatch[2]),
  Number(versionMatch[3]) + 1
].join(".");

packageJson.version = nextVersion;
fs.writeFileSync(packageFile, `${JSON.stringify(packageJson, null, 2)}\n`, "utf-8");

if (fs.existsSync(lockFile)) {
  const packageLock = JSON.parse(fs.readFileSync(lockFile, "utf-8"));
  packageLock.version = nextVersion;
  if (packageLock.packages?.[""]) {
    packageLock.packages[""].version = nextVersion;
  }
  fs.writeFileSync(lockFile, `${JSON.stringify(packageLock, null, 2)}\n`, "utf-8");
}

fs.writeFileSync(
  versionFile,
  `export const APP_VERSION = ${JSON.stringify(nextVersion)};\n`,
  "utf-8"
);

console.log(`Versão do build: ${nextVersion}`);
