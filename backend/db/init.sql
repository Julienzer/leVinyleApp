-- Structure de base de données pour Le Vinyle
-- Basée sur l'EBD fourni pour supporter les sessions musicales

-- ===== TABLE USERS =====
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,  -- ID Twitch
    display_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(50) DEFAULT 'viewer',  -- viewer, moderator, streamer
    is_streamer BOOLEAN DEFAULT FALSE,
    spotify_id VARCHAR(255),
    profile_picture VARCHAR(512),  -- URL de la photo de profil Twitch
    spotify_profile_picture VARCHAR(512),  -- URL de la photo de profil Spotify
    spotify_display_name VARCHAR(255),  -- Nom d'affichage Spotify
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABLE SESSIONS =====
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(255) NOT NULL UNIQUE,  -- Code d'accès (ex: "julien", "test123")
    name VARCHAR(255) NOT NULL,
    streamer_id VARCHAR(255) NOT NULL REFERENCES users(id),
    is_private BOOLEAN DEFAULT FALSE,
    prevent_duplicates BOOLEAN DEFAULT TRUE,
    queue_mode VARCHAR(50) DEFAULT 'chronological',  -- chronological, random
    active BOOLEAN DEFAULT TRUE,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT NULL,
    auto_cleanup BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABLE PROPOSITIONS =====
CREATE TABLE IF NOT EXISTS propositions (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    viewer_id VARCHAR(255) NOT NULL REFERENCES users(id),
    spotify_url VARCHAR(512) NOT NULL,
    track_name VARCHAR(255),
    artist VARCHAR(255),
    album VARCHAR(255),
    duration VARCHAR(10),
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending',  -- pending, approved, rejected, added
    queue_position INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    moderated_at TIMESTAMP,
    moderator_id VARCHAR(255) REFERENCES users(id),
    added_at TIMESTAMP
);

