const SpotifyWebApi = require('spotify-web-api-node');
require('dotenv').config();

// Mock data pour le développement
const mockTracks = {
  'track1': {
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    spotify_url: 'https://open.spotify.com/track/track1'
  },
  'track2': {
    title: 'Starman',
    artist: 'David Bowie',
    spotify_url: 'https://open.spotify.com/track/track2'
  },
  'track3': {
    title: 'Sweet Home Alabama',
    artist: 'Lynyrd Skynyrd',
    spotify_url: 'https://open.spotify.com/track/track3'
  }
};

class SpotifyService {
  static async initialize() {
    console.log('Mock Spotify service initialized');
    return true;
  }

  static async getTrackInfo(spotifyUrl) {
    try {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Extraire un ID de piste aléatoire pour la démo
      const trackIds = Object.keys(mockTracks);
      const randomTrackId = trackIds[Math.floor(Math.random() * trackIds.length)];
      
      return mockTracks[randomTrackId];
    } catch (error) {
      console.error('Error getting track info:', error);
      throw error;
    }
  }

  static async addToPlaylist(trackId, playlistId) {
    try {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log(`Mock: Added track ${trackId} to playlist ${playlistId}`);
      return true;
    } catch (error) {
      console.error('Error adding track to playlist:', error);
      throw error;
    }
  }
}

module.exports = SpotifyService; 