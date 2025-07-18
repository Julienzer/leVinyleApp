const express = require('express');
const router = express.Router();
const spotifyController = require('../controllers/spotifyController');
const { requireAuth } = require('../auth');

// Middleware d'authentification pour toutes les routes
router.use(requireAuth);

// Routes pour les playlists Spotify
router.get('/playlists', spotifyController.getSpotifyPlaylists);
router.get('/playlists/:playlistId', spotifyController.getSpotifyPlaylistDetails);
router.post('/playlists/:playlistId/tracks/:trackId', spotifyController.addTrackToSpotifyPlaylist);

module.exports = router; 