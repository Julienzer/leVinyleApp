const db = require('./db');
const Proposition = require('./models/Proposition');
const Session = require('./models/Session');
const User = require('./models/User');

console.log('🧪 Test d\'approbation en temps réel');
console.log('===================================');

async function testLiveApproval() {
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
    
    // 2. Trouver une proposition en attente récente
    const pendingPropositions = await db.query(`
      SELECT p.*, s.code as session_code, s.name as session_name, u.display_name as viewer_name
      FROM propositions p
      JOIN sessions s ON p.session_id = s.id
      JOIN users u ON p.viewer_id = u.id
      WHERE p.status = 'pending'
      ORDER BY p.created_at DESC
      LIMIT 3
    `);
    
    if (pendingPropositions.rows.length === 0) {
      console.log('❌ Aucune proposition en attente trouvée');
      console.log('💡 Créez une proposition depuis le frontend pour tester');
      return;
    }
    
    console.log('\n📋 Propositions en attente récentes:');
    pendingPropositions.rows.forEach((prop, index) => {
      console.log(`   ${index + 1}. "${prop.track_name}" par ${prop.artist}`);
      console.log(`      Session: ${prop.session_code} (${prop.session_name})`);
      console.log(`      Viewer: ${prop.viewer_name} (${prop.viewer_id})`);
      console.log(`      ID: ${prop.id}, Créée: ${prop.created_at}`);
    });
    
    // 3. Trouver un utilisateur pour approuver (le streamer de la session)
    const testProposition = pendingPropositions.rows[0];
    const session = await Session.findById(testProposition.session_id);
    const streamer = await User.findById(session.streamer_id);
    
    console.log(`\n👤 Streamer de la session: ${streamer.display_name} (${streamer.id})`);
    
    // 4. Simuler l'approbation étape par étape
    console.log(`\n🔄 Test d'approbation pour la proposition ${testProposition.id}:`);
    console.log(`   - Morceau: ${testProposition.track_name}`);
    console.log(`   - Session: ${session.code}`);
    console.log(`   - Modérateur: ${streamer.display_name}`);
    
    // Étape 1: Vérifier que l'utilisateur modérateur existe
    const moderatorUser = await User.findById(streamer.id);
    if (!moderatorUser) {
      console.log('❌ ERREUR: Utilisateur modérateur non trouvé');
      return;
    }
    console.log('✅ Étape 1: Utilisateur modérateur trouvé');
    
    // Étape 2: Vérifier que la proposition est en attente
    if (testProposition.status !== 'pending') {
      console.log('❌ ERREUR: Proposition pas en attente');
      return;
    }
    console.log('✅ Étape 2: Proposition en attente');
    
    // Étape 3: Approuver la proposition
    console.log('🔄 Étape 3: Approbation de la proposition...');
    const approvedProposition = await Proposition.approve(testProposition.id, streamer.id);
    console.log('✅ Étape 3: Proposition approuvée');
    console.log('   - Nouveau statut:', approvedProposition.status);
    console.log('   - Modérateur:', approvedProposition.moderator_id);
    console.log('   - Modéré à:', approvedProposition.moderated_at);
    
    // Étape 4: Mettre à jour les positions
    console.log('🔄 Étape 4: Mise à jour des positions...');
    const updatedCount = await Proposition.updateQueuePositions(session.id, session.queue_mode);
    console.log(`✅ Étape 4: ${updatedCount} positions mises à jour`);
    
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
    
    // Afficher toutes les propositions approuvées de la session
    const allApproved = await db.query(`
      SELECT id, track_name, artist, queue_position, moderated_at
      FROM propositions 
      WHERE session_id = $1 AND status = 'approved'
      ORDER BY queue_position ASC
    `, [session.id]);
    
    console.log('\n📋 File d\'attente approuvée:');
    allApproved.rows.forEach(prop => {
      console.log(`   ${prop.queue_position}. "${prop.track_name}" par ${prop.artist}`);
    });
    
    console.log('\n🎉 Test terminé !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    console.error('Stack:', error.stack);
  }
}

// Fonction pour surveiller les changements en temps réel
async function watchForChanges() {
  console.log('\n👀 Surveillance des changements en temps réel...');
  console.log('💡 Créez une proposition depuis le frontend pour voir les changements');
  
  let lastCount = 0;
  
  setInterval(async () => {
    try {
      const result = await db.query('SELECT COUNT(*) as count FROM propositions WHERE status = \'pending\'');
      const currentCount = parseInt(result.rows[0].count);
      
      if (currentCount !== lastCount) {
        console.log(`🔄 Changement détecté: ${lastCount} → ${currentCount} propositions en attente`);
        lastCount = currentCount;
        
        if (currentCount > 0) {
          console.log('📋 Nouvelles propositions en attente:');
          const pending = await db.query(`
            SELECT p.*, s.code as session_code, u.display_name as viewer_name
            FROM propositions p
            JOIN sessions s ON p.session_id = s.id
            JOIN users u ON p.viewer_id = u.id
            WHERE p.status = 'pending'
            ORDER BY p.created_at DESC
          `);
          
          pending.rows.forEach(prop => {
            console.log(`   - "${prop.track_name}" par ${prop.artist} (Session: ${prop.session_code})`);
          });
        }
      }
    } catch (error) {
      console.error('❌ Erreur surveillance:', error);
    }
  }, 2000); // Vérifier toutes les 2 secondes
}

// Lancer le test principal
testLiveApproval().then(() => {
  // Lancer la surveillance
  watchForChanges();
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
}); 