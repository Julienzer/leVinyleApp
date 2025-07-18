const db = require('../db');

class Session {
  constructor(id, code, name, streamer_id, is_private, prevent_duplicates, queue_mode, active) {
    this.id = id;
    this.code = code;
    this.name = name;
    this.streamer_id = streamer_id;
    this.is_private = is_private;
    this.prevent_duplicates = prevent_duplicates;
    this.queue_mode = queue_mode;
    this.active = active;
  }

  // Créer une nouvelle session
  static async create(sessionData) {
    const { code, name, streamer_id, is_private, prevent_duplicates, queue_mode } = sessionData;
    
    try {
      const result = await db.query(
        `INSERT INTO sessions (code, name, streamer_id, is_private, prevent_duplicates, queue_mode) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [code, name, streamer_id, is_private, prevent_duplicates, queue_mode]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  // Trouver une session par son code
  static async findByCode(code) {
    try {
      const result = await db.query(
        `SELECT s.*, u.display_name as streamer_name 
         FROM sessions s 
         JOIN users u ON s.streamer_id = u.id 
         WHERE s.code = $1`,
        [code]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding session by code:', error);
      throw error;
    }
  }

  // Trouver une session par son ID
  static async findById(id) {
    try {
      const result = await db.query(
        `SELECT s.*, u.display_name as streamer_name 
         FROM sessions s 
         JOIN users u ON s.streamer_id = u.id 
         WHERE s.id = $1`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding session by ID:', error);
      throw error;
    }
  }

  // Trouver toutes les sessions d'un streamer
  static async findByStreamer(streamerId) {
    try {
      const result = await db.query(
        `SELECT s.*, u.display_name as streamer_name 
         FROM sessions s 
         JOIN users u ON s.streamer_id = u.id 
         WHERE s.streamer_id = $1 
         ORDER BY s.created_at DESC`,
        [streamerId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error finding sessions by streamer:', error);
      throw error;
    }
  }

  // Trouver toutes les sessions actives
  static async findActive() {
    try {
      const result = await db.query(
        `SELECT s.*, u.display_name as streamer_name 
         FROM sessions s 
         JOIN users u ON s.streamer_id = u.id 
         WHERE s.active = TRUE 
         ORDER BY s.created_at DESC`
      );
      return result.rows;
    } catch (error) {
      console.error('Error finding active sessions:', error);
      throw error;
    }
  }

  // Mettre à jour le mode de file d'attente
  static async updateQueueMode(sessionId, queueMode) {
    try {
      const result = await db.query(
        'UPDATE sessions SET queue_mode = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [queueMode, sessionId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error updating queue mode:', error);
      throw error;
    }
  }

  // Activer/désactiver une session
  static async updateActive(sessionId, active) {
    try {
      const result = await db.query(
        'UPDATE sessions SET active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [active, sessionId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error updating session active status:', error);
      throw error;
    }
  }

  // Mettre à jour une session
  static async update(sessionId, updateData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Construire dynamiquement la requête UPDATE
    Object.keys(updateData).forEach(key => {
      fields.push(`${key} = $${paramIndex}`);
      values.push(updateData[key]);
      paramIndex++;
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(sessionId);

    try {
      const result = await db.query(
        `UPDATE sessions SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  }

  // Supprimer une session
  static async delete(sessionId) {
    try {
      const result = await db.query('DELETE FROM sessions WHERE id = $1 RETURNING *', [sessionId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  // Obtenir les statistiques d'une session
  static async getStats(sessionId) {
    try {
      const result = await db.query(
        `SELECT 
          COUNT(*) as total_propositions,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_propositions,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_propositions,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_propositions,
          COUNT(CASE WHEN status = 'added' THEN 1 END) as added_propositions,
          COUNT(DISTINCT viewer_id) as active_viewers
         FROM propositions 
         WHERE session_id = $1`,
        [sessionId]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error getting session stats:', error);
      throw error;
    }
  }

  // Vérifier si un code de session est disponible
  static async isCodeAvailable(code) {
    try {
      const result = await db.query('SELECT 1 FROM sessions WHERE code = $1', [code]);
      return result.rows.length === 0;
    } catch (error) {
      console.error('Error checking code availability:', error);
      throw error;
    }
  }

  // Générer un code unique pour une session
  static async generateUniqueCode(baseName) {
    let code = baseName.toLowerCase().replace(/[^a-z0-9]/g, '');
    let counter = 1;
    
    while (!(await this.isCodeAvailable(code))) {
      code = `${baseName.toLowerCase().replace(/[^a-z0-9]/g, '')}${counter}`;
      counter++;
    }
    
    return code;
  }

  // Vérifier si un utilisateur peut accéder à une session
  static async canUserAccess(sessionCode, userId) {
    try {
      const session = await this.findByCode(sessionCode);
      
      if (!session) {
        return { canAccess: false, reason: 'Session not found' };
      }

      if (!session.active) {
        return { canAccess: false, reason: 'Session inactive' };
      }

      // Si la session est privée, seul le streamer et ses modérateurs peuvent y accéder
      if (session.is_private) {
        if (session.streamer_id === userId) {
          return { canAccess: true, session };
        }
        
        // Vérifier si l'utilisateur est modérateur du streamer
        const User = require('./User');
        const isModerator = await User.isModeratorOf(userId, session.streamer_id);
        
        if (isModerator) {
          return { canAccess: true, session };
        }
        
        return { canAccess: false, reason: 'Private session - access denied' };
      }

      return { canAccess: true, session };
    } catch (error) {
      console.error('Error checking user access:', error);
      throw error;
    }
  }
}

module.exports = Session; 