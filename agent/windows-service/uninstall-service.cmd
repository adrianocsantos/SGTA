@echo off
setlocal
cd /d "%~dp0"
if not exist "SGTAAgentService.exe" (
  echo ERRO: SGTAAgentService.exe nao encontrado nesta pasta.
  exit /b 1
)
"SGTAAgentService.exe" stop
"SGTAAgentService.exe" uninstall
if errorlevel 1 exit /b %errorlevel%
echo SGTA Agent removido do Service Control Manager.
endlocal
