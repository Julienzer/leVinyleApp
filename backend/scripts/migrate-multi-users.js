#!/usr/bin/env node

/**
 * Migration Multi-Utilisateurs Le Vinyle
 * 
 * Ce script applique les modifications nécessaires pour la gestion multi-utilisateurs :
 * - Ajout des colonnes Spotify tokens dans la table users
 * - Création des index pour optimiser les performances
 */

const { Pool } = require('pg');
require('dotenv').config();

async function runMigration() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  console.log('🚀 Démarrage de la migration multi-utilisateurs...');

  try {
    // 1. Vérifier la connexion
    const client = await pool.connect();
    console.log('✅ Connexion à la base de données réussie');

    // 2. Vérifier si les colonnes existent déjà
    const checkColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('spotify_access_token', 'spotify_refresh_token', 'spotify_token_expires_at', 'spotify_connected_at')
    `);

    if (checkColumns.rows.length > 0) {
      console.log('⚠️  Les colonnes Spotify existent déjà. Migration annulée.');
      console.log('   Colonnes trouvées:', checkColumns.rows.map(r => r.column_name));
      client.release();
      await pool.end();
      return;
    }

    // 3. Appliquer la migration
    console.log('📋 Application de la migration...');
    
    await client.query('BEGIN');

    // Ajouter les colonnes
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS spotify_access_token TEXT;
    `);
    console.log('✅ Colonne spotify_access_token ajoutée');

    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS spotify_refresh_token TEXT;
    `);
    console.log('✅ Colonne spotify_refresh_token ajoutée');

    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS spotify_token_expires_at TIMESTAMP;
    `);
    console.log('✅ Colonne spotify_token_expires_at ajoutée');

    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS spotify_connected_at TIMESTAMP;
    `);
    console.log('✅ Colonne spotify_connected_at ajoutée');

    // Créer l'index
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_spotify_tokens ON users(id) WHERE spotify_access_token IS NOT NULL;
    `);
    console.log('✅ Index optimisé créé');

    await client.query('COMMIT');
    console.log('✅ Transaction validée');

    // 4. Vérifier le résultat
    const stats = await client.query(`
      SELECT 
        'Migration terminée' as status,
        COUNT(*) as total_users,
        COUNT(spotify_access_token) as users_with_spotify
      FROM users
    `);
    
    console.log('\n📊 Statistiques post-migration:');
    console.log('   Utilisateurs total:', stats.rows[0].total_users);
    console.log('   Utilisateurs avec Spotify:', stats.rows[0].users_with_spotify);

    client.release();
    await pool.end();
    
    console.log('\n🎉 Migration multi-utilisateurs terminée avec succès !');
    console.log('\n📝 Prochaines étapes:');
    console.log('   1. Redémarrer le serveur backend');
    console.log('   2. Les utilisateurs devront se reconnecter à Spotify');
    console.log('   3. Chaque utilisateur aura ses propres tokens Spotify');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

// Vérifier les variables d'environnement
if (!process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_USER) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   Vérifiez DB_HOST, DB_NAME, DB_USER dans votre fichier .env');
  process.exit(1);
}

// Exécuter la migration
runMigration().catch(console.error); 