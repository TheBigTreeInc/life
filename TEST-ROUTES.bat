@echo off
setlocal
cd /d "%~dp0"
echo ==== THE LIFE LOOP - QUICK ROUTE TEST ====
where node >nul 2>nul
if errorlevel 1 (
 echo ERROR: Node.js 22 or later is required for the route smoke tests.
 pause
 exit /b 1
)
node --test tests\route-graph.test.cjs tests\route-browser-wiring.test.cjs tests\classic-route-clock.test.cjs tests\original-dos-route-jobs-ai.test.cjs
if errorlevel 1 (
 echo FAILED: Route tests failed. Game not opened.
 pause
 exit /b 1
)
echo Routes verified. Opening bundled PLAY.html...
start "" "%~dp0PLAY.html"
endlocal
