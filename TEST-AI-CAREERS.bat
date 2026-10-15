@echo off
setlocal
pushd "%~dp0"
where node >nul 2>nul || (echo Install Node.js first. & popd & exit /b 1)
node --test tests/classic-ai-career-recovery.test.cjs tests/classic-migration-career-survival.test.cjs tests/classic-jobs-rent.test.cjs
set rc=%ERRORLEVEL%
popd
if not "%rc%"=="0" pause
exit /b %rc%
