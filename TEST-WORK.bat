@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is required. & exit /b 1)
node --test tests\classic-work-warning-garnishment.test.cjs tests\classic-original-timing.test.cjs tests\classic-work-pawn.test.cjs
exit /b %errorlevel%
