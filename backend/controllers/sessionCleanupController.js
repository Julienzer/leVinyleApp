const db = require('../db');
const Session = require('../models/Session');

class SessionCleanupController {
  
  // Obtenir les statistiques de nettoyage des sessions
  static async getCleanupStats(req, res) {
    try {
      console.log('📊 Récupération des statistiques de nettoyage...');
      
      const result = await db.query('SELECT * FROM get_session_cleanup_stats()');
      const stats = result.rows[0];
      
      console.log('✅ Statistiques récupérées:', stats);
      
      res.json({
        success: true,
        stats: {
          total: parseInt(stats.total_sessions),
          active: parseInt(stats.active_sessions), 
          inactive: parseInt(stats.inactive_sessions),
          old: parseInt(stats.old_sessions),
          cleanup_candidates: parseInt(stats.cleanup_candidates)
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des statistiques:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des statistiques'
      });
    }
  }

  // Obtenir la vue détaillée des sessions à nettoyer
  static async getCleanupView(req, res) {
    try {
      const streamerId = req.user?.id;
      const isAdmin = req.user?.role === 'admin';
      
      console.log('🔍 Récupération des sessions à nettoyer pour:', streamerId);
      
      let query = 'SELECT * FROM sessions_cleanup_view';
      let params = [];
      
      // Si pas admin, filtrer par streamer
      if (!isAdmin && streamerId) {
        query += ' WHERE streamer_id = $1';
        params.push(streamerId);
      }
      
      query += ' ORDER BY last_activity DESC';
      
      const result = await db.query(query, params);
      const sessions = result.rows.map(session => ({
        ...session,
        hours_inactive: parseFloat(session.hours_inactive),
        days_old: parseFloat(session.days_old),
        total_propositions: parseInt(session.total_propositions)
      }));
      
      console.log(`✅ ${sessions.length} sessions récupérées`);
      
      res.json({
        success: true,
        sessions: sessions,
        user_role: req.user?.role || 'viewer'
      });
      
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de la vue:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des sessions'
      });
    }
  }

  // Effectuer le nettoyage automatique
  static async performCleanup(req, res) {
    try {
      const { inactive_hours = 24, delete_old_days = 30, dry_run = false } = req.body;
      const isAdmin = req.user?.role === 'admin';
      
      // Seuls les admins peuvent faire le nettoyage global
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Seuls les administrateurs peuvent effectuer le nettoyage global'
        });
      }
      
      console.log('🧹 Nettoyage des sessions:', { inactive_hours, delete_old_days, dry_run });
      
      if (dry_run) {
        // Mode simulation - compter seulement
        const deactivateQuery = `
          SELECT COUNT(*) as count 
          FROM sessions 
          WHERE active = TRUE 
            AND auto_cleanup = TRUE
            AND last_activity < (CURRENT_TIMESTAMP - ($1 || ' hours')::INTERVAL)
        `;
        
        const deleteQuery = `
          SELECT COUNT(*) as count 
          FROM sessions 
          WHERE auto_cleanup = TRUE
            AND active = FALSE 
            AND updated_at < (CURRENT_TIMESTAMP - ($1 || ' days')::INTERVAL)
        `;
        
        const [deactivateResult, deleteResult] = await Promise.all([
          db.query(deactivateQuery, [inactive_hours]),
          db.query(deleteQuery, [delete_old_days])
        ]);
        
        res.json({
          success: true,
          dry_run: true,
          results: [
            {
              action: 'deactivated',
              session_count: parseInt(deactivateResult.rows[0].count),
              details: `Sessions à désactiver après ${inactive_hours} heures d'inactivité`
            },
            {
              action: 'deleted', 
              session_count: parseInt(deleteResult.rows[0].count),
              details: `Sessions à supprimer après ${delete_old_days} jours`
            }
          ]
        });
        
      } else {
        // Nettoyage réel
        const result = await db.query(
          'SELECT * FROM cleanup_inactive_sessions($1, $2)',
          [inactive_hours, delete_old_days]
        );
        
        const results = result.rows.map(row => ({
          action: row.action,
          session_count: parseInt(row.session_count),
          details: row.details
        }));
        
        console.log('✅ Nettoyage terminé:', results);
        
        res.json({
          success: true,
          dry_run: false,
          results: results
        });
      }
      
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors du nettoyage des sessions'
      });
    }
  }

  // Désactiver manuellement une session spécifique
  static async deactivateSession(req, res) {
    try {
      const { sessionId } = req.params;
      const streamerId = req.user?.id;
      const isAdmin = req.user?.role === 'admin';
      
      console.log('🔴 Désactivation manuelle de la session:', sessionId);
      
      // Vérifier que la session existe et appartient au streamer (sauf admin)
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session non trouvée'
        });
      }
      
      if (!isAdmin && session.streamer_id !== streamerId) {
        return res.status(403).json({
          success: false,
          error: 'Vous ne pouvez désactiver que vos propres sessions'
        });
      }
      
      // Désactiver la session
      const updatedSession = await Session.updateActive(sessionId, false);
      
      console.log('✅ Session désactivée:', updatedSession.code);
      
      res.json({
        success: true,
        message: 'Session désactivée avec succès',
        session: updatedSession
      });
      
    } catch (error) {
      console.error('❌ Erreur lors de la désactivation:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la désactivation de la session'
      });
    }
  }

  // Supprimer manuellement une session spécifique
  static async deleteSession(req, res) {
    try {
      const { sessionId } = req.params;
      const streamerId = req.user?.id;
      const isAdmin = req.user?.role === 'admin';
      
      console.log('🗑️ Suppression manuelle de la session:', sessionId);
      
      // Vérifier que la session existe et appartient au streamer (sauf admin)
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session non trouvée'
        });
      }
      
      if (!isAdmin && session.streamer_id !== streamerId) {
        return res.status(403).json({
          success: false,
          error: 'Vous ne pouvez supprimer que vos propres sessions'
        });
      }
      
      // Supprimer la session (et toutes ses propositions via CASCADE)
      const deletedSession = await Session.delete(sessionId);
      
      console.log('✅ Session supprimée:', deletedSession.code);
      
      res.json({
        success: true,
        message: 'Session supprimée avec succès',
        session: deletedSession
      });
      
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la suppression de la session'
      });
    }
  }

  // Configuration du nettoyage automatique pour un streamer
  static async updateAutoCleanupSettings(req, res) {
    try {
      const { sessionId } = req.params;
      const { auto_cleanup } = req.body;
      const streamerId = req.user?.id;
      
      console.log('⚙️ Mise à jour du nettoyage auto pour:', sessionId, auto_cleanup);
      
      // Vérifier que la session appartient au streamer
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session non trouvée'
        });
      }
      
      if (session.streamer_id !== streamerId) {
        return res.status(403).json({
          success: false,
          error: 'Vous ne pouvez modifier que vos propres sessions'
        });
      }
      
      // Mettre à jour le paramètre auto_cleanup
      const updatedSession = await Session.update(sessionId, { auto_cleanup });
      
      console.log('✅ Paramètre auto_cleanup mis à jour');
      
      res.json({
        success: true,
        message: `Nettoyage automatique ${auto_cleanup ? 'activé' : 'désactivé'}`,
        session: updatedSession
      });
      
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour des paramètres'
      });
    }
  }

  // Mettre à jour l'activité d'une session manuellement
  static async updateSessionActivity(req, res) {
    try {
      const { sessionId } = req.params;
      const streamerId = req.user?.id;
      
      console.log('⏰ Mise à jour de l\'activité pour:', sessionId);
      
      // Vérifier que la session appartient au streamer
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session non trouvée'
        });
      }
      
      if (session.streamer_id !== streamerId) {
        return res.status(403).json({
          success: false,
          error: 'Vous ne pouvez modifier que vos propres sessions'
        });
      }
      
      // Mettre à jour last_activity
      await db.query(
        'UPDATE sessions SET last_activity = CURRENT_TIMESTAMP WHERE id = $1',
        [sessionId]
      );
      
      console.log('✅ Activité mise à jour');
      
      res.json({
        success: true,
        message: 'Activité de la session mise à jour'
      });
      
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de l\'activité:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour de l\'activité'
      });
    }
  }
}

module.exports = SessionCleanupController; 