const Session = require('../models/Session');
const User = require('../models/User');

class SessionController {
  // Créer une nouvelle session
  static async createSession(req, res) {
    try {
      const { name, isPrivate = false, preventDuplicates = true, queueMode = 'chronological' } = req.body;
      const streamerId = req.user.id;

      // Vérifier que l'utilisateur est un streamer
      if (!req.user.isStreamer) {
        return res.status(403).json({ error: 'Seuls les streamers peuvent créer des sessions' });
      }

      // Valider les données
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Le nom de la session est requis' });
      }

      // Générer un code unique basé sur le nom
      const code = await Session.generateUniqueCode(name);

      // Créer la session
      const session = await Session.create({
        code,
        name: name.trim(),
        streamer_id: streamerId,
        is_private: isPrivate,
        prevent_duplicates: preventDuplicates,
        queue_mode: queueMode
      });

      res.status(201).json({
        success: true,
        session: {
          ...session,
          streamer_name: req.user.display_name
        }
      });
    } catch (error) {
      console.error('Error creating session:', error);
      if (error.code === '23505') { // Violation de contrainte unique
        return res.status(409).json({ error: 'Ce code de session existe déjà' });
      }
      res.status(500).json({ error: 'Erreur lors de la création de la session' });
    }
  }

  // Obtenir une session par son code
  static async getSession(req, res) {
    try {
      const { sessionCode } = req.params;
      const userId = req.user?.id;

      // Vérifier l'accès à la session
      const accessCheck = await Session.canUserAccess(sessionCode, userId);
      
      if (!accessCheck.canAccess) {
        const statusCode = accessCheck.reason === 'Session not found' ? 404 : 403;
        return res.status(statusCode).json({ error: accessCheck.reason });
      }

      res.json({
        success: true,
        session: accessCheck.session
      });
    } catch (error) {
      console.error('Error getting session:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération de la session' });
    }
  }

  // Obtenir toutes les sessions d'un streamer
  static async getStreamerSessions(req, res) {
    try {
      const streamerId = req.user.id;

      // Vérifier que l'utilisateur est un streamer
      if (!req.user.isStreamer) {
        return res.status(403).json({ error: 'Accès refusé' });
      }

      const sessions = await Session.findByStreamer(streamerId);
      
      res.json({
        success: true,
        sessions
      });
    } catch (error) {
      console.error('Error getting streamer sessions:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des sessions' });
    }
  }

  // Obtenir toutes les sessions actives
  static async getActiveSessions(req, res) {
    try {
      const sessions = await Session.findActive();
      
      res.json({
        success: true,
        sessions
      });
    } catch (error) {
      console.error('Error getting active sessions:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des sessions actives' });
    }
  }

  // Mettre à jour le mode de file d'attente
  static async updateQueueMode(req, res) {
    try {
      const { sessionId } = req.params;
      const { queueMode } = req.body;

      // Vérifier que l'utilisateur est propriétaire de la session
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session non trouvée' });
      }

      if (session.streamer_id !== req.user.id) {
        return res.status(403).json({ error: 'Seul le streamer peut modifier le mode de file d\'attente' });
      }

      // Valider le mode de file d'attente
      if (!['chronological', 'random'].includes(queueMode)) {
        return res.status(400).json({ error: 'Mode de file d\'attente invalide' });
      }

      const updatedSession = await Session.updateQueueMode(sessionId, queueMode);
      
      res.json({
        success: true,
        session: updatedSession
      });
    } catch (error) {
      console.error('Error updating queue mode:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour du mode de file d\'attente' });
    }
  }

  // Activer/désactiver une session
  static async toggleSession(req, res) {
    try {
      const { sessionId } = req.params;
      const { active } = req.body;

      // Vérifier que l'utilisateur est propriétaire de la session
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session non trouvée' });
      }

      if (session.streamer_id !== req.user.id) {
        return res.status(403).json({ error: 'Seul le streamer peut modifier le statut de la session' });
      }

      const updatedSession = await Session.updateActive(sessionId, active);
      
      res.json({
        success: true,
        session: updatedSession
      });
    } catch (error) {
      console.error('Error toggling session:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour du statut de la session' });
    }
  }

  // Mettre à jour une session
  static async updateSession(req, res) {
    try {
      const { sessionId } = req.params;
      const updateData = req.body;

      // Vérifier que l'utilisateur est propriétaire de la session
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session non trouvée' });
      }

      if (session.streamer_id !== req.user.id) {
        return res.status(403).json({ error: 'Seul le streamer peut modifier la session' });
      }

      // Filtrer les champs autorisés
      const allowedFields = ['name', 'is_private', 'prevent_duplicates', 'queue_mode'];
      const filteredData = {};
      
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      });

      if (Object.keys(filteredData).length === 0) {
        return res.status(400).json({ error: 'Aucun champ valide à mettre à jour' });
      }

      const updatedSession = await Session.update(sessionId, filteredData);
      
      res.json({
        success: true,
        session: updatedSession
      });
    } catch (error) {
      console.error('Error updating session:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour de la session' });
    }
  }

  // Supprimer une session
  static async deleteSession(req, res) {
    try {
      const { sessionId } = req.params;

      // Vérifier que l'utilisateur est propriétaire de la session
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session non trouvée' });
      }

      if (session.streamer_id !== req.user.id) {
        return res.status(403).json({ error: 'Seul le streamer peut supprimer la session' });
      }

      await Session.delete(sessionId);
      
      res.json({
        success: true,
        message: 'Session supprimée avec succès'
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      res.status(500).json({ error: 'Erreur lors de la suppression de la session' });
    }
  }

  // Obtenir les statistiques d'une session
  static async getSessionStats(req, res) {
    try {
      const { sessionId } = req.params;

      // Vérifier que l'utilisateur a accès à la session
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session non trouvée' });
      }

      // Vérifier les permissions (streamer ou modérateur)
      const isStreamer = session.streamer_id === req.user.id;
      const isModerator = await User.isModeratorOf(req.user.id, session.streamer_id);

      if (!isStreamer && !isModerator) {
        return res.status(403).json({ error: 'Accès refusé' });
      }

      const stats = await Session.getStats(sessionId);
      
      res.json({
        success: true,
        stats: {
          ...stats,
          total_propositions: parseInt(stats.total_propositions),
          pending_propositions: parseInt(stats.pending_propositions),
          approved_propositions: parseInt(stats.approved_propositions),
          rejected_propositions: parseInt(stats.rejected_propositions),
          added_propositions: parseInt(stats.added_propositions),
          active_viewers: parseInt(stats.active_viewers)
        }
      });
    } catch (error) {
      console.error('Error getting session stats:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
    }
  }

  // Vérifier si un code de session est disponible
  static async checkCodeAvailability(req, res) {
    try {
      const { code } = req.params;
      const isAvailable = await Session.isCodeAvailable(code);
      
      res.json({
        success: true,
        available: isAvailable
      });
    } catch (error) {
      console.error('Error checking code availability:', error);
      res.status(500).json({ error: 'Erreur lors de la vérification du code' });
    }
  }
}

module.exports = SessionController; 