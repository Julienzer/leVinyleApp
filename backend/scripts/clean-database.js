const { Client } = require('pg');
require('dotenv').config();

async function cleanDatabase() {
  console.log('🧹 Nettoyage complet de la base de données...\n');
  
  const config = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'le_vinyle',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 5432,
  };

  console.log('📊 Configuration de la base de données:', {
    user: config.user,
    host: config.host,
    database: config.database,
    port: config.port
  });

  const client = new Client(config);

  try {
    await client.connect();
    console.log('✅ Connecté à la base de données\n');

    // Supprimer toutes les tables dans l'ordre correct (contraintes)
    const tablesToDrop = [
      'session_history',
      'moderators', 
      'propositions',
      'sessions',
      'users',
      'tracks' // Ancienne table si elle existe
    ];

    console.log('🗑️ Suppression des tables existantes...');
    for (const table of tablesToDrop) {
      try {
        await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`   ✅ Table ${table} supprimée`);
      } catch (error) {
        console.log(`   ⚠️ Table ${table} : ${error.message}`);
      }
    }

    // Supprimer les fonctions si elles existent
    console.log('\n🔧 Suppression des fonctions...');
    try {
      await client.query('DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE');
      console.log('   ✅ Fonction update_updated_at_column supprimée');
    } catch (error) {
      console.log(`   ⚠️ Fonction : ${error.message}`);
    }

    // Supprimer les types personnalisés si ils existent
    console.log('\n🎨 Nettoyage des types personnalisés...');
    try {
      await client.query('DROP TYPE IF EXISTS user_role CASCADE');
      await client.query('DROP TYPE IF EXISTS proposition_status CASCADE');
      await client.query('DROP TYPE IF EXISTS queue_mode CASCADE');
      console.log('   ✅ Types personnalisés supprimés');
    } catch (error) {
      console.log(`   ⚠️ Types : ${error.message}`);
    }

    console.log('\n🎉 Base de données nettoyée avec succès !');
    console.log('\n🚀 Vous pouvez maintenant exécuter :');
    console.log('   npm run setup-db');

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Connexion fermée');
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  cleanDatabase()
    .then(() => {
      console.log('\n✅ Nettoyage terminé avec succès');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Nettoyage échoué:', error);
      process.exit(1);
    });
}

module.exports = cleanDatabase; 