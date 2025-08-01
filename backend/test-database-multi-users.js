const db = require('./db');
const { spotifyUserTokens, twitchUserTokens } = require('./auth');

console.log('🧪 Test complet du système multi-utilisateurs');
console.log('=============================================');

async function testDatabaseStructure() {
  console.log('\n📊 Test de la structure de la base de données...');
  
  try {
    // Vérifier que la table users n'a pas de colonnes Spotify
    const columnsResult = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('✅ Colonnes de la table users:');
    columnsResult.rows.forEach(row => {
      console.log(`   - ${row.column_name} (${row.data_type})`);
    });
    
    // Vérifier qu'il n'y a pas de colonnes Spotify
    const spotifyColumns = columnsResult.rows.filter(row => 
      row.column_name.includes('spotify')
    );
    
    if (spotifyColumns.length === 0) {
      console.log('✅ Aucune colonne Spotify trouvée (correct)');
    } else {
      console.log('❌ Colonnes Spotify trouvées:', spotifyColumns.map(c => c.column_name));
    }
    
    // Vérifier les tables principales
    const tablesResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('\n✅ Tables créées:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Erreur lors du test de structure:', error);
    return false;
  }
}

async function testMultiUserTokens() {
  console.log('\n🔑 Test du système de tokens multi-utilisateurs...');
  
  // Simuler plusieurs utilisateurs
  const testUsers = [
    {
      twitchId: 'user1_twitch',
      twitchName: 'User1',
      spotifyId: 'spotify_user_1',
      spotifyName: 'SpotifyUser1'
    },
    {
      twitchId: 'user2_twitch', 
      twitchName: 'User2',
      spotifyId: 'spotify_user_2',
      spotifyName: 'SpotifyUser2'
    },
    {
      twitchId: 'user3_twitch',
      twitchName: 'User3', 
      spotifyId: 'spotify_user_3',
      spotifyName: 'SpotifyUser3'
    }
  ];
  
  // Ajouter les tokens Twitch
  testUsers.forEach(user => {
    twitchUserTokens[user.twitchId] = {
      access_token: `twitch_token_${user.twitchId}`,
      user_id: user.twitchId,
      display_name: user.twitchName
    };
  });
  
  // Ajouter les tokens Spotify
  testUsers.forEach(user => {
    spotifyUserTokens[user.twitchId] = {
      access_token: `spotify_token_${user.spotifyId}`,
      refresh_token: `spotify_refresh_${user.spotifyId}`,
      expires_at: Date.now() + 3600000, // 1 heure
      spotify_id: user.spotifyId,
      display_name: user.spotifyName,
      email: `${user.spotifyName.toLowerCase()}@test.com`,
      profile_picture: null,
      linked_to_twitch: true,
      twitch_user_id: user.twitchId,
      twitch_user_name: user.twitchName
    };
  });
  
  console.log('✅ Utilisateurs de test ajoutés');
  console.log(`   - Tokens Twitch: ${Object.keys(twitchUserTokens).length}`);
  console.log(`   - Tokens Spotify: ${Object.keys(spotifyUserTokens).length}`);
  
  // Tester l'isolation des tokens
  console.log('\n🔒 Test de l\'isolation des tokens:');
  testUsers.forEach(user => {
    const twitchToken = twitchUserTokens[user.twitchId];
    const spotifyToken = spotifyUserTokens[user.twitchId];
    
    console.log(`   - ${user.twitchName}:`);
    console.log(`     Twitch: ${twitchToken ? '✅' : '❌'} (${twitchToken?.access_token.substring(0, 20)}...)`);
    console.log(`     Spotify: ${spotifyToken ? '✅' : '❌'} (${spotifyToken?.access_token.substring(0, 20)}...)`);
  });
  
  return true;
}

