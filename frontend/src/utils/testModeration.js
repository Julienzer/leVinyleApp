// Script pour tester l'API de modération
export const testModerationAPI = async (streamerId, userId, token) => {
  console.log('🧪 Test API Modération...');
  console.log('   - Streamer ID:', streamerId);
  console.log('   - User ID:', userId);
  console.log('   - Token:', token ? 'présent' : 'absent');
  
  try {
    const apiUrl = `/api/users/${streamerId}/moderator-status`;
    console.log('   - URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   - Status:', response.status);
    console.log('   - OK:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   - Data:', data);
      return data;
    } else {
      const errorText = await response.text();
      console.log('   - Error:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
  } catch (error) {
    console.error('   - Exception:', error);
    throw error;
  }
};

// Fonction pour tester depuis la console du navigateur
window.testModeration = testModerationAPI;

// Exemple d'utilisation :
// await testModeration('STREAMER_ID', 'USER_ID', 'TOKEN'); 