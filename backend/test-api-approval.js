const fetch = require('node-fetch');

console.log('🧪 Test de l\'API d\'approbation des propositions');
console.log('================================================');

// Configuration
const config = {
  baseUrl: process.env.API_URL || 'http://localhost:3000',
  testToken: process.env.TEST_TOKEN || 'test_token_123'
};

async function testApiApproval() {
  try {
    console.log('📋 Configuration:');
    console.log(`   - Base URL: ${config.baseUrl}`);
    console.log(`   - Token: ${config.testToken ? 'Présent' : 'Manquant'}`);
    
    // 1. Récupérer les sessions disponibles
    console.log('\n🔍 Récupération des sessions...');
    const sessionsResponse = await fetch(`${config.baseUrl}/api/sessions`, {
      headers: {
        'Authorization': `Bearer ${config.testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!sessionsResponse.ok) {
      console.error('❌ Erreur lors de la récupération des sessions:', sessionsResponse.status);
      return;
    }
    
    const sessions = await sessionsResponse.json();
    console.log(`✅ ${sessions.length} sessions trouvées`);
    
    if (sessions.length === 0) {
      console.log('❌ Aucune session disponible pour le test');
      return;
    }
    
    // 2. Choisir une session et récupérer ses propositions en attente
    const testSession = sessions[0];
    console.log(`\n📋 Session de test: ${testSession.code} (${testSession.name})`);
    
    const pendingResponse = await fetch(`${config.baseUrl}/api/sessions/${testSession.id}/propositions/pending`, {
      headers: {
        'Authorization': `Bearer ${config.testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!pendingResponse.ok) {
      console.error('❌ Erreur lors de la récupération des propositions en attente:', pendingResponse.status);
      return;
    }
    
    const pendingData = await pendingResponse.json();
    console.log(`✅ ${pendingData.propositions.length} propositions en attente trouvées`);
    
    if (pendingData.propositions.length === 0) {
      console.log('❌ Aucune proposition en attente pour le test');
      return;
    }
    
    // 3. Récupérer les propositions approuvées avant le test
    console.log('\n📊 État initial des propositions approuvées...');
    const approvedResponse = await fetch(`${config.baseUrl}/api/sessions/${testSession.id}/propositions/approved`, {
      headers: {
        'Authorization': `Bearer ${config.testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!approvedResponse.ok) {
      console.error('❌ Erreur lors de la récupération des propositions approuvées:', approvedResponse.status);
      return;
    }
    
    const approvedData = await approvedResponse.json();
    console.log(`✅ ${approvedData.propositions.length} propositions approuvées avant le test`);
    
    // 4. Tester l'approbation d'une proposition
    const testProposition = pendingData.propositions[0];
    console.log(`\n✅ Test d'approbation pour la proposition ${testProposition.id}:`);
    console.log(`   - Morceau: ${testProposition.track_name}`);
    console.log(`   - Artiste: ${testProposition.artist}`);
    
    const approveResponse = await fetch(`${config.baseUrl}/api/sessions/${testSession.id}/propositions/${testProposition.id}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📡 Réponse d'approbation: ${approveResponse.status} ${approveResponse.statusText}`);
    
    if (!approveResponse.ok) {
      const errorData = await approveResponse.json();
      console.error('❌ Erreur lors de l\'approbation:', errorData);
      return;
    }
    
    const approveData = await approveResponse.json();
    console.log('✅ Proposition approuvée avec succès:', approveData);
    
    // 5. Vérifier l'état après approbation
    console.log('\n📊 Vérification de l\'état après approbation...');
    
    // Récupérer à nouveau les propositions en attente
    const pendingAfterResponse = await fetch(`${config.baseUrl}/api/sessions/${testSession.id}/propositions/pending`, {
      headers: {
        'Authorization': `Bearer ${config.testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (pendingAfterResponse.ok) {
      const pendingAfterData = await pendingAfterResponse.json();
      const stillPending = pendingAfterData.propositions.find(p => p.id === testProposition.id);
      
      if (stillPending) {
        console.log('❌ ERREUR: La proposition est encore en attente après approbation');
      } else {
        console.log('✅ SUCCÈS: La proposition n\'est plus en attente');
      }
    }
    
    // Récupérer à nouveau les propositions approuvées
    const approvedAfterResponse = await fetch(`${config.baseUrl}/api/sessions/${testSession.id}/propositions/approved`, {
      headers: {
        'Authorization': `Bearer ${config.testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (approvedAfterResponse.ok) {
      const approvedAfterData = await approvedAfterResponse.json();
      const nowApproved = approvedAfterData.propositions.find(p => p.id === testProposition.id);
      
      if (nowApproved) {
        console.log('✅ SUCCÈS: La proposition est maintenant dans la file d\'attente approuvée');
        console.log(`   Position: ${nowApproved.queue_position}`);
      } else {
        console.log('❌ ERREUR: La proposition n\'est pas dans la file d\'attente approuvée');
      }
      
      console.log(`📊 Total propositions approuvées: ${approvedAfterData.propositions.length}`);
    }
    
    console.log('\n🎉 Test de l\'API terminé !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    console.error('Stack:', error.stack);
  }
}

// Lancer le test
testApiApproval().then(() => {
  console.log('\n🏁 Test terminé');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
}); 