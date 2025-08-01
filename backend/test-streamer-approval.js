const db = require('./db');
const Proposition = require('./models/Proposition');
const Session = require('./models/Session');
const User = require('./models/User');

console.log('🧪 Test d\'approbation par le streamer');
console.log('=====================================');

async function testStreamerApproval() {
  try {
    // 1. Vérifier l'état actuel
    console.log('\n📊 État actuel de la base de données:');
    
    const stats = await db.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM propositions 
      GROUP BY status
      ORDER BY status
    `);
    
    console.log('Propositions par statut:');
    stats.rows.forEach(row => {
      console.log(`   - ${row.status}: ${row.count}`);
    });
    
    // 2. Trouver une session avec son streamer
    const sessionsWithStreamers = await db.query(`
      SELECT s.*, u.display_name as streamer_name, u.id as streamer_id
      FROM sessions s
      JOIN users u ON s.streamer_id = u.id
      WHERE s.active = true
      ORDER BY s.created_at DESC
      LIMIT 3
    `);
    
    if (sessionsWithStreamers.rows.length === 0) {
      console.log('❌ Aucune session active trouvée');
      return;
    }
    
    console.log('\n📋 Sessions actives avec streamers:');
    sessionsWithStreamers.rows.forEach((session, index) => {
      console.log(`   ${index + 1}. ${session.name} (${session.code})`);
      console.log(`      Streamer: ${session.streamer_name} (${session.streamer_id})`);
    });
    
    // 3. Trouver des propositions en attente pour ces sessions
    const testSession = sessionsWithStreamers.rows[0];
    console.log(`\n🔍 Recherche de propositions en attente pour la session: ${testSession.code}`);
    
    const pendingPropositions = await db.query(`
      SELECT p.*, u.display_name as viewer_name
      FROM propositions p
      JOIN users u ON p.viewer_id = u.id
      WHERE p.session_id = $1 AND p.status = 'pending'
      ORDER BY p.created_at DESC
      LIMIT 5
    `, [testSession.id]);
    
    if (pendingPropositions.rows.length === 0) {
      console.log('❌ Aucune proposition en attente pour cette session');
      console.log('💡 Créez une proposition depuis le frontend pour tester');
      return;
    }
    
    console.log(`\n📋 Propositions en attente pour ${testSession.code}:`);
    pendingPropositions.rows.forEach((prop, index) => {
      console.log(`   ${index + 1}. "${prop.track_name}" par ${prop.artist}`);
      console.log(`      Viewer: ${prop.viewer_name} (${prop.viewer_id})`);
      console.log(`      ID: ${prop.id}`);
    });
    
    // 4. Tester l'approbation par le streamer
    const testProposition = pendingPropositions.rows[0];
    console.log(`\n✅ Test d'approbation par le streamer:`);
    console.log(`   - Session: ${testSession.code} (${testSession.name})`);
    console.log(`   - Streamer: ${testSession.streamer_name} (${testSession.streamer_id})`);
    console.log(`   - Proposition: "${testProposition.track_name}" par ${testProposition.artist}`);
    console.log(`   - Viewer: ${testProposition.viewer_name} (${testProposition.viewer_id})`);
    
    // Vérifier que le streamer existe
    const streamer = await User.findById(testSession.streamer_id);
    if (!streamer) {
      console.log('❌ ERREUR: Streamer non trouvé en base de données');
      return;
    }
    console.log('✅ Streamer trouvé en base de données');
    
    // Vérifier que la proposition est en attente
    if (testProposition.status !== 'pending') {
      console.log('❌ ERREUR: Proposition pas en attente');
      return;
    }
    console.log('✅ Proposition en attente');
    
    // Vérifier que le streamer est bien le streamer de la session
    if (testSession.streamer_id !== testProposition.session_id) {
      console.log('❌ ERREUR: Incohérence entre session et streamer');
      return;
    }
    console.log('✅ Cohérence session/streamer vérifiée');
    
    // Approuver la proposition
    console.log('🔄 Approbation de la proposition par le streamer...');
    const approvedProposition = await Proposition.approve(testProposition.id, testSession.streamer_id);
    console.log('✅ Proposition approuvée');
    console.log('   - Nouveau statut:', approvedProposition.status);
    console.log('   - Modérateur:', approvedProposition.moderator_id);
    console.log('   - Modéré à:', approvedProposition.moderated_at);
    
    // Mettre à jour les positions
    console.log('🔄 Mise à jour des positions...');
    const updatedCount = await Proposition.updateQueuePositions(testSession.id, testSession.queue_mode);
    console.log(`✅ ${updatedCount} positions mises à jour`);
    
    // 5. Vérifier le résultat
    console.log('\n📊 Vérification du résultat:');
    
    // Vérifier que la proposition n'est plus en attente
    const stillPending = await db.query(`
      SELECT id FROM propositions WHERE id = $1 AND status = 'pending'
    `, [testProposition.id]);
    
    if (stillPending.rows.length === 0) {
      console.log('✅ La proposition n\'est plus en attente');
    } else {
      console.log('❌ ERREUR: La proposition est encore en attente');
    }
    
    // Vérifier que la proposition est approuvée
    const nowApproved = await db.query(`
      SELECT id, queue_position FROM propositions WHERE id = $1 AND status = 'approved'
    `, [testProposition.id]);
    
    if (nowApproved.rows.length > 0) {
      console.log(`✅ La proposition est approuvée (position: ${nowApproved.rows[0].queue_position})`);
    } else {
      console.log('❌ ERREUR: La proposition n\'est pas approuvée');
    }
    
    // Afficher la file d'attente
    const allApproved = await db.query(`
      SELECT id, track_name, artist, queue_position, moderated_at
      FROM propositions 
      WHERE session_id = $1 AND status = 'approved'
      ORDER BY queue_position ASC
    `, [testSession.id]);
    
    console.log('\n📋 File d\'attente approuvée:');
    allApproved.rows.forEach(prop => {
      console.log(`   ${prop.queue_position}. "${prop.track_name}" par ${prop.artist}`);
    });
    
    console.log('\n🎉 Test d\'approbation par le streamer terminé avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    console.error('Stack:', error.stack);
  }
}

// Lancer le test
testStreamerApproval().then(() => {
  console.log('\n🏁 Test terminé');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
}); 