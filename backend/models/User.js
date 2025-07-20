const db = require('../db');

class User {
  constructor(id, display_name, email, role, is_streamer, spotify_id) {
    this.id = id;
    this.display_name = display_name;
    this.email = email;
    this.role = role;
    this.is_streamer = is_streamer;
    this.spotify_id = spotify_id;
  }

  // Créer ou mettre à jour un utilisateur
  static async createOrUpdate(userData) {
    const { 
      id, 
      display_name, 
      email, 
      role, 
      is_streamer, 
      spotify_id,
      profile_picture = null,
      spotify_profile_picture = null,
      spotify_display_name = null
    } = userData;
    
    try {
      const result = await db.query(
        `INSERT INTO users (id, display_name, email, role, is_streamer, spotify_id, profile_picture, spotify_profile_picture, spotify_display_name) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           display_name = EXCLUDED.display_name,
           email = EXCLUDED.email,
           role = EXCLUDED.role,
           is_streamer = EXCLUDED.is_streamer,
           spotify_id = EXCLUDED.spotify_id,
           profile_picture = EXCLUDED.profile_picture,
           spotify_profile_picture = EXCLUDED.spotify_profile_picture,
           spotify_display_name = EXCLUDED.spotify_display_name,
           updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [id, display_name, email, role, is_streamer, spotify_id, profile_picture, spotify_profile_picture, spotify_display_name]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw error;
    }
  }

  // Stocker les tokens Spotify pour un utilisateur
  static async updateSpotifyTokens(userId, spotifyData) {
    const {
      spotify_id,
      spotify_access_token,
      spotify_refresh_token,
      expires_in,
      display_name,
      profile_picture
    } = spotifyData;

    try {
      const expiresAt = new Date(Date.now() + (expires_in * 1000));
      
      const result = await db.query(
        `UPDATE users SET
           spotify_id = $2,
           spotify_access_token = $3,
           spotify_refresh_token = $4,
           spotify_token_expires_at = $5,
           spotify_display_name = $6,
           spotify_profile_picture = $7,
           spotify_connected_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [userId, spotify_id, spotify_access_token, spotify_refresh_token, expiresAt, display_name, profile_picture]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating Spotify tokens:', error);
      throw error;
    }
  }

  // Récupérer les tokens Spotify d'un utilisateur
  static async getSpotifyTokens(userId) {
    try {
      const result = await db.query(
        `SELECT spotify_id, spotify_access_token, spotify_refresh_token, 
                spotify_token_expires_at, spotify_display_name, spotify_profile_picture
         FROM users 
         WHERE id = $1 AND spotify_access_token IS NOT NULL`,
        [userId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      
      // Vérifier si le token est expiré
      const now = new Date();
      const expiresAt = new Date(user.spotify_token_expires_at);
      const isExpired = now >= expiresAt;

      return {
        spotify_id: user.spotify_id,
        access_token: user.spotify_access_token,
        refresh_token: user.spotify_refresh_token,
        expires_at: user.spotify_token_expires_at,
        display_name: user.spotify_display_name,
        profile_picture: user.spotify_profile_picture,
        is_expired: isExpired
      };
    } catch (error) {
      console.error('Error getting Spotify tokens:', error);
      throw error;
    }
  }

  // Supprimer les tokens Spotify d'un utilisateur (déconnexion)
  static async clearSpotifyTokens(userId) {
    try {
      const result = await db.query(
        `UPDATE users SET
           spotify_access_token = NULL,
           spotify_refresh_token = NULL,
           spotify_token_expires_at = NULL,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [userId]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error clearing Spotify tokens:', error);
      throw error;
    }
  }

  // Trouver un utilisateur par ID
  static async findById(id) {
    try {
      const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  // Trouver tous les utilisateurs
  static async findAll() {
    try {
      const result = await db.query('SELECT * FROM users ORDER BY created_at DESC');
      return result.rows;
    } catch (error) {
      console.error('Error finding all users:', error);
      throw error;
    }
  }

  // Trouver les streamers
  static async findStreamers() {
    try {
      const result = await db.query(
        'SELECT * FROM users WHERE is_streamer = TRUE ORDER BY created_at DESC'
      );
      return result.rows;
    } catch (error) {
      console.error('Error finding streamers:', error);
      throw error;
    }
  }

  // Vérifier si un utilisateur est modérateur d'un streamer
  static async isModeratorOf(moderatorId, streamerId) {
    try {
      const result = await db.query(
        'SELECT 1 FROM moderators WHERE moderator_id = $1 AND streamer_id = $2',
        [moderatorId, streamerId]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking moderator relationship:', error);
      throw error;
    }
  }

  // Ajouter un modérateur à un streamer
  static async addModerator(streamerId, moderatorId) {
    try {
      const result = await db.query(
        `INSERT INTO moderators (streamer_id, moderator_id) 
         VALUES ($1, $2)
         ON CONFLICT (streamer_id, moderator_id) DO NOTHING
         RETURNING *`,
        [streamerId, moderatorId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error adding moderator:', error);
      throw error;
    }
  }

  // Supprimer un modérateur d'un streamer
  static async removeModerator(streamerId, moderatorId) {
    try {
      const result = await db.query(
        'DELETE FROM moderators WHERE streamer_id = $1 AND moderator_id = $2 RETURNING *',
        [streamerId, moderatorId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error removing moderator:', error);
      throw error;
    }
  }

  // Obtenir les modérateurs d'un streamer
  static async getModeratorsByStreamer(streamerId) {
    try {
      const result = await db.query(
        `SELECT u.*, m.created_at as moderator_since 
         FROM users u 
         JOIN moderators m ON u.id = m.moderator_id 
         WHERE m.streamer_id = $1
         ORDER BY m.created_at DESC`,
        [streamerId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting moderators by streamer:', error);
      throw error;
    }
  }

  // Mettre à jour le Spotify ID d'un utilisateur
  static async updateSpotifyId(userId, spotifyId) {
    try {
      const result = await db.query(
        'UPDATE users SET spotify_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [spotifyId, userId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error updating Spotify ID:', error);
      throw error;
    }
  }

  // Supprimer un utilisateur
  static async delete(id) {
    try {
      const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}

module.exports = User; 