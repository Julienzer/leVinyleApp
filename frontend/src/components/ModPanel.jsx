import { useState, useEffect } from 'react';
import axios from 'axios';
import TrackCard from './TrackCard';

export default function ModPanel() {
  const [pendingTracks, setPendingTracks] = useState([]);
  const [error, setError] = useState('');

  const fetchPendingTracks = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/pending');
      setPendingTracks(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des morceaux en attente');
    }
  };

  useEffect(() => {
    fetchPendingTracks();
  }, []);

  const handleApprove = async (trackId) => {
    try {
      await axios.patch(`http://localhost:3000/api/track/${trackId}`, {
        status: 'approved'
      });
      fetchPendingTracks();
    } catch (err) {
      setError('Erreur lors de l\'approbation du morceau');
    }
  };

  const handleReject = async (trackId) => {
    try {
      await axios.patch(`http://localhost:3000/api/track/${trackId}`, {
        status: 'rejected'
      });
      fetchPendingTracks();
    } catch (err) {
      setError('Erreur lors du rejet du morceau');
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-[#2D0036]/40 via-[#0A0A23]/40 to-[#1a1a40]/40 rounded-3xl shadow-2xl border-2 border-[#00FFD0]/20 backdrop-blur-md p-16">
      <h2 className="text-5xl font-extrabold text-[#00FFD0] mb-16 drop-shadow-[0_0_16px_#00FFD0] tracking-wide">Panneau de modération</h2>

      {error && (
        <div className="mb-8 p-4 bg-red-500/20 border-2 border-red-500 rounded-xl text-red-500 text-xl">
          {error}
        </div>
      )}

      <div className="space-y-12">
        {pendingTracks.length === 0 ? (
          <p className="text-gray-400 text-center py-16 text-2xl">
            Aucun morceau en attente de modération
          </p>
        ) : (
          pendingTracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              onApprove={handleApprove}
              onReject={handleReject}
              showActions={true}
            />
          ))
        )}
      </div>
    </div>
  );
} 