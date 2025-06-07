@echo off
echo Démarrage de StreamSelect...

REM Démarrer le backend
start cmd /k "cd backend && npm run dev"

REM Attendre que le backend démarre
timeout /t 5

REM Démarrer le frontend
start cmd /k "cd frontend && npm run dev"

echo Application démarrée !
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173 