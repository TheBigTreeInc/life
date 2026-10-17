@echo off
cd /d "%~dp0"
node --test tests/classic-obligations-source-061.test.cjs tests/classic-banking-food.test.cjs tests/classic-paycheck-audit.test.cjs
if errorlevel 1 exit /b 1
start "" "PLAY.html"
