@echo off
cd /d "%~dp0"
node --test tests/classic-household-entrance.test.cjs
if errorlevel 1 exit /b 1
