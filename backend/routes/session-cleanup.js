const express = require('express');
const router = express.Router();
const SessionCleanupController = require('../controllers/sessionCleanupController');
const { requireAuth } = require('../auth');

// Middleware d'authentification pour toutes les routes
router.use(requireAuth);

// Routes pour les statistiques et vues de nettoyage
router.get('/stats', SessionCleanupController.getCleanupStats);
router.get('/view', SessionCleanupController.getCleanupView);

// Routes pour le nettoyage automatique (admin uniquement)
router.post('/cleanup', SessionCleanupController.performCleanup);

// Routes pour la gestion manuelle des sessions
router.patch('/:sessionId/deactivate', SessionCleanupController.deactivateSession);
router.delete('/:sessionId', SessionCleanupController.deleteSession);
router.patch('/:sessionId/auto-cleanup', SessionCleanupController.updateAutoCleanupSettings);
router.patch('/:sessionId/activity', SessionCleanupController.updateSessionActivity);

module.exports = router; 