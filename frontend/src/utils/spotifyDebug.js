// Script de diagnostic pour le lecteur Spotify embeddé
export const spotifyDebug = {
  // Vérifier l'état de l'API Spotify
  checkAPI: () => {
    console.log('🔍 Diagnostic Spotify API:');
    console.log('- window.onSpotifyIframeApiReady:', typeof window.onSpotifyIframeApiReady);
    console.log('- window.IFrameAPI:', !!window.IFrameAPI);
    console.log('- Script Spotify chargé:', !!document.querySelector('script[src*="spotify.com/embed/iframe-api"]'));
    
    // Vérifier si le script est bien chargé
    const spotifyScript = document.querySelector('script[src*="spotify.com/embed/iframe-api"]');
    if (spotifyScript) {
      console.log('- Script Spotify src:', spotifyScript.src);
      console.log('- Script async:', spotifyScript.async);
      console.log('- Script loaded:', spotifyScript.readyState);
    }
    
    return {
      hasCallback: typeof window.onSpotifyIframeApiReady === 'function',
      hasAPI: !!window.IFrameAPI,
      hasScript: !!spotifyScript
    };
  },

  // Tester l'extraction d'ID Spotify
  testExtractId: (url) => {
    const patterns = [
      /spotify:track:([a-zA-Z0-9]+)/,
      /spotify\.com\/track\/([a-zA-Z0-9]+)/,
      /spotify\.com\/.*\/track\/([a-zA-Z0-9]+)/,
      /open\.spotify\.com\/track\/([a-zA-Z0-9]+)/
    ];
    
    console.log('🔍 Test extraction ID pour:', url);
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        console.log('✅ ID trouvé:', match[1]);
        return match[1];
      }
    }
    
    console.log('❌ Aucun ID trouvé');
    return null;
  },

  // Simuler l'initialisation du lecteur
  simulateInit: (trackId = '4iV5W9uYEdYUVa79Axb7Rh') => {
    console.log('🧪 Simulation d\'initialisation du lecteur...');
    
    const mockInit = (IFrameAPI) => {
      console.log('📦 IFrameAPI reçu:', IFrameAPI);
      console.log('- createController:', typeof IFrameAPI.createController);
      
      if (typeof IFrameAPI.createController === 'function') {
        console.log('✅ createController disponible');
        
        // Créer un élément temporaire pour tester
        const tempDiv = document.createElement('div');
        tempDiv.id = 'test-spotify-player';
        document.body.appendChild(tempDiv);
        
        const options = {
          width: '100%',
          height: 152,
          uri: `spotify:track:${trackId}`
        };
        
        console.log('🎵 Test création avec options:', options);
        
        try {
          IFrameAPI.createController(tempDiv, options, (controller) => {
            console.log('✅ Controller test créé!', controller);
            
            // Nettoyer après test
            setTimeout(() => {
              if (controller && typeof controller.destroy === 'function') {
                controller.destroy();
              }
              document.body.removeChild(tempDiv);
              console.log('🧹 Test nettoyé');
            }, 2000);
          });
        } catch (err) {
          console.error('❌ Erreur lors du test:', err);
          document.body.removeChild(tempDiv);
        }
      } else {
        console.log('❌ createController non disponible');
      }
    };

    // Tester avec l'API existante ou attendre
    if (window.IFrameAPI) {
      mockInit(window.IFrameAPI);
    } else {
      console.log('⏳ En attente de l\'API...');
      const originalCallback = window.onSpotifyIframeApiReady;
      
      window.onSpotifyIframeApiReady = (IFrameAPI) => {
        console.log('🎉 API prête pour le test!');
        
        // Restaurer le callback original
        if (originalCallback) {
          originalCallback(IFrameAPI);
        }
        
        // Lancer le test
        mockInit(IFrameAPI);
      };
    }
  },

  // Vérifier les erreurs de réseau
  checkNetwork: () => {
    console.log('🌐 Test de connectivité Spotify...');
    
    // Tester l'accès à l'API
    fetch('https://open.spotify.com/embed/iframe-api/v1', { mode: 'no-cors' })
      .then(() => {
        console.log('✅ API Spotify accessible');
      })
      .catch((err) => {
        console.error('❌ Erreur réseau:', err);
      });
  }
};

// Exposer globalement pour les tests
window.spotifyDebug = spotifyDebug;

// Auto-diagnostic au chargement
if (typeof window !== 'undefined') {
  setTimeout(() => {
    console.log('🚀 Auto-diagnostic Spotify:');
    spotifyDebug.checkAPI();
    spotifyDebug.checkNetwork();
  }, 2000);
} 