import React, { useState, useEffect } from 'react';

const SpotifyPreview = ({ spotifyUrl, trackName, artist }) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [embedUrl, setEmbedUrl] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useEmbed, setUseEmbed] = useState(false);

  useEffect(() => {
    if (!spotifyUrl) {
      setError('URL Spotify manquante');
      setLoading(false);
      return;
    }

    // Extraire l'ID du track de l'URL Spotify
    const trackIdMatch = spotifyUrl.match(/track\/([a-zA-Z0-9]+)/);
    if (!trackIdMatch) {
      setError('URL Spotify invalide');
      setLoading(false);
      return;
    }

    const trackId = trackIdMatch[1];
    const embedUrl = `https://open.spotify.com/embed/track/${trackId}`;
    setEmbedUrl(embedUrl);

    // Essayer de récupérer la preview via l'API Spotify
    fetchPreviewUrl(trackId);
  }, [spotifyUrl]);

  const fetchPreviewUrl = async (trackId) => {
    try {
      setLoading(true);
      setError(null);

      // Appel à votre API backend pour récupérer les infos du track
      const response = await fetch(`/api/spotify/tracks/${trackId}/preview`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.preview_url) {
          setPreviewUrl(data.preview_url);
          setUseEmbed(false);
        } else {
          // Pas de preview disponible, utiliser l'embed
          setUseEmbed(true);
        }
      } else {
        // Erreur API, utiliser l'embed comme fallback
        setUseEmbed(true);
      }
    } catch (err) {
      console.warn('Erreur lors de la récupération de la preview:', err);
      // En cas d'erreur, utiliser l'embed
      setUseEmbed(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewError = () => {
    console.log('Preview audio échouée, passage à l\'embed');
    setUseEmbed(true);
    setError(null);
  };

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  if (error && !useEmbed) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-red-800 text-sm">{error}</span>
        </div>
        {embedUrl && (
          <button
            onClick={() => setUseEmbed(true)}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Utiliser l'aperçu Spotify à la place
          </button>
        )}
      </div>
    );
  }

  if (useEmbed && embedUrl) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-gray-600">Aperçu Spotify</span>
        </div>
        
        <div className="bg-gray-50 rounded-lg overflow-hidden">
          <iframe
            src={embedUrl}
            width="100%"
            height="80"
            frameBorder="0"
            allow="encrypted-media"
            title={`Preview de ${trackName} par ${artist}`}
            className="w-full"
          />
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          {trackName} - {artist}
        </div>
      </div>
    );
  }

  if (previewUrl) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-gray-600">Preview audio</span>
        </div>
        
        <audio
          controls
          className="w-full"
          onError={handlePreviewError}
          preload="metadata"
        >
          <source src={previewUrl} type="audio/mpeg" />
          Votre navigateur ne supporte pas l'élément audio.
        </audio>
        
        <div className="mt-2 text-xs text-gray-500">
          {trackName} - {artist}
        </div>
      </div>
    );
  }

  // Fallback final
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-center">
        <svg className="w-5 h-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <span className="text-sm text-gray-600">Aperçu non disponible</span>
      </div>
      <div className="mt-1 text-xs text-gray-500">
        {trackName} - {artist}
      </div>
    </div>
  );
};

export default SpotifyPreview; 