import { useState, useEffect } from 'react'
import { CheckIcon, XMarkIcon, ArrowPathIcon, MusicalNoteIcon } from '@heroicons/react/24/outline'
import { mockApiResponses } from '../utils/fakeData'
import { api } from '../utils/api'
import SpotifyPlayer from './SpotifyFallback'
import SpotifyPlaylistManager from './SpotifyPlaylistManager'

export default function StreamerInterface({ session, user, token, isTestMode }) {
  const [approvedTracks, setApprovedTracks] = useState([])
  const [pendingTracks, setPendingTracks] = useState([])
  const [sessionStats, setSessionStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('')
  const [showPlaylistManager, setShowPlaylistManager] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      console.log('🔄 Chargement initial des données streamer...')
      setLoading(true)
      try {
        await Promise.all([
          fetchApprovedTracks(),
          fetchPendingTracks(),
          fetchSessionStats()
        ])
        console.log('✅ Chargement initial terminé')
      } catch (error) {
        console.error('❌ Erreur lors du chargement initial:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  const fetchApprovedTracks = async () => {
    console.log('🔄 Récupération des morceaux approuvés...')
    try {
      if (isTestMode) {
        // Utiliser les mock API en mode test
        const response = await mockApiResponses.getPropositions(session.id, 'approved')
        setApprovedTracks(response.propositions)
        console.log('✅ Morceaux approuvés récupérés (test):', response.propositions.length)
      } else {
        // Utiliser les vraies API en mode production
        const response = await api.get(`/api/sessions/${session.id}/propositions/approved`, token)
        
        console.log('📡 Réponse API approved:', response.status, response.ok)
        
        if (response.ok) {
          const data = await response.json()
          setApprovedTracks(data.propositions)
          console.log('✅ Morceaux approuvés récupérés:', data.propositions.length)
        } else {
          console.error('❌ Erreur lors du chargement des morceaux approuvés:', response.status)
          setError('Erreur lors du chargement des morceaux approuvés')
        }
      }
    } catch (err) {
      console.error('❌ Exception lors du chargement des morceaux approuvés:', err)
      setError('Erreur lors du chargement des morceaux approuvés')
    }
  }

  const fetchPendingTracks = async () => {
    console.log('🔄 Récupération des propositions en attente...')
    try {
      if (isTestMode) {
        // Utiliser les mock API en mode test
        const response = await mockApiResponses.getPropositions(session.id, 'pending')
        setPendingTracks(response.propositions)
        console.log('✅ Propositions en attente récupérées (test):', response.propositions.length)
      } else {
        // Utiliser les vraies API en mode production
        const response = await api.get(`/api/sessions/${session.id}/propositions/pending`, token)
        
        console.log('📡 Réponse API pending:', response.status, response.ok)
        
        if (response.ok) {
          const data = await response.json()
          setPendingTracks(data.propositions)
          console.log('✅ Propositions en attente récupérées:', data.propositions.length)
        } else {
          console.error('❌ Erreur lors du chargement des propositions en attente:', response.status)
          setError('Erreur lors du chargement des propositions en attente')
        }
      }
    } catch (err) {
      console.error('❌ Exception lors du chargement des propositions en attente:', err)
      setError('Erreur lors du chargement des propositions en attente')
    }
  }

  const fetchSessionStats = async () => {
    try {
      if (isTestMode) {
        // Utiliser les mock API en mode test
        const response = await mockApiResponses.getSessionStats(session.id)
        setSessionStats(response.stats)
      } else {
        // Utiliser les vraies API en mode production
        const response = await api.get(`/api/sessions/${session.id}/stats`, token)
        
        if (response.ok) {
          const data = await response.json()
          setSessionStats(data.stats)
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err)
    }
  }

  const handleAddToPlaylist = async (trackId) => {
    if (!selectedPlaylistId) {
      setError('Veuillez sélectionner une playlist Spotify avant d\'ajouter un morceau')
      return
    }

    try {
      // Trouver le morceau pour obtenir son URL Spotify
      const track = [...approvedTracks, ...pendingTracks].find(t => t.id === trackId);
      if (!track || !track.spotify_url) {
        setError('Morceau non trouvé ou URL Spotify manquante');
        return;
      }

      if (isTestMode) {
        // En mode test, simuler l'ajout à la playlist Spotify
        console.log('🎵 Mode test : Ajout simulé à la playlist Spotify', selectedPlaylistId);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // Utiliser la vraie API Spotify
        const response = await fetch(`/api/spotify/playlists/${selectedPlaylistId}/tracks/${trackId}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({
            spotify_url: track.spotify_url
          })
        })
        
        if (!response.ok) {
          const data = await response.json()
          if (response.status === 401) {
            setError('Connexion Spotify expirée. Veuillez vous reconnecter à Spotify.')
          } else {
            setError(data.error || 'Erreur lors de l\'ajout à la playlist Spotify')
          }
          return
        }
      }
      
      setSuccess('Morceau ajouté à votre playlist Spotify ! 🎵')
      
      // Mettre à jour le statut du morceau localement
      setApprovedTracks(prev => prev.map(track => 
        track.id === trackId 
          ? { ...track, status: 'added', added_at: new Date() }
          : track
      ))
      
      // Rafraîchir les stats
      fetchSessionStats()
    } catch (err) {
      setError(err.message || 'Erreur réseau lors de l\'ajout à la playlist Spotify')
    }
  }

  const handleReject = async (trackId) => {
    try {
      if (isTestMode) {
        // Utiliser les mock API en mode test
        await mockApiResponses.moderateProposition(session.id, trackId, 'rejected')
      } else {
        // Utiliser les vraies API en mode production
        const response = await fetch(`/api/sessions/${session.id}/tracks/${trackId}/reject`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (!response.ok) {
          const data = await response.json()
          setError(data.error || 'Erreur lors du refus')
          return
        }
      }
      
      // Retirer de la liste des morceaux approuvés
      setApprovedTracks(prev => prev.filter(t => t.id !== trackId))
      setSuccess('Morceau rejeté')
      fetchSessionStats()
    } catch (err) {
      setError(err.message || 'Erreur réseau lors du refus')
    }
  }

  // Approuver une proposition en attente (depuis l'interface streamer)
  const handleApprovePending = async (propositionId) => {
    try {
      if (isTestMode) {
        // Utiliser les mock API en mode test
        await mockApiResponses.moderateProposition(session.id, propositionId, 'approved')
      } else {
        // Utiliser les vraies API en mode production
        const response = await fetch(`/api/sessions/${session.id}/propositions/${propositionId}/approve`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (!response.ok) {
          const data = await response.json()
          setError(data.error || 'Erreur lors de l\'approbation')
          return
        }
      }
      
      // Retirer de la liste des propositions en attente
      setPendingTracks(prev => prev.filter(p => p.id !== propositionId))
      // Rafraîchir les morceaux approuvés
      fetchApprovedTracks()
      setSuccess('Proposition approuvée')
    } catch (err) {
      setError(err.message || 'Erreur réseau lors de l\'approbation')
    }
  }

  // Rejeter une proposition en attente (depuis l'interface streamer)
  const handleRejectPending = async (propositionId) => {
    try {
      if (isTestMode) {
        // Utiliser les mock API en mode test
        await mockApiResponses.moderateProposition(session.id, propositionId, 'rejected')
      } else {
        // Utiliser les vraies API en mode production
        const response = await fetch(`/api/sessions/${session.id}/propositions/${propositionId}/reject`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (!response.ok) {
          const data = await response.json()
          setError(data.error || 'Erreur lors du refus')
          return
        }
      }
      
      // Retirer de la liste des propositions en attente
      setPendingTracks(prev => prev.filter(p => p.id !== propositionId))
      setSuccess('Proposition rejetée')
    } catch (err) {
      setError(err.message || 'Erreur réseau lors du refus')
    }
  }

  const handleShuffleQueue = async () => {
    try {
      if (isTestMode) {
        // Utiliser les mock API en mode test
        await mockApiResponses.shuffleQueue(session.id)
      } else {
        // Utiliser les vraies API en mode production
        const response = await fetch(`/api/sessions/${session.id}/shuffle`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (!response.ok) {
          const data = await response.json()
          setError(data.error || 'Erreur lors du mélange')
          return
        }
      }
      
      setSuccess('File d\'attente mélangée !')
      fetchApprovedTracks()
    } catch (err) {
      setError(err.message || 'Erreur réseau lors du mélange')
    }
  }

  const handleToggleQueueMode = async () => {
    const newMode = session.queueMode === 'chronological' ? 'random' : 'chronological'
    
    try {
      if (isTestMode) {
        // Utiliser les mock API en mode test
        await mockApiResponses.updateQueueMode(session.id, newMode)
      } else {
        // Utiliser les vraies API en mode production
        const response = await fetch(`/api/sessions/${session.id}/queue-mode`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ queueMode: newMode })
        })
        
        if (!response.ok) {
          const data = await response.json()
          setError(data.error || 'Erreur lors du changement de mode')
          return
        }
      }
      
      setSuccess(`Mode de file d'attente changé : ${newMode === 'chronological' ? 'Chronologique' : 'Aléatoire'}`)
      // Mettre à jour la session localement
      session.queueMode = newMode
      if (newMode === 'random') {
        await handleShuffleQueue()
      } else {
        fetchApprovedTracks()
      }
    } catch (err) {
      setError(err.message || 'Erreur réseau lors du changement de mode')
    }
  }

  const TrackCard = ({ track }) => (
    <div className="bg-[#3A3A3A] rounded-lg p-6 border border-[#555] hover:border-[#FF4FAD]/50 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg mb-1">
            {track.track_name || 'Morceau inconnu'}
          </h3>
          <p className="text-gray-400 mb-2">
            {track.artist || 'Artiste inconnu'}
          </p>
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-[#FF4FAD]">
              Proposé par <span className="font-medium">{track.viewer_name}</span>
            </span>
            <span className="text-gray-500">
              {new Date(track.created_at).toLocaleString()}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            track.status === 'added' 
              ? 'bg-blue-500/20 text-blue-400' 
              : 'bg-green-500/20 text-green-400'
          }`}>
            {track.status === 'added' ? 'Ajouté' : 'Approuvé'}
          </span>
          {track.status === 'added' && (
            <span className="text-gray-500 text-xs">
              {new Date(track.added_at).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {track.message && (
        <div className="bg-[#2D0036]/60 rounded-lg p-3 mb-4">
          <p className="text-gray-300 text-sm italic">
            Message: "{track.message}"
          </p>
        </div>
      )}

      {/* Lecteur Spotify embeddé */}
      {track.spotify_url && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-white font-medium text-sm">🎵 Lecteur Spotify</h4>
            <a
              href={track.spotify_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1DB954] hover:text-[#1DB954]/80 text-xs transition-colors"
            >
              Ouvrir dans Spotify
            </a>
          </div>
          <SpotifyPlayer 
            spotifyUrl={track.spotify_url} 
            compact={true}
            width="100%"
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Actions supplémentaires si besoin */}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {track.status === 'approved' ? (
            <>
              <button
                onClick={() => handleAddToPlaylist(track.id)}
                className="flex items-center space-x-2 px-4 py-2 bg-[#FF4FAD] text-white rounded-lg hover:bg-[#FF4FAD]/80 transition-colors"
              >
                <MusicalNoteIcon className="w-4 h-4" />
                <span className="text-sm">Ajouter à la playlist</span>
              </button>
              <button
                onClick={() => handleReject(track.id)}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                title="Refuser"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-2 text-blue-400 text-sm">
              <CheckIcon className="w-4 h-4" />
              <span>Ajouté à la playlist</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF4FAD]"></div>
      </div>
    )
  }

  const pendingCount = approvedTracks.filter(t => t.status === 'approved').length
  const addedCount = approvedTracks.filter(t => t.status === 'added').length

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#2D0036]/60 backdrop-blur-md rounded-lg p-4 border border-[#FF4FAD]/20">
          <div className="text-2xl font-bold text-[#FF4FAD]">{pendingCount}</div>
          <div className="text-gray-400 text-sm">En attente</div>
        </div>
        <div className="bg-[#2D0036]/60 backdrop-blur-md rounded-lg p-4 border border-[#00FFD0]/20">
          <div className="text-2xl font-bold text-[#00FFD0]">{addedCount}</div>
          <div className="text-gray-400 text-sm">Ajoutés</div>
        </div>
        <div className="bg-[#2D0036]/60 backdrop-blur-md rounded-lg p-4 border border-[#DBFFA8]/20">
          <div className="text-2xl font-bold text-[#DBFFA8]">{sessionStats.total_propositions || 0}</div>
          <div className="text-gray-400 text-sm">Propositions totales</div>
        </div>
        <div className="bg-[#2D0036]/60 backdrop-blur-md rounded-lg p-4 border border-yellow-500/20">
          <div className="text-2xl font-bold text-yellow-400">{sessionStats.active_viewers || 0}</div>
          <div className="text-gray-400 text-sm">Viewers actifs</div>
        </div>
      </div>

      {/* Indicateur de mode test */}
      {isTestMode && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-blue-300 text-sm">
            🧪 Mode test activé : Les actions sur la playlist sont simulées et n'affectent pas de vraies données Spotify
          </p>
        </div>
      )}

      {/* Contrôles de session */}
      <div className="bg-[#2D0036]/60 backdrop-blur-md rounded-lg p-6 border border-[#FF4FAD]/20">
        <h3 className="text-xl font-bold text-[#FF4FAD] mb-4">
          Contrôles de session
        </h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleToggleQueueMode}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              session.queueMode === 'chronological'
                ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
            }`}
          >
            Mode: {session.queueMode === 'chronological' ? 'Chronologique' : 'Aléatoire'}
          </button>
          
          {session.queueMode === 'random' && (
            <button
              onClick={handleShuffleQueue}
              className="px-6 py-3 rounded-lg font-medium bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors"
            >
              🔀 Mélanger la file
            </button>
          )}
          
          <button
            onClick={async () => {
              console.log('🔄 Actualisation complète depuis les contrôles de session...')
              setError('') // Nettoyer les erreurs précédentes
              try {
                await Promise.all([
                  fetchPendingTracks(),
                  fetchApprovedTracks(),
                  fetchSessionStats()
                ])
                console.log('✅ Actualisation complète terminée')
              } catch (error) {
                console.error('❌ Erreur lors de l\'actualisation complète:', error)
                setError('Erreur lors de l\'actualisation')
              }
            }}
            className="px-6 py-3 rounded-lg font-medium bg-[#FF4FAD]/20 text-[#FF4FAD] hover:bg-[#FF4FAD]/30 transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4 inline mr-2" />
            Actualiser
          </button>
          
          <button
            onClick={() => setShowPlaylistManager(!showPlaylistManager)}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              showPlaylistManager
                ? 'bg-[#1DB954] text-white'
                : 'bg-[#1DB954]/20 text-[#1DB954] hover:bg-[#1DB954]/30'
            }`}
          >
            <MusicalNoteIcon className="w-4 h-4 inline mr-2" />
            {showPlaylistManager ? 'Masquer' : 'Mes playlists'} Spotify
          </button>
        </div>
      </div>

      {/* Gestionnaire de playlists Spotify */}
      {showPlaylistManager && (
        <SpotifyPlaylistManager
          user={user}
          token={token}
          selectedPlaylistId={selectedPlaylistId}
          onPlaylistSelect={setSelectedPlaylistId}
          isTestMode={isTestMode}
        />
      )}

      {/* Indicateur de playlist sélectionnée */}
      {selectedPlaylistId && !showPlaylistManager && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <p className="text-green-400 font-medium">
            ✅ Playlist active : {selectedPlaylistId}
          </p>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <p className="text-green-400 font-medium">{success}</p>
        </div>
      )}

      {/* Onglets */}
      <div className="flex space-x-1 bg-[#2D0036]/60 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            activeTab === 'pending' 
              ? 'bg-[#FF4FAD] text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          En attente ({pendingTracks.length})
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            activeTab === 'queue' 
              ? 'bg-[#FF4FAD] text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          File d'attente ({pendingCount})
        </button>
        <button
          onClick={() => setActiveTab('added')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            activeTab === 'added' 
              ? 'bg-[#FF4FAD] text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Ajoutés ({addedCount})
        </button>
      </div>

      {/* Contenu des onglets */}
      <div className="space-y-4">
        {activeTab === 'pending' && (
          <>
            {pendingTracks.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">
                  Aucune proposition en attente
                </div>
                <p className="text-gray-500 text-sm">
                  Les propositions des viewers apparaîtront ici pour modération
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[#DBFFA8] font-bold text-lg">
                    Propositions en attente de modération ({pendingTracks.length})
                  </h3>
                  <button
                    onClick={async () => {
                      console.log('🔄 Actualisation manuelle des propositions...')
                      setError('') // Nettoyer les erreurs précédentes
                      try {
                        await Promise.all([
                          fetchPendingTracks(),
                          fetchApprovedTracks(),
                          fetchSessionStats()
                        ])
                        console.log('✅ Actualisation manuelle terminée')
                      } catch (error) {
                        console.error('❌ Erreur lors de l\'actualisation manuelle:', error)
                        setError('Erreur lors de l\'actualisation')
                      }
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-[#DBFFA8]/20 text-[#DBFFA8] rounded-lg hover:bg-[#DBFFA8]/30 transition-colors"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    <span>Actualiser</span>
                  </button>
                </div>
                
                {pendingTracks.map(track => (
                  <PendingTrackCard 
                    key={track.id} 
                    track={track} 
                    onApprove={() => handleApprovePending(track.id)}
                    onReject={() => handleRejectPending(track.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'queue' && (
          <>
            {approvedTracks.filter(t => t.status === 'approved').length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">
                  Aucun morceau en attente
                </div>
                <p className="text-gray-500 text-sm">
                  Les morceaux approuvés par les modérateurs apparaîtront ici
                </p>
              </div>
            ) : (
              approvedTracks
                .filter(t => t.status === 'approved')
                .map((track) => (
                  <TrackCard key={track.id} track={track} />
                ))
            )}
          </>
        )}

        {activeTab === 'added' && (
          <>
            {approvedTracks.filter(t => t.status === 'added').length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">
                  Aucun morceau ajouté
                </div>
                <p className="text-gray-500 text-sm">
                  Les morceaux ajoutés à votre playlist Spotify apparaîtront ici
                </p>
              </div>
            ) : (
              approvedTracks
                .filter(t => t.status === 'added')
                .map((track) => (
                  <TrackCard key={track.id} track={track} />
                ))
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Composant pour afficher les propositions en attente
const PendingTrackCard = ({ track, onApprove, onReject }) => (
  <div className="bg-[#3A3A3A] rounded-lg p-6 border border-[#555] hover:border-[#DBFFA8]/50 transition-colors">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <h3 className="text-white font-bold text-lg mb-1">
          {track.track_name || 'Morceau inconnu'}
        </h3>
        <p className="text-gray-400 mb-2">
          {track.artist || 'Artiste inconnu'} {track.album ? `• ${track.album}` : ''}
        </p>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>⏱️ {track.duration || 'Durée inconnue'}</span>
          <span>👤 {track.viewer_name || 'Anonyme'}</span>
          <span>📅 {new Date(track.created_at).toLocaleString()}</span>
        </div>
        {track.message && (
          <div className="mt-3 p-3 bg-[#2D2D2D] rounded-lg border-l-4 border-[#DBFFA8]">
            <p className="text-gray-300 text-sm italic">"{track.message}"</p>
          </div>
        )}
      </div>
      <div className="flex space-x-2 ml-4">
        <button
          onClick={onApprove}
          className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
          title="Approuver"
        >
          <CheckIcon className="w-5 h-5" />
        </button>
        <button
          onClick={onReject}
          className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          title="Rejeter"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
    
    {track.spotify_url && (
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-white font-medium text-sm">🎵 Écouter le morceau</h4>
          <a
            href={track.spotify_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1DB954] hover:text-[#1DB954]/80 text-xs transition-colors"
          >
            Ouvrir dans Spotify
          </a>
        </div>
        <SpotifyPlayer 
          spotifyUrl={track.spotify_url} 
          compact={true}
          width="100%"
        />
      </div>
    )}
  </div>
) 