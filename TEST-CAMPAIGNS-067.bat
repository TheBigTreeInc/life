@echo off
cd /d "%~dp0"
node --test tests\campaign-preset-067.test.cjs tests\language-campaign-066.test.cjs tests\language-compat-064.test.cjs
if errorlevel 1 exit /b 1
echo Campaign and language source checks passed.
