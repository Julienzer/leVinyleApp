const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

async function setupDatabase() {
  console.log('🔧 Setting up Le Vinyle Database...');
  
  // Configuration de la base de données
  const config = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'le_vinyle',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
  };

  console.log('📊 Database config:', {
    user: config.user,
    host: config.host,
    database: config.database,
    port: config.port
  });

  const client = new Client(config);

  try {
    // Connexion à la base de données
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database successfully');

    // Lire le fichier SQL d'initialisation
    const sqlFilePath = path.join(__dirname, '../db/init.sql');
    console.log('📄 Reading SQL file:', sqlFilePath);
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error('SQL initialization file not found');
    }

    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('🗂️ SQL file loaded successfully');

    // Exécuter le SQL
    console.log('⚡ Executing SQL initialization...');
    await client.query(sql);
    console.log('✅ Database initialized successfully');

    // Vérifier que les tables ont été créées
    console.log('🔍 Verifying table creation...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('📋 Created tables:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Vérifier les données de test
    console.log('🧪 Checking test data...');
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    const sessionCount = await client.query('SELECT COUNT(*) FROM sessions');
    const propositionCount = await client.query('SELECT COUNT(*) FROM propositions');

    console.log(`📊 Test data created:`);
    console.log(`  - Users: ${userCount.rows[0].count}`);
    console.log(`  - Sessions: ${sessionCount.rows[0].count}`);
    console.log(`  - Propositions: ${propositionCount.rows[0].count}`);

    console.log('🎉 Database setup completed successfully!');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Exécuter le setup si le script est appelé directement
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('✅ Setup completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = setupDatabase; 