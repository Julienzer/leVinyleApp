import { useEffect, useRef, useState } from 'react';

const SpotifyPlayerSimple = ({ spotifyUrl, compact = true }) => {
  const iframeRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // Extraire l'ID Spotify de l'URL
  const extractSpotifyId = (url) => {
    if (!url) return null;
    
    console.log('🔍 Extraction ID depuis:', url);
    
    const patterns = [
      /spotify:track:([a-zA-Z0-9]+)/,
      /open\.spotify\.com\/track\/([a-zA-Z0-9]+)/,
      /spotify\.com\/track\/([a-zA-Z0-9]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        console.log('✅ ID Spotify trouvé:', match[1]);
        return match[1];
      }
    }
    
    console.warn('❌ Impossible d\'extraire l\'ID Spotify');
    return null;
  };

  useEffect(() => {
    if (!spotifyUrl) {
      setError('URL Spotify manquante');
      setIsLoading(false);
      return;
    }

    const trackId = extractSpotifyId(spotifyUrl);
    if (!trackId) {
      setError('URL Spotify invalide');
      setIsLoading(false);
      return;
    }

    console.log('🎵 Initialisation du lecteur simple pour:', trackId);

    // Fonction d'initialisation suivant exactement la documentation
    const initSpotify = (IFrameAPI) => {
      console.log('🎯 Initialisation avec IFrameAPI:', !!IFrameAPI);
      
      if (!IFrameAPI || !IFrameAPI.createController) {
        console.error('❌ IFrameAPI invalide');
        setError('API Spotify non disponible');
        setIsLoading(false);
        return;
      }

      if (!iframeRef.current) {
        console.error('❌ Référence iframe manquante');
        setError('Élément iframe non disponible');
        setIsLoading(false);
        return;
      }

      const options = {
        uri: `spotify:track:${trackId}`,
        width: '100%',
        height: compact ? 152 : 380
      };

      console.log('⚙️ Options du lecteur:', options);

      try {
        IFrameAPI.createController(
          iframeRef.current, 
          options, 
          (EmbedController) => {
            console.log('✅ Controller créé avec succès!');
            setIsReady(true);
            setIsLoading(false);
            setError(null);
          }
        );
      } catch (err) {
        console.error('❌ Erreur createController:', err);
        setError(`Erreur lors de la création: ${err.message}`);
        setIsLoading(false);
      }
    };

    // Vérifier si l'API est déjà disponible ou attendre
    console.log('🔍 Vérification de l\'API Spotify...');
    
    if (window.IFrameAPI) {
      console.log('✅ API déjà disponible');
      initSpotify(window.IFrameAPI);
    } else if (typeof window.onSpotifyIframeApiReady === 'function') {
      console.log('⏳ Callback déjà défini, en attente...');
    } else {
      console.log('🚀 Définition du callback onSpotifyIframeApiReady');
      
      window.onSpotifyIframeApiReady = (IFrameAPI) => {
        console.log('🎉 Spotify iframe API prête!');
        window.IFrameAPI = IFrameAPI;
        initSpotify(IFrameAPI);
      };
    }

    // Timeout de sécurité
    const timeout = setTimeout(() => {
      if (isLoading && !isReady) {
        console.warn('⏰ Timeout - API Spotify non chargée');
        setError('Timeout: Spotify non disponible');
        setIsLoading(false);
      }
    }, 15000);

    return () => {
      clearTimeout(timeout);
    };
  }, [spotifyUrl, compact]);

  // Interface d'erreur
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <div className="text-center">
          <div className="text-red-400 mb-2">❌ {error}</div>
          <a
            href={spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1DB954] hover:text-[#1DB954]/80 text-sm underline"
          >
            Ouvrir dans Spotify
          </a>
        </div>
      </div>
    );
  }

  // Interface de chargement
  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1DB954] mx-auto mb-3"></div>
          <p className="text-gray-400 text-sm">Chargement du lecteur Spotify...</p>
        </div>
      </div>
    );
  }

  // Lecteur iframe
  return (
    <div className="relative">
      <div
        ref={iframeRef}
        className="rounded-lg overflow-hidden border border-gray-600 w-full"
        style={{ height: compact ? '152px' : '380px' }}
      />
      {isReady && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          ✅ Lecteur Spotify actif
        </div>
      )}
    </div>
  );
};

export default SpotifyPlayerSimple; 