@echo off
setlocal
cd /d "%~dp0"
if not exist "SGTAAgentService.exe" (
  echo ERRO: SGTAAgentService.exe nao encontrado nesta pasta.
  exit /b 1
)
if not exist "sgta-agent.exe" (
  echo ERRO: sgta-agent.exe nao encontrado nesta pasta.
  exit /b 1
)
if not exist "agent.config.js" (
  echo ERRO: agent.config.js nao encontrado nesta pasta.
  exit /b 1
)
if not exist "logs" mkdir "logs"
"SGTAAgentService.exe" install
if errorlevel 1 exit /b %errorlevel%
"SGTAAgentService.exe" start
if errorlevel 1 exit /b %errorlevel%
echo SGTA Agent instalado e iniciado com sucesso.
endlocal
