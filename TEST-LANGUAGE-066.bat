@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is required. & exit /b 1)
node --test tests\language-campaign-066.test.cjs tests\language-compat-064.test.cjs
if errorlevel 1 exit /b 1
node tools\verify.mjs
exit /b %ERRORLEVEL%