-- ===== TABLE SESSION_HISTORY =====
-- Pour l'historique des morceaux joués (gestion des doublons inter-sessions)
CREATE TABLE IF NOT EXISTS session_history (
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
CREATE TABLE IF NOT EXISTS moderators (
    id SERIAL PRIMARY KEY,
    streamer_id VARCHAR(255) NOT NULL REFERENCES users(id),
    moderator_id VARCHAR(255) NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(streamer_id, moderator_id)
);

-- ===== INDEX POUR PERFORMANCES =====
-- Sessions
CREATE INDEX IF NOT EXISTS idx_sessions_code ON sessions(code);
CREATE INDEX IF NOT EXISTS idx_sessions_streamer ON sessions(streamer_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(active);

-- Propositions
CREATE INDEX IF NOT EXISTS idx_propositions_session ON propositions(session_id);
CREATE INDEX IF NOT EXISTS idx_propositions_viewer ON propositions(viewer_id);
CREATE INDEX IF NOT EXISTS idx_propositions_status ON propositions(status);
CREATE INDEX IF NOT EXISTS idx_propositions_queue ON propositions(queue_position);
CREATE INDEX IF NOT EXISTS idx_propositions_created ON propositions(created_at);

-- Session History
CREATE INDEX IF NOT EXISTS idx_history_session ON session_history(session_id);
CREATE INDEX IF NOT EXISTS idx_history_streamer ON session_history(streamer_id);
CREATE INDEX IF NOT EXISTS idx_history_spotify_url ON session_history(spotify_url);

-- Moderators
CREATE INDEX IF NOT EXISTS idx_moderators_streamer ON moderators(streamer_id);
CREATE INDEX IF NOT EXISTS idx_moderators_moderator ON moderators(moderator_id);

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

-- ===== TABLE PLAYLISTS =====
-- Table pour stocker les playlists des streamers
CREATE TABLE IF NOT EXISTS playlists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    streamer_id TEXT NOT NULL REFERENCES users(id),
    spotify_playlist_id TEXT DEFAULT NULL,
    tracks_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table de liaison entre playlists et tracks
CREATE TABLE IF NOT EXISTS playlist_tracks (
    id TEXT PRIMARY KEY,
    playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    track_id INTEGER NOT NULL REFERENCES propositions(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(playlist_id, track_id)
);

-- Index pour optimiser les requêtes des playlists
CREATE INDEX IF NOT EXISTS idx_playlists_streamer ON playlists(streamer_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_track ON playlist_tracks(track_id);

-- Trigger pour updated_at sur playlists
CREATE TRIGGER update_playlists_updated_at BEFORE UPDATE ON playlists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== GESTION AUTOMATIQUE DES SESSIONS =====

-- Ajouter des colonnes pour traquer l'activité et l'expiration (si elles n'existent pas)
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP DEFAULT NULL,
ADD COLUMN IF NOT EXISTS auto_cleanup BOOLEAN DEFAULT TRUE;

-- Mettre à jour les sessions existantes avec l'activité actuelle
UPDATE sessions 
SET last_activity = updated_at 
WHERE last_activity IS NULL;

-- Index pour optimiser les requêtes de nettoyage
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_auto_cleanup ON sessions(auto_cleanup);

-- Fonction pour mettre à jour last_activity automatiquement
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour last_activity quand une proposition est créée/modifiée
    UPDATE sessions 
    SET last_activity = CURRENT_TIMESTAMP 
    WHERE id = NEW.session_id;
    
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Triggers pour mettre à jour l'activité automatiquement
DROP TRIGGER IF EXISTS update_activity_on_proposition ON propositions;
CREATE TRIGGER update_activity_on_proposition
    AFTER INSERT OR UPDATE ON propositions
    FOR EACH ROW EXECUTE FUNCTION update_session_activity();

-- Fonction pour nettoyer les sessions inactives
CREATE OR REPLACE FUNCTION cleanup_inactive_sessions(
    inactive_hours INTEGER DEFAULT 24,
    delete_old_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    action TEXT,
    session_count INTEGER,
    details TEXT
) AS $$
DECLARE
    deactivated_count INTEGER;
    deleted_count INTEGER;
BEGIN
    -- 1. Désactiver les sessions inactives (plus de X heures sans activité)
    UPDATE sessions 
    SET active = FALSE, updated_at = CURRENT_TIMESTAMP
    WHERE active = TRUE 
      AND auto_cleanup = TRUE
      AND last_activity < (CURRENT_TIMESTAMP - (inactive_hours || ' hours')::INTERVAL);
    
    GET DIAGNOSTICS deactivated_count = ROW_COUNT;
    
    -- 2. Supprimer les sessions très anciennes (plus de X jours)
    DELETE FROM sessions 
    WHERE auto_cleanup = TRUE
      AND active = FALSE 
      AND updated_at < (CURRENT_TIMESTAMP - (delete_old_days || ' days')::INTERVAL);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Retourner les résultats
    RETURN QUERY VALUES 
        ('deactivated', deactivated_count, format('Sessions désactivées après %s heures d''inactivité', inactive_hours)),
        ('deleted', deleted_count, format('Sessions supprimées après %s jours', delete_old_days));
END;
$$ LANGUAGE 'plpgsql';

-- Fonction pour obtenir les statistiques des sessions
CREATE OR REPLACE FUNCTION get_session_cleanup_stats()
RETURNS TABLE (
    total_sessions INTEGER,
    active_sessions INTEGER,
    inactive_sessions INTEGER,
    old_sessions INTEGER,
    cleanup_candidates INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM sessions) as total_sessions,
        (SELECT COUNT(*)::INTEGER FROM sessions WHERE active = TRUE) as active_sessions,
        (SELECT COUNT(*)::INTEGER FROM sessions WHERE active = FALSE) as inactive_sessions,
        (SELECT COUNT(*)::INTEGER FROM sessions WHERE updated_at < CURRENT_TIMESTAMP - INTERVAL '30 days') as old_sessions,
        (SELECT COUNT(*)::INTEGER FROM sessions 
         WHERE auto_cleanup = TRUE 
           AND (
               (active = TRUE AND last_activity < CURRENT_TIMESTAMP - INTERVAL '24 hours') OR
               (active = FALSE AND updated_at < CURRENT_TIMESTAMP - INTERVAL '30 days')
           )
        ) as cleanup_candidates;
END;
$$ LANGUAGE 'plpgsql';

-- Vue pour les sessions à nettoyer
CREATE OR REPLACE VIEW sessions_cleanup_view AS
SELECT 
    s.id,
    s.code,
    s.name,
    s.streamer_id,
    u.display_name as streamer_name,
    s.active,
    s.created_at,
    s.updated_at,
    s.last_activity,
    s.auto_cleanup,
    EXTRACT(HOURS FROM (CURRENT_TIMESTAMP - s.last_activity)) as hours_inactive,
    EXTRACT(DAYS FROM (CURRENT_TIMESTAMP - s.updated_at)) as days_old,
    CASE 
        WHEN s.active = TRUE AND s.last_activity < CURRENT_TIMESTAMP - INTERVAL '24 hours' THEN 'À désactiver'
        WHEN s.active = FALSE AND s.updated_at < CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 'À supprimer'
        ELSE 'Actif'
    END as cleanup_status,
    (SELECT COUNT(*) FROM propositions WHERE session_id = s.id) as total_propositions
FROM sessions s
JOIN users u ON s.streamer_id = u.id
ORDER BY s.last_activity DESC;

-- ===== DONNÉES DE TEST =====
-- Insérer des utilisateurs de test
INSERT INTO users (id, display_name, role, is_streamer, email) VALUES
    ('test_streamer', 'TestStreamer', 'streamer', TRUE, 'streamer@test.com'),
    ('test_moderator', 'TestModerator', 'moderator', FALSE, 'moderator@test.com'),
    ('test_viewer', 'TestViewer', 'viewer', FALSE, 'viewer@test.com')
ON CONFLICT (id) DO NOTHING;

-- Insérer des sessions de test
INSERT INTO sessions (code, name, streamer_id, is_private, prevent_duplicates, queue_mode) VALUES
    ('test123', 'Session Test de Julien', 'test_streamer', FALSE, TRUE, 'chronological'),
    ('private456', 'Session Privée', 'test_streamer', TRUE, FALSE, 'random')
ON CONFLICT (code) DO NOTHING;

-- Insérer des propositions de test
INSERT INTO propositions (session_id, viewer_id, spotify_url, track_name, artist, album, duration, message, status, created_at, moderated_at, moderator_id) VALUES
    (1, 'test_viewer', 'https://open.spotify.com/track/fugees-fu-gee-la', 'Fugees - Fu-Gee-La', 'Fugees', 'The Score', '3:56', 'Un classique du hip-hop !', 'pending', NOW() - INTERVAL '10 minutes', NULL, NULL),
    (1, 'test_viewer', 'https://open.spotify.com/track/kendrick-swimming-pools', 'Kendrick Lamar - Swimming Pools (Drank)', 'Kendrick Lamar', 'good kid, m.A.A.d city', '5:13', 'Pour l''ambiance !', 'approved', NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '5 minutes', 'test_moderator'),
    (1, 'test_viewer', 'https://open.spotify.com/track/nas-ny-state-of-mind', 'Nas - N.Y. State of Mind', 'Nas', 'Illmatic', '4:54', '', 'rejected', NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '8 minutes', 'test_moderator'),
    (1, 'test_viewer', 'https://open.spotify.com/track/wu-tang-cream', 'Wu-Tang Clan - C.R.E.A.M.', 'Wu-Tang Clan', 'Enter the Wu-Tang (36 Chambers)', '4:12', 'Cash Rules Everything Around Me', 'added', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '25 minutes', 'test_moderator'),
    (1, 'test_viewer', 'https://open.spotify.com/track/outkast-ms-jackson', 'OutKast - Ms. Jackson', 'OutKast', 'Stankonia', '4:30', 'Un tube intemporel', 'pending', NOW() - INTERVAL '5 minutes', NULL, NULL),
    (1, 'test_viewer', 'https://open.spotify.com/track/tribe-scenario', 'A Tribe Called Quest - Scenario', 'A Tribe Called Quest', 'The Low End Theory', '4:10', 'Jazz rap à son meilleur', 'approved', NOW() - INTERVAL '12 minutes', NOW() - INTERVAL '3 minutes', 'test_moderator')
ON CONFLICT DO NOTHING;

-- Relation modérateur
INSERT INTO moderators (streamer_id, moderator_id) VALUES
    ('test_streamer', 'test_moderator')
ON CONFLICT (streamer_id, moderator_id) DO NOTHING;

-- ===== DONNÉES DE TEST PLAYLISTS =====
-- Insérer des playlists de test
INSERT INTO playlists (id, name, description, streamer_id, tracks_count, created_at, updated_at) VALUES
    ('playlist-1', 'Session Live Stream', 'Morceaux de ma session en direct', 'test_streamer', 2, NOW(), NOW()),
    ('playlist-2', 'Viewer Favorites', 'Les coups de cœur des viewers', 'test_streamer', 1, NOW(), NOW()),
    ('playlist-3', 'Chill Vibes', 'Playlist détente pour les moments calmes', 'test_streamer', 0, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Exemples de morceaux dans les playlists (liés aux propositions existantes)
INSERT INTO playlist_tracks (id, playlist_id, track_id, added_at) VALUES
    ('pt-1', 'playlist-1', 4, NOW() - INTERVAL '20 minutes'),  -- Wu-Tang Clan dans Session Live Stream
    ('pt-2', 'playlist-1', 6, NOW() - INTERVAL '10 minutes'),  -- A Tribe Called Quest dans Session Live Stream
    ('pt-3', 'playlist-2', 2, NOW() - INTERVAL '15 minutes')   -- Kendrick Lamar dans Viewer Favorites
ON CONFLICT (id) DO NOTHING;

-- ===== SUPPRESSION DE L'ANCIENNE TABLE =====
-- Supprimer l'ancienne table tracks si elle existe
-- DROP TABLE IF EXISTS tracks; 