@echo off
cd /d "%~dp0"
node --test tests/classic-happiness-weekend-parity.test.cjs tests/classic-relaxation-journey-skip.test.cjs tests/classic-weekly-source-order.test.cjs
if errorlevel 1 exit /b 1
start "" "PLAY.html"
