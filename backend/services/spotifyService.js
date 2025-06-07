const SpotifyWebApi = require('spotify-web-api-node');
require('dotenv').config();

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

  // Optionnel : tu peux implémenter addToPlaylist plus tard
  static async addToPlaylist(trackId, playlistId) {
    // À implémenter si besoin
    return true;
  }
}

module.exports = SpotifyService; 