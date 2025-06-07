const express = require('express');
const router = express.Router();
const TrackController = require('../controllers/trackController');
const { requireModerator } = require('../auth');

// Submit a new track
router.post('/submit-track', TrackController.submitTrack);

// Get all pending tracks
router.get('/pending', TrackController.getPendingTracks);

// Get all approved tracks
router.get('/approved', TrackController.getApprovedTracks);

// Update track status (protégé)
router.patch('/track/:id', requireModerator, TrackController.updateTrackStatus);

module.exports = router; 