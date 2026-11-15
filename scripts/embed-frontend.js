import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { transformSync } from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const frontendDir = path.join(rootDir, "frontend");
const outputFile = path.join(rootDir, "backend", "frontendEmbed.js");

function read(file) {
  const full = path.join(frontendDir, file);
  if (!fs.existsSync(full)) {
    throw new Error(`Arquivo não encontrado: ${full}`);
  }
  return fs.readFileSync(full, "utf8");
}

function readDependency(...parts) {
  const full = path.join(rootDir, "node_modules", ...parts);
  if (!fs.existsSync(full)) throw new Error(`Dependência não encontrada: ${full}`);
  return fs.readFileSync(full, "utf8");
}

function minifyCss(css) {
  return css
    .replace(/\/\*[^*]*\*+([^/*][^*]*\*+)*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,])\s*/g, "$1")
    .trim();
}

function minifyJs(js) {
  return transformSync(js, {
    loader: "js",
    minify: true,
    target: "es2019"
  }).code.trim();
}

function minifyInlineModule(js) {
  return transformSync(js, {
    loader: "js",
    format: "iife",
    minify: true,
    target: "es2019"
  }).code.trim();
}

function minifyHtml(html) {
  return html.replace(/>\s+</g, "><").replace(/\s+/g, " ").trim();
}

function inlineAssets(html, css, js, xtermCss, xtermJs, socketIoJs, isoParserJs) {
  let out = html;
  // Usar callbacks evita que sequências legítimas das dependências, como
  // `$&`, `$\`` e `$'`, sejam interpretadas como padrões de substituição.
  out = out.replace(/<link[^>]*href=["']style.css["'][^>]*>/i, () => `<style>${css}</style>`);
  out = out.replace(/<link[^>]*href=["']xterm.css["'][^>]*>/i, () => `<style>${xtermCss}</style>`);
  out = out.replace(/<script\s+src=["']socket\.io\.js["']><\/script>/i, () => `<script>${socketIoJs}</script>`);
  out = out.replace(/<script\s+src=["']xterm.js["']><\/script>/i, () => `<script>${xtermJs}</script>`);
  out = out.replace(/<script\s+src=["']app.js["']><\/script>/i, () => `<script>${js}</script>`);
  out = out.replace(/<script\s+type=["']module["']\s+src=["']iso-parser\.js["']><\/script>/i, () => `<script>${isoParserJs}</script>`);
  return out;
}

function build() {
  const rawHtml = read("index.html");
  const css = minifyCss(read("style.css"));
  const js = minifyJs(read("app.js"));
  const xtermCss = minifyCss(readDependency("@xterm", "xterm", "css", "xterm.css"));
  const xtermJs = readDependency("@xterm", "xterm", "lib", "xterm.js");
  const socketIoJs = readDependency("socket.io-client", "dist", "socket.io.js");
  const isoParserJs = minifyInlineModule(read("iso-parser.js"));

  const htmlShell = minifyHtml(rawHtml);
  const html = inlineAssets(htmlShell, css, js, xtermCss, xtermJs, socketIoJs, isoParserJs);

  const banner = "// Gerado automaticamente por scripts/embed-frontend.js. Não editar manualmente.\n";
  const content = `${banner}export const FRONTEND_HTML = ${JSON.stringify(html)};\n`;

  fs.writeFileSync(outputFile, content, "utf8");
  console.log(`✓ Frontend embutido em ${path.relative(rootDir, outputFile)}`);
}

build();
