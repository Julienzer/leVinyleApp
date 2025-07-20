// Script pour tester les différents scénarios d'erreur Spotify
const express = require('express');
const app = express();

// Simulation de la fonction de gestion d'erreur corrigée
function handleSpotifyError(error, frontendUrl) {
  console.log('🔄 Gestion d\'erreur Spotify:');
  console.log('   - Type d\'erreur:', typeof error);
  console.log('   - Valeur d\'erreur:', error);
  
  // Notre correction
  const errorMessage = typeof error === 'string' ? error : 'Erreur d\'authentification Spotify';
  const redirectUrl = `${frontendUrl}/?spotify_error=${encodeURIComponent(errorMessage)}`;
  
  console.log('   - Message d\'erreur extrait:', errorMessage);
  console.log('   - URL de redirection:', redirectUrl);
  console.log('   - URL décodée:', decodeURIComponent(redirectUrl.split('spotify_error=')[1]));
  console.log('---');
  
  return redirectUrl;
}

// Tests
const frontendUrl = 'https://levinyle-frontend.onrender.com';

console.log('🧪 Tests de gestion d\'erreur Spotify\n');

// Test 1: Erreur string normale
console.log('Test 1: Erreur string normale');
handleSpotifyError('access_denied', frontendUrl);

// Test 2: Erreur objet (cas problématique)
console.log('Test 2: Erreur objet (cas problématique)');
handleSpotifyError({ message: 'access_denied', code: 403 }, frontendUrl);

// Test 3: Erreur null
console.log('Test 3: Erreur null');
handleSpotifyError(null, frontendUrl);

// Test 4: Erreur undefined
console.log('Test 4: Erreur undefined');
handleSpotifyError(undefined, frontendUrl);

// Test 5: Erreur avec caractères spéciaux
console.log('Test 5: Erreur avec caractères spéciaux');
handleSpotifyError('Erreur: accès refusé & paramètres invalides', frontendUrl);

console.log('✅ Tous les tests terminés'); 