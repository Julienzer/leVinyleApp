# 🔧 Guide d'Initialisation de la Base de Données

## 📋 Vue d'ensemble

Ce guide explique comment initialiser ou réinitialiser complètement la base de données PostgreSQL pour l'application Le Vinyle. La nouvelle version inclut le support complet des tokens Spotify et une structure optimisée.

## 🚀 Méthodes d'Initialisation

### 1. Script Batch Windows (Recommandé pour Windows)

```bash
# Depuis la racine du projet
./init-db.bat
```

**Avantages:**
- Interface utilisateur claire avec émojis
- Gestion automatique des erreurs
- Vérifications de sécurité
- Messages de statut détaillés

### 2. Script Node.js (Cross-platform)

```bash
# Depuis le backend
npm run db:init
# ou
npm run db:reset
# ou directement
node scripts/reinit-database.js
```

**Avantages:**
- Fonctionne sur tous les OS
- Intégré à l'écosystème Node.js
- Vérifications avancées de la structure
- Statistiques détaillées post-création

### 3. Méthode Manuelle PostgreSQL

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Supprimer l'ancienne base
DROP DATABASE IF EXISTS le_vinyle;

# Créer la nouvelle base
CREATE DATABASE le_vinyle;

# Se connecter à la nouvelle base
\c le_vinyle

# Exécuter le script
\i backend/db/init.sql
```

## 🗃️ Structure de la Base de Données

### Tables Principales

1. **`users`** - Utilisateurs avec support Spotify complet
   - Colonnes Twitch: `id`, `display_name`, `email`, `role`, `profile_picture`
   - Colonnes Spotify: `spotify_id`, `spotify_access_token`, `spotify_refresh_token`, `spotify_token_expires_at`
   - Métadonnées: `spotify_display_name`, `spotify_profile_picture`, `spotify_connected_at`

2. **`sessions`** - Sessions de streaming
   - Gestion automatique: `last_activity`, `expires_at`, `auto_cleanup`
   - Configuration: `prevent_duplicates`, `queue_mode`, `is_private`

3. **`propositions`** - Morceaux proposés
   - Métadonnées Spotify: `track_name`, `artist`, `album`, `duration`
   - Modération: `status`, `moderator_id`, `moderated_at`

4. **`playlists`** - Playlists créées
   - Liaison Spotify: `spotify_playlist_id`
   - Statistiques: `tracks_count`

5. **`session_history`** - Historique pour doublons
6. **`moderators`** - Relations modérateur/streamer
7. **`playlist_tracks`** - Liaison playlist/morceaux

### Fonctions Utilitaires

- `update_updated_at_column()` - Timestamps automatiques
- `update_session_activity()` - Suivi d'activité
- `cleanup_inactive_sessions()` - Nettoyage automatique
- `get_session_cleanup_stats()` - Statistiques de maintenance

## 🔧 Configuration Requise

### Variables d'Environnement

```env
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=root
DB_NAME=le_vinyle

# Spotify (requis pour l'auth)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/spotify/callback

# Twitch
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret

# JWT
JWT_SECRET=your_secret_key
```

### Prérequis Système

- PostgreSQL 12+ installé et démarré
- Node.js 16+ (pour le script Node.js)
- Permissions d'écriture sur la base PostgreSQL

## 📊 Données de Test Incluses

Le script crée automatiquement:

### Utilisateurs de Test
- `test_streamer` - Streamer principal
- `test_moderator` - Modérateur 
- `test_viewer` - Viewer normal
- `test_viewer_2` - Viewer supplémentaire

### Sessions d'Exemple
- `test123` - Session publique chronologique
- `private456` - Session privée aléatoire
- `live789` - Session live active

### Propositions avec Vrais Morceaux
- "Never Gonna Give You Up" - Rick Astley
- "Sweet Child O' Mine" - Guns N' Roses
- "Bohemian Rhapsody" - Queen
- "Shape of You" - Ed Sheeran
- "Blinding Lights" - The Weeknd
- "Lose Yourself" - Eminem
- "Hotel California" - Eagles

### Playlists Pré-configurées
- "Session Live Stream" (2 morceaux)
- "Viewer Favorites" (1 morceau)
- "Chill Vibes" (vide)
- "Rock Classics" (1 morceau)

## 🛠️ Résolution de Problèmes

### Erreur: "database is being accessed by other users"

```bash
# Fermer toutes les connexions actives
psql -U postgres -c "
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'le_vinyle'
  AND pid <> pg_backend_pid();
"
```

### Erreur: "permission denied"

```bash
# Vérifier les permissions
psql -U postgres -c "ALTER USER postgres CREATEDB;"
```

### Erreur: "relation already exists"

```bash
# Force la suppression complète
psql -U postgres -c "DROP DATABASE le_vinyle CASCADE;"
```

### Problème de Connexion

1. Vérifier que PostgreSQL est démarré:
   ```bash
   # Windows
   net start postgresql-x64-13
   
   # Linux/Mac
   sudo systemctl start postgresql
   ```

2. Tester la connexion:
   ```bash
   psql -U postgres -c "SELECT version();"
   ```

## 📈 Vérification Post-Installation

### Via pgAdmin ou psql

```sql
-- Vérifier les tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;

-- Vérifier les données
SELECT COUNT(*) as users FROM users;
SELECT COUNT(*) as sessions FROM sessions;
SELECT COUNT(*) as propositions FROM propositions;

-- Vérifier les colonnes Spotify
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' AND column_name LIKE '%spotify%';
```

### Via l'Application

1. Démarrer le backend: `npm run dev`
2. Vérifier l'endpoint: `GET /api/auth/debug/tokens`
3. Tester une connexion Twitch
4. Tester une connexion Spotify

## 🔄 Maintenance

### Nettoyage Régulier

```bash
# Nettoyer les sessions inactives
npm run db:clean

# Statistiques de nettoyage
node scripts/session-maintenance.js --dry-run --verbose
```

### Sauvegarde

```bash
# Créer une sauvegarde
pg_dump -U postgres le_vinyle > backup_$(date +%Y%m%d).sql

# Restaurer depuis une sauvegarde
psql -U postgres le_vinyle < backup_20231215.sql
```

## ✅ Checklist de Validation

- [ ] Base de données `le_vinyle` créée
- [ ] Toutes les tables présentes (7 tables principales)
- [ ] Colonnes Spotify dans `users` (`spotify_access_token`, etc.)
- [ ] Données de test insérées (4 users, 3 sessions, 7 propositions)
- [ ] Fonctions et triggers créés
- [ ] Index de performance appliqués
- [ ] Backend se connecte sans erreur
- [ ] Logs d'authentification Spotify fonctionnels

---

**Note:** Ce script remplace complètement l'ancienne structure. Toutes les données existantes seront perdues. Assurez-vous de faire une sauvegarde si nécessaire. 