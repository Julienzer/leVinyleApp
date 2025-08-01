const jwt = require('jsonwebtoken');
const db = require('./db');

console.log('🔍 Debug de l\'authentification utilisateur');
console.log('==========================================');

async function debugUserAuth() {
  try {
    // 1. Vérifier les utilisateurs en base de données
    console.log('\n📊 Utilisateurs en base de données:');
    const users = await db.query('SELECT id, display_name, email, role, created_at FROM users ORDER BY created_at DESC');
    
    console.log(`Total utilisateurs: ${users.rows.length}`);
    users.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.display_name} (${user.id})`);
      console.log(`      Email: ${user.email}`);
      console.log(`      Rôle: ${user.role}`);
      console.log(`      Créé: ${user.created_at}`);
    });
    
    // 2. Vérifier les sessions
    console.log('\n📋 Sessions en base de données:');
    const sessions = await db.query(`
      SELECT s.*, u.display_name as streamer_name 
      FROM sessions s 
      JOIN users u ON s.streamer_id = u.id 
      ORDER BY s.created_at DESC
    `);
    
    console.log(`Total sessions: ${sessions.rows.length}`);
    sessions.rows.forEach((session, index) => {
      console.log(`   ${index + 1}. ${session.name} (${session.code})`);
      console.log(`      Streamer: ${session.streamer_name} (${session.streamer_id})`);
      console.log(`      Active: ${session.active}`);
      console.log(`      Créée: ${session.created_at}`);
    });
    
    // 3. Vérifier les propositions
    console.log('\n🎵 Propositions en base de données:');
    const propositions = await db.query(`
      SELECT p.*, s.code as session_code, u.display_name as viewer_name
      FROM propositions p
      JOIN sessions s ON p.session_id = s.id
      JOIN users u ON p.viewer_id = u.id
      ORDER BY p.created_at DESC
    `);
    
    console.log(`Total propositions: ${propositions.rows.length}`);
    propositions.rows.forEach((prop, index) => {
      console.log(`   ${index + 1}. "${prop.track_name}" par ${prop.artist}`);
      console.log(`      Session: ${prop.session_code}`);
      console.log(`      Viewer: ${prop.viewer_name} (${prop.viewer_id})`);
      console.log(`      Statut: ${prop.status}`);
      console.log(`      Position: ${prop.queue_position || 'N/A'}`);
      console.log(`      Modérateur: ${prop.moderator_id || 'Aucun'}`);
    });
    
    // 4. Vérifier les contraintes de clé étrangère
    console.log('\n🔗 Vérification des contraintes de clé étrangère:');
    
    // Vérifier les propositions avec des moderator_id invalides
    const invalidModerators = await db.query(`
      SELECT p.id, p.moderator_id, p.track_name
      FROM propositions p
      LEFT JOIN users u ON p.moderator_id = u.id
      WHERE p.moderator_id IS NOT NULL AND u.id IS NULL
    `);
    
    if (invalidModerators.rows.length > 0) {
      console.log('❌ Propositions avec des modérateurs invalides:');
      invalidModerators.rows.forEach(prop => {
        console.log(`   - Proposition ${prop.id} ("${prop.track_name}"): modérateur ${prop.moderator_id} n'existe pas`);
      });
    } else {
      console.log('✅ Toutes les propositions ont des modérateurs valides');
    }
    
    // 5. Test de création d'un JWT de test
    console.log('\n🎫 Test de création de JWT:');
    
    if (users.rows.length > 0) {
      const testUser = users.rows[0];
      const testToken = jwt.sign({
        id: testUser.id,
        display_name: testUser.display_name,
        email: testUser.email,
        role: testUser.role
      }, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1h' });
      
      console.log(`✅ JWT créé pour ${testUser.display_name}:`);
      console.log(`   Token: ${testToken.substring(0, 50)}...`);
      
      // Décoder le token
      try {
        const decoded = jwt.verify(testToken, process.env.JWT_SECRET || 'test_secret');
        console.log(`   Décodé: ${decoded.display_name} (${decoded.id})`);
      } catch (error) {
        console.error('❌ Erreur décodage JWT:', error.message);
      }
    }
    
    // 6. Recommandations
    console.log('\n💡 Recommandations:');
    
    if (users.rows.length === 0) {
      console.log('   - Aucun utilisateur en base: Vérifiez l\'authentification Twitch');
    }
    
    if (sessions.rows.length === 0) {
      console.log('   - Aucune session: Créez une session pour tester');
    }
    
    if (propositions.rows.length === 0) {
      console.log('   - Aucune proposition: Proposez des morceaux pour tester');
    }
    
    if (invalidModerators.rows.length > 0) {
      console.log('   - Propositions avec modérateurs invalides: Nettoyez la base de données');
    }
    
    console.log('\n🎉 Debug terminé !');
    
  } catch (error) {
    console.error('❌ Erreur lors du debug:', error);
    console.error('Stack:', error.stack);
  }
}

// Lancer le debug
debugUserAuth().then(() => {
  console.log('\n🏁 Debug terminé');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
}); 