const express = require('express');
const router = express.Router();
const PropositionController = require('../controllers/propositionController');
const { requireAuth } = require('../auth');

// Middleware d'authentification pour toutes les routes
router.use(requireAuth);

// === ROUTES PROPOSITIONS ===

// POST /api/sessions/:sessionId/propositions - Créer une nouvelle proposition
router.post('/sessions/:sessionId/propositions', PropositionController.createProposition);

// GET /api/sessions/:sessionId/propositions/pending - Obtenir les propositions en attente
router.get('/sessions/:sessionId/propositions/pending', PropositionController.getPendingPropositions);

// GET /api/sessions/:sessionId/propositions/approved - Obtenir les propositions approuvées
router.get('/sessions/:sessionId/propositions/approved', PropositionController.getApprovedPropositions);

// GET /api/sessions/:sessionId/propositions/history - Obtenir l'historique des propositions
router.get('/sessions/:sessionId/propositions/history', PropositionController.getPropositionsHistory);

// GET /api/sessions/:sessionId/my-propositions - Obtenir mes propositions dans une session
router.get('/sessions/:sessionId/my-propositions', PropositionController.getMyPropositions);

// POST /api/sessions/:sessionId/propositions/:propositionId/approve - Approuver une proposition
router.post('/sessions/:sessionId/propositions/:propositionId/approve', PropositionController.approveProposition);

// POST /api/sessions/:sessionId/propositions/:propositionId/reject - Rejeter une proposition
router.post('/sessions/:sessionId/propositions/:propositionId/reject', PropositionController.rejectProposition);

// POST /api/sessions/:sessionId/propositions/:propositionId/requeue - Remettre en file d'attente
router.post('/sessions/:sessionId/propositions/:propositionId/requeue', PropositionController.requeueProposition);

// POST /api/sessions/:sessionId/shuffle - Mélanger la file d'attente
router.post('/sessions/:sessionId/shuffle', PropositionController.shuffleQueue);

// POST /api/sessions/:sessionId/tracks/:propositionId/add-to-playlist - Ajouter à la playlist
router.post('/sessions/:sessionId/tracks/:propositionId/add-to-playlist', PropositionController.markAsAddedToPlaylist);

// POST /api/sessions/:sessionId/tracks/:propositionId/reject - Rejeter une proposition approuvée
router.post('/sessions/:sessionId/tracks/:propositionId/reject', PropositionController.rejectApprovedProposition);

// DELETE /api/sessions/:sessionId/propositions/:propositionId - Supprimer une proposition
router.delete('/sessions/:sessionId/propositions/:propositionId', PropositionController.deleteProposition);

module.exports = router; 