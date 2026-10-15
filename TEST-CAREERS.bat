@echo off
setlocal
cd /d "%~dp0"
echo ==== THE LIFE LOOP - CLASSIC CAREER AND AI TESTS ====
where node >nul 2>nul
if errorlevel 1 (
 echo ERROR: Node.js 22 or later is required for tests.
 pause
 exit /b 1
)
node --test tests\classic-migration-career-survival.test.cjs tests\classic-jobs-rent.test.cjs tests\original-dos-route-jobs-ai.test.cjs
if errorlevel 1 (
 echo FAILED: Classic migration regression detected.
 pause
 exit /b 1
)
echo Career migration verified. Opening offline PLAY.html; no rebuild required.
start "" "%~dp0PLAY.html"
endlocal
