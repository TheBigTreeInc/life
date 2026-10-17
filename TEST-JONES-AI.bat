@echo off
setlocal
pushd "%~dp0"
where node >nul 2>nul || (echo Node.js 22+ is required. & popd & exit /b 1)
node --test tests/classic-jones-source-062.test.cjs tests/classic-ai-career-recovery.test.cjs tests/classic-migration-career-survival.test.cjs tests/classic-pass2-source.test.cjs
set rc=%ERRORLEVEL%
popd
exit /b %rc%
