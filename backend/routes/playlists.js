const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlistController');
const { requireAuth } = require('../auth');

// Middleware d'authentification pour toutes les routes
router.use(requireAuth);

// Routes pour les playlists
router.get('/', playlistController.getPlaylists);
router.post('/', playlistController.createPlaylist);
router.get('/:playlistId/tracks', playlistController.getPlaylistTracks);
router.post('/:playlistId/tracks/:trackId', playlistController.addTrackToPlaylist);
router.delete('/:playlistId', playlistController.deletePlaylist);

module.exports = router; 