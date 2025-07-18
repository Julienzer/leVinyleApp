const SpotifyWebApi = require('spotify-web-api-node');
require('dotenv').config();
const { spotifyUserTokens } = require('../auth');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

class SpotifyService {
  static async initialize() {
    try {
      const data = await spotifyApi.clientCredentialsGrant();
      spotifyApi.setAccessToken(data.body['access_token']);
      console.log('Spotify service initialized (real API)');
    } catch (error) {
      console.error('Error initializing Spotify API:', error);
    }
  }

  static async getTrackInfo(spotifyUrl) {
    // Extrait l'ID du morceau depuis l'URL
    const match = spotifyUrl.match(/track\/([a-zA-Z0-9]+)/);
    if (!match) throw new Error('Invalid Spotify URL');
    const trackId = match[1];
    try {
      const data = await spotifyApi.getTrack(trackId);
      const track = data.body;
      return {
        spotify_url: spotifyUrl,
        title: track.name,
        artist: track.artists.map(a => a.name).join(', '),
      };
    } catch (error) {
      console.error('Error fetching track from Spotify:', error);
      throw new Error('Spotify track not found');
    }
  }

  // Recherche des morceaux sur Spotify
  static async searchTracks(query, limit = 20) {
    try {
      console.log('🔍 Searching Spotify for:', query);
      const searchResults = await spotifyApi.searchTracks(query, { limit });
      const tracks = searchResults.body.tracks.items;
      
      // Formater les résultats pour le frontend
      const formattedResults = tracks.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists.map(a => a.name).join(', '),
        album: track.album.name,
        duration: this.formatDuration(track.duration_ms),
        spotify_url: track.external_urls.spotify,
        preview_url: track.preview_url,
        image: track.album.images[0]?.url || null,
        popularity: track.popularity
      }));

      console.log('✅ Found', formattedResults.length, 'tracks');
      return formattedResults;
    } catch (error) {
      console.error('Error searching Spotify tracks:', error);
      throw new Error('Erreur lors de la recherche Spotify');
    }
  }

  // Utilitaire pour formater la durée
  static formatDuration(durationMs) {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Ajoute un morceau à la playlist Spotify avec le token utilisateur
  static async addToPlaylist(trackId, playlistId) {
    console.log('Adding track to playlist:', { trackId, playlistId });
    console.log('Current Spotify user tokens:', spotifyUserTokens);

    if (!spotifyUserTokens || Object.keys(spotifyUserTokens).length === 0) {
      console.error('No Spotify user tokens available');
      throw new Error('Aucun token utilisateur Spotify disponible. Veuillez vous authentifier via /api/auth/spotify en tant que streamer.');
    }

    const userIds = Object.keys(spotifyUserTokens);
    console.log('Available user IDs:', userIds);
    
    const userId = userIds[0]; // Prend le premier utilisateur authentifié
    const { access_token, refresh_token } = spotifyUserTokens[userId];

    if (!access_token || !refresh_token) {
      console.error('Invalid Spotify tokens for user:', userId);
      throw new Error('Token Spotify invalide. Veuillez vous réauthentifier via /api/auth/spotify.');
    }

    const userApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      accessToken: access_token,
      refreshToken: refresh_token,
    });

    try {
      console.log('Attempting to add track to playlist...');
      const result = await userApi.addTracksToPlaylist(playlistId, [`spotify:track:${trackId}`]);
      console.log('Track added successfully:', result);
      return true;
    } catch (error) {
      console.error('Error adding track to playlist:', error);
      if (error.statusCode === 401) {
        throw new Error('Session Spotify expirée. Veuillez vous réauthentifier via /api/auth/spotify.');
      }
      throw new Error(`Erreur lors de l'ajout à la playlist Spotify: ${error.message}`);
    }
  }
}

module.exports = SpotifyService; 