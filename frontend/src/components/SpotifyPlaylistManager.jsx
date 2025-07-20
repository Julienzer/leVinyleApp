import { useState, useEffect } from 'react';
import { MusicalNoteIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { api } from '../utils/api';

const SpotifyPlaylistManager = ({ 
  user, 
  token, 
  selectedPlaylistId, 
  onPlaylistSelect, 
  isTestMode = false 
}) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [spotifyUser, setSpotifyUser] = useState(null);

  // Mock data pour le mode test
  const mockSpotifyPlaylists = [
    {
      id: 'spotify-playlist-1',
      name: 'Ma Playlist de Stream',
      description: 'Mes morceaux préférés pour les streams',
      tracks: { total: 25 },
      images: [{ url: 'https://via.placeholder.com/60x60?text=🎵' }],
      owner: { display_name: 'TestStreamer' },
      public: true
    },
    {
      id: 'spotify-playlist-2', 
      name: 'Chill Vibes',
      description: 'Pour les moments détente',
      tracks: { total: 12 },
      images: [{ url: 'https://via.placeholder.com/60x60?text=🎶' }],
      owner: { display_name: 'TestStreamer' },
      public: false
    },
    {
      id: 'spotify-playlist-3',
      name: 'Hip-Hop Classics',
      description: '',
      tracks: { total: 45 },
      images: [{ url: 'https://via.placeholder.com/60x60?text=🎤' }],
      owner: { display_name: 'TestStreamer' },
      public: true
    }
  ];

  useEffect(() => {
    checkSpotifyConnection();
  }, []);

  useEffect(() => {
    if (spotifyConnected) {
      fetchSpotifyPlaylists();
    }
  }, [spotifyConnected]);

  const checkSpotifyConnection = async () => {
    try {
      if (isTestMode) {
        // Simuler une connexion Spotify en mode test
        setSpotifyConnected(true);
        setSpotifyUser({ display_name: 'TestStreamer', id: 'test_spotify_user' });
        return;
      }

      // Vérifier que l'utilisateur est connecté à Twitch avant de vérifier Spotify
      if (!token) {
        console.log('🔒 Pas de token Twitch, impossible de vérifier Spotify');
        setSpotifyConnected(false);
        setSpotifyUser(null);
        return;
      }

      const response = await api.get('/api/auth/spotify/status', token);
      const data = await response.json();
      
      console.log('🎵 Statut Spotify:', data);
      
      if (data.success && data.authenticated && data.currentUser) {
        setSpotifyConnected(true);
        setSpotifyUser(data.currentUser);
      } else {
        setSpotifyConnected(false);
      }
    } catch (err) {
      console.error('Erreur vérification Spotify:', err);
      setSpotifyConnected(false);
    }
  };

  const fetchSpotifyPlaylists = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (isTestMode) {
        // Simuler un délai réseau
        await new Promise(resolve => setTimeout(resolve, 1000));
        setPlaylists(mockSpotifyPlaylists);
      } else {
        const response = await api.get('/api/spotify/playlists', token);
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des playlists Spotify');
        }
        
        const data = await response.json();
        setPlaylists(data.playlists || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectSpotify = () => {
    if (isTestMode) {
      // En mode test, simuler la connexion
      setSpotifyConnected(true);
      setSpotifyUser({ display_name: 'TestStreamer', id: 'test_spotify_user' });
      return;
    }
    
    // Rediriger vers l'authentification Spotify
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    window.location.href = `${apiUrl}/api/auth/spotify`;
  };

  if (!spotifyConnected) {
    return (
      <div className="bg-[#2D0036]/60 backdrop-blur-md rounded-lg p-6 border border-[#FF4FAD]/20">
        <div className="text-center">
          <h3 className="text-xl font-bold text-[#FF4FAD] mb-4">
            🎵 Connexion Spotify Requise
          </h3>
          <p className="text-gray-300 mb-6">
            Connectez votre compte Spotify pour accéder à vos playlists et ajouter des morceaux directement.
          </p>
          <button
            onClick={handleConnectSpotify}
            className="flex items-center space-x-2 px-6 py-3 bg-[#1DB954] text-white rounded-lg hover:bg-[#1DB954]/90 transition-colors mx-auto"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            <span>Se connecter à Spotify</span>
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-[#2D0036]/60 backdrop-blur-md rounded-lg p-4 border border-[#FF4FAD]/20">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1DB954] mr-3"></div>
          <span className="text-white">Chargement des playlists Spotify...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#2D0036]/60 backdrop-blur-md rounded-lg p-6 border border-[#FF4FAD]/20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-[#FF4FAD]">
            🎵 Mes Playlists Spotify
          </h3>
          {spotifyUser && (
            <p className="text-sm text-gray-400 mt-1">
              Connecté en tant que <span className="text-[#1DB954]">{spotifyUser.display_name}</span>
            </p>
          )}
        </div>
        <button
          onClick={fetchSpotifyPlaylists}
          className="flex items-center space-x-2 px-4 py-2 bg-[#1DB954]/20 text-[#1DB954] rounded-lg hover:bg-[#1DB954]/30 transition-colors"
        >
          <ArrowPathIcon className="w-4 h-4" />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Sélecteur de playlist */}
      <div className="mb-4">
        <label className="block text-white font-medium mb-2">
          Playlist active pour l'ajout de morceaux
        </label>
        <select
          value={selectedPlaylistId || ''}
          onChange={(e) => onPlaylistSelect(e.target.value)}
          className="w-full bg-[#3A3A3A] border border-[#555] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#1DB954] transition-colors"
        >
          <option value="">Sélectionnez une playlist Spotify</option>
          {playlists.map(playlist => (
            <option key={playlist.id} value={playlist.id}>
              {playlist.name} ({playlist.tracks.total} morceaux)
            </option>
          ))}
        </select>
      </div>

      {/* Liste des playlists */}
      <div className="space-y-3">
        <h4 className="text-white font-medium">Vos playlists ({playlists.length})</h4>
        
        {playlists.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            <MusicalNoteIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Aucune playlist trouvée</p>
            <p className="text-sm">Créez des playlists sur Spotify pour les voir ici</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {playlists.map(playlist => (
              <div 
                key={playlist.id}
                className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                  selectedPlaylistId === playlist.id 
                    ? 'bg-[#1DB954]/20 border-[#1DB954] text-[#1DB954]' 
                    : 'bg-[#3A3A3A] border-[#555] text-white hover:bg-[#3A3A3A]/80'
                }`}
                onClick={() => onPlaylistSelect(playlist.id)}
              >
                <div className="flex items-center space-x-3">
                  {playlist.images && playlist.images.length > 0 ? (
                    <img 
                      src={playlist.images[0].url} 
                      alt={playlist.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-600 rounded flex items-center justify-center">
                      <MusicalNoteIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h5 className="font-medium">{playlist.name}</h5>
                    {playlist.description && (
                      <p className="text-sm opacity-75 truncate">{playlist.description}</p>
                    )}
                    <div className="flex items-center space-x-2 text-xs opacity-75 mt-1">
                      <span>{playlist.tracks.total} morceaux</span>
                      <span>•</span>
                      <span>{playlist.public ? 'Publique' : 'Privée'}</span>
                      <span>•</span>
                      <span>Par {playlist.owner.display_name}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Indicateur de playlist sélectionnée */}
      {selectedPlaylistId && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-green-400 text-sm">
            ✅ Playlist active : {playlists.find(p => p.id === selectedPlaylistId)?.name}
          </p>
        </div>
      )}

      {/* Mode test indicator */}
      {isTestMode && (
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-blue-400 text-sm">
            🧪 Mode test : Playlists Spotify simulées
          </p>
        </div>
      )}
    </div>
  );
};

export default SpotifyPlaylistManager; 