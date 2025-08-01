const express = require('express');
const router = express.Router();
const spotifyController = require('../controllers/spotifyController');
const { requireAuth } = require('../auth');

// Middleware d'authentification pour toutes les routes
router.use(requireAuth);

// GET /api/spotify/playlists - Récupérer les playlists de l'utilisateur
router.get('/playlists', spotifyController.getSpotifyPlaylists);

// GET /api/spotify/playlists/:playlistId - Récupérer les détails d'une playlist
router.get('/playlists/:playlistId', spotifyController.getSpotifyPlaylistDetails);

// POST /api/spotify/playlists/:playlistId/tracks/:trackId - Ajouter un morceau à une playlist
router.post('/playlists/:playlistId/tracks/:trackId', spotifyController.addTrackToSpotifyPlaylist);

// GET /api/spotify/tracks/:trackId/preview - Récupérer les infos d'un track (pour preview)
router.get('/tracks/:trackId/preview', spotifyController.getTrackPreview);

module.exports = router; 