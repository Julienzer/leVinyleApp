const spotifyApi = require('spotify-web-api-node');
const { spotifyUserTokens } = require('../auth');

// Récupérer les playlists Spotify de l'utilisateur
const getSpotifyPlaylists = async (req, res) => {
  try {
    console.log('🎵 Récupération des playlists Spotify...');
    console.log('🔑 Tokens Spotify disponibles:', Object.keys(spotifyUserTokens));
    
    // Trouver le token Spotify de l'utilisateur
    let spotifyToken = null;
    let spotifyUserId = null;
    
    for (const [userId, tokenData] of Object.entries(spotifyUserTokens)) {
      if (tokenData.access_token) {
        spotifyToken = tokenData.access_token;
        spotifyUserId = userId;
        console.log('✅ Token Spotify trouvé pour:', tokenData.display_name);
        break;
      }
    }
    
    if (!spotifyToken) {
      return res.status(401).json({
        success: false,
        error: 'Aucune connexion Spotify trouvée. Veuillez vous connecter à Spotify.'
      });
    }
    
    // Configurer l'API Spotify
    const api = new spotifyApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.SPOTIFY_REDIRECT_URI
    });
    
    api.setAccessToken(spotifyToken);
    
    // Récupérer les playlists de l'utilisateur
    console.log('📋 Récupération des playlists via API Spotify...');
    const playlistsResponse = await api.getUserPlaylists(spotifyUserId, {
      limit: 50,
      offset: 0
    });
    
    const playlists = playlistsResponse.body.items.map(playlist => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description || '',
      tracks: {
        total: playlist.tracks.total
      },
      images: playlist.images || [],
      owner: {
        id: playlist.owner.id,
        display_name: playlist.owner.display_name
      },
      public: playlist.public,
      collaborative: playlist.collaborative,
      external_urls: playlist.external_urls
    }));
    
    console.log(`✅ ${playlists.length} playlists récupérées`);
    
    res.json({
      success: true,
      playlists: playlists,
      user: {
        id: spotifyUserId,
        display_name: spotifyUserTokens[spotifyUserId].display_name
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des playlists Spotify:', error);
    
    if (error.statusCode === 401) {
      return res.status(401).json({
        success: false,
        error: 'Token Spotify expiré. Veuillez vous reconnecter.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des playlists Spotify'
    });
  }
};

// Ajouter un morceau à une playlist Spotify
const addTrackToSpotifyPlaylist = async (req, res) => {
  try {
    const { playlistId, trackId } = req.params;
    const { spotify_url } = req.body;
    
    console.log('🎵 Ajout du morceau à la playlist Spotify:', { playlistId, trackId, spotify_url });
    
    // Trouver le token Spotify de l'utilisateur
    let spotifyToken = null;
    let spotifyUserId = null;
    
    for (const [userId, tokenData] of Object.entries(spotifyUserTokens)) {
      if (tokenData.access_token) {
        spotifyToken = tokenData.access_token;
        spotifyUserId = userId;
        break;
      }
    }
    
    if (!spotifyToken) {
      return res.status(401).json({
        success: false,
        error: 'Aucune connexion Spotify trouvée'
      });
    }
    
    // Extraire l'ID Spotify de l'URL
    const spotifyTrackId = extractSpotifyTrackId(spotify_url);
    if (!spotifyTrackId) {
      return res.status(400).json({
        success: false,
        error: 'URL Spotify invalide'
      });
    }
    
    // Configurer l'API Spotify
    const api = new spotifyApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.SPOTIFY_REDIRECT_URI
    });
    
    api.setAccessToken(spotifyToken);
    
    // Ajouter le morceau à la playlist
    console.log('➕ Ajout du morceau:', spotifyTrackId, 'à la playlist:', playlistId);
    
    const trackUri = `spotify:track:${spotifyTrackId}`;
    await api.addTracksToPlaylist(playlistId, [trackUri]);
    
    console.log('✅ Morceau ajouté à la playlist Spotify avec succès');
    
    res.json({
      success: true,
      message: 'Morceau ajouté à la playlist Spotify avec succès',
      track_uri: trackUri,
      playlist_id: playlistId
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout à la playlist Spotify:', error);
    
    if (error.statusCode === 401) {
      return res.status(401).json({
        success: false,
        error: 'Token Spotify expiré. Veuillez vous reconnecter.'
      });
    }
    
    if (error.statusCode === 403) {
      return res.status(403).json({
        success: false,
        error: 'Permissions insuffisantes pour modifier cette playlist'
      });
    }
    
    if (error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        error: 'Playlist ou morceau non trouvé'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'ajout à la playlist Spotify'
    });
  }
};

// Fonction utilitaire pour extraire l'ID Spotify d'une URL
const extractSpotifyTrackId = (url) => {
  if (!url) return null;
  
  const patterns = [
    /spotify:track:([a-zA-Z0-9]+)/,
    /open\.spotify\.com\/track\/([a-zA-Z0-9]+)/,
    /spotify\.com\/track\/([a-zA-Z0-9]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
};

// Obtenir les détails d'une playlist Spotify
const getSpotifyPlaylistDetails = async (req, res) => {
  try {
    const { playlistId } = req.params;
    
    console.log('🎵 Récupération des détails de la playlist:', playlistId);
    
    // Trouver le token Spotify
    let spotifyToken = null;
    for (const tokenData of Object.values(spotifyUserTokens)) {
      if (tokenData.access_token) {
        spotifyToken = tokenData.access_token;
        break;
      }
    }
    
    if (!spotifyToken) {
      return res.status(401).json({
        success: false,
        error: 'Aucune connexion Spotify trouvée'
      });
    }
    
    const api = new spotifyApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.SPOTIFY_REDIRECT_URI
    });
    
    api.setAccessToken(spotifyToken);
    
    // Récupérer les détails de la playlist
    const playlistResponse = await api.getPlaylist(playlistId);
    const playlist = playlistResponse.body;
    
    // Récupérer les morceaux de la playlist
    const tracksResponse = await api.getPlaylistTracks(playlistId, {
      limit: 50,
      offset: 0
    });
    
    res.json({
      success: true,
      playlist: {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        tracks: {
          total: playlist.tracks.total,
          items: tracksResponse.body.items
        },
        images: playlist.images,
        owner: playlist.owner,
        public: playlist.public
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des détails:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des détails de la playlist'
    });
  }
};

module.exports = {
  getSpotifyPlaylists,
  addTrackToSpotifyPlaylist,
  getSpotifyPlaylistDetails,
  extractSpotifyTrackId
}; 