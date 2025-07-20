-- Migration : Ajout des tokens Spotify par utilisateur
-- À exécuter après l'initialisation de base

-- Ajouter les colonnes pour les tokens Spotify individuels
ALTER TABLE users ADD COLUMN IF NOT EXISTS spotify_access_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS spotify_refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS spotify_token_expires_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS spotify_connected_at TIMESTAMP;

-- Index pour optimiser les requêtes de tokens
CREATE INDEX IF NOT EXISTS idx_users_spotify_tokens ON users(id) WHERE spotify_access_token IS NOT NULL;

-- Afficher le résultat
SELECT 
    'Migration terminée' as status,
    COUNT(*) as total_users,
    COUNT(spotify_access_token) as users_with_spotify
FROM users; 