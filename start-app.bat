@echo off
echo Starting Gym Admission Management System

:: 1. Start Backend in a new window
start "Backend Server" cmd /k "cd backend && node index.js"

:: 2. Start the Frontend in a new window
start "React App" cmd /k "npm run dev"

exit