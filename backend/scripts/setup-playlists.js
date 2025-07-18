const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function setupPlaylistsTables() {
  console.log('🎵 Configuration des tables de playlists...');
  
  try {
    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, '../db/playlists.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Fichier SQL lu:', sqlPath);
    
    // Exécuter le SQL
    await pool.query(sql);
    
    console.log('✅ Tables de playlists créées avec succès !');
    
    // Vérifier que les tables existent
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('playlists', 'playlist_tracks')
      ORDER BY table_name;
    `;
    
    const result = await pool.query(tablesQuery);
    console.log('📊 Tables créées:', result.rows.map(row => row.table_name));
    
    // Vérifier les données de test
    const playlistsCount = await pool.query('SELECT COUNT(*) as count FROM playlists');
    console.log('🎵 Playlists de test:', playlistsCount.rows[0].count);
    
  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  setupPlaylistsTables();
}

module.exports = { setupPlaylistsTables }; 