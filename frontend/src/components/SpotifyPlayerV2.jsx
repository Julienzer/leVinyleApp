import { useEffect, useRef, useState } from 'react';

const SpotifyPlayerV2 = ({ spotifyUrl, compact = true }) => {
  const iframeRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [controller, setController] = useState(null);
  const [debugInfo, setDebugInfo] = useState([]);

  const addDebug = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${message}`);
    setDebugInfo(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // Extraire l'ID Spotify
  const extractSpotifyId = (url) => {
    if (!url) return null;
    const match = url.match(/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  // Charger le script Spotify dynamiquement si nécessaire
  const ensureSpotifyScript = () => {
    return new Promise((resolve, reject) => {
      // Vérifier si le script existe déjà
      const existingScript = document.querySelector('script[src*="spotify.com/embed/iframe-api"]');
      
      if (existingScript) {
        addDebug('✅ Script Spotify déjà présent');
        resolve();
        return;
      }

      addDebug('📥 Chargement du script Spotify...');
      
      const script = document.createElement('script');
      script.src = 'https://open.spotify.com/embed/iframe-api/v1';
      script.async = true;
      
      script.onload = () => {
        addDebug('✅ Script Spotify chargé');
        resolve();
      };
      
      script.onerror = (err) => {
        addDebug(`❌ Erreur chargement script: ${err.message}`);
        reject(err);
      };
      
      document.head.appendChild(script);
    });
  };

  // Attendre que l'API soit prête
  const waitForSpotifyAPI = (maxAttempts = 30) => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      
      const checkAPI = () => {
        attempts++;
        addDebug(`🔍 Tentative ${attempts}/${maxAttempts} - Vérification API`);
        
        if (window.IFrameAPI && typeof window.IFrameAPI.createController === 'function') {
          addDebug('✅ API Spotify détectée et prête');
          resolve(window.IFrameAPI);
          return;
        }
        
        if (attempts >= maxAttempts) {
          addDebug(`❌ API non disponible après ${maxAttempts} tentatives`);
          reject(new Error('API Spotify non disponible'));
          return;
        }
        
        setTimeout(checkAPI, 500);
      };
      
      // Définir le callback au cas où l'API ne serait pas encore prête
      if (!window.onSpotifyIframeApiReady) {
        window.onSpotifyIframeApiReady = (IFrameAPI) => {
          addDebug('🎉 Callback onSpotifyIframeApiReady appelé');
          window.IFrameAPI = IFrameAPI;
          resolve(IFrameAPI);
        };
      }
      
      checkAPI();
    });
  };

  useEffect(() => {
    const initPlayer = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        addDebug('🚀 Initialisation du lecteur V2');
        
        // Vérifier l'URL
        const trackId = extractSpotifyId(spotifyUrl);
        if (!trackId) {
          throw new Error('URL Spotify invalide');
        }
        addDebug(`🎵 Track ID: ${trackId}`);
        
        // Vérifier l'élément iframe
        if (!iframeRef.current) {
          throw new Error('Élément iframe non disponible');
        }
        
        // Assurer que le script est chargé
        await ensureSpotifyScript();
        
        // Attendre que l'API soit prête
        const IFrameAPI = await waitForSpotifyAPI();
        
        // Créer le lecteur
        addDebug('🎮 Création du controller...');
        const options = {
          uri: `spotify:track:${trackId}`,
          width: '100%',
          height: compact ? 152 : 380
        };
        
        IFrameAPI.createController(iframeRef.current, options, (embedController) => {
          addDebug('✅ Controller créé avec succès');
          setController(embedController);
          setIsLoading(false);
        });
        
      } catch (err) {
        addDebug(`❌ Erreur: ${err.message}`);
        setError(err.message);
        setIsLoading(false);
      }
    };
    
    if (spotifyUrl) {
      initPlayer();
    }
    
    return () => {
      if (controller && typeof controller.destroy === 'function') {
        controller.destroy();
      }
    };
  }, [spotifyUrl, compact]);

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <div className="text-red-400 text-sm mb-2">❌ {error}</div>
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-400 mb-2">Debug Info</summary>
          <div className="bg-black p-2 rounded max-h-32 overflow-y-auto">
            {debugInfo.map((info, idx) => (
              <div key={idx} className="text-gray-300">{info}</div>
            ))}
          </div>
        </details>
        <a
          href={spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#1DB954] hover:text-[#1DB954]/80 text-sm underline"
        >
          Ouvrir dans Spotify
        </a>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1DB954] mx-auto mb-2"></div>
          <p className="text-gray-400 text-sm">Chargement lecteur V2...</p>
        </div>
        <details className="mt-4 text-xs">
          <summary className="cursor-pointer text-gray-400">Debug Info</summary>
          <div className="bg-black p-2 rounded mt-2 max-h-32 overflow-y-auto">
            {debugInfo.map((info, idx) => (
              <div key={idx} className="text-gray-300">{info}</div>
            ))}
          </div>
        </details>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={iframeRef}
        className="rounded-lg overflow-hidden border border-gray-600 w-full"
        style={{ height: compact ? '152px' : '380px' }}
      />
      <div className="mt-2 text-xs text-gray-500">
        ✅ Lecteur V2 actif
      </div>
    </div>
  );
};

export default SpotifyPlayerV2; 