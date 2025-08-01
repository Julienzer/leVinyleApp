const db = require('./db');
const Proposition = require('./models/Proposition');
const Session = require('./models/Session');

console.log('🧪 Test de debug pour l\'approbation des propositions');
console.log('====================================================');

async function testApprovalProcess() {
  try {
    // 1. Vérifier l'état initial de la base de données
    console.log('\n📊 État initial de la base de données:');
    
    const initialStats = await db.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM propositions 
      GROUP BY status
      ORDER BY status
    `);
    
    console.log('Propositions par statut:');
    initialStats.rows.forEach(row => {
      console.log(`   - ${row.status}: ${row.count}`);
    });
    
    // 2. Vérifier les utilisateurs disponibles
    console.log('\n👥 Utilisateurs disponibles:');
    const users = await db.query('SELECT id, display_name, role FROM users ORDER BY created_at DESC');
    
    if (users.rows.length === 0) {
      console.log('❌ Aucun utilisateur trouvé dans la base de données');
      return;
    }
    
    users.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.display_name} (${user.id}) - ${user.role}`);
    });
    
    // Utiliser le premier utilisateur comme modérateur
    const moderatorUser = users.rows[0];
    console.log(`\n✅ Utilisateur modérateur sélectionné: ${moderatorUser.display_name} (${moderatorUser.id})`);
    
    // 3. Trouver une session avec des propositions en attente
    const pendingPropositions = await db.query(`
      SELECT p.*, s.code as session_code, s.name as session_name
      FROM propositions p
      JOIN sessions s ON p.session_id = s.id
      WHERE p.status = 'pending'
      ORDER BY p.created_at DESC
      LIMIT 5
    `);
    
    if (pendingPropositions.rows.length === 0) {
      console.log('❌ Aucune proposition en attente trouvée');
      return;
    }
    
    console.log('\n📋 Propositions en attente trouvées:');
    pendingPropositions.rows.forEach((prop, index) => {
      console.log(`   ${index + 1}. "${prop.track_name}" par ${prop.artist} (Session: ${prop.session_code})`);
      console.log(`      ID: ${prop.id}, Session ID: ${prop.session_id}`);
    });
    
    // 4. Tester l'approbation d'une proposition
    const testProposition = pendingPropositions.rows[0];
    console.log(`\n✅ Test d'approbation pour la proposition ${testProposition.id}:`);
    console.log(`   - Morceau: ${testProposition.track_name}`);
    console.log(`   - Session: ${testProposition.session_code}`);
    console.log(`   - Modérateur: ${moderatorUser.display_name} (${moderatorUser.id})`);
    
    // Approuver la proposition avec un utilisateur valide
    const approvedProposition = await Proposition.approve(testProposition.id, moderatorUser.id);
    console.log('✅ Proposition approuvée:', {
      id: approvedProposition.id,
      status: approvedProposition.status,
      moderator_id: approvedProposition.moderator_id,
      moderated_at: approvedProposition.moderated_at
    });
    
    // 5. Mettre à jour les positions de la file d'attente
    const session = await Session.findById(testProposition.session_id);
    console.log(`\n🔄 Mise à jour des positions de file d'attente pour la session ${session.code}:`);
    console.log(`   - Mode de file: ${session.queue_mode}`);
    
    const updatedCount = await Proposition.updateQueuePositions(testProposition.session_id, session.queue_mode);
    console.log(`✅ ${updatedCount} positions mises à jour`);
    
    // 6. Vérifier l'état final
    console.log('\n📊 État final après approbation:');
    
    const finalStats = await db.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM propositions 
      GROUP BY status
      ORDER BY status
    `);
    
    console.log('Propositions par statut:');
    finalStats.rows.forEach(row => {
      console.log(`   - ${row.status}: ${row.count}`);
    });
    
    // 7. Vérifier les propositions approuvées avec leurs positions
    const approvedPropositions = await db.query(`
      SELECT id, track_name, artist, queue_position, moderated_at
      FROM propositions 
      WHERE session_id = $1 AND status = 'approved'
      ORDER BY queue_position ASC
    `, [testProposition.session_id]);
    
    console.log('\n📋 Propositions approuvées dans la file d\'attente:');
    approvedPropositions.rows.forEach(prop => {
      console.log(`   ${prop.queue_position}. "${prop.track_name}" par ${prop.artist} (ID: ${prop.id})`);
    });
    
    // 8. Vérifier que la proposition testée est bien dans la liste approuvée
    const testPropInApproved = approvedPropositions.rows.find(p => p.id === testProposition.id);
    if (testPropInApproved) {
      console.log(`\n✅ SUCCÈS: La proposition testée est bien dans la file d'attente approuvée`);
      console.log(`   Position: ${testPropInApproved.queue_position}`);
    } else {
      console.log(`\n❌ ERREUR: La proposition testée n'est pas dans la file d'attente approuvée`);
    }
    
    // 9. Vérifier qu'elle n'est plus en attente
    const testPropInPending = await db.query(`
      SELECT id FROM propositions WHERE id = $1 AND status = 'pending'
    `, [testProposition.id]);
    
    if (testPropInPending.rows.length === 0) {
      console.log(`✅ SUCCÈS: La proposition testée n'est plus en attente`);
    } else {
      console.log(`❌ ERREUR: La proposition testée est encore en attente`);
    }
    
    console.log('\n🎉 Test d\'approbation terminé !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    console.error('Stack:', error.stack);
  }
}

// Lancer le test
testApprovalProcess().then(() => {
  console.log('\n🏁 Test terminé');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
}); 