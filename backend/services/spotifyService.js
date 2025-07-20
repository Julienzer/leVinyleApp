const SpotifyWebApi = require('spotify-web-api-node');
require('dotenv').config();
const User = require('../models/User');
const { spotifyUserTokens } = require('../auth');

// Classe pour gérer les interactions avec l'API Spotify
class SpotifyService {
  constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.SPOTIFY_REDIRECT_URI
    });
  }

  static async initialize() {
    try {
      const data = await this.spotifyApi.clientCredentialsGrant();
      this.spotifyApi.setAccessToken(data.body['access_token']);
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
      const data = await this.spotifyApi.getTrack(trackId);
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

  // Recherche des morceaux sur Spotify avec l'API publique
  static async searchTracks(query, limit = 20) {
    console.log('🔍 Searching tracks on Spotify:', query);
    
    try {
      // Utiliser l'authentification client credentials (publique)
      const spotifyApi = new SpotifyWebApi({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET
      });

      // Get access token (client credentials flow)
      const data = await spotifyApi.clientCredentialsGrant();
      spotifyApi.setAccessToken(data.body['access_token']);

      const results = await spotifyApi.searchTracks(query, { limit });
      
      const tracks = results.body.tracks.items.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists.map(artist => artist.name).join(', '),
        album: track.album.name,
        duration: this.formatDuration(track.duration_ms),
        image: track.album.images && track.album.images.length > 0 
          ? track.album.images[0].url 
          : null,
        spotify_url: track.external_urls.spotify,
        preview_url: track.preview_url
      }));

      console.log(`✅ Found ${tracks.length} tracks for query: ${query}`);
      return {
        tracks,
        total: results.body.tracks.total,
        query
      };

    } catch (error) {
      console.error('❌ Error searching tracks on Spotify:', error);
      throw new Error('Erreur lors de la recherche sur Spotify: ' + error.message);
    }
  }

  // Helper pour formater la durée
  static formatDuration(durationMs) {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Ajoute un morceau à la playlist Spotify avec le token utilisateur
  static async addToPlaylist(trackId, playlistId, userId) {
    console.log('🎵 Adding track to playlist:', { trackId, playlistId, userId });

    // Récupérer les tokens Spotify de l'utilisateur depuis la mémoire (comme Twitch)
    const spotifyData = spotifyUserTokens[userId];
    
    if (!spotifyData) {
      console.error('❌ No Spotify tokens found for user:', userId);
      throw new Error('Aucun token utilisateur Spotify disponible. Veuillez vous authentifier via /api/auth/spotify.');
    }

    // Vérifier si le token est expiré
    const isExpired = Date.now() >= spotifyData.expires_at;
    if (isExpired) {
      console.error('❌ Spotify tokens expired for user:', userId);
      throw new Error('Token Spotify expiré. Veuillez vous réauthentifier via /api/auth/spotify.');
    }

    console.log('✅ Valid Spotify tokens found for:', spotifyData.display_name);

    const userApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      accessToken: spotifyData.access_token,
      refreshToken: spotifyData.refresh_token,
    });

    try {
      console.log('🔄 Attempting to add track to playlist...');
      const result = await userApi.addTracksToPlaylist(playlistId, [`spotify:track:${trackId}`]);
      console.log('✅ Track added successfully:', result);
      return true;
    } catch (error) {
      console.error('❌ Error adding track to playlist:', error);
      if (error.statusCode === 401) {
        throw new Error('Session Spotify expirée. Veuillez vous réauthentifier via /api/auth/spotify.');
      }
      throw new Error(`Erreur lors de l'ajout à la playlist Spotify: ${error.message}`);
    }
  }
}

module.exports = SpotifyService; 