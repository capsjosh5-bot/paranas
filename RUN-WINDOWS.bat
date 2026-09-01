@echo off
setlocal
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js / npm was not found.
  echo Install Node.js LTS from https://nodejs.org then run this file again.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing project dependencies...
  call npm install
  if errorlevel 1 (
    echo Dependency installation failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)
echo Starting Paranas LGU Scholarship Portal...
call npm run dev
endlocal
