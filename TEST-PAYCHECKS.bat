@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul || (echo ERROR: Node.js is required & exit /b 1)
node --test tests\classic-paycheck-audit.test.cjs tests\classic-work-warning-garnishment.test.cjs
exit /b %errorlevel%
