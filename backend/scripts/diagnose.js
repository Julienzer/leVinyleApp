const { Client } = require('pg');
require('dotenv').config();

console.log('🔍 Diagnostic Le Vinyle Backend\n');

// 1. Vérifier les variables d'environnement
console.log('1. Variables d\'environnement :');
const requiredEnvVars = [
  'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
  'JWT_SECRET', 'SESSION_SECRET',
  'TWITCH_CLIENT_ID', 'TWITCH_CLIENT_SECRET', 'TWITCH_REDIRECT_URI',
  'SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET', 'SPOTIFY_REDIRECT_URI'
];

let missingVars = [];
requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: ${varName.includes('SECRET') ? '***' : process.env[varName]}`);
  } else {
    console.log(`❌ ${varName}: MANQUANT`);
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.log(`\n🚨 Variables manquantes: ${missingVars.join(', ')}`);
  console.log('Créez un fichier .env dans le dossier backend/ avec ces variables.\n');
}

// 2. Vérifier la connexion à la base de données
console.log('\n2. Connexion à la base de données :');
const dbClient = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function testDatabase() {
  try {
    await dbClient.connect();
    console.log('✅ Connexion à la base de données OK');
    
    // Vérifier les tables
    const tables = await dbClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const tableNames = tables.rows.map(row => row.table_name);
    const expectedTables = ['users', 'sessions', 'propositions', 'session_history', 'moderators'];
    
    console.log('\n   Tables existantes :');
    expectedTables.forEach(table => {
      if (tableNames.includes(table)) {
        console.log(`   ✅ ${table}`);
      } else {
        console.log(`   ❌ ${table} (manquante)`);
      }
    });
    
    await dbClient.end();
  } catch (error) {
    console.log(`❌ Erreur de connexion : ${error.message}`);
    console.log('Vérifiez que PostgreSQL est démarré et que les credentials sont corrects.');
  }
}

// 3. Vérifier les URLs de redirection
console.log('\n3. URLs de redirection :');
console.log(`Twitch: ${process.env.TWITCH_REDIRECT_URI}`);
console.log(`Spotify: ${process.env.SPOTIFY_REDIRECT_URI}`);
console.log('Vérifiez que ces URLs sont configurées dans vos applications OAuth.');

// 4. Recommandations
console.log('\n4. Recommandations :');
console.log('✅ Créez votre fichier .env avec toutes les variables');
console.log('✅ Exécutez: npm run setup-db');
console.log('✅ Vérifiez vos applications Twitch/Spotify');
console.log('✅ Testez: npm run dev');

// Exécuter le diagnostic
if (require.main === module) {
  testDatabase().then(() => {
    console.log('\n🎯 Diagnostic terminé !');
  });
} 