@echo off
setlocal
cd /d "%~dp0"
node --test tests/classic-dos-consumables-064.test.cjs
if errorlevel 1 exit /b 1
node tools/verify.mjs
exit /b %errorlevel%
