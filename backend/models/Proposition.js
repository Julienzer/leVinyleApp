const db = require('../db');

class Proposition {
  constructor(id, session_id, viewer_id, spotify_url, track_name, artist, album, duration, message, status, queue_position) {
    this.id = id;
    this.session_id = session_id;
    this.viewer_id = viewer_id;
    this.spotify_url = spotify_url;
    this.track_name = track_name;
    this.artist = artist;
    this.album = album;
    this.duration = duration;
    this.message = message;
    this.status = status;
    this.queue_position = queue_position;
  }

  // Créer une nouvelle proposition
  static async create(propositionData) {
    const { 
      session_id, 
      viewer_id, 
      spotify_url, 
      track_name, 
      artist, 
      album, 
      duration, 
      message 
    } = propositionData;
    
    try {
      const result = await db.query(
        `INSERT INTO propositions 
         (session_id, viewer_id, spotify_url, track_name, artist, album, duration, message) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING *`,
        [session_id, viewer_id, spotify_url, track_name, artist, album, duration, message]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating proposition:', error);
      throw error;
    }
  }

  // Trouver une proposition par ID
  static async findById(id) {
    try {
      const result = await db.query(
        `SELECT p.*, u.display_name as viewer_name, m.display_name as moderator_name
         FROM propositions p
         JOIN users u ON p.viewer_id = u.id
         LEFT JOIN users m ON p.moderator_id = m.id
         WHERE p.id = $1`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding proposition by ID:', error);
      throw error;
    }
  }

  // Trouver toutes les propositions d'une session
  static async findBySession(sessionId, status = null) {
    try {
      let query = `
        SELECT p.*, u.display_name as viewer_name, m.display_name as moderator_name
        FROM propositions p
        JOIN users u ON p.viewer_id = u.id
        LEFT JOIN users m ON p.moderator_id = m.id
        WHERE p.session_id = $1
      `;
      
      const values = [sessionId];
      
      if (status) {
        query += ' AND p.status = $2';
        values.push(status);
      }
      
      query += ' ORDER BY p.created_at DESC';
      
      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error finding propositions by session:', error);
      throw error;
    }
  }

  // Trouver les propositions en attente d'une session
  static async findPending(sessionId) {
    return this.findBySession(sessionId, 'pending');
  }

  // Trouver les propositions approuvées d'une session
  static async findApproved(sessionId) {
    try {
      const result = await db.query(
        `SELECT p.*, u.display_name as viewer_name, m.display_name as moderator_name
         FROM propositions p
         JOIN users u ON p.viewer_id = u.id
         LEFT JOIN users m ON p.moderator_id = m.id
         WHERE p.session_id = $1 AND p.status IN ('approved', 'added')
         ORDER BY p.queue_position ASC, p.moderated_at ASC`,
        [sessionId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error finding approved propositions:', error);
      throw error;
    }
  }

  // Trouver l'historique des propositions modérées
  static async findHistory(sessionId) {
    try {
      const result = await db.query(
        `SELECT p.*, u.display_name as viewer_name, m.display_name as moderator_name
         FROM propositions p
         JOIN users u ON p.viewer_id = u.id
         LEFT JOIN users m ON p.moderator_id = m.id
         WHERE p.session_id = $1 AND p.status IN ('approved', 'rejected', 'added')
         ORDER BY p.moderated_at DESC`,
        [sessionId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error finding proposition history:', error);
      throw error;
    }
  }

  // Trouver les propositions d'un utilisateur dans une session
  static async findByUserInSession(sessionId, userId) {
    try {
      const result = await db.query(
        `SELECT p.*, u.display_name as viewer_name, m.display_name as moderator_name
         FROM propositions p
         JOIN users u ON p.viewer_id = u.id
         LEFT JOIN users m ON p.moderator_id = m.id
         WHERE p.session_id = $1 AND p.viewer_id = $2
         ORDER BY p.created_at DESC`,
        [sessionId, userId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error finding propositions by user in session:', error);
      throw error;
    }
  }

  // Vérifier si un morceau a déjà été proposé dans une session
  static async isDuplicate(sessionId, spotifyUrl) {
    try {
      const result = await db.query(
        'SELECT 1 FROM propositions WHERE session_id = $1 AND spotify_url = $2',
        [sessionId, spotifyUrl]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking duplicate:', error);
      throw error;
    }
  }

  // Vérifier si un morceau a été joué dans les sessions précédentes d'un streamer
  static async isInHistory(streamerId, spotifyUrl) {
    try {
      const result = await db.query(
        'SELECT 1 FROM session_history WHERE streamer_id = $1 AND spotify_url = $2',
        [streamerId, spotifyUrl]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking history:', error);
      throw error;
    }
  }

  // Approuver une proposition
  static async approve(propositionId, moderatorId) {
    try {
      const result = await db.query(
        `UPDATE propositions 
         SET status = 'approved', moderator_id = $1, moderated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING *`,
        [moderatorId, propositionId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error approving proposition:', error);
      throw error;
    }
  }

  // Rejeter une proposition
  static async reject(propositionId, moderatorId) {
    try {
      const result = await db.query(
        `UPDATE propositions 
         SET status = 'rejected', moderator_id = $1, moderated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING *`,
        [moderatorId, propositionId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error rejecting proposition:', error);
      throw error;
    }
  }

  // Remettre une proposition en file d'attente
  static async requeue(propositionId) {
    try {
      const result = await db.query(
        `UPDATE propositions 
         SET status = 'pending', moderator_id = NULL, moderated_at = NULL 
         WHERE id = $1 
         RETURNING *`,
        [propositionId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error requeuing proposition:', error);
      throw error;
    }
  }

  // Marquer une proposition comme ajoutée à la playlist
  static async markAsAdded(propositionId) {
    try {
      const result = await db.query(
        `UPDATE propositions 
         SET status = 'added', added_at = CURRENT_TIMESTAMP 
         WHERE id = $1 
         RETURNING *`,
        [propositionId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error marking proposition as added:', error);
      throw error;
    }
  }

  // Mélanger la file d'attente des propositions approuvées
  static async shuffleQueue(sessionId) {
    try {
      // Obtenir toutes les propositions approuvées
      const approvedPropositions = await db.query(
        'SELECT id FROM propositions WHERE session_id = $1 AND status = $2',
        [sessionId, 'approved']
      );

      // Mélanger les positions
      const shuffledIds = approvedPropositions.rows.map(p => p.id);
      for (let i = shuffledIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledIds[i], shuffledIds[j]] = [shuffledIds[j], shuffledIds[i]];
      }

      // Mettre à jour les positions dans la base de données
      const promises = shuffledIds.map((id, index) => {
        return db.query(
          'UPDATE propositions SET queue_position = $1 WHERE id = $2',
          [index + 1, id]
        );
      });

      await Promise.all(promises);
      return shuffledIds.length;
    } catch (error) {
      console.error('Error shuffling queue:', error);
      throw error;
    }
  }

  // Supprimer une proposition
  static async delete(propositionId) {
    try {
      const result = await db.query('DELETE FROM propositions WHERE id = $1 RETURNING *', [propositionId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting proposition:', error);
      throw error;
    }
  }

  // Ajouter un morceau à l'historique
  static async addToHistory(sessionId, streamerId, spotifyUrl, trackName, artist) {
    try {
      const result = await db.query(
        `INSERT INTO session_history (session_id, streamer_id, spotify_url, track_name, artist) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [sessionId, streamerId, spotifyUrl, trackName, artist]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error adding to history:', error);
      throw error;
    }
  }

  // Obtenir l'historique des morceaux d'un streamer
  static async getStreamerHistory(streamerId, limit = 50) {
    try {
      const result = await db.query(
        `SELECT sh.*, s.name as session_name 
         FROM session_history sh
         JOIN sessions s ON sh.session_id = s.id
         WHERE sh.streamer_id = $1 
         ORDER BY sh.played_at DESC 
         LIMIT $2`,
        [streamerId, limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting streamer history:', error);
      throw error;
    }
  }

  // Mettre à jour les positions de la file d'attente
  static async updateQueuePositions(sessionId, queueMode = 'chronological') {
    try {
      let orderBy = 'moderated_at ASC';
      if (queueMode === 'random') {
        orderBy = 'RANDOM()';
      }

      const result = await db.query(
        `UPDATE propositions 
         SET queue_position = subquery.row_number
         FROM (
           SELECT id, ROW_NUMBER() OVER (ORDER BY ${orderBy}) as row_number
           FROM propositions 
           WHERE session_id = $1 AND status = 'approved'
         ) AS subquery
         WHERE propositions.id = subquery.id`,
        [sessionId]
      );
      
      return result.rowCount;
    } catch (error) {
      console.error('Error updating queue positions:', error);
      throw error;
    }
  }
}

module.exports = Proposition; 