@echo off
setlocal
cd /d "%~dp0"
echo Testing Looprd Social client and shared-profile adapter...
node --test tests\looprd-social-chat.test.cjs tests\shared-profile-portrait.test.cjs
if errorlevel 1 exit /b 1
echo Unit tests passed. To test the browser (Playwright/Chromium required):
python tests\qa_social_chat.py
exit /b %errorlevel%
