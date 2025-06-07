const express = require('express');
const router = express.Router();
const TrackController = require('../controllers/trackController');

// Submit a new track
router.post('/submit-track', TrackController.submitTrack);

// Get all pending tracks
router.get('/pending', TrackController.getPendingTracks);

// Get all approved tracks
router.get('/approved', TrackController.getApprovedTracks);

// Update track status
router.patch('/track/:id', TrackController.updateTrackStatus);

module.exports = router; 