@echo off
cd /d "%~dp0"
node --test tests/mobile-experience-072.test.cjs tests/mobile-end-week-073.test.cjs
if errorlevel 1 exit /b 1
node tools/verify.mjs
