@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1 || (echo Node.js is required. & exit /b 1)
node --test tests\classic-economic-migration.test.cjs tests\classic-pass2-source.test.cjs tests\classic-migration-career-survival.test.cjs tests\classic-jobs-rent.test.cjs
if errorlevel 1 exit /b 1
echo.
echo Classic economic migration tests passed. Run TEST-LOCAL.bat for full verification.
