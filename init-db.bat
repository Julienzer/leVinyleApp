@echo off
echo Initialisation de la base de données StreamSelect...

REM Créer la base de données
psql -U postgres -c "CREATE DATABASE streamselect;"

REM Exécuter le script d'initialisation
psql -U postgres -d streamselect -f backend/db/init.sql

echo Base de données initialisée avec succès !
pause 