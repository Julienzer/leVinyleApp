import { useState, useEffect } from 'react';
import TrackCard from './TrackCard';
import { api } from '../utils/api';

export default function ModPanel({ token }) {
  const [pendingTracks, setPendingTracks] = useState([]);
  const [error, setError] = useState('');

  const fetchPendingTracks = async () => {
    if (!token) {
      setError('Vous devez être connecté pour accéder au panneau de modération');
      return;
    }

    try {
      const response = await api.get('/api/pending', token);
      if (response.ok) {
        const data = await response.json();
        setPendingTracks(data);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Vous n\'êtes pas autorisé à accéder au panneau de modération');
      } else if (err.response?.status === 403) {
        setError('Vous devez être modérateur pour accéder à cette fonctionnalité');
      } else {
        setError('Erreur lors du chargement des morceaux en attente');
      }
    }
  };

  useEffect(() => {
    fetchPendingTracks();
  }, [token]);

  const handleApprove = async (trackId) => {
    if (!token) {
      setError('Vous devez être connecté pour modérer les morceaux');
      return;
    }
    try {
      await api.post(`/api/track/${trackId}/approve`, {}, token);
      fetchPendingTracks();
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Vous n\'êtes pas autorisé à modérer les morceaux');
      } else if (err.response?.status === 403) {
        setError('Vous devez être modérateur pour approuver les morceaux');
      } else {
        setError('Erreur lors de l\'approbation du morceau');
      }
    }
  };

  const handleReject = async (trackId) => {
    if (!token) {
      setError('Vous devez être connecté pour modérer les morceaux');
      return;
    }
    try {
      await api.delete(`/api/track/${trackId}`, token);
      fetchPendingTracks();
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Vous n\'êtes pas autorisé à modérer les morceaux');
      } else if (err.response?.status === 403) {
        setError('Vous devez être modérateur pour rejeter les morceaux');
      } else {
        setError('Erreur lors du rejet du morceau');
      }
    }
  };

  if (!token) {
    return (
      <div className="w-full bg-gradient-to-br from-[#2D0036]/40 via-[#0A0A23]/40 to-[#1a1a40]/40 rounded-3xl shadow-2xl border-2 border-[#00FFD0]/20 backdrop-blur-md p-16">
        <h2 className="text-5xl font-extrabold text-[#00FFD0] mb-16 drop-shadow-[0_0_16px_#00FFD0] tracking-wide">Panneau de modération</h2>
        <div className="text-center text-white text-xl">
          <p>Vous devez être connecté avec Twitch pour accéder au panneau de modération.</p>
          <p className="mt-4">Seuls les modérateurs de la chaîne peuvent accéder à cette fonctionnalité.</p>
        </div>
      </div>
    );
  }

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