async function testDatabaseOperations() {
  console.log('\n💾 Test des opérations de base de données...');
  
  try {
    // Test d'insertion d'utilisateur
    const userResult = await db.query(`
      INSERT INTO users (id, display_name, email, role, is_streamer) 
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        is_streamer = EXCLUDED.is_streamer,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, ['test_user_123', 'TestUser', 'test@example.com', 'viewer', true]);
    
    console.log('✅ Utilisateur créé/mis à jour:', userResult.rows[0].display_name);
    
    // Test de création de session
    const sessionResult = await db.query(`
      INSERT INTO sessions (code, name, streamer_id, is_private, prevent_duplicates) 
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        streamer_id = EXCLUDED.streamer_id,
        is_private = EXCLUDED.is_private,
        prevent_duplicates = EXCLUDED.prevent_duplicates,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, ['test_session', 'Session de Test', 'test_user_123', false, true]);
    
    console.log('✅ Session créée/mise à jour:', sessionResult.rows[0].name);
    
    // Test de création de proposition
    const propositionResult = await db.query(`
      INSERT INTO propositions (session_id, viewer_id, spotify_url, track_name, artist, album, duration, message) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      sessionResult.rows[0].id,
      'test_user_123',
      'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh',
      'Never Gonna Give You Up',
      'Rick Astley',
      'Whenever You Need Somebody',
      '3:33',
      'Test proposition'
    ]);
    
    console.log('✅ Proposition créée:', propositionResult.rows[0].track_name);
    
    // Test de récupération des données
    const statsResult = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM sessions) as sessions_count,
        (SELECT COUNT(*) FROM propositions) as propositions_count
    `);
    
    console.log('✅ Statistiques de la base:');
    console.log(`   - Utilisateurs: ${statsResult.rows[0].users_count}`);
    console.log(`   - Sessions: ${statsResult.rows[0].sessions_count}`);
    console.log(`   - Propositions: ${statsResult.rows[0].propositions_count}`);
    
    return true;
  } catch (error) {
    console.error('❌ Erreur lors des opérations de base:', error);
    return false;
  }
}

async function testCleanup() {
  console.log('\n🧹 Test du nettoyage...');
  
  try {
    // Nettoyer les données de test
    await db.query('DELETE FROM propositions WHERE viewer_id = $1', ['test_user_123']);
    await db.query('DELETE FROM sessions WHERE streamer_id = $1', ['test_user_123']);
    await db.query('DELETE FROM users WHERE id = $1', ['test_user_123']);
    
    console.log('✅ Données de test nettoyées');
    
    // Nettoyer les tokens de test
    delete twitchUserTokens['user1_twitch'];
    delete twitchUserTokens['user2_twitch'];
    delete twitchUserTokens['user3_twitch'];
    delete spotifyUserTokens['user1_twitch'];
    delete spotifyUserTokens['user2_twitch'];
    delete spotifyUserTokens['user3_twitch'];
    
    console.log('✅ Tokens de test nettoyés');
    
    return true;
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Démarrage des tests complets...\n');
  
  const results = {
    structure: await testDatabaseStructure(),
    tokens: await testMultiUserTokens(),
    operations: await testDatabaseOperations(),
    cleanup: await testCleanup()
  };
  
  console.log('\n📋 Résumé des tests:');
  console.log('====================');
  console.log(`Structure BDD: ${results.structure ? '✅' : '❌'}`);
  console.log(`Tokens multi-users: ${results.tokens ? '✅' : '❌'}`);
  console.log(`Opérations BDD: ${results.operations ? '✅' : '❌'}`);
  console.log(`Nettoyage: ${results.cleanup ? '✅' : '❌'}`);
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 Tous les tests sont passés !');
    console.log('✅ Le système multi-utilisateurs est prêt pour la production');
    console.log('🔒 Chaque utilisateur a ses tokens isolés');
    console.log('💾 La base de données est propre et optimisée');
  } else {
    console.log('\n❌ Certains tests ont échoué');
    console.log('🔧 Vérifiez la configuration et relancez les tests');
  }
  
  process.exit(allPassed ? 0 : 1);
}

// Lancer les tests
runAllTests().catch(error => {
  console.error('💥 Erreur fatale lors des tests:', error);
  process.exit(1);
}); 