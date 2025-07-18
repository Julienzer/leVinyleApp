const SpotifyService = require('../services/spotifyService');

class SearchController {
  // Recherche de morceaux sur Spotify
  static async searchTracks(req, res) {
    try {
      const { q, limit = 20 } = req.query;

      if (!q || !q.trim()) {
        return res.status(400).json({ error: 'Paramètre de recherche requis' });
      }

      const results = await SpotifyService.searchTracks(q.trim(), parseInt(limit));

      res.json({
        success: true,
        results,
        total: results.length,
        query: q.trim()
      });
    } catch (error) {
      console.error('Error in searchTracks:', error);
      res.status(500).json({ error: 'Erreur lors de la recherche Spotify' });
    }
  }
}

module.exports = SearchController; 