const User = require('../models/User');
const Session = require('../models/Session');
const { checkTwitchModeratorStatus } = require('../auth');

class UserController {
  // Vérifier si un utilisateur est modérateur d'un streamer via l'API Twitch
  static async checkModeratorStatus(req, res) {
    try {
      const { streamerId } = req.params;
      const userId = req.user.id;

      console.log('🔍 Vérification du statut de modérateur Twitch...');
      console.log('   - Utilisateur connecté:', userId, '(' + req.user.display_name + ')');
      console.log('   - Streamer cible:', streamerId);

      // Utiliser l'API Twitch pour vérifier le statut de modérateur
      const isModerator = await checkTwitchModeratorStatus(userId, streamerId);

      res.json({
        success: true,
        isModerator,
        userId,
        streamerId,
        method: 'twitch_api'
      });
    } catch (error) {
      console.error('Error checking moderator status:', error);
      res.status(500).json({ error: 'Erreur lors de la vérification du statut de modérateur' });
    }
  }

  // Les modérateurs sont maintenant gérés directement via Twitch
  static async addModerator(req, res) {
    res.status(501).json({ 
      error: 'Les modérateurs sont maintenant gérés directement via Twitch. Utilisez le tableau de bord Twitch pour ajouter des modérateurs.',
      redirect_url: 'https://dashboard.twitch.tv/u/' + req.user.display_name + '/settings/moderation'
    });
  }

  // Retirer un modérateur d'un streamer
  static async removeModerator(req, res) {
    res.status(501).json({ 
      error: 'Les modérateurs sont maintenant gérés directement via Twitch. Utilisez le tableau de bord Twitch pour retirer des modérateurs.',
      redirect_url: 'https://dashboard.twitch.tv/u/' + req.user.display_name + '/settings/moderation'
    });
  }

  // Obtenir les modérateurs d'un streamer
  static async getModerators(req, res) {
    try {
      const { streamerId } = req.params;
      const requesterId = req.user.id;

      // Vérifier que l'utilisateur peut voir les modérateurs
      const isStreamer = requesterId === streamerId;
      const isModerator = await User.isModeratorOf(requesterId, streamerId);

      if (!isStreamer && !isModerator) {
        return res.status(403).json({ error: 'Accès refusé' });
      }

      const moderators = await User.getModeratorsByStreamer(streamerId);

      res.json({
        success: true,
        moderators,
        streamerId
      });
    } catch (error) {
      console.error('Error getting moderators:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des modérateurs' });
    }
  }

  // Obtenir les informations d'un utilisateur
  static async getUserInfo(req, res) {
    try {
      const { userId } = req.params;
      const requesterId = req.user.id;

      // Pour l'instant, permettre à tous les utilisateurs authentifiés de voir les infos de base
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      // Retourner seulement les informations publiques
      res.json({
        success: true,
        user: {
          id: user.id,
          display_name: user.display_name,
          role: user.role,
          is_streamer: user.is_streamer,
          profile_picture: user.profile_picture,
          created_at: user.created_at
        }
      });
    } catch (error) {
      console.error('Error getting user info:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des informations utilisateur' });
    }
  }
}

module.exports = UserController; 