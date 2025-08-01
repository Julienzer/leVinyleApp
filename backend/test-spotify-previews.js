const axios = require('axios');

console.log('🎵 Test des previews Spotify');
console.log('============================');

async function testSpotifyPreviews() {
  try {
    // URLs de test pour les previews Spotify
    const testUrls = [
      'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh', // Never Gonna Give You Up
      'https://open.spotify.com/track/1zB4vmk8tFRmM9UULNzbLB', // Bohemian Rhapsody
      'https://open.spotify.com/track/0V3wPSX9ygBnCm8psdzegu'  // Another One Bites the Dust
    ];
    
    console.log('🔍 Test de connexion à Spotify...');
    
    for (let i = 0; i < testUrls.length; i++) {
      const url = testUrls[i];
      console.log(`\n📡 Test ${i + 1}: ${url}`);
      
      try {
        // Test 1: Accès direct à l'URL Spotify
        console.log('   🔗 Test accès direct...');
        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        console.log(`   ✅ Accès direct: ${response.status}`);
        
        // Test 2: Extraction de l'ID du track
        const trackIdMatch = url.match(/track\/([a-zA-Z0-9]+)/);
        if (trackIdMatch) {
          const trackId = trackIdMatch[1];
          console.log(`   🎵 Track ID extrait: ${trackId}`);
          
          // Test 3: API Spotify (si on a des tokens)
          if (process.env.SPOTIFY_CLIENT_ID) {
            console.log('   🔑 Test avec API Spotify...');
            try {
              // Essayer d'obtenir un token client credentials
              const tokenResponse = await axios.post('https://accounts.spotify.com/api/token', null, {
                params: {
                  grant_type: 'client_credentials',
                  client_id: process.env.SPOTIFY_CLIENT_ID,
                  client_secret: process.env.SPOTIFY_CLIENT_SECRET
                },
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                }
              });
              
              const accessToken = tokenResponse.data.access_token;
              console.log('   ✅ Token obtenu');
              
              // Tester l'API track
              const trackResponse = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
                headers: {
                  'Authorization': `Bearer ${accessToken}`
                }
              });
              
              const track = trackResponse.data;
              console.log(`   ✅ Track info: "${track.name}" par ${track.artists[0].name}`);
              console.log(`   🎵 Preview URL: ${track.preview_url || 'Non disponible'}`);
              
              if (track.preview_url) {
                // Test 4: Accès à la preview
                console.log('   🔊 Test preview audio...');
                const previewResponse = await axios.get(track.preview_url, {
                  timeout: 5000,
                  responseType: 'stream'
                });
                
                console.log(`   ✅ Preview accessible: ${previewResponse.status}`);
              }
              
            } catch (apiError) {
              console.log(`   ⚠️ Erreur API Spotify: ${apiError.message}`);
            }
          } else {
            console.log('   ⚠️ Pas de credentials Spotify configurés');
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
        if (error.code === 'ECONNRESET') {
          console.log('   🔧 Cause: Connexion réinitialisée (timeout ou rate limiting)');
        } else if (error.code === 'ETIMEDOUT') {
          console.log('   🔧 Cause: Timeout de connexion');
        }
      }
    }
    
    // Test des URLs d'embed
    console.log('\n🎵 Test des URLs d\'embed Spotify...');
    const embedUrls = [
      'https://open.spotify.com/embed/track/4iV5W9uYEdYUVa79Axb7Rh',
      'https://open.spotify.com/embed/track/1zB4vmk8tFRmM9UULNzbLB'
    ];
    
    for (const embedUrl of embedUrls) {
      console.log(`\n📡 Test embed: ${embedUrl}`);
      
      try {
        const response = await axios.get(embedUrl, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        console.log(`   ✅ Embed accessible: ${response.status}`);
        
        // Vérifier si c'est du HTML valide
        if (response.data.includes('<iframe')) {
          console.log('   ✅ Contenu HTML valide détecté');
        } else {
          console.log('   ⚠️ Contenu HTML inattendu');
        }
        
      } catch (error) {
        console.log(`   ❌ Erreur embed: ${error.message}`);
      }
    }
    
    // Recommandations
    console.log('\n💡 Recommandations pour les previews:');
    console.log('   1. Vérifiez votre connexion internet');
    console.log('   2. Les previews peuvent être temporairement indisponibles');
    console.log('   3. Utilisez les embeds Spotify comme fallback');
    console.log('   4. Ajoutez un délai entre les requêtes pour éviter le rate limiting');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Lancer le test
testSpotifyPreviews().then(() => {
  console.log('\n🏁 Test terminé');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
}); 