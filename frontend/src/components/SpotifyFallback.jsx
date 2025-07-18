import { useEffect, useState } from 'react';

const SpotifyFallback = ({ spotifyUrl, compact = true }) => {
  const [trackId, setTrackId] = useState(null);
  const [error, setError] = useState(null);

  // Extraire l'ID Spotify
  const extractSpotifyId = (url) => {
    if (!url) return null;
    const match = url.match(/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  useEffect(() => {
    if (spotifyUrl) {
      const id = extractSpotifyId(spotifyUrl);
      if (id) {
        setTrackId(id);
        setError(null);
      } else {
        setError('URL Spotify invalide');
      }
    }
  }, [spotifyUrl]);

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <div className="text-red-400 text-sm mb-2">❌ {error}</div>
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

  if (!trackId) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 text-center">
        <div className="text-gray-400 text-sm">Chargement...</div>
      </div>
    );
  }

  const height = compact ? 152 : 380;
  const embedUrl = `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`;

  return (
    <div className="relative">
      <iframe
        src={embedUrl}
        width="100%"
        height={height}
        frameBorder="0"
        allowtransparency="true"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="rounded-lg"
        onError={() => setError('Impossible de charger le lecteur Spotify')}
      />
      <div className="mt-2 text-xs text-gray-500 text-center">
        🎵 Lecteur Spotify (fallback)
      </div>
    </div>
  );
};

export default SpotifyFallback; 