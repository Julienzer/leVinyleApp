#!/usr/bin/env node

/**
 * Script pour appliquer la migration de nettoyage des sessions
 * 
 * Usage:
 *   node apply-session-cleanup.js [--force]
 */

const fs = require('fs');
const path = require('path');
const db = require('../db');
require('dotenv').config();

async function applyMigration() {
  console.log('🚀 Application de la migration de nettoyage des sessions...');
  
  try {
    // Lire le script SQL de migration
    const migrationPath = path.join(__dirname, '../db/session-cleanup.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Fichier de migration non trouvé: ${migrationPath}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📋 Exécution du script de migration...');
    
    // Exécuter la migration
    await db.query(migrationSQL);
    
    console.log('✅ Migration appliquée avec succès !');
    
    // Vérifier que les nouvelles fonctions existent
    console.log('🔍 Vérification des fonctions...');
    
    const checks = [
      'SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = \'sessions\' AND column_name = \'last_activity\')',
      'SELECT EXISTS(SELECT 1 FROM information_schema.routines WHERE routine_name = \'cleanup_inactive_sessions\')',
      'SELECT EXISTS(SELECT 1 FROM information_schema.routines WHERE routine_name = \'get_session_cleanup_stats\')',
      'SELECT EXISTS(SELECT 1 FROM information_schema.views WHERE table_name = \'sessions_cleanup_view\')'
    ];
    
    const results = await Promise.all(checks.map(query => db.query(query)));
    const allExist = results.every(result => result.rows[0].exists);
    
    if (allExist) {
      console.log('✅ Toutes les fonctions et colonnes ont été créées correctement');
      
      // Obtenir les statistiques initiales
      console.log('📊 Statistiques initiales:');
      const statsResult = await db.query('SELECT * FROM get_session_cleanup_stats()');
      const stats = statsResult.rows[0];
      
      console.log(`   • Total sessions: ${stats.total_sessions}`);
      console.log(`   • Sessions actives: ${stats.active_sessions}`);
      console.log(`   • Sessions inactives: ${stats.inactive_sessions}`);
      console.log(`   • Sessions anciennes: ${stats.old_sessions}`);
      console.log(`   • Candidats au nettoyage: ${stats.cleanup_candidates}`);
      
      if (stats.cleanup_candidates > 0) {
        console.log('');
        console.log('💡 Suggestions:');
        console.log('   • Exécutez `npm run session-cleanup-dry` pour voir ce qui sera nettoyé');
        console.log('   • Exécutez `npm run session-cleanup` pour effectuer le nettoyage');
        console.log('   • Configurez un cron job avec `npm run session-cron`');
      }
      
    } else {
      console.log('⚠️ Certaines fonctions n\'ont pas été créées correctement');
    }
    
    console.log('');
    console.log('🎉 Migration terminée ! Le système de nettoyage automatique est maintenant actif.');
    console.log('');
    console.log('📖 Consultez SESSION_MANAGEMENT_GUIDE.md pour plus d\'informations.');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    console.error('');
    console.error('🔧 Solutions possibles:');
    console.error('   • Vérifiez que la base de données est accessible');
    console.error('   • Vérifiez les permissions de votre utilisateur PostgreSQL');
    console.error('   • Consultez les logs de PostgreSQL pour plus de détails');
    
    process.exit(1);
  }
}

async function main() {
  try {
    await applyMigration();
    process.exit(0);
  } catch (error) {
    console.error('Erreur fatale:', error.message);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

module.exports = { applyMigration }; 