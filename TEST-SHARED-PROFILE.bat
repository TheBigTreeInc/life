@echo off
cd /d "%~dp0"
node --test tests\shared-profile-portrait.test.cjs
if errorlevel 1 exit /b 1
python tests\qa_shared_profile.py
