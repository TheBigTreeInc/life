@echo off
setlocal
cd /d "%~dp0"
node --test tests\dutch-gameplay-070.test.cjs
if errorlevel 1 exit /b 1
node tools\verify.mjs
exit /b %errorlevel%
