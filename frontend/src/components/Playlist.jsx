import { useState, useEffect } from 'react';
import axios from 'axios';
import TrackCard from './TrackCard';

export default function Playlist({ token, user }) {
  const [approvedTracks, setApprovedTracks] = useState([]);
  const [error, setError] = useState('');

  const fetchApprovedTracks = async () => {
    try {
      const response = await axios.get('/api/approved');
      setApprovedTracks(response.data);
    } catch (err) {
      setError('Erreur lors du chargement de la playlist');
    }
  };

  useEffect(() => {
    fetchApprovedTracks();
    // Rafraîchir la playlist toutes les 30 secondes
    const interval = setInterval(fetchApprovedTracks, 30000);
    return () => clearInterval(interval);
  }, []);

  // Actions streamer seulement
  const handleApprove = async (trackId) => {
    if (!token) return;
    try {
      await axios.post(`/api/track/${trackId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchApprovedTracks();
    } catch (err) {
      setError('Erreur lors de la validation du morceau');
    }
  };
  const handleDelete = async (trackId) => {
    if (!token) return;
    try {
      await axios.delete(`/api/track/${trackId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchApprovedTracks();
    } catch (err) {
      setError('Erreur lors de la suppression du morceau');
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-[#2D0036]/40 via-[#0A0A23]/40 to-[#1a1a40]/40 rounded-3xl shadow-2xl border-2 border-[#FF4FAD]/20 backdrop-blur-md p-16">
      <h2 className="text-5xl font-extrabold text-[#FF4FAD] mb-16 drop-shadow-[0_0_16px_#FF4FAD] tracking-wide">Playlist en direct</h2>

      {error && (
        <div className="mb-8 p-4 bg-red-500/20 border-2 border-red-500 rounded-xl text-red-500 text-xl">
          {error}
        </div>
      )}

      <div className="space-y-12">
        {approvedTracks.length === 0 ? (
          <p className="text-gray-400 text-center py-16 text-2xl">
            Aucun morceau dans la playlist
          </p>
        ) : (
          approvedTracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              showActions={user?.isStreamer}
              onApprove={handleApprove}
              onReject={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
} 