import { useState, useEffect } from 'react';
import { PlusIcon, MusicalNoteIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const PlaylistManager = ({ 
  user, 
  token, 
  selectedPlaylistId, 
  onPlaylistSelect, 
  isTestMode = false 
}) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Mock data pour le mode test
  const mockPlaylists = [
    {
      id: 'playlist-1',
      name: 'Session Live Stream',
      description: 'Morceaux de ma session en direct',
      tracks_count: 12,
      created_at: new Date().toISOString()
    },
    {
      id: 'playlist-2', 
      name: 'Viewer Favorites',
      description: 'Les coups de cœur des viewers',
      tracks_count: 8,
      created_at: new Date().toISOString()
    }
  ];

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (isTestMode) {
        // Simuler un délai réseau
        await new Promise(resolve => setTimeout(resolve, 500));
        setPlaylists(mockPlaylists);
      } else {
        const response = await fetch('/api/playlists', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des playlists');
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

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    
    if (!newPlaylistName.trim()) {
      setError('Le nom de la playlist est requis');
      return;
    }

    setCreating(true);
    setError('');

    try {
      if (isTestMode) {
        // Simuler la création d'une playlist
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const newPlaylist = {
          id: `playlist-${Date.now()}`,
          name: newPlaylistName,
          description: newPlaylistDescription,
          tracks_count: 0,
          created_at: new Date().toISOString()
        };
        
        setPlaylists(prev => [newPlaylist, ...prev]);
        
        // Sélectionner automatiquement la nouvelle playlist
        onPlaylistSelect(newPlaylist.id);
      } else {
        const response = await fetch('/api/playlists', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: newPlaylistName,
            description: newPlaylistDescription
          })
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Erreur lors de la création');
        }
        
        const data = await response.json();
        setPlaylists(prev => [data.playlist, ...prev]);
        onPlaylistSelect(data.playlist.id);
      }

      // Réinitialiser le formulaire
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      setShowCreateForm(false);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#2D0036]/60 backdrop-blur-md rounded-lg p-4 border border-[#FF4FAD]/20">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF4FAD] mr-3"></div>
          <span className="text-white">Chargement des playlists...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#2D0036]/60 backdrop-blur-md rounded-lg p-6 border border-[#FF4FAD]/20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-[#FF4FAD]">
          🎵 Gestion des Playlists
        </h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-[#FF4FAD]/20 text-[#FF4FAD] rounded-lg hover:bg-[#FF4FAD]/30 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Nouvelle playlist</span>
        </button>
      </div>

      {/* Formulaire de création */}
      {showCreateForm && (
        <form onSubmit={handleCreatePlaylist} className="mb-6 space-y-4">
          <div className="bg-[#3A3A3A] rounded-lg p-4 border border-[#555]">
            <div className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">
                  Nom de la playlist
                </label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Ma nouvelle playlist"
                  className="w-full bg-[#2D2D2D] border border-[#555] rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#FF4FAD] transition-colors"
                  required
                />
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">
                  Description (optionnel)
                </label>
                <textarea
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  placeholder="Description de la playlist"
                  rows={2}
                  className="w-full bg-[#2D2D2D] border border-[#555] rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#FF4FAD] transition-colors resize-none"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#FF4FAD] text-white rounded-lg hover:bg-[#FF4FAD]/90 transition-colors disabled:opacity-50"
                >
                  {creating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <CheckCircleIcon className="w-4 h-4" />
                  )}
                  <span>{creating ? 'Création...' : 'Créer'}</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

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
          className="w-full bg-[#3A3A3A] border border-[#555] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF4FAD] transition-colors"
        >
          <option value="">Sélectionnez une playlist</option>
          {playlists.map(playlist => (
            <option key={playlist.id} value={playlist.id}>
              {playlist.name} ({playlist.tracks_count} morceaux)
            </option>
          ))}
        </select>
      </div>

      {/* Liste des playlists */}
      <div className="space-y-3">
        <h4 className="text-white font-medium">Vos playlists</h4>
        
        {playlists.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            <MusicalNoteIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Aucune playlist créée</p>
            <p className="text-sm">Créez votre première playlist pour commencer</p>
          </div>
        ) : (
          <div className="space-y-2">
            {playlists.map(playlist => (
              <div 
                key={playlist.id}
                className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                  selectedPlaylistId === playlist.id 
                    ? 'bg-[#FF4FAD]/20 border-[#FF4FAD] text-[#FF4FAD]' 
                    : 'bg-[#3A3A3A] border-[#555] text-white hover:bg-[#3A3A3A]/80'
                }`}
                onClick={() => onPlaylistSelect(playlist.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium">{playlist.name}</h5>
                    {playlist.description && (
                      <p className="text-sm opacity-75">{playlist.description}</p>
                    )}
                  </div>
                  <div className="text-sm opacity-75">
                    {playlist.tracks_count} morceaux
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
    </div>
  );
};

export default PlaylistManager; 