const express = require('express');
const router = express.Router();
const SearchController = require('../controllers/searchController');
const { requireAuth } = require('../auth');

// Middleware d'authentification pour toutes les routes
router.use(requireAuth);

// === ROUTES SEARCH ===

// GET /api/search/tracks?q=query&limit=20 - Rechercher des morceaux sur Spotify
router.get('/tracks', SearchController.searchTracks);

module.exports = router; 