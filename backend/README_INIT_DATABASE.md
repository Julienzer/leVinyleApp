# 🗄️ Guide d'initialisation de la base de données

## ⚠️ CHANGEMENT IMPORTANT - Spotify

**Depuis la refactorisation, Spotify n'est PLUS stocké en base de données !**

- ✅ **Twitch** : Tokens stockés en mémoire (`twitchUserTokens`)
- ✅ **Spotify** : Tokens stockés en mémoire (`spotifyUserTokens`) 
- ❌ **Base de données** : Plus de colonnes `spotify_*` dans la table `users`

Les deux systèmes d'authentification utilisent maintenant la **même architecture en mémoire**.

## 🎯 Objectif

Ce guide explique comment initialiser ou réinitialiser complètement la base de données PostgreSQL de l'application Le Vinyle.

## 📋 Structure de la base

### Tables principales
- **`users`** : Utilisateurs Twitch uniquement (plus de colonnes Spotify)
- **`sessions`** : Sessions de streaming 
- **`propositions`** : Propositions de morceaux
- **`session_history`** : Historique des morceaux joués
- **`moderators`** : Relations modérateur/streamer
- **`playlists`** : Playlists des streamers
- **`playlist_tracks`** : Morceaux dans les playlists

### ❌ Supprimé de la base
Toutes les colonnes Spotify ont été supprimées :
- `spotify_access_token`
- `spotify_refresh_token` 
- `spotify_token_expires_at`
- `spotify_connected_at`
- `spotify_id`
- `spotify_display_name`
- `spotify_profile_picture`

## 🚀 Méthodes d'initialisation

### Méthode 1 : Script SQL direct (Recommandé)

```bash
psql -U postgres -d postgres -f backend/db/init.sql
```

### Méthode 2 : Script Node.js

```bash
node backend/scripts/reinit-database.js
```

### Méthode 3 : NPM Commands

```bash
# Depuis le dossier backend
npm run db:init
# ou
npm run db:reset
```

### Méthode 4 : Windows Batch (Obsolète)

```cmd
cd backend/scripts
init_database.bat
```

## 🔧 Configuration requise

### Variables d'environnement

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=root
DB_NAME=le_vinyle
```

### PostgreSQL
- Version 12+ recommandée
- Utilisateur avec droits CREATE DATABASE
- Port 5432 (par défaut)

## 📊 Données de test incluses

Le script crée automatiquement :

### Utilisateurs de test
```sql
test_streamer_123  -- Streamer principal
test_moderator_456 -- Modérateur  
test_viewer_789    -- Viewer standard
```

### Sessions de test
```sql
'test'   -- Session publique de test
'julien' -- Session Julien
```

### Relations
- Modérateur lié au streamer
- Propositions d'exemple

## 🎵 Gestion Spotify (Nouveau)

### Architecture actuelle
```javascript
// Backend auth.js
let spotifyUserTokens = {
  'user123': {
    access_token: 'BQD...',
    refresh_token: 'AQD...',
    expires_at: 1704067200000,
    spotify_id: 'spotify_user',
    display_name: 'MonNom',
    linked_to_twitch: true,
    twitch_user_id: 'user123'
  }
}
```

### Avantages
- ✅ Même logique que Twitch
- ✅ Performance (pas de DB)
- ✅ Simplicité de maintenance
- ✅ Multi-utilisateurs

### Inconvénients
- ❌ Tokens perdus au redémarrage
- ❌ Un seul serveur supporté

## 🔄 Migration depuis l'ancienne version

Si vous aviez des données Spotify en base :

1. **Sauvegarde** (optionnelle) :
```sql
-- Sauvegarder les anciens tokens Spotify
SELECT id, spotify_id, spotify_display_name 
FROM users 
WHERE spotify_access_token IS NOT NULL;
```

2. **Réinitialisation** :
```bash
npm run db:reset
```

3. **Reconnexion** :
Les utilisateurs devront se reconnecter à Spotify.

## 🛠️ Fonctions utilitaires

### Nettoyage automatique
```sql
-- Supprimer sessions inactives (24h+)
SELECT * FROM cleanup_inactive_sessions(24, 100);

-- Statistiques de nettoyage
SELECT * FROM get_session_cleanup_stats();
```

### Surveillance
```sql
-- Vue des sessions avec statut
SELECT * FROM sessions_cleanup_view;
```

## 🐛 Dépannage

### Erreur de connexion
```bash
# Vérifier PostgreSQL
sudo systemctl status postgresql
sudo systemctl start postgresql
```

### Permissions
```sql
-- Donner tous les droits à l'utilisateur
GRANT ALL PRIVILEGES ON DATABASE le_vinyle TO postgres;
```

### Réinitialisation force
```bash
# Supprimer complètement la base
dropdb le_vinyle
# Puis réexécuter le script d'init
```

## 📝 Notes importantes

1. **Spotify** : Plus de persistance en base, reconnexion requise après redémarrage
2. **Twitch** : Même comportement qu'avant (mémoire)
3. **Sessions** : Toujours persistées en base
4. **Propositions** : Toujours persistées en base

La base de données est maintenant plus simple et alignée sur l'architecture Twitch ! 