require('dotenv').config();
const axios = require('axios');

async function testTwitchConfig() {
  console.log('🔍 Test de la configuration Twitch...\n');
  
  // Vérification des variables d'environnement
  const requiredVars = {
    TWITCH_CLIENT_ID: process.env.TWITCH_CLIENT_ID,
    TWITCH_CLIENT_SECRET: process.env.TWITCH_CLIENT_SECRET,
    TWITCH_REDIRECT_URI: process.env.TWITCH_REDIRECT_URI,
    JWT_SECRET: process.env.JWT_SECRET
  };
  
  console.log('📋 Variables d\'environnement:');
  Object.entries(requiredVars).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    const displayValue = value ? `${value.substring(0, 10)}...` : 'undefined';
    console.log(`  ${status} ${key}: ${displayValue}`);
  });
  
  const missingVars = Object.entries(requiredVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);
  
  if (missingVars.length > 0) {
    console.log(`\n❌ Variables manquantes: ${missingVars.join(', ')}`);
    return;
  }
  
  console.log('\n✅ Toutes les variables d\'environnement sont présentes');
  
  // Test de validation du client ID
  try {
    console.log('\n🔄 Test de validation du Client ID...');
    const response = await axios.get(`https://api.twitch.tv/helix/users?login=test`, {
      headers: {
        'Client-ID': process.env.TWITCH_CLIENT_ID
      }
    });
    console.log('✅ Client ID valide');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('❌ Client ID invalide');
    } else {
      console.log('⚠️ Erreur lors du test du Client ID:', error.message);
    }
  }
  
  // Test de validation du client secret (avec un token d'app)
  try {
    console.log('\n🔄 Test de validation du Client Secret...');
    const tokenResponse = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        grant_type: 'client_credentials'
      }
    });
    
    if (tokenResponse.data.access_token) {
      console.log('✅ Client Secret valide');
      console.log(`   Token d'app obtenu: ${tokenResponse.data.access_token.substring(0, 20)}...`);
    } else {
      console.log('❌ Client Secret invalide - pas de token reçu');
    }
  } catch (error) {
    console.log('❌ Client Secret invalide:', error.response?.data?.message || error.message);
  }
  
  console.log('\n📝 Configuration actuelle:');
  console.log(`   Client ID: ${process.env.TWITCH_CLIENT_ID}`);
  console.log(`   Redirect URI: ${process.env.TWITCH_REDIRECT_URI}`);
  console.log(`   JWT Secret: ${process.env.JWT_SECRET ? 'Défini' : 'Non défini'}`);
  
  console.log('\n🔗 URL d\'autorisation Twitch:');
  const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${process.env.TWITCH_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.TWITCH_REDIRECT_URI)}&response_type=code&scope=user:read:email+moderation:read`;
  console.log(authUrl);
}

testTwitchConfig().catch(console.error); 