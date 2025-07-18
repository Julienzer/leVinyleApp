import { useState, useEffect } from 'react';

const SpotifyTest = () => {
  const [logs, setLogs] = useState([]);
  const [apiStatus, setApiStatus] = useState('loading');

  const addLog = (message) => {
    console.log(message);
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message }]);
  };

  useEffect(() => {
    addLog('🚀 Test Spotify démarré');
    
    // Vérifier l'état initial
    addLog(`📋 État initial:`);
    addLog(`- Script présent: ${!!document.querySelector('script[src*="spotify.com/embed/iframe-api"]')}`);
    addLog(`- window.onSpotifyIframeApiReady: ${typeof window.onSpotifyIframeApiReady}`);
    addLog(`- window.IFrameAPI: ${!!window.IFrameAPI}`);

    // Test de connectivité réseau
    addLog('🌐 Test de connectivité...');
    fetch('https://open.spotify.com/embed/iframe-api/v1', { 
      method: 'HEAD', 
      mode: 'no-cors' 
    })
    .then(() => {
      addLog('✅ Connectivité Spotify OK');
    })
    .catch(err => {
      addLog(`❌ Erreur connectivité: ${err.message}`);
    });

    // Écouter les événements de chargement du script
    const spotifyScript = document.querySelector('script[src*="spotify.com/embed/iframe-api"]');
    if (spotifyScript) {
      spotifyScript.addEventListener('load', () => {
        addLog('✅ Script Spotify chargé');
      });
      
      spotifyScript.addEventListener('error', (err) => {
        addLog(`❌ Erreur chargement script: ${err.message}`);
      });
    }

    // Définir le callback de test
    const originalCallback = window.onSpotifyIframeApiReady;
    
    window.onSpotifyIframeApiReady = (IFrameAPI) => {
      addLog('🎉 API Spotify reçue!');
      addLog(`- Type: ${typeof IFrameAPI}`);
      addLog(`- createController: ${typeof IFrameAPI?.createController}`);
      
      setApiStatus('ready');
      window.IFrameAPI = IFrameAPI;
      
      // Restaurer le callback original
      if (originalCallback && typeof originalCallback === 'function') {
        originalCallback(IFrameAPI);
      }
    };

    // Timeout pour détecter les problèmes
    const timeout = setTimeout(() => {
      if (apiStatus === 'loading') {
        addLog('⏰ TIMEOUT: API Spotify non chargée après 10 secondes');
        setApiStatus('timeout');
      }
    }, 10000);

    // Vérifier périodiquement l'état
    const interval = setInterval(() => {
      if (window.IFrameAPI && apiStatus === 'loading') {
        addLog('✅ API détectée via polling');
        setApiStatus('ready');
      }
    }, 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const testCreateController = () => {
    if (!window.IFrameAPI) {
      addLog('❌ API non disponible pour le test');
      return;
    }

    addLog('🧪 Test createController...');
    
    // Créer un div temporaire
    const testDiv = document.createElement('div');
    testDiv.id = 'spotify-test-div';
    testDiv.style.width = '300px';
    testDiv.style.height = '152px';
    testDiv.style.border = '1px solid #ccc';
    testDiv.style.margin = '10px';
    
    // L'ajouter au DOM
    document.body.appendChild(testDiv);
    
    const options = {
      uri: 'spotify:track:4iV5W9uYEdYUVa79Axb7Rh', // Bohemian Rhapsody
      width: '100%',
      height: 152
    };
    
    try {
      window.IFrameAPI.createController(testDiv, options, (controller) => {
        addLog('✅ Controller créé avec succès!');
        addLog(`- Controller type: ${typeof controller}`);
        
        // Nettoyer après 5 secondes
        setTimeout(() => {
          if (controller && typeof controller.destroy === 'function') {
            controller.destroy();
          }
          document.body.removeChild(testDiv);
          addLog('🧹 Test nettoyé');
        }, 5000);
      });
    } catch (err) {
      addLog(`❌ Erreur createController: ${err.message}`);
      document.body.removeChild(testDiv);
    }
  };

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">🧪 Test Spotify API</h2>
      
      <div className="mb-4">
        <div className="flex items-center space-x-2">
          <span>État API:</span>
          <span className={`px-2 py-1 rounded text-sm ${
            apiStatus === 'loading' ? 'bg-yellow-500' : 
            apiStatus === 'ready' ? 'bg-green-500' : 'bg-red-500'
          }`}>
            {apiStatus === 'loading' ? 'Chargement...' : 
             apiStatus === 'ready' ? 'Prêt' : 'Timeout'}
          </span>
        </div>
      </div>

      {apiStatus === 'ready' && (
        <button 
          onClick={testCreateController}
          className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded mb-4"
        >
          🎵 Tester createController
        </button>
      )}

      <div className="bg-black p-4 rounded max-h-96 overflow-y-auto">
        <h3 className="text-lg font-semibold mb-2">📋 Logs</h3>
        {logs.map((log, index) => (
          <div key={index} className="text-sm mb-1">
            <span className="text-gray-400">{log.time}</span> - {log.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpotifyTest; 