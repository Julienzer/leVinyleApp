const express = require('express');
const router = express.Router();
const SessionController = require('../controllers/sessionController');
const { requireAuth } = require('../auth');

// Middleware d'authentification pour toutes les routes
router.use(requireAuth);

// === ROUTES SESSIONS ===

// POST /api/sessions - Créer une nouvelle session
router.post('/', SessionController.createSession);

// GET /api/sessions/active - Obtenir toutes les sessions actives
router.get('/active', SessionController.getActiveSessions);

// GET /api/sessions/my - Obtenir les sessions du streamer connecté
router.get('/my', SessionController.getStreamerSessions);

// GET /api/sessions/:sessionCode - Obtenir une session par son code
router.get('/:sessionCode', SessionController.getSession);

// PUT /api/sessions/:sessionId - Mettre à jour une session
router.put('/:sessionId', SessionController.updateSession);

// DELETE /api/sessions/:sessionId - Supprimer une session
router.delete('/:sessionId', SessionController.deleteSession);

// PATCH /api/sessions/:sessionId/queue-mode - Changer le mode de file d'attente
router.patch('/:sessionId/queue-mode', SessionController.updateQueueMode);

// PATCH /api/sessions/:sessionId/toggle - Activer/désactiver une session
router.patch('/:sessionId/toggle', SessionController.toggleSession);

// GET /api/sessions/:sessionId/stats - Obtenir les statistiques d'une session
router.get('/:sessionId/stats', SessionController.getSessionStats);

// GET /api/sessions/check-code/:code - Vérifier la disponibilité d'un code
router.get('/check-code/:code', SessionController.checkCodeAvailability);

module.exports = router; 