@echo off
set "ROOT=%~dp0"
echo CampusFix launcher - MongoDB Server must already be running.
start "CampusFix Backend" /D "%ROOT%server" cmd /k "npm install && npm start"
start "CampusFix Frontend" /D "%ROOT%client" cmd /k "npm install && npm run dev"
echo Two terminal windows have been opened. Wait for Vite to show its local URL, then open that URL in your browser.
pause
