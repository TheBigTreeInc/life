@echo off
cd /d "%~dp0"
node --test tests/classic-maintenance-lifecycle.test.cjs
if errorlevel 1 exit /b 1
node tools/reconcile-workboard.mjs --check
