@echo off
setlocal
powershell -ExecutionPolicy Bypass -File "%~dp0start-with-tunnel.ps1"
endlocal
