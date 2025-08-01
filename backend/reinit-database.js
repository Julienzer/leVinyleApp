const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
require('dotenv').config();

console.log('🔄 Réinitialisation de la base de données Le Vinyle');
console.log('==================================================');

// Configuration
const config = {
  database: process.env.DB_NAME || 'levinyle',
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '5432',
  initScript: path.join(__dirname, 'db', 'init.sql')
};

console.log('📋 Configuration:');
console.log(`   - Base de données: ${config.database}`);
console.log(`   - Utilisateur: ${config.user}`);
console.log(`   - Hôte: ${config.host}:${config.port}`);
console.log(`   - Script: ${config.initScript}`);

// Vérifier que le script existe
if (!fs.existsSync(config.initScript)) {
  console.error('❌ Script d\'initialisation non trouvé:', config.initScript);
  process.exit(1);
}

console.log('✅ Script d\'initialisation trouvé');

// Construire la commande psql
const psqlCommand = `psql -h ${config.host} -p ${config.port} -U ${config.user} -d ${config.database} -f "${config.initScript}"`;

console.log('\n🚀 Exécution de la réinitialisation...');
console.log('Commande:', psqlCommand);

// Exécuter la commande
exec(psqlCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Erreur lors de la réinitialisation:');
    console.error('Message:', error.message);
    if (stderr) {
      console.error('Stderr:', stderr);
    }
    process.exit(1);
  }
  
  console.log('✅ Réinitialisation terminée avec succès !');
  console.log('\n📊 Sortie:');
  console.log(stdout);
  
  console.log('\n🎉 Base de données réinitialisée !');
  console.log('✅ Architecture multi-utilisateurs activée');
  console.log('🔒 Tokens Spotify et Twitch en mémoire');
  console.log('⚡ Index optimisés pour les performances');
  console.log('🧹 Nettoyage automatique des sessions');
  
  console.log('\n📝 Prochaines étapes:');
  console.log('1. Redémarrez votre serveur backend');
  console.log('2. Testez la connexion avec plusieurs utilisateurs');
  console.log('3. Vérifiez que chaque utilisateur a ses propres tokens');
  
  process.exit(0);
}); 