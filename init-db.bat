@echo off
echo ==========================================
echo   RÉINITIALISATION COMPLÈTE DE LA BASE
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

REM Définir le mot de passe pour PostgreSQL
set PGPASSWORD=root

echo 🔍 Vérification de la connexion PostgreSQL...
psql -U postgres -c "SELECT version();" >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Impossible de se connecter à PostgreSQL.
    echo    Vérifiez que PostgreSQL est démarré et que le mot de passe est correct.
    pause
    exit /b 1
)

echo ✅ Connexion PostgreSQL réussie

echo.
echo 🗑️  Suppression de l'ancienne base de données...
psql -U postgres -c "DROP DATABASE IF EXISTS le_vinyle;"
if %errorlevel% neq 0 (
    echo ⚠️  Avertissement: Impossible de supprimer la base (peut-être qu'elle n'existait pas)
)

echo 🆕 Création de la nouvelle base de données...
psql -U postgres -c "CREATE DATABASE le_vinyle;"
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la création de la base de données
    pause
    exit /b 1
)

echo ✅ Base de données 'le_vinyle' créée

echo.
echo 🔧 Exécution du script d'initialisation complet...
echo    - Création des tables avec colonnes Spotify
echo    - Ajout des index pour performances
echo    - Création des fonctions et triggers
echo    - Insertion des données de test
echo.

psql -U postgres -d le_vinyle -f backend/db/init.sql
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de l'exécution du script d'initialisation
    pause
    exit /b 1
)

REM Nettoyer la variable d'environnement
set PGPASSWORD=

echo.
echo ✅ RÉINITIALISATION TERMINÉE AVEC SUCCÈS !
echo.
echo 📊 Résumé:
echo    • Base de données: le_vinyle (nouvelle)
echo    • Tables: users, sessions, propositions, playlists, etc.
echo    • Support Spotify: Tokens et colonnes complètes
echo    • Données de test: Utilisateurs et sessions d'exemple
echo    • Fonctions: Nettoyage automatique et maintenance
echo.
echo 🚀 La base est prête pour le développement !
echo.
pause 