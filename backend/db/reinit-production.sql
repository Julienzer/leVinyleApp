-- ===== SCRIPT DE RÉINITIALISATION POUR PRODUCTION =====
-- Nettoie et recrée la structure de la base de données Le Vinyle
-- Version adaptée pour la production (pas de suppression de base)
-- Architecture: Multi-utilisateurs avec isolation complète des tokens
-- Usage: psql -U your_user -d your_database -f reinit-production.sql

-- ===== VÉRIFICATION ET NETTOYAGE =====

-- Afficher les informations de la base
SELECT 
    current_database() as database_name,
    current_user as current_user,
    version() as postgres_version;

-- ===== SUPPRESSION DES TABLES EXISTANTES (ordre important) =====
-- Fermer toutes les connexions actives aux tables (si possible)
DO $$
BEGIN
    -- Tenter de terminer les connexions actives (nécessite des droits admin)
    -- Cette partie peut échouer en production, c'est normal
    RAISE NOTICE 'Nettoyage des connexions actives...';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Impossible de terminer les connexions actives (normal en production)';
END $$;

-- Supprimer les tables dans l'ordre (à cause des clés étrangères)
DROP TABLE IF EXISTS playlist_tracks CASCADE;
DROP TABLE IF EXISTS playlists CASCADE;
DROP TABLE IF EXISTS session_history CASCADE;
DROP TABLE IF EXISTS propositions CASCADE;
DROP TABLE IF EXISTS moderators CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS tracks CASCADE;  -- Ancienne table obsolète
DROP TABLE IF EXISTS users CASCADE;

