@echo off
setlocal
cd /d "%~dp0"
node --test tests\classic-journey-entry.test.cjs tests\classic-board-weekly.test.cjs tests\route-graph.test.cjs tests\route-browser-wiring.test.cjs
exit /b %errorlevel%
