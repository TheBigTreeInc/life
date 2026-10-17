@echo off
cd /d "%~dp0"
node --test tests\goal-presets-068.test.cjs tests\campaign-preset-067.test.cjs tests\language-campaign-066.test.cjs tests\language-compat-064.test.cjs
if errorlevel 1 exit /b 1
echo ZipRunner language, campaign and goal-preset source contracts passed.
