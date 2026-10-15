@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1 || (echo Node.js is required. & exit /b 1)
node --test tests\classic-pass2-source.test.cjs tests\classic-migration-career-survival.test.cjs tests\original-dos-route-jobs-ai.test.cjs
if errorlevel 1 exit /b 1
echo.
echo Pass-2 live-game tests passed. Python source reference checks are optional:
echo   py -3 -m unittest discover -s docs\reference\original-dos-pass2\tests -v
