const Proposition = require('../models/Proposition');
const Session = require('../models/Session');
const User = require('../models/User');
const { checkTwitchModeratorStatus } = require('../auth');

class PropositionController {
  // Créer une nouvelle proposition
  static async createProposition(req, res) {
    try {
      const { sessionId } = req.params;
      const { spotify_url, track_name, artist, album, duration, message } = req.body;
      const viewerId = req.user.id;

      // Vérifier que la session existe et est accessible
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session non trouvée' });
      }

      if (!session.active) {
        return res.status(403).json({ error: 'Cette session n\'est pas active' });
      }

      // Valider les données
      if (!spotify_url || !spotify_url.trim()) {
        return res.status(400).json({ error: 'L\'URL Spotify est requise' });
      }

      // Vérifier si le morceau a déjà été proposé dans cette session
      const isDuplicate = await Proposition.isDuplicate(sessionId, spotify_url);
      if (isDuplicate) {
        return res.status(409).json({ error: 'Ce morceau a déjà été proposé dans cette session' });
      }

      // Vérifier si la session empêche les doublons inter-sessions
      if (session.prevent_duplicates) {
        const isInHistory = await Proposition.isInHistory(session.streamer_id, spotify_url);
        if (isInHistory) {
          return res.status(422).json({ 
            error: 'Ce morceau a déjà été joué dans une session précédente de ce streamer' 
          });
        }
      }

      // Créer la proposition
      const proposition = await Proposition.create({
        session_id: sessionId,
        viewer_id: viewerId,
        spotify_url: spotify_url.trim(),
        track_name: track_name?.trim(),
        artist: artist?.trim(),
        album: album?.trim(),
        duration: duration?.trim(),
        message: message?.trim()
      });

      // Récupérer la proposition complète avec les noms d'utilisateur
      const fullProposition = await Proposition.findById(proposition.id);

      res.status(201).json({
        success: true,
        proposition: fullProposition
      });
    } catch (error) {
      console.error('Error creating proposition:', error);
      res.status(500).json({ error: 'Erreur lors de la création de la proposition' });
    }
  }

  // Obtenir les propositions en attente d'une session
  static async getPendingPropositions(req, res) {
    try {
      const { sessionId } = req.params;

      // Vérifier que l'utilisateur peut modérer cette session
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session non trouvée' });
      }

      const isStreamer = session.streamer_id === req.user.id;
      let isModerator = false;
      
      // Vérifier si l'utilisateur est modérateur via l'API Twitch
      if (!isStreamer) {
        try {
          isModerator = await checkTwitchModeratorStatus(req.user.id, session.streamer_id);
          console.log('🔍 Vérification modérateur pour propositions pending:', {
            userId: req.user.id,
            streamerId: session.streamer_id,
            isModerator
          });
        } catch (error) {
          console.error('Erreur lors de la vérification du statut de modérateur:', error);
          // Si la vérification échoue, on refuse l'accès sauf si c'est le streamer
          isModerator = false;
        }
      }

      if (!isStreamer && !isModerator) {
        return res.status(403).json({ error: 'Accès refusé - Vous devez être le streamer ou un modérateur' });
      }

      const propositions = await Proposition.findPending(sessionId);

      res.json({
        success: true,
        propositions
      });
    } catch (error) {
      console.error('Error getting pending propositions:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des propositions en attente' });
    }
  }

  // Obtenir les propositions approuvées d'une session
  static async getApprovedPropositions(req, res) {
    try {
      const { sessionId } = req.params;

      // Vérifier que l'utilisateur peut voir cette session
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session non trouvée' });
      }

      const isStreamer = session.streamer_id === req.user.id;
      let isModerator = false;
      
      // Vérifier si l'utilisateur est modérateur via l'API Twitch
      if (!isStreamer) {
        try {
          isModerator = await checkTwitchModeratorStatus(req.user.id, session.streamer_id);
          console.log('🔍 Vérification modérateur pour propositions approuvées:', {
            userId: req.user.id,
            streamerId: session.streamer_id,
            isModerator
          });
        } catch (error) {
          console.error('Erreur lors de la vérification du statut de modérateur:', error);
          isModerator = false;
        }
      }

      if (!isStreamer && !isModerator) {
        return res.status(403).json({ error: 'Accès refusé - Vous devez être le streamer ou un modérateur' });
      }

      const propositions = await Proposition.findApproved(sessionId);

      res.json({
        success: true,
        propositions
      });
    } catch (error) {
      console.error('Error getting approved propositions:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des propositions approuvées' });
    }
  }

  // Obtenir l'historique des propositions d'une session
  static async getPropositionsHistory(req, res) {
    try {
      const { sessionId } = req.params;

      // Vérifier que l'utilisateur peut modérer cette session
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session non trouvée' });
      }

      const isStreamer = session.streamer_id === req.user.id;
      let isModerator = false;
      
      // Vérifier si l'utilisateur est modérateur via l'API Twitch
      if (!isStreamer) {
        try {
          isModerator = await checkTwitchModeratorStatus(req.user.id, session.streamer_id);
          console.log('🔍 Vérification modérateur pour historique:', {
            userId: req.user.id,
            streamerId: session.streamer_id,
            isModerator
          });
        } catch (error) {
          console.error('Erreur lors de la vérification du statut de modérateur:', error);
          isModerator = false;
        }
      }

      if (!isStreamer && !isModerator) {
        return res.status(403).json({ error: 'Accès refusé - Vous devez être le streamer ou un modérateur' });
      }

      const propositions = await Proposition.findHistory(sessionId);

      res.json({
        success: true,
        propositions
      });
    } catch (error) {
      console.error('Error getting propositions history:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
    }
  }

  // Obtenir les propositions d'un utilisateur dans une session
  static async getMyPropositions(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      // Vérifier que la session existe
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session non trouvée' });
      }

      const propositions = await Proposition.findByUserInSession(sessionId, userId);

      res.json({
        success: true,
        propositions
      });
    } catch (error) {
      console.error('Error getting user propositions:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération de vos propositions' });
    }
  }

  // Approuver une proposition
  static async approveProposition(req, res) {
    try {
      const { sessionId, propositionId } = req.params;
      const moderatorId = req.user.id;

      console.log('🔍 Début approbation proposition:', {
        sessionId,
        propositionId,
        moderatorId,
        moderatorName: req.user.display_name
      });

      // Vérifier que l'utilisateur modérateur existe en base de données
      const User = require('../models/User');
      const moderatorUser = await User.findById(moderatorId);
      if (!moderatorUser) {
        console.error('❌ Utilisateur modérateur non trouvé en base:', moderatorId);
        return res.status(400).json({ 
          error: 'Utilisateur modérateur non trouvé. Veuillez vous reconnecter.' 
        });
      }

      console.log('✅ Utilisateur modérateur trouvé:', moderatorUser.display_name);

      // Vérifier que l'utilisateur peut modérer cette session
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session non trouvée' });
      }

      const isStreamer = session.streamer_id === req.user.id;
      let isModerator = false;
      
      // Vérifier si l'utilisateur est modérateur via l'API Twitch
      if (!isStreamer) {
        try {
          isModerator = await checkTwitchModeratorStatus(req.user.id, session.streamer_id);
          console.log('🔍 Vérification modérateur pour approbation:', {
            userId: req.user.id,
            streamerId: session.streamer_id,
            isModerator
          });
        } catch (error) {
          console.error('Erreur lors de la vérification du statut de modérateur:', error);
          isModerator = false;
        }
      }

      if (!isStreamer && !isModerator) {
        return res.status(403).json({ error: 'Accès refusé - Vous devez être le streamer ou un modérateur' });
      }

      // Vérifier que la proposition existe et est en attente
      const proposition = await Proposition.findById(propositionId);
      if (!proposition) {
        return res.status(404).json({ error: 'Proposition non trouvée' });
      }

      if (proposition.session_id !== parseInt(sessionId)) {
        return res.status(400).json({ error: 'Cette proposition n\'appartient pas à cette session' });
      }

      if (proposition.status !== 'pending') {
        return res.status(400).json({ error: 'Cette proposition a déjà été traitée' });
      }

      console.log('✅ Toutes les vérifications passées, approbation de la proposition...');

      // Approuver la proposition
      const updatedProposition = await Proposition.approve(propositionId, moderatorId);

      console.log('✅ Proposition approuvée, mise à jour des positions...');

      // Mettre à jour les positions de la file d'attente
      await Proposition.updateQueuePositions(sessionId, session.queue_mode);

      console.log('✅ Positions mises à jour, envoi de la réponse...');

      res.json({
        success: true,
        proposition: updatedProposition
      });
    } catch (error) {
      console.error('Error approving proposition:', error);
      res.status(500).json({ error: 'Erreur lors de l\'approbation de la proposition' });
    }
  }

  // Rejeter une proposition
  static async rejectProposition(req, res) {
    try {
      const { sessionId, propositionId } = req.params;
      const moderatorId = req.user.id;

      // Vérifier que l'utilisateur peut modérer cette session
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session non trouvée' });
      }

      const isStreamer = session.streamer_id === req.user.id;
      let isModerator = false;
      
      // Vérifier si l'utilisateur est modérateur via l'API Twitch
      if (!isStreamer) {
        try {
          isModerator = await checkTwitchModeratorStatus(req.user.id, session.streamer_id);
          console.log('🔍 Vérification modérateur pour rejet:', {
            userId: req.user.id,
            streamerId: session.streamer_id,
            isModerator
          });
        } catch (error) {
          console.error('Erreur lors de la vérification du statut de modérateur:', error);
          isModerator = false;
        }
      }

      if (!isStreamer && !isModerator) {
        return res.status(403).json({ error: 'Accès refusé - Vous devez être le streamer ou un modérateur' });
      }

      // Vérifier que la proposition existe et est en attente
      const proposition = await Proposition.findById(propositionId);
      if (!proposition) {
        return res.status(404).json({ error: 'Proposition non trouvée' });
      }

      if (proposition.session_id !== parseInt(sessionId)) {
        return res.status(400).json({ error: 'Cette proposition n\'appartient pas à cette session' });
      }

      if (proposition.status !== 'pending') {
        return res.status(400).json({ error: 'Cette proposition a déjà été traitée' });
      }

      // Rejeter la proposition
      const updatedProposition = await Proposition.reject(propositionId, moderatorId);

      res.json({
        success: true,
        proposition: updatedProposition
      });
    } catch (error) {
      console.error('Error rejecting proposition:', error);
      res.status(500).json({ error: 'Erreur lors du refus de la proposition' });
    }
  }

  // Remettre une proposition en file d'attente
  static async requeueProposition(req, res) {
    try {
      const { sessionId, propositionId } = req.params;

      // Vérifier que l'utilisateur peut modérer cette session
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session non trouvée' });
      }

      const isStreamer = session.streamer_id === req.user.id;
      let isModerator = false;
      
      // Vérifier si l'utilisateur est modérateur via l'API Twitch
      if (!isStreamer) {
        try {
          isModerator = await checkTwitchModeratorStatus(req.user.id, session.streamer_id);
          console.log('🔍 Vérification modérateur pour requeue:', {
            userId: req.user.id,
            streamerId: session.streamer_id,
            isModerator
          });
        } catch (error) {
          console.error('Erreur lors de la vérification du statut de modérateur:', error);
          isModerator = false;
        }
      }

      if (!isStreamer && !isModerator) {
        return res.status(403).json({ error: 'Accès refusé - Vous devez être le streamer ou un modérateur' });
      }

      // Vérifier que la proposition existe et a été traitée
      const proposition = await Proposition.findById(propositionId);
      if (!proposition) {
        return res.status(404).json({ error: 'Proposition non trouvée' });
      }

      if (proposition.session_id !== parseInt(sessionId)) {
        return res.status(400).json({ error: 'Cette proposition n\'appartient pas à cette session' });
      }

      if (proposition.status === 'pending') {
        return res.status(400).json({ error: 'Cette proposition est déjà en attente' });
      }

      // Remettre en file d'attente
      const updatedProposition = await Proposition.requeue(propositionId);

      res.json({
        success: true,
        proposition: updatedProposition
      });
    } catch (error) {
      console.error('Error requeuing proposition:', error);
      res.status(500).json({ error: 'Erreur lors de la remise en file d\'attente' });
    }
  }

  // Mélanger la file d'attente
  static async shuffleQueue(req, res) {
    try {
      const { sessionId } = req.params;

      // Vérifier que l'utilisateur est le streamer
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session non trouvée' });
      }

      if (session.streamer_id !== req.user.id) {
        return res.status(403).json({ error: 'Seul le streamer peut mélanger la file d\'attente' });
      }

      // Mélanger la file d'attente
      const shuffledCount = await Proposition.shuffleQueue(sessionId);

      res.json({
        success: true,
        message: `${shuffledCount} propositions mélangées`
      });
    } catch (error) {
      console.error('Error shuffling queue:', error);
      res.status(500).json({ error: 'Erreur lors du mélange de la file d\'attente' });
    }
  }

  // Marquer une proposition comme ajoutée à la playlist
  static async markAsAddedToPlaylist(req, res) {
    try {
      const { sessionId, propositionId } = req.params;

      // Vérifier que l'utilisateur est le streamer
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session non trouvée' });
      }

      if (session.streamer_id !== req.user.id) {
        return res.status(403).json({ error: 'Seul le streamer peut ajouter des morceaux à la playlist' });
      }

      // Vérifier que la proposition existe et est approuvée
      const proposition = await Proposition.findById(propositionId);
      if (!proposition) {
        return res.status(404).json({ error: 'Proposition non trouvée' });
      }

      if (proposition.session_id !== parseInt(sessionId)) {
        return res.status(400).json({ error: 'Cette proposition n\'appartient pas à cette session' });
      }

      if (proposition.status !== 'approved') {
        return res.status(400).json({ error: 'Cette proposition n\'a pas été approuvée' });
      }

      // Marquer comme ajoutée
      const updatedProposition = await Proposition.markAsAdded(propositionId);

      // Ajouter à l'historique
      await Proposition.addToHistory(
        sessionId,
        session.streamer_id,
        proposition.spotify_url,
        proposition.track_name,
        proposition.artist
      );

      res.json({
        success: true,
        proposition: updatedProposition
      });
    } catch (error) {
      console.error('Error marking proposition as added:', error);
      res.status(500).json({ error: 'Erreur lors de l\'ajout à la playlist' });
    }
  }

  // Rejeter une proposition approuvée (streamer uniquement)
  static async rejectApprovedProposition(req, res) {
    try {
      const { sessionId, propositionId } = req.params;

      // Vérifier que l'utilisateur est le streamer
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session non trouvée' });
      }

      if (session.streamer_id !== req.user.id) {
        return res.status(403).json({ error: 'Seul le streamer peut rejeter des propositions approuvées' });
      }

      // Vérifier que la proposition existe et est approuvée
      const proposition = await Proposition.findById(propositionId);
      if (!proposition) {
        return res.status(404).json({ error: 'Proposition non trouvée' });
      }

      if (proposition.session_id !== parseInt(sessionId)) {
        return res.status(400).json({ error: 'Cette proposition n\'appartient pas à cette session' });
      }

      if (proposition.status !== 'approved') {
        return res.status(400).json({ error: 'Cette proposition n\'est pas approuvée' });
      }

      // Rejeter la proposition
      const updatedProposition = await Proposition.reject(propositionId, req.user.id);

      res.json({
        success: true,
        proposition: updatedProposition
      });
    } catch (error) {
      console.error('Error rejecting approved proposition:', error);
      res.status(500).json({ error: 'Erreur lors du refus de la proposition' });
    }
  }

  // Supprimer une proposition
  static async deleteProposition(req, res) {
    try {
      const { sessionId, propositionId } = req.params;

      // Vérifier que l'utilisateur est le streamer ou le créateur de la proposition
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session non trouvée' });
      }

      const proposition = await Proposition.findById(propositionId);
      if (!proposition) {
        return res.status(404).json({ error: 'Proposition non trouvée' });
      }

      const isStreamer = session.streamer_id === req.user.id;
      const isOwner = proposition.viewer_id === req.user.id;

      if (!isStreamer && !isOwner) {
        return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres propositions' });
      }

      // Supprimer la proposition
      await Proposition.delete(propositionId);

      res.json({
        success: true,
        message: 'Proposition supprimée avec succès'
      });
    } catch (error) {
      console.error('Error deleting proposition:', error);
      res.status(500).json({ error: 'Erreur lors de la suppression de la proposition' });
    }
  }
}

module.exports = PropositionController; 