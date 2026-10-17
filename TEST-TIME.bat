@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is required. & exit /b 1)
node --test tests\classic-original-timing.test.cjs tests\classic-route-clock.test.cjs tests\classic-clock-employment.test.cjs tests\classic-work-pawn.test.cjs tests\classic-dos-time-parity.test.cjs tests\classic-clock-source-matrix.test.cjs
exit /b %errorlevel%
