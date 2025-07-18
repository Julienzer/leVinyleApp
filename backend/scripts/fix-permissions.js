const { Client } = require('pg');
require('dotenv').config();

console.log('🔧 Correction des permissions PostgreSQL...\n');

async function fixPermissions() {
  // Essayer de se connecter avec l'utilisateur postgres (superuser)
  const postgresClient = new Client({
    user: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres', // Base par défaut
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 5432,
  });

  try {
    console.log('🔌 Connexion en tant que postgres...');
    await postgresClient.connect();
    console.log('✅ Connecté en tant que postgres');

    // 1. Créer la base de données si elle n'existe pas
    const dbName = process.env.DB_NAME || 'le_vinyle';
    console.log(`\n📊 Création de la base de données "${dbName}"...`);
    
    try {
      await postgresClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Base de données "${dbName}" créée`);
    } catch (error) {
      if (error.code === '42P04') {
        console.log(`✅ Base de données "${dbName}" existe déjà`);
      } else {
        throw error;
      }
    }

    // 2. Créer l'utilisateur s'il n'existe pas
    const dbUser = process.env.DB_USER || 'postgres';
    const dbPassword = process.env.DB_PASSWORD || '';
    
    if (dbUser !== 'postgres') {
      console.log(`\n👤 Création de l'utilisateur "${dbUser}"...`);
      
      try {
        await postgresClient.query(`CREATE USER "${dbUser}" WITH PASSWORD '${dbPassword}'`);
        console.log(`✅ Utilisateur "${dbUser}" créé`);
      } catch (error) {
        if (error.code === '42710') {
          console.log(`✅ Utilisateur "${dbUser}" existe déjà`);
        } else {
          throw error;
        }
      }

      // 3. Donner les permissions à l'utilisateur
      console.log(`\n🔐 Attribution des permissions à "${dbUser}"...`);
      await postgresClient.query(`GRANT ALL PRIVILEGES ON DATABASE "${dbName}" TO "${dbUser}"`);
      console.log(`✅ Permissions accordées sur la base de données`);
    }

    await postgresClient.end();

    // 4. Se connecter à la base de données cible pour donner les permissions sur le schéma
    const targetClient = new Client({
      user: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: dbName,
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 5432,
    });

    console.log(`\n🔌 Connexion à la base de données "${dbName}"...`);
    await targetClient.connect();
    console.log('✅ Connecté à la base de données cible');

    if (dbUser !== 'postgres') {
      console.log(`\n🔐 Attribution des permissions sur le schéma public...`);
      await targetClient.query(`GRANT ALL ON SCHEMA public TO "${dbUser}"`);
      await targetClient.query(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "${dbUser}"`);
      await targetClient.query(`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "${dbUser}"`);
      await targetClient.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "${dbUser}"`);
      await targetClient.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "${dbUser}"`);
      console.log(`✅ Permissions accordées sur le schéma public`);
    }

    await targetClient.end();

    console.log('\n🎉 Permissions corrigées avec succès !');
    console.log('\n🚀 Vous pouvez maintenant exécuter :');
    console.log('   npm run setup-db');
    console.log('   npm run dev');

  } catch (error) {
    console.error('❌ Erreur lors de la correction des permissions:', error.message);
    console.error('\n🔧 Solutions possibles :');
    console.error('1. Vérifiez que PostgreSQL est démarré');
    console.error('2. Vérifiez le mot de passe de l\'utilisateur postgres');
    console.error('3. Modifiez votre .env avec les bonnes credentials');
    console.error('4. Utilisez DB_USER=postgres dans votre .env');
    throw error;
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  fixPermissions()
    .then(() => {
      console.log('\n✅ Correction terminée avec succès');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Correction échouée:', error);
      process.exit(1);
    });
}

module.exports = fixPermissions; 