@echo off
setlocal
cd /d "%~dp0"
"SGTAAgentService.exe" restart
exit /b %errorlevel%
