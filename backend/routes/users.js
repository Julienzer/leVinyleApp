const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { requireAuth } = require('../auth');

// Middleware d'authentification pour toutes les routes
router.use(requireAuth);

// === ROUTES USERS ===

// GET /api/users/:userId - Obtenir les informations d'un utilisateur
router.get('/:userId', UserController.getUserInfo);

// GET /api/users/:streamerId/moderator-status - Vérifier si l'utilisateur connecté est modérateur du streamer
router.get('/:streamerId/moderator-status', UserController.checkModeratorStatus);

// GET /api/users/:streamerId/moderators - Obtenir les modérateurs d'un streamer
router.get('/:streamerId/moderators', UserController.getModerators);

// POST /api/users/:streamerId/moderators - Ajouter un modérateur
router.post('/:streamerId/moderators', UserController.addModerator);

// DELETE /api/users/:streamerId/moderators/:moderatorId - Retirer un modérateur
router.delete('/:streamerId/moderators/:moderatorId', UserController.removeModerator);

module.exports = router; 