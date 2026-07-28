@echo off
REM ============================================================================
REM EDEN launcher — starts a local HTTP server and opens Eden in the browser.
REM ============================================================================
REM Eden uses ES modules + an importmap (Phase 3), which require http://.
REM This script starts a tiny static server on port 8765 and opens the browser.
REM
REM Requirements: Python 3 (already installed) OR Node.js. The script tries
REM Python first, then Node, then falls back to opening the file directly
REM (which will warn that a server is needed).
REM ============================================================================

setlocal
cd /d "%~dp0"

set PORT=8765
set URL=http://localhost:%PORT%/

REM Kill anything already on PORT (ignore errors — likely nothing there).
REM Using netstat to find the PID listening on PORT.
for /f "tokens=5" %%a in ('netstat -ano -p tcp ^| findstr ":%PORT% " ^| findstr "LISTENING"') do (
  taskkill /F /PID %%a >nul 2>&1
)

REM Pick a server backend.
where python >nul 2>&1 && (
  start "" python -m http.server %PORT%
  goto :open
)
where py >nul 2>&1 && (
  start "" py -m http.server %PORT%
  goto :open
)
where npx >nul 2>&1 && (
  start "" npx --yes serve -l %PORT% .
  goto :open
)

echo [EDEN] Neither Python nor Node found. Opening file directly —
echo [EDEN] Three.js (Phase 3) will NOT work without a local server.
echo [EDEN] Install Python 3 or Node.js, or run:  python -m http.server %PORT%
start "" index.html
exit /b 0

:open
REM Give the server a moment to bind.
timeout /t 1 /nobreak >nul
start "" %URL%
endlocal