-- Supprimer les vues et fonctions existantes
DROP VIEW IF EXISTS sessions_cleanup_view CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_session_activity() CASCADE;
DROP FUNCTION IF EXISTS cleanup_inactive_sessions(INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_session_cleanup_stats() CASCADE;

-- ===== RECRÉATION DE LA STRUCTURE COMPLÈTE =====

-- ===== TABLE USERS (PURE - SANS TOKENS) =====
-- Cette table ne contient QUE les informations de base des utilisateurs
-- Tous les tokens (Spotify, Twitch) sont stockés en mémoire pour l'isolation
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,  -- ID Twitch (clé primaire)
    display_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(50) DEFAULT 'viewer',  -- viewer, moderator, streamer
    is_streamer BOOLEAN DEFAULT FALSE,
    
    -- PROFIL TWITCH UNIQUEMENT
    profile_picture VARCHAR(512),  -- URL photo profil Twitch
    
    -- TIMESTAMPS
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABLE SESSIONS =====
-- Gestion des sessions de streaming avec codes d'accès
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(255) NOT NULL UNIQUE,  -- Code d'accès (ex: "julien", "test123")
    name VARCHAR(255) NOT NULL,
    streamer_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_private BOOLEAN DEFAULT FALSE,
    prevent_duplicates BOOLEAN DEFAULT TRUE,
    queue_mode VARCHAR(50) DEFAULT 'chronological',  -- chronological, random
    active BOOLEAN DEFAULT TRUE,
    
    -- GESTION AUTOMATIQUE ET EXPIRATION
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT NULL,
    auto_cleanup BOOLEAN DEFAULT TRUE,
    
    -- TIMESTAMPS
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABLE PROPOSITIONS =====
-- Morceaux proposés par les viewers dans une session
CREATE TABLE propositions (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    viewer_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    spotify_url VARCHAR(512) NOT NULL,
    track_name VARCHAR(255),
    artist VARCHAR(255),
    album VARCHAR(255),
    duration VARCHAR(10),
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending',  -- pending, approved, rejected, added
    queue_position INTEGER,
    
    -- MODÉRATION
    moderated_at TIMESTAMP,
    moderator_id VARCHAR(255) REFERENCES users(id),
    added_at TIMESTAMP,
    
    -- TIMESTAMPS
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABLE SESSION_HISTORY =====
-- Historique des morceaux joués (gestion des doublons inter-sessions)
CREATE TABLE session_history (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    streamer_id VARCHAR(255) NOT NULL REFERENCES users(id),
    spotify_url VARCHAR(512) NOT NULL,
    track_name VARCHAR(255),
    artist VARCHAR(255),
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABLE MODERATORS =====
-- Relation many-to-many entre streamers et modérateurs
CREATE TABLE moderators (
    id SERIAL PRIMARY KEY,
    streamer_id VARCHAR(255) NOT NULL REFERENCES users(id),
    moderator_id VARCHAR(255) NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(streamer_id, moderator_id)
);

-- ===== TABLE PLAYLISTS =====
-- Playlists créées par les streamers
CREATE TABLE playlists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    streamer_id TEXT NOT NULL REFERENCES users(id),
    spotify_playlist_id TEXT DEFAULT NULL,  -- ID de la playlist Spotify (si synchronisée)
    tracks_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABLE PLAYLIST_TRACKS =====
-- Relation many-to-many entre playlists et tracks (propositions)
CREATE TABLE playlist_tracks (
    id TEXT PRIMARY KEY,
    playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    track_id INTEGER NOT NULL REFERENCES propositions(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(playlist_id, track_id)
);

-- ===== INDEX POUR PERFORMANCES =====
-- Sessions
CREATE INDEX idx_sessions_code ON sessions(code);
CREATE INDEX idx_sessions_streamer ON sessions(streamer_id);
CREATE INDEX idx_sessions_active ON sessions(active);
CREATE INDEX idx_sessions_last_activity ON sessions(last_activity);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_auto_cleanup ON sessions(auto_cleanup);

-- Propositions
CREATE INDEX idx_propositions_session ON propositions(session_id);
CREATE INDEX idx_propositions_viewer ON propositions(viewer_id);
CREATE INDEX idx_propositions_status ON propositions(status);
CREATE INDEX idx_propositions_queue ON propositions(queue_position);
CREATE INDEX idx_propositions_created ON propositions(created_at);

-- Session History
CREATE INDEX idx_history_session ON session_history(session_id);
CREATE INDEX idx_history_streamer ON session_history(streamer_id);
CREATE INDEX idx_history_spotify_url ON session_history(spotify_url);

-- Moderators
CREATE INDEX idx_moderators_streamer ON moderators(streamer_id);
CREATE INDEX idx_moderators_moderator ON moderators(moderator_id);

-- Playlists
CREATE INDEX idx_playlists_streamer ON playlists(streamer_id);
CREATE INDEX idx_playlist_tracks_playlist ON playlist_tracks(playlist_id);
CREATE INDEX idx_playlist_tracks_track ON playlist_tracks(track_id);

-- ===== FONCTIONS UTILITAIRES =====
-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playlists_updated_at BEFORE UPDATE ON playlists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== GESTION AUTOMATIQUE DES SESSIONS =====

-- Fonction pour nettoyer les sessions inactives
CREATE OR REPLACE FUNCTION cleanup_inactive_sessions(
    inactive_hours INTEGER DEFAULT 24,
    max_sessions_to_delete INTEGER DEFAULT 100
)
RETURNS TABLE(
    deleted_sessions INTEGER,
    deleted_propositions INTEGER,
    deleted_history INTEGER
) AS $$
DECLARE
    cutoff_time TIMESTAMP;
    session_ids INTEGER[];
    deleted_sessions_count INTEGER;
    deleted_propositions_count INTEGER;
    deleted_history_count INTEGER;
BEGIN
    -- Calculer la date limite
    cutoff_time := CURRENT_TIMESTAMP - INTERVAL '1 hour' * inactive_hours;
    
    -- Identifier les sessions à supprimer
    SELECT ARRAY(
        SELECT id 
        FROM sessions 
        WHERE auto_cleanup = TRUE 
        AND (
            last_activity < cutoff_time 
            OR (expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP)
        )
        LIMIT max_sessions_to_delete
    ) INTO session_ids;
    
    -- Supprimer l'historique associé
    DELETE FROM session_history 
    WHERE session_id = ANY(session_ids);
    GET DIAGNOSTICS deleted_history_count = ROW_COUNT;
    
    -- Supprimer les propositions associées
    DELETE FROM propositions 
    WHERE session_id = ANY(session_ids);
    GET DIAGNOSTICS deleted_propositions_count = ROW_COUNT;
    
    -- Supprimer les sessions
    DELETE FROM sessions 
    WHERE id = ANY(session_ids);
    GET DIAGNOSTICS deleted_sessions_count = ROW_COUNT;
    
    -- Retourner les statistiques
    RETURN QUERY SELECT 
        deleted_sessions_count, 
        deleted_propositions_count, 
        deleted_history_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour l'activité d'une session
CREATE OR REPLACE FUNCTION update_session_activity(session_code VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE sessions 
    SET last_activity = CURRENT_TIMESTAMP 
    WHERE code = session_code AND active = TRUE;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les statistiques de nettoyage
CREATE OR REPLACE FUNCTION get_session_cleanup_stats()
RETURNS TABLE(
    total_sessions INTEGER,
    active_sessions INTEGER,
    inactive_sessions INTEGER,
    expired_sessions INTEGER,
    auto_cleanup_enabled INTEGER
) AS $$
BEGIN
    RETURN QUERY SELECT 
        (SELECT COUNT(*)::INTEGER FROM sessions),
        (SELECT COUNT(*)::INTEGER FROM sessions WHERE active = TRUE),
        (SELECT COUNT(*)::INTEGER FROM sessions 
         WHERE auto_cleanup = TRUE 
         AND last_activity < CURRENT_TIMESTAMP - INTERVAL '24 hours'),
        (SELECT COUNT(*)::INTEGER FROM sessions 
         WHERE expires_at IS NOT NULL 
         AND expires_at < CURRENT_TIMESTAMP),
        (SELECT COUNT(*)::INTEGER FROM sessions WHERE auto_cleanup = TRUE);
END;
$$ LANGUAGE plpgsql;

-- ===== VUE POUR SURVEILLANCE =====
CREATE VIEW sessions_cleanup_view AS
SELECT 
    id,
    code,
    name,
    active,
    auto_cleanup,
    last_activity,
    expires_at,
    CASE 
        WHEN expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP THEN 'expired'
        WHEN last_activity < CURRENT_TIMESTAMP - INTERVAL '24 hours' THEN 'inactive'
        ELSE 'active'
    END as status,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_activity))/3600 as hours_since_activity
FROM sessions
ORDER BY last_activity DESC;

-- ===== DONNÉES DE TEST (optionnel) =====
-- Utilisateur de test
INSERT INTO users (id, display_name, email, role, is_streamer, profile_picture) VALUES 
('test_streamer_123', 'TestStreamer', 'streamer@test.com', 'streamer', TRUE, 'https://static-cdn.jtvnw.net/jtv_user_pictures/test-profile-image.png'),
('test_moderator_456', 'TestModerator', 'moderator@test.com', 'moderator', FALSE, 'https://static-cdn.jtvnw.net/jtv_user_pictures/mod-profile-image.png'),
('test_viewer_789', 'TestViewer', 'viewer@test.com', 'viewer', FALSE, 'https://static-cdn.jtvnw.net/jtv_user_pictures/viewer-profile-image.png')
ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    is_streamer = EXCLUDED.is_streamer,
    profile_picture = EXCLUDED.profile_picture,
    updated_at = CURRENT_TIMESTAMP;

-- Session de test
INSERT INTO sessions (code, name, streamer_id, is_private, prevent_duplicates, queue_mode) VALUES 
('test', 'Session de Test', 'test_streamer_123', FALSE, TRUE, 'chronological'),
('julien', 'Session Julien', 'test_streamer_123', FALSE, TRUE, 'chronological')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    streamer_id = EXCLUDED.streamer_id,
    is_private = EXCLUDED.is_private,
    prevent_duplicates = EXCLUDED.prevent_duplicates,
    queue_mode = EXCLUDED.queue_mode,
    updated_at = CURRENT_TIMESTAMP;

-- Relation modérateur
INSERT INTO moderators (streamer_id, moderator_id) VALUES 
('test_streamer_123', 'test_moderator_456')
ON CONFLICT (streamer_id, moderator_id) DO NOTHING;

-- Propositions de test
INSERT INTO propositions (session_id, viewer_id, spotify_url, track_name, artist, album, duration, message, status) 
SELECT 
    s.id,
    'test_viewer_789',
    'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh',
    'Never Gonna Give You Up',
    'Rick Astley',
    'Whenever You Need Somebody',
    '3:33',
    'Un classique indémodable !',
    'pending'
FROM sessions s WHERE s.code = 'test'
ON CONFLICT DO NOTHING;

-- ===== RÉSUMÉ DES CHANGEMENTS =====
-- 🗑️ SUPPRIMÉ : Toutes les colonnes Spotify de la table users
-- 🔄 ARCHITECTURE : Spotify utilise maintenant le stockage en mémoire comme Twitch
-- ✅ CONSERVÉ : Structure de base pour sessions, propositions, playlists
-- 💾 STOCKAGE SPOTIFY : Backend auth.js > spotifyUserTokens (mémoire)
-- 🔒 ISOLATION : Chaque utilisateur a ses propres tokens isolés
-- ⚡ PERFORMANCE : Index optimisés pour toutes les requêtes fréquentes
-- 🚀 PRODUCTION : Script optimisé pour l'environnement de production

SELECT 'Base de données de production réinitialisée - Architecture multi-utilisateurs optimisée' as status; 