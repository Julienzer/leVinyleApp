-- Table pour stocker les playlists des streamers
CREATE TABLE IF NOT EXISTS playlists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    streamer_id TEXT NOT NULL,
    spotify_playlist_id TEXT DEFAULT NULL,
    tracks_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table de liaison entre playlists et tracks
CREATE TABLE IF NOT EXISTS playlist_tracks (
    id TEXT PRIMARY KEY,
    playlist_id TEXT NOT NULL,
    track_id TEXT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_playlist_tracks_playlist FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    CONSTRAINT fk_playlist_tracks_track FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
    UNIQUE(playlist_id, track_id)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_playlists_streamer ON playlists(streamer_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_track ON playlist_tracks(track_id);

-- Données de test pour le développement
INSERT INTO playlists (id, name, description, streamer_id, tracks_count, created_at, updated_at) 
VALUES 
    ('playlist-1', 'Session Live Stream', 'Morceaux de ma session en direct', 'streamer-1', 2, NOW(), NOW()),
    ('playlist-2', 'Viewer Favorites', 'Les coups de cœur des viewers', 'streamer-1', 1, NOW(), NOW()),
    ('playlist-3', 'Chill Vibes', 'Playlist détente pour les moments calmes', 'streamer-2', 0, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Exemples de morceaux dans les playlists (si les tracks existent)
INSERT INTO playlist_tracks (id, playlist_id, track_id, added_at) 
VALUES 
    ('pt-1', 'playlist-1', 'track-1', NOW()),
    ('pt-2', 'playlist-1', 'track-2', NOW()),
    ('pt-3', 'playlist-2', 'track-3', NOW())
ON CONFLICT (id) DO NOTHING; 