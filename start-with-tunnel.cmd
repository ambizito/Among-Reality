@echo off
setlocal
powershell -ExecutionPolicy Bypass -File "%~dp0start-with-tunnel.ps1"
set "exit_code=%errorlevel%"
if not "%exit_code%"=="0" (
  echo.
  echo O script de tunnel terminou com erro (%exit_code%).
  echo Pressione qualquer tecla para fechar...
  pause >nul
)
endlocal
exit /b %exit_code%
