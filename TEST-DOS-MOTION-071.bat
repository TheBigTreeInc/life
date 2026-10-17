@echo off
cd /d "%~dp0"
node --test tests/classic-dos-motion-071.test.cjs tests/classic-original-timing.test.cjs tests/classic-clock-source-matrix.test.cjs
if errorlevel 1 exit /b 1
node tools/dos-time-audit.mjs
