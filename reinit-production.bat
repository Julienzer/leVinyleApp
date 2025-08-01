@echo off
echo ==========================================
echo   RÉINITIALISATION BASE DE PRODUCTION
echo            Le Vinyle Database
echo ==========================================
echo.

REM Vérifier si PostgreSQL est installé
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL n'est pas installé ou n'est pas dans le PATH.
    echo    Veuillez installer PostgreSQL et réessayer.
    pause
    exit /b 1
)

echo 🔧 === RÉINITIALISATION POUR PRODUCTION ===
echo.
echo ⚠️  ATTENTION: Ce script va supprimer toutes les données existantes !
echo    Assurez-vous d'avoir fait une sauvegarde si nécessaire.
echo.
set /p confirm="Êtes-vous sûr de vouloir continuer ? (oui/non): "
if /i not "%confirm%"=="oui" (
    echo ❌ Opération annulée par l'utilisateur.
    pause
    exit /b 1
)

echo.
echo 📋 Configuration de la base de données:
echo    - Host: %DB_HOST%
echo    - Port: %DB_PORT%
echo    - Database: %DB_NAME%
echo    - User: %DB_USER%
echo.

REM Demander les informations de connexion si pas définies
if "%DB_HOST%"=="" (
    set /p DB_HOST="Host PostgreSQL (défaut: localhost): "
    if "%DB_HOST%"=="" set DB_HOST=localhost
)

if "%DB_PORT%"=="" (
    set /p DB_PORT="Port PostgreSQL (défaut: 5432): "
    if "%DB_PORT%"=="" set DB_PORT=5432
)

if "%DB_NAME%"=="" (
    set /p DB_NAME="Nom de la base de données: "
)

if "%DB_USER%"=="" (
    set /p DB_USER="Utilisateur PostgreSQL (défaut: postgres): "
    if "%DB_USER%"=="" set DB_USER=postgres
)

if "%DB_PASSWORD%"=="" (
    set /p DB_PASSWORD="Mot de passe PostgreSQL: "
)

echo.
echo 🔍 Test de connexion à la base de données...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT version();" >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Impossible de se connecter à la base de données.
    echo    Vérifiez les paramètres de connexion.
    pause
    exit /b 1
)

echo ✅ Connexion réussie
echo.

echo 🗑️  Suppression des anciennes tables et fonctions...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f backend/db/reinit-production.sql
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la réinitialisation
    pause
    exit /b 1
)

echo.
echo ✅ === RÉINITIALISATION TERMINÉE AVEC SUCCÈS ! ===
echo.
echo 📊 Résumé:
echo    • Tables supprimées et recréées
echo    • Colonnes Spotify supprimées de la table users
echo    • Fonctions de nettoyage automatique créées
echo    • Index de performance ajoutés
echo    • Structure compatible avec le nouveau modèle User.js
echo.
echo 🚀 La base de production est prête !
echo.
echo 💡 Prochaines étapes:
echo    1. Redémarrez votre serveur backend
echo    2. Testez l'authentification Twitch
echo    3. Créez une nouvelle session
echo.
pause 