@echo off
echo Démarrage de l'application...

REM Vérifier si Node.js est installé
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js n'est pas installé ou n'est pas dans le PATH.
    echo Veuillez installer Node.js et réessayer.
    pause
    exit /b 1
)

REM Vérifier les fichiers .env
if not exist "backend\.env" (
    echo Le fichier backend\.env n'existe pas !
    echo Veuillez créer le fichier avec les variables d'environnement nécessaires.
    pause
    exit /b 1
)

if not exist "frontend\.env" (
    echo Le fichier frontend\.env n'existe pas !
    echo Veuillez créer le fichier avec les variables d'environnement nécessaires.
    pause
    exit /b 1
)

REM Démarrer le backend
echo Démarrage du backend...
start cmd /k "cd backend && npm run dev"

REM Attendre que le backend soit prêt
timeout /t 5 /nobreak

REM Démarrer le frontend
echo Démarrage du frontend...
start cmd /k "cd frontend && npm run dev"

echo Application démarrée !
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173 