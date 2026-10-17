@echo off
setlocal
cd /d "%~dp0"
node --test tests\classic-retail-pawn-economy-063.test.cjs tests\classic-work-pawn.test.cjs tests\classic-discount-market.test.cjs tests\classic-economic-events.test.cjs
if errorlevel 1 exit /b 1
node tools\verify.mjs
exit /b %errorlevel%
