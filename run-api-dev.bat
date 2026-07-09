@echo off
cd /d "%~dp0"
set "PIDIOFORGE_API_PORT=8787"
set "PIDIOFORGE_DATA_DIR=%APPDATA%\Electron\backend-data"
"C:\Program Files\nodejs\node.exe" backend\server.mjs > api-bat.out.log 2> api-bat.err.log
