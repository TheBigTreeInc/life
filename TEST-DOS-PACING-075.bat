@echo off
cd /d "%~dp0"
node tools/dos-session-pacing-075.mjs
node --test tests/classic-session-pacing-075.test.cjs
pause
