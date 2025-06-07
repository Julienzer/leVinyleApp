const db = require('../db');

class Track {
  static async create({ spotify_url, title, artist, submitted_by }) {
    const query = `
      INSERT INTO tracks (spotify_url, title, artist, submitted_by, status, created_at)
      VALUES ($1, $2, $3, $4, 'pending', NOW())
      RETURNING *
    `;
    const values = [spotify_url, title, artist, submitted_by];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM tracks WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async updateStatus(id, status) {
    const query = 'UPDATE tracks SET status = $1 WHERE id = $2 RETURNING *';
    const result = await db.query(query, [status, id]);
    return result.rows[0];
  }

  static async findAllPending() {
    const query = 'SELECT * FROM tracks WHERE status = $1 ORDER BY created_at DESC';
    const result = await db.query(query, ['pending']);
    return result.rows;
  }

  static async findAllApproved() {
    const query = 'SELECT * FROM tracks WHERE status = $1 ORDER BY created_at DESC';
    const result = await db.query(query, ['approved']);
    return result.rows;
  }
}

module.exports = Track; 