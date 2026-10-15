@echo off
cd /d "%~dp0"
node --test tests\classic-relaxation-journey-skip.test.cjs tests\classic-journey-entry.test.cjs
if errorlevel 1 (echo Classic relaxation and journey checks FAILED & exit /b 1)
echo Classic relaxation and journey checks passed.
