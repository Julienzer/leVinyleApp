const Track = require('../models/Track');
const SpotifyService = require('../services/spotifyService');

class TrackController {
  static async submitTrack(req, res) {
    try {
      const { spotify_url, submitted_by } = req.body;

      // Validate Spotify URL
      if (
        !spotify_url ||
        !/^https:\/\/open\.spotify\.com\/(intl-[a-z]{2}\/)?track\/[a-zA-Z0-9]+/.test(spotify_url)
      ) {
        return res.status(400).json({ error: 'Invalid Spotify URL' });
      }

      // Get track info from Spotify
      const trackInfo = await SpotifyService.getTrackInfo(spotify_url);

      // Create track in database
      const track = await Track.create({
        ...trackInfo,
        submitted_by
      });

      res.status(201).json(track);
    } catch (error) {
      console.error('Error submitting track:', error);
      res.status(500).json({ error: 'Error submitting track' });
    }
  }

  static async getPendingTracks(req, res) {
    try {
      const tracks = await Track.findAllPending();
      res.json(tracks);
    } catch (error) {
      console.error('Error getting pending tracks:', error);
      res.status(500).json({ error: 'Error getting pending tracks' });
    }
  }

  static async getApprovedTracks(req, res) {
    try {
      const tracks = await Track.findAllApproved();
      res.json(tracks);
    } catch (error) {
      console.error('Error getting approved tracks:', error);
      res.status(500).json({ error: 'Error getting approved tracks' });
    }
  }

  static async updateTrackStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const track = await Track.findById(id);
      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }

      const updatedTrack = await Track.updateStatus(id, status);

      // If track is approved, add it to Spotify playlist
      if (status === 'approved' && req.user) {
        const trackId = track.spotify_url.split('/').pop().split('?')[0];
        // Utiliser l'ID de l'utilisateur connecté pour ses tokens Spotify
        await SpotifyService.addToPlaylist(trackId, process.env.SPOTIFY_PLAYLIST_ID, req.user.id);
      }

      res.json(updatedTrack);
    } catch (error) {
      console.error('Error updating track status:', error);
      res.status(500).json({ error: 'Error updating track status' });
    }
  }

  // Approuver un morceau : ajout à la playlist Spotify et update DB
  static async approveTrack(req, res) {
    try {
      const { id } = req.params;
      const track = await Track.findById(id);
      if (!track) return res.status(404).json({ error: 'Track not found' });
      
      // Utiliser l'ID de l'utilisateur connecté (nécessite middleware requireAuth)
      if (!req.user) {
        return res.status(401).json({ error: 'Authentification requise' });
      }
      
      // Extraire l'ID du morceau Spotify
      const trackId = track.spotify_url.split('/').pop().split('?')[0];
      await SpotifyService.addToPlaylist(trackId, process.env.SPOTIFY_PLAYLIST_ID, req.user.id);
      await Track.updateStatus(id, 'approved');
      res.json({ success: true });
    } catch (error) {
      console.error('Erreur lors de l\'approbation du morceau:', error);
      res.status(500).json({ error: 'Erreur lors de l\'approbation du morceau' });
    }
  }

  // Supprimer un morceau
  static async deleteTrack(req, res) {
    try {
      const { id } = req.params;
      const track = await Track.findById(id);
      if (!track) return res.status(404).json({ error: 'Track not found' });
      await Track.delete(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Erreur lors de la suppression du morceau:', error);
      res.status(500).json({ error: 'Erreur lors de la suppression du morceau' });
    }
  }
}

module.exports = TrackController; 