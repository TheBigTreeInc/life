@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul || (echo ERROR: Node.js is required & exit /b 1)
node --test tests\classic-turn-sequence.test.cjs tests\classic-jobs-rent.test.cjs tests\classic-clock-employment.test.cjs
exit /b %errorlevel%
