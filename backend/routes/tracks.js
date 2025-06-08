const express = require('express');
const router = express.Router();
const TrackController = require('../controllers/trackController');
const { requireModerator, requireAuth } = require('../auth');

// Submit a new track
router.post('/submit-track', requireAuth, TrackController.submitTrack);

// Get all pending tracks
router.get('/pending', TrackController.getPendingTracks);

// Get all approved tracks
router.get('/approved', TrackController.getApprovedTracks);

// Update track status (protégé)
router.patch('/track/:id', requireModerator, TrackController.updateTrackStatus);

// Approuver un morceau (ajout à la playlist Spotify)
router.post('/track/:id/approve', requireModerator, TrackController.approveTrack);

// Supprimer un morceau
router.delete('/track/:id', requireModerator, TrackController.deleteTrack);

module.exports = router; 