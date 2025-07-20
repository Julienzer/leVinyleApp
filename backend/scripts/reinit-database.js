#!/usr/bin/env node

/**
 * Script de réinitialisation complète de la base de données
 * Usage: node backend/scripts/reinit-database.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuration de la base de données
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'postgres', // Se connecter à la base système pour pouvoir créer/supprimer
  password: process.env.DB_PASSWORD || 'root',
  port: process.env.DB_PORT || 5432,
};

const TARGET_DATABASE = 'le_vinyle';

console.log('🔧 === RÉINITIALISATION COMPLÈTE DE LA BASE ===');
console.log('📍 Configuration:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  target_database: TARGET_DATABASE
});

async function reinitializeDatabase() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('\n🔍 Vérification de la connexion PostgreSQL...');
    const client = await pool.connect();
    const versionResult = await client.query('SELECT version()');
    console.log('✅ Connexion réussie:', versionResult.rows[0].version.split(' ').slice(0, 2).join(' '));
    client.release();

    console.log('\n🗑️  Suppression de l\'ancienne base de données...');
    try {
      // Fermer toutes les connexions actives à la base cible
      await pool.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = $1
          AND pid <> pg_backend_pid()
      `, [TARGET_DATABASE]);
      
      await pool.query(`DROP DATABASE IF EXISTS ${TARGET_DATABASE}`);
      console.log('✅ Ancienne base supprimée');
    } catch (error) {
      console.log('⚠️  Avertissement lors de la suppression:', error.message);
    }

    console.log('\n🆕 Création de la nouvelle base de données...');
    await pool.query(`CREATE DATABASE ${TARGET_DATABASE}`);
    console.log('✅ Base de données créée');

    // Se reconnecter à la nouvelle base
    await pool.end();
    const newPool = new Pool({
      ...dbConfig,
      database: TARGET_DATABASE
    });

    console.log('\n🔧 Exécution du script d\'initialisation...');
    const sqlPath = path.join(__dirname, '..', 'db', 'init.sql');
    
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Script SQL introuvable: ${sqlPath}`);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    console.log('📄 Script SQL chargé:', sqlPath);
    console.log('📏 Taille:', Math.round(sqlContent.length / 1024), 'KB');

    // Exécuter le script SQL
    await newPool.query(sqlContent);
    console.log('✅ Script d\'initialisation exécuté');

    // Vérifier le résultat
    console.log('\n📊 Vérification de la structure créée...');
    const tablesResult = await newPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    const tables = tablesResult.rows.map(row => row.table_name);
    console.log('📋 Tables créées:', tables.join(', '));

    // Statistiques des données de test
    const stats = await newPool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM sessions) as sessions_count,
        (SELECT COUNT(*) FROM propositions) as propositions_count,
        (SELECT COUNT(*) FROM playlists) as playlists_count
    `);

    const counts = stats.rows[0];
    console.log('📈 Données de test insérées:');
    console.log(`   • Utilisateurs: ${counts.users_count}`);
    console.log(`   • Sessions: ${counts.sessions_count}`);
    console.log(`   • Propositions: ${counts.propositions_count}`);
    console.log(`   • Playlists: ${counts.playlists_count}`);

    // Vérifier les colonnes Spotify
    const spotifyColumns = await newPool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND column_name LIKE '%spotify%'
      ORDER BY column_name
    `);

    console.log('🎵 Colonnes Spotify dans users:', 
      spotifyColumns.rows.map(row => row.column_name).join(', '));

    await newPool.end();

    console.log('\n✅ === RÉINITIALISATION TERMINÉE AVEC SUCCÈS ! ===');
    console.log('🚀 La base de données est prête pour le développement');
    console.log('🔗 Connectez-vous avec: psql -U postgres -d le_vinyle');

  } catch (error) {
    console.error('\n❌ === ERREUR LORS DE LA RÉINITIALISATION ===');
    console.error('Type:', error.constructor.name);
    console.error('Message:', error.message);
    
    if (error.code) {
      console.error('Code PostgreSQL:', error.code);
    }
    
    if (error.detail) {
      console.error('Détail:', error.detail);
    }

    console.error('\n🔧 Solutions possibles:');
    console.error('• Vérifiez que PostgreSQL est démarré');
    console.error('• Vérifiez les variables d\'environnement DB_*');
    console.error('• Vérifiez les permissions utilisateur');
    
    process.exit(1);
  } finally {
    try {
      await pool.end();
    } catch (e) {
      // Ignorer les erreurs de fermeture
    }
  }
}

// Gestion des signaux pour fermeture propre
process.on('SIGINT', () => {
  console.log('\n⚠️  Arrêt demandé par l\'utilisateur');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Arrêt demandé par le système');
  process.exit(1);
});

// Exécution
if (require.main === module) {
  reinitializeDatabase().catch(error => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = { reinitializeDatabase }; 