@echo off
cd /d "%~dp0"
call npm run test:goals
if errorlevel 1 exit /b 1
start "" "%~dp0PLAY.html"
