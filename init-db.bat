@echo off
echo Initialisation de la base de données...

REM Vérifier si PostgreSQL est installé
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo PostgreSQL n'est pas installé ou n'est pas dans le PATH.
    echo Veuillez installer PostgreSQL et réessayer.
    pause
    exit /b 1
)

REM Définir le mot de passe pour PostgreSQL
set PGPASSWORD=root

REM Créer la base de données si elle n'existe pas
psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname='le_vinyle'" | findstr /C:"1 row" >nul
if %errorlevel% neq 0 (
    echo Création de la base de données...
    psql -U postgres -c "CREATE DATABASE le_vinyle"
)

REM Exécuter le script d'initialisation
echo Exécution du script d'initialisation...
psql -U postgres -d le_vinyle -f backend/db/init.sql

REM Nettoyer la variable d'environnement
set PGPASSWORD=

echo Base de données initialisée avec succès !
pause 