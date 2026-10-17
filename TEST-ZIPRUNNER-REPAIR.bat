@echo off
setlocal
pushd "%~dp0"
where node >nul 2>&1 || (echo Node.js was not found on PATH.& popd & exit /b 1)
node --test tests\language-compat-064.test.cjs
if errorlevel 1 (popd & exit /b 1)
node tools\verify.mjs
set "RESULT=%ERRORLEVEL%"
popd
exit /b %RESULT%
