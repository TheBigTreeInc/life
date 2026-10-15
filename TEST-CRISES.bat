@echo off
setlocal
pushd "%~dp0"
where node >nul 2>nul || (echo Install Node.js to run tests. & pause & exit /b 1)
node --test tests/classic-economic-events.test.cjs tests/classic-economic-migration.test.cjs tests/classic-migration-career-survival.test.cjs
set rc=%ERRORLEVEL%
popd
if not "%rc%"=="0" pause
exit /b %rc%
