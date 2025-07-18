const db = require('../db');
const Playlist = require('../models/Playlist');

// Récupérer toutes les playlists d'un streamer
const getPlaylists = async (req, res) => {
  try {
    const streamerId = req.user.id; // Obtenu depuis le middleware d'authentification
    
    console.log('🎵 Récupération des playlists pour le streamer:', streamerId);
    
    const query = `
      SELECT p.*, 
             COUNT(pt.id) as tracks_count
      FROM playlists p
      LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
      WHERE p.streamer_id = $1
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;
    
    const result = await db.query(query, [streamerId]);
    const playlists = result.rows;
    
    console.log('✅ Playlists récupérées:', playlists.length);
    
    res.json({
      success: true,
      playlists: playlists.map(playlist => Playlist.fromDB(playlist).toJSON())
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des playlists:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des playlists'
    });
  }
};

// Créer une nouvelle playlist
const createPlaylist = async (req, res) => {
  try {
    const streamerId = req.user.id;
    const { name, description } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Le nom de la playlist est requis'
      });
    }
    
    console.log('🎵 Création d\'une nouvelle playlist:', name);
    
    // Vérifier si une playlist avec ce nom existe déjà
    const existingPlaylist = await db.query(
      'SELECT id FROM playlists WHERE streamer_id = $1 AND name = $2',
      [streamerId, name.trim()]
    );
    
    if (existingPlaylist.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Une playlist avec ce nom existe déjà'
      });
    }
    
    // Créer la playlist
    const playlistId = `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const insertQuery = `
      INSERT INTO playlists (id, name, description, streamer_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `;
    
    const result = await db.query(insertQuery, [
      playlistId,
      name.trim(),
      description?.trim() || '',
      streamerId
    ]);
    
    const createdPlaylist = result.rows[0];
    
    console.log('✅ Playlist créée avec succès:', playlistId);
    
    res.status(201).json({
      success: true,
      playlist: Playlist.fromDB(createdPlaylist).toJSON()
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de la playlist:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de la playlist'
    });
  }
};

// Ajouter un morceau à une playlist
const addTrackToPlaylist = async (req, res) => {
  try {
    const { playlistId, trackId } = req.params;
    const streamerId = req.user.id;
    
    console.log('🎵 Ajout du morceau', trackId, 'à la playlist', playlistId);
    
    // Vérifier que la playlist appartient au streamer
    const playlist = await db.query(
      'SELECT * FROM playlists WHERE id = $1 AND streamer_id = $2',
      [playlistId, streamerId]
    );
    
    if (playlist.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Playlist non trouvée'
      });
    }
    
    // Vérifier que le morceau existe et est approuvé
    const track = await db.query(
      'SELECT * FROM propositions WHERE id = $1 AND status = $2',
      [trackId, 'approved']
    );
    
    if (track.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Morceau non trouvé ou non approuvé'
      });
    }
    
    // Vérifier si le morceau n'est pas déjà dans la playlist
    const existingTrack = await db.query(
      'SELECT id FROM playlist_tracks WHERE playlist_id = $1 AND track_id = $2',
      [playlistId, trackId]
    );
    
    if (existingTrack.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Ce morceau est déjà dans la playlist'
      });
    }
    
    // Ajouter le morceau à la playlist
    const playlistTrackId = `pt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await db.query(
      'INSERT INTO playlist_tracks (id, playlist_id, track_id, added_at) VALUES ($1, $2, $3, NOW())',
      [playlistTrackId, playlistId, trackId]
    );
    
    // Mettre à jour le statut du morceau
    await db.query(
      'UPDATE propositions SET status = $1, added_at = NOW() WHERE id = $2',
      ['added', trackId]
    );
    
    // Mettre à jour le compteur de morceaux de la playlist
    await db.query(
      'UPDATE playlists SET tracks_count = tracks_count + 1, updated_at = NOW() WHERE id = $1',
      [playlistId]
    );
    
    console.log('✅ Morceau ajouté à la playlist avec succès');
    
    res.json({
      success: true,
      message: 'Morceau ajouté à la playlist avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout du morceau à la playlist:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'ajout du morceau à la playlist'
    });
  }
};

// Récupérer les morceaux d'une playlist
const getPlaylistTracks = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const streamerId = req.user.id;
    
    console.log('🎵 Récupération des morceaux de la playlist:', playlistId);
    
    // Vérifier que la playlist appartient au streamer
    const playlist = await db.query(
      'SELECT * FROM playlists WHERE id = $1 AND streamer_id = $2',
      [playlistId, streamerId]
    );
    
    if (playlist.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Playlist non trouvée'
      });
    }
    
    // Récupérer les morceaux
    const query = `
      SELECT p.*, pt.added_at as playlist_added_at
      FROM propositions p
      JOIN playlist_tracks pt ON p.id = pt.track_id
      WHERE pt.playlist_id = $1
      ORDER BY pt.added_at DESC
    `;
    
    const result = await db.query(query, [playlistId]);
    const tracks = result.rows;
    
    console.log('✅ Morceaux récupérés:', tracks.length);
    
    res.json({
      success: true,
      playlist: Playlist.fromDB(playlist.rows[0]).toJSON(),
      tracks: tracks
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des morceaux:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des morceaux'
    });
  }
};

// Supprimer une playlist
const deletePlaylist = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const streamerId = req.user.id;
    
    console.log('🎵 Suppression de la playlist:', playlistId);
    
    // Vérifier que la playlist appartient au streamer
    const playlist = await db.query(
      'SELECT * FROM playlists WHERE id = $1 AND streamer_id = $2',
      [playlistId, streamerId]
    );
    
    if (playlist.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Playlist non trouvée'
      });
    }
    
    // Supprimer les morceaux de la playlist
    await db.query('DELETE FROM playlist_tracks WHERE playlist_id = $1', [playlistId]);
    
    // Supprimer la playlist
    await db.query('DELETE FROM playlists WHERE id = $1', [playlistId]);
    
    console.log('✅ Playlist supprimée avec succès');
    
    res.json({
      success: true,
      message: 'Playlist supprimée avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de la playlist:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression de la playlist'
    });
  }
};

module.exports = {
  getPlaylists,
  createPlaylist,
  addTrackToPlaylist,
  getPlaylistTracks,
  deletePlaylist
}; 