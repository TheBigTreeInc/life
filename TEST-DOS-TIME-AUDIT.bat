@echo off
setlocal
cd /d "%~dp0"
node --test tests\classic-dos-time-parity.test.cjs || exit /b 1
node tools\dos-time-audit.mjs || exit /b 1
endlocal
