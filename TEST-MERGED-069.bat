@echo off
cd /d "%~dp0"
node --test tests/ziprunner-merge-069.test.cjs tests/language-campaign-066.test.cjs tests/classic-dos-consumables-064.test.cjs tests/goal-presets-068.test.cjs
if errorlevel 1 exit /b 1
node tools/verify.mjs
