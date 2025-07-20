import { useState, useEffect } from 'react'
import { CheckIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { mockApiResponses } from '../utils/fakeData'
import { api } from '../utils/api'
import SpotifyPlayer from './SpotifyFallback'

export default function ModeratorInterface({ session, user, token, isTestMode }) {
  const [pendingPropositions, setPendingPropositions] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('pending')

  useEffect(() => {
    fetchPendingPropositions()
    fetchHistory()
  }, [])

  const fetchPendingPropositions = async () => {
    try {
      if (isTestMode) {
        // Utiliser les mock API en mode test
        const response = await mockApiResponses.getPropositions(session.id, 'pending')
        setPendingPropositions(response.propositions)
      } else {
        // Utiliser les vraies API en mode production
        const response = await api.get(`/api/sessions/${session.id}/propositions/pending`, token)
        
        if (response.ok) {
          const data = await response.json()
          setPendingPropositions(data.propositions)
        }
      }
    } catch (err) {
      setError('Erreur lors du chargement des propositions')
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    try {
      if (isTestMode) {
        // Utiliser les mock API en mode test
        const response = await mockApiResponses.getPropositions(session.id, 'history')
        setHistory(response.propositions)
      } else {
        // Utiliser les vraies API en mode production
        const response = await fetch(`/api/sessions/${session.id}/propositions/history`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          setHistory(data.propositions)
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement de l\'historique:', err)
    }
  }

  const handleApprove = async (propositionId) => {
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
      setPendingPropositions(prev => prev.filter(p => p.id !== propositionId))
      // Rafraîchir l'historique
      fetchHistory()
    } catch (err) {
      setError(err.message || 'Erreur réseau lors de l\'approbation')
    }
  }

  const handleReject = async (propositionId) => {
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
      setPendingPropositions(prev => prev.filter(p => p.id !== propositionId))
      // Rafraîchir l'historique
      fetchHistory()
    } catch (err) {
      setError(err.message || 'Erreur réseau lors du refus')
    }
  }

  const handleRequeue = async (propositionId) => {
    try {
      if (isTestMode) {
        // Utiliser les mock API en mode test
        await mockApiResponses.moderateProposition(session.id, propositionId, 'pending')
      } else {
        // Utiliser les vraies API en mode production
        const response = await fetch(`/api/sessions/${session.id}/propositions/${propositionId}/requeue`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (!response.ok) {
          const data = await response.json()
          setError(data.error || 'Erreur lors de la remise en file')
          return
        }
      }
      
      // Rafraîchir les deux listes
      fetchPendingPropositions()
      fetchHistory()
    } catch (err) {
      setError(err.message || 'Erreur réseau lors de la remise en file')
    }
  }

  const PropositionCard = ({ proposition, isPending = true }) => (
    <div className="bg-[#3A3A3A] rounded-lg p-6 border border-[#555] hover:border-[#00FFD0]/50 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg mb-1">
            {proposition.track_name || 'Morceau inconnu'}
          </h3>
          <p className="text-gray-400 mb-2">
            {proposition.artist || 'Artiste inconnu'}
          </p>
          <p className="text-[#00FFD0] text-sm">
            Proposé par <span className="font-medium">{proposition.viewer_name}</span>
          </p>
        </div>
        
        {!isPending && (
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              proposition.status === 'approved' 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              {proposition.status === 'approved' ? 'Approuvé' : 'Refusé'}
            </span>
            <span className="text-gray-500 text-xs">
              {new Date(proposition.moderated_at).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {proposition.message && (
        <div className="bg-[#2D0036]/60 rounded-lg p-3 mb-4">
          <p className="text-gray-300 text-sm italic">
            "{proposition.message}"
          </p>
        </div>
      )}

      {/* Lecteur Spotify embeddé */}
      {proposition.spotify_url && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-white font-medium text-sm">🎵 Prévisualisation</h4>
            <a
              href={proposition.spotify_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1DB954] hover:text-[#1DB954]/80 text-xs transition-colors"
            >
              Ouvrir dans Spotify
            </a>
          </div>
          <SpotifyPlayer 
            spotifyUrl={proposition.spotify_url} 
            compact={true}
            width="100%"
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-gray-500 text-xs">
            Proposé le {new Date(proposition.created_at).toLocaleString()}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {isPending ? (
            <>
              <button
                onClick={() => handleApprove(proposition.id)}
                className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                title="Approuver"
              >
                <CheckIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleReject(proposition.id)}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                title="Refuser"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => handleRequeue(proposition.id)}
              className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
              title="Remettre en file d'attente"
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FFD0]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* INDICATEUR DE DEBUG - Interface Modérateur */}
      <div className="bg-green-500 text-white p-4 rounded-lg border-2 border-green-600">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🛡️</span>
          <div>
            <h3 className="font-bold">INTERFACE MODÉRATEUR ACTIVÉE</h3>
            <p className="text-sm">Utilisateur: {user?.display_name} | Session: {session?.name}</p>
          </div>
        </div>
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-[#00FFD0]">
          Panneau de modération
        </h2>
        <button
          onClick={async () => {
            setLoading(true)
            try {
              await Promise.all([
                fetchPendingPropositions(),
                fetchHistory()
              ])
            } catch (error) {
              console.error('❌ Erreur lors de l\'actualisation:', error)
              setError('Erreur lors de l\'actualisation')
            } finally {
              setLoading(false)
            }
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-[#00FFD0]/20 text-[#00FFD0] rounded-lg hover:bg-[#00FFD0]/30 transition-colors"
          disabled={loading}
        >
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Actualisation...' : 'Actualiser'}</span>
        </button>
      </div>

      {/* Indicateur de mode test */}
      {isTestMode && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-blue-300 text-sm">
            🧪 Mode test activé : Les actions de modération sont simulées et n'affectent pas de vraies données
          </p>
        </div>
      )}

      {/* Onglets */}
      <div className="flex space-x-1 bg-[#2D0036]/60 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            activeTab === 'pending' 
              ? 'bg-[#00FFD0] text-[#2D0036]' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          En attente ({pendingPropositions.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            activeTab === 'history' 
              ? 'bg-[#00FFD0] text-[#2D0036]' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Historique ({history.length})
        </button>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 font-medium">{error}</p>
        </div>
      )}

      {/* Contenu des onglets */}
      <div className="space-y-4">
        {activeTab === 'pending' && (
          <>
            {pendingPropositions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">
                  Aucune proposition en attente
                </div>
                <p className="text-gray-500 text-sm">
                  Les nouvelles propositions apparaîtront ici
                </p>
              </div>
            ) : (
              pendingPropositions.map((proposition) => (
                <PropositionCard
                  key={proposition.id}
                  proposition={proposition}
                  isPending={true}
                />
              ))
            )}
          </>
        )}

        {activeTab === 'history' && (
          <>
            {history.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">
                  Aucune décision prise
                </div>
                <p className="text-gray-500 text-sm">
                  L'historique de vos décisions s'affichera ici
                </p>
              </div>
            ) : (
              history.map((proposition) => (
                <PropositionCard
                  key={proposition.id}
                  proposition={proposition}
                  isPending={false}
                />
              ))
            )}
          </>
        )}
      </div>
    </div>
  )
} 