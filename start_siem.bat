@echo off
title SIEM Master Launcher
echo ===================================================
echo     Starting Real-Time Threat Detection SIEM
echo ===================================================
echo.

echo [1/4] Starting Node.js Backend API...
start "SIEM Backend" cmd /k "cd backend && npm run dev"

echo [2/4] Starting React Frontend Dashboard...
start "SIEM Frontend" cmd /k "cd frontend && npm run dev"

echo [3/4] Starting Python ML Inference Engine...
start "SIEM ML Inference" cmd /k "cd ml_engine && .\venv\Scripts\activate && python inference.py"

echo [4/4] Starting Python Packet Sniffer...
start "SIEM Packet Sniffer" cmd /k "cd ml_engine && .\venv\Scripts\activate && python sniffer.py"

echo.
echo All 4 services have been successfully launched in separate windows!
echo You can monitor the logs for each service individually.
echo.
pause
