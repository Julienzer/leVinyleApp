import { useEffect, useRef, useState } from 'react';

const SpotifyPlayer = ({ spotifyUrl, width = '100%', height = 380, compact = false }) => {
  const iframeRef = useRef(null);
  const [controller, setController] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Extraire l'ID Spotify de l'URL
  const extractSpotifyId = (url) => {
    if (!url) return null;
    
    // Gestion des différents formats d'URL Spotify
    const patterns = [
      /spotify:track:([a-zA-Z0-9]+)/,
      /spotify\.com\/track\/([a-zA-Z0-9]+)/,
      /spotify\.com\/.*\/track\/([a-zA-Z0-9]+)/,
      /open\.spotify\.com\/track\/([a-zA-Z0-9]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    console.warn('Impossible d\'extraire l\'ID Spotify de l\'URL:', url);
    return null;
  };

  useEffect(() => {
    if (!iframeRef.current) {
      console.error('Référence iframe manquante');
      return;
    }

    const trackId = extractSpotifyId(spotifyUrl);
    if (!trackId) {
      setError('URL Spotify invalide');
      setIsLoading(false);
      return;
    }

    console.log('🔧 Initialisation du lecteur Spotify pour:', trackId);

    const initializePlayer = (IFrameAPI) => {
      try {
        const options = {
          width: typeof width === 'number' ? width : '100%',
          height: compact ? 152 : height,
          uri: `spotify:track:${trackId}`
        };

        console.log('🎵 Création du controller avec options:', options);

        const callback = (EmbedController) => {
          console.log('✅ Controller Spotify créé avec succès');
          setController(EmbedController);
          setIsLoading(false);
          setError(null);
        };

        IFrameAPI.createController(iframeRef.current, options, callback);
      } catch (err) {
        console.error('❌ Erreur lors de l\'initialisation:', err);
        setError('Erreur lors du chargement du morceau');
        setIsLoading(false);
      }
    };

    // Vérifier si l'API est déjà prête
    if (window.onSpotifyIframeApiReady && window.IFrameAPI) {
      console.log('🎯 API Spotify déjà disponible');
      initializePlayer(window.IFrameAPI);
    } else {
      console.log('⏳ En attente de l\'API Spotify...');
      
      // Définir le callback pour quand l'API sera prête
      const originalCallback = window.onSpotifyIframeApiReady;
      
      window.onSpotifyIframeApiReady = (IFrameAPI) => {
        console.log('🎉 API Spotify iframe ready!');
        
        // Appeler le callback original s'il existait
        if (originalCallback) {
          originalCallback(IFrameAPI);
        }
        
        // Sauvegarder l'API globalement pour les prochaines instances
        window.IFrameAPI = IFrameAPI;
        
        // Initialiser notre lecteur
        initializePlayer(IFrameAPI);
      };
    }

    // Timeout de sécurité
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('⚠️ Timeout: API Spotify non chargée');
        setError('Timeout: impossible de charger le lecteur Spotify');
        setIsLoading(false);
      }
    }, 10000); // 10 secondes

    // Cleanup
    return () => {
      clearTimeout(timeout);
      if (controller && typeof controller.destroy === 'function') {
        try {
          controller.destroy();
        } catch (err) {
          console.warn('Erreur lors de la destruction du controller:', err);
        }
      }
    };
  }, [spotifyUrl, width, height, compact]);

  // Fonction pour changer le morceau
  const changeTrack = (newSpotifyUrl) => {
    if (!controller) {
      console.warn('Controller non disponible');
      return;
    }

    const trackId = extractSpotifyId(newSpotifyUrl);
    if (!trackId) {
      console.error('URL Spotify invalide pour le changement:', newSpotifyUrl);
      return;
    }

    console.log('🔄 Changement de morceau:', trackId);
    controller.loadUri(`spotify:track:${trackId}`);
  };

  // Exposer la fonction changeTrack via une ref
  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.changeTrack = changeTrack;
    }
  }, [controller]);

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-2">🚫</div>
          <p className="text-red-400 text-sm">{error}</p>
          <a
            href={spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1DB954] hover:text-[#1DB954]/80 text-sm mt-2 inline-block"
          >
            Ouvrir dans Spotify
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center z-10">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1DB954] mx-auto mb-2"></div>
            <p className="text-sm">Chargement du lecteur...</p>
          </div>
        </div>
      )}
      
      <div
        ref={iframeRef}
        className="rounded-lg overflow-hidden border border-gray-600"
        style={{ width, height: compact ? 152 : height }}
      />
    </div>
  );
};

export default SpotifyPlayer; 