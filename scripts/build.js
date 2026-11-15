import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const backendDir = path.join(rootDir, 'backend');
const agentDir = path.join(rootDir, 'agent');
const distAgentDir = path.join(distDir, 'agent');
const prepareOnly = process.argv.includes('--prepare-only');

if (!prepareOnly) {
  const bump = spawnSync(process.execPath, [path.join(__dirname, 'bump-version.js')], {
    cwd: rootDir,
    stdio: 'inherit'
  });
  if (bump.error) {
    console.error('✗ Erro ao incrementar a versão:', bump.error.message);
    process.exit(1);
  }
  if (bump.status !== 0) process.exit(bump.status || 1);

  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const build = spawnSync(npmCommand, ['run', 'build:no-bump'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
  if (build.error) {
    console.error('✗ Erro ao executar o pipeline de build:', build.error.message);
    process.exit(1);
  }
  process.exit(build.status ?? 1);
}

console.log('📦 Preparando build...\n');

// Criar pasta dist se não existir
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log('✓ Criada pasta: dist/');
}

// Copiar configLogs.js
const configSource = path.join(backendDir, 'configLogs.js');
const configDest = path.join(distDir, 'configLogs.js');

try {
  fs.copyFileSync(configSource, configDest);
  console.log('✓ Copiado: configLogs.js');
} catch (err) {
  console.error('✗ Erro ao copiar configLogs.js:', err.message);
  process.exit(1);
}

// Criar pasta logs se não existir
const logsDir = path.join(distDir, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('✓ Criada pasta: logs/');
}

// Criar .gitkeep para manter a pasta logs
const gitkeepPath = path.join(logsDir, '.gitkeep');
if (!fs.existsSync(gitkeepPath)) {
  fs.writeFileSync(gitkeepPath, '');
}

// Preparar pacote do agente
if (!fs.existsSync(distAgentDir)) {
  fs.mkdirSync(distAgentDir, { recursive: true });
  console.log('✓ Criada pasta: dist/agent/');
}

const agentConfigSource = path.join(agentDir, 'agent.config.js');
const agentConfigDest = path.join(distAgentDir, 'agent.config.js');
try {
  fs.copyFileSync(agentConfigSource, agentConfigDest);
  console.log('✓ Copiado: agent/agent.config.js -> dist/agent/agent.config.js');
} catch (err) {
  console.error('✗ Erro ao copiar agent.config.js:', err.message);
  process.exit(1);
}

const agentDocSource = path.join(rootDir, 'AGENTE_SGTA.md');
const agentDocDest = path.join(distAgentDir, 'README_AGENT.md');
if (fs.existsSync(agentDocSource)) {
  fs.copyFileSync(agentDocSource, agentDocDest);
  console.log('✓ Copiado: AGENTE_SGTA.md -> dist/agent/README_AGENT.md');
}

const windowsServiceDir = path.join(agentDir, 'windows-service');
for (const fileName of [
  'SGTAAgentService.exe',
  'SGTAAgentService.xml',
  'install-service.cmd',
  'uninstall-service.cmd',
  'restart-service.cmd'
]) {
  const source = path.join(windowsServiceDir, fileName);
  const destination = path.join(distAgentDir, fileName);
  if (!fs.existsSync(source)) {
    console.error(`✗ Arquivo de serviço Windows ausente: ${fileName}`);
    process.exit(1);
  }
  fs.copyFileSync(source, destination);
}
console.log('✓ Copiados arquivos de integração com o Windows Service Control Manager');

console.log('\n✅ Build preparado em: ' + distDir);
console.log('\nArquivos gerados:');
// Normalize binaries: move generated files if not already named
try {
  const winSrc = path.join(rootDir, 'sgta-win.exe');
  const linuxSrc = path.join(rootDir, 'sgta-linux');
  const winDest = path.join(distDir, 'sgta.exe');
  const linuxDest = path.join(distDir, 'sgta');

  if (fs.existsSync(winSrc)) {
    fs.renameSync(winSrc, winDest);
    console.log('✓ Movido: sgta-win.exe -> dist/sgta.exe');
  }

  if (fs.existsSync(linuxSrc)) {
    fs.renameSync(linuxSrc, linuxDest);
    fs.chmodSync(linuxDest, 0o755);
    console.log('✓ Movido: sgta-linux -> dist/sgta');
  }

  // pkg may also output files named server-bundle-* inside dist; normalize them
  const serverWin = path.join(distDir, 'server-bundle-win.exe');
  const serverLinux = path.join(distDir, 'server-bundle-linux');
  if (fs.existsSync(serverWin)) fs.renameSync(serverWin, path.join(distDir, 'sgta.exe'));
  if (fs.existsSync(serverLinux)) {
    const dest = path.join(distDir, 'sgta');
    fs.renameSync(serverLinux, dest);
    fs.chmodSync(dest, 0o755);
  }

  const agentWin = path.join(distAgentDir, 'agent-bundle-win.exe');
  const agentLinux = path.join(distAgentDir, 'agent-bundle-linux');
  if (fs.existsSync(agentWin)) {
    fs.renameSync(agentWin, path.join(distAgentDir, 'sgta-agent.exe'));
    console.log('✓ Normalizado: dist/agent/sgta-agent.exe');
  }
  if (fs.existsSync(agentLinux)) {
    const dest = path.join(distAgentDir, 'sgta-agent');
    fs.renameSync(agentLinux, dest);
    fs.chmodSync(dest, 0o755);
    console.log('✓ Normalizado: dist/agent/sgta-agent');
  }
} catch (err) {
  console.warn('Aviso ao normalizar binários:', err.message);
}

console.log('  📦 sgta.exe (Windows)');
console.log('  📦 sgta (Linux)');
console.log('  ⚙️  configLogs.js (editável)');
console.log('  📁 logs/ (para armazenar logs)');
console.log('  📁 agent/');
console.log('     📦 sgta-agent.exe (Windows)');
console.log('     📦 sgta-agent (Linux)');
console.log('     ⚙️  agent.config.js (editável)');
console.log('     🪟 install-service.cmd (instalação no Windows Service Control Manager)');
