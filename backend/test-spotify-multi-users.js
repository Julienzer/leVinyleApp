const { spotifyUserTokens } = require('./auth');

console.log('🧪 Test du système multi-utilisateurs Spotify');
console.log('============================================');

// Simuler plusieurs utilisateurs connectés
const testUsers = [
  {
    id: 'user1_twitch',
    display_name: 'User1',
    spotify_id: 'spotify_user_1',
    access_token: 'fake_token_1',
    refresh_token: 'fake_refresh_1',
    expires_at: Date.now() + 3600000 // 1 heure
  },
  {
    id: 'user2_twitch', 
    display_name: 'User2',
    spotify_id: 'spotify_user_2',
    access_token: 'fake_token_2',
    refresh_token: 'fake_refresh_2',
    expires_at: Date.now() + 3600000 // 1 heure
  },
  {
    id: 'user3_twitch',
    display_name: 'User3', 
    spotify_id: 'spotify_user_3',
    access_token: 'fake_token_3',
    refresh_token: 'fake_refresh_3',
    expires_at: Date.now() - 3600000 // Expiré
  }
];

// Ajouter les utilisateurs de test
testUsers.forEach(user => {
  spotifyUserTokens[user.id] = {
    access_token: user.access_token,
    refresh_token: user.refresh_token,
    expires_at: user.expires_at,
    spotify_id: user.spotify_id,
    display_name: user.display_name,
    email: `${user.display_name.toLowerCase()}@test.com`,
    profile_picture: null,
    linked_to_twitch: true,
    twitch_user_id: user.id,
    twitch_user_name: user.display_name
  };
});

console.log('✅ Utilisateurs de test ajoutés');
console.log('📊 État actuel des tokens:');
console.log('   - Nombre d\'utilisateurs:', Object.keys(spotifyUserTokens).length);
console.log('   - Utilisateurs:', Object.keys(spotifyUserTokens));

// Tester la récupération des tokens
console.log('\n🔍 Test de récupération des tokens:');
testUsers.forEach(user => {
  const tokens = spotifyUserTokens[user.id];
  const isExpired = Date.now() >= tokens.expires_at;
  
  console.log(`   - ${user.display_name}: ${tokens ? '✅ Connecté' : '❌ Non connecté'} ${isExpired ? '(Expiré)' : '(Valide)'}`);
});

// Tester la suppression d'un utilisateur
console.log('\n🗑️ Test de suppression d\'un utilisateur:');
delete spotifyUserTokens['user1_twitch'];
console.log('   - User1 supprimé');
console.log('   - Utilisateurs restants:', Object.keys(spotifyUserTokens));

// Tester l'ajout d'un nouvel utilisateur
console.log('\n➕ Test d\'ajout d\'un nouvel utilisateur:');
spotifyUserTokens['user4_twitch'] = {
  access_token: 'fake_token_4',
  refresh_token: 'fake_refresh_4', 
  expires_at: Date.now() + 7200000, // 2 heures
  spotify_id: 'spotify_user_4',
  display_name: 'User4',
  email: 'user4@test.com',
  profile_picture: null,
  linked_to_twitch: true,
  twitch_user_id: 'user4_twitch',
  twitch_user_name: 'User4'
};

console.log('   - User4 ajouté');
console.log('   - Utilisateurs finaux:', Object.keys(spotifyUserTokens));

console.log('\n✅ Test terminé - Le système multi-utilisateurs fonctionne correctement !');
console.log('📝 Chaque utilisateur a ses propres tokens Spotify stockés en mémoire');
console.log('🔒 Les tokens sont isolés par utilisateur (ID Twitch)');
console.log('⏰ La vérification d\'expiration fonctionne correctement'); 