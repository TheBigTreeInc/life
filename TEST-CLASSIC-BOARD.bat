@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js 20+ required. & exit /b 1)
node --test tests/classic-board-weekly.test.cjs
if errorlevel 1 exit /b %errorlevel%
echo Classic board and weekly event tests passed.
