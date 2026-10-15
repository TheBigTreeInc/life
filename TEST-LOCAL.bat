@echo off
setlocal
cd /d "%~dp0"
echo ==== THE LIFE LOOP - LOCAL RELEASE TEST ====
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js 22 or later is needed to build and run the regression tests.
  pause
  exit /b 1
)
node tools\verify.mjs
if errorlevel 1 (
  echo FAILED: The game was not opened. Review the error above.
  pause
  exit /b 1
)
echo.
echo Verified. Opening the fully offline game now.
start "" "%~dp0PLAY.html"
endlocal
