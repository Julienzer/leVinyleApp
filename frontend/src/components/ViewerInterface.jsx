import { useState, useEffect } from 'react'
import { mockApiResponses } from '../utils/fakeData'

export default function ViewerInterface({ session, user, token, isTestMode }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [spotifyLink, setSpotifyLink] = useState('')
  const [message, setMessage] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [myPropositions, setMyPropositions] = useState([])
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Fake data pour simuler l'AJAX Spotify
  const fakeDatabase = [
    {
      id: 1,
      album: "Fugees The Score",
      artist: "Fugees",
      image: "/api/placeholder/48/48",
      tracks: [
        { id: "1-1", name: "Fugees - Fu-Gee-La", duration: "3:56", spotify_url: "https://open.spotify.com/track/fugees-fu-gee-la" },
        { id: "1-2", name: "Fugees - Ready or not", duration: "3:47", spotify_url: "https://open.spotify.com/track/fugees-ready-or-not" },
        { id: "1-3", name: "Fugees - Killing Me Softly", duration: "4:58", spotify_url: "https://open.spotify.com/track/fugees-killing-me-softly" }
      ]
    },
    {
      id: 2,
      album: "Good Kid, M.A.A.D City",
      artist: "Kendrick Lamar",
      image: "/api/placeholder/48/48",
      tracks: [
        { id: "2-1", name: "Kendrick Lamar - Swimming Pools (Drank)", duration: "5:13", spotify_url: "https://open.spotify.com/track/kendrick-swimming-pools" },
        { id: "2-2", name: "Kendrick Lamar - Bitch, Don't Kill My Vibe", duration: "5:10", spotify_url: "https://open.spotify.com/track/kendrick-bitch-dont-kill-my-vibe" },
        { id: "2-3", name: "Kendrick Lamar - Money Trees", duration: "6:26", spotify_url: "https://open.spotify.com/track/kendrick-money-trees" }
      ]
    },
    {
      id: 3,
      album: "To Pimp a Butterfly",
      artist: "Kendrick Lamar",
      image: "/api/placeholder/48/48",
      tracks: [
        { id: "3-1", name: "Kendrick Lamar - King Kunta", duration: "3:54", spotify_url: "https://open.spotify.com/track/kendrick-king-kunta" },
        { id: "3-2", name: "Kendrick Lamar - Alright", duration: "3:39", spotify_url: "https://open.spotify.com/track/kendrick-alright" },
        { id: "3-3", name: "Kendrick Lamar - The Blacker the Berry", duration: "5:28", spotify_url: "https://open.spotify.com/track/kendrick-blacker-berry" }
      ]
    },
    {
      id: 4,
      album: "Illmatic",
      artist: "Nas",
      image: "/api/placeholder/48/48",
      tracks: [
        { id: "4-1", name: "Nas - N.Y. State of Mind", duration: "4:54", spotify_url: "https://open.spotify.com/track/nas-ny-state-of-mind" },
        { id: "4-2", name: "Nas - Life's a Bitch", duration: "3:30", spotify_url: "https://open.spotify.com/track/nas-lifes-a-bitch" },
        { id: "4-3", name: "Nas - The World Is Yours", duration: "4:50", spotify_url: "https://open.spotify.com/track/nas-world-is-yours" }
      ]
    }
  ]

  useEffect(() => {
    if (user) {
      fetchMyPropositions()
    }
  }, [user])

  const fetchMyPropositions = async () => {
    if (!token) return

    try {
      if (isTestMode) {
        // Utiliser les mock API en mode test
        const response = await mockApiResponses.getPropositions(session.id, 'my')
        setMyPropositions(response.propositions)
      } else {
        // Utiliser les vraies API en mode production
        const response = await api.get(`/api/sessions/${session.id}/my-propositions`, token)
        
        if (response.ok) {
          const data = await response.json()
          setMyPropositions(data.propositions)
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement des propositions:', err)
    }
  }

  const searchSpotifyTracks = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsLoading(true)
    
    try {
      if (isTestMode) {
        // En mode test, utiliser les données mockées
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500))
        
        const filtered = fakeDatabase.filter(album => 
          album.album.toLowerCase().includes(query.toLowerCase()) ||
          album.artist.toLowerCase().includes(query.toLowerCase()) ||
          album.tracks.some(track => 
            track.name.toLowerCase().includes(query.toLowerCase())
          )
        )
        
        setSearchResults(filtered)
      } else {
        // En mode production, utiliser la vraie API Spotify
        const response = await api.get(`/api/search/tracks?q=${encodeURIComponent(query)}&limit=20`, token)
        
        if (response.ok) {
          const data = await response.json()
          
          // Convertir les résultats Spotify au format attendu par le frontend
          const formattedResults = [{
            id: 'spotify_results',
            album: 'Résultats Spotify',
            artist: `${data.results.length} morceau${data.results.length > 1 ? 's' : ''} trouvé${data.results.length > 1 ? 's' : ''}`,
            image: data.results[0]?.image || null,
            tracks: data.results.map(track => ({
              id: track.id,
              name: `${track.artist} - ${track.name}`,
              duration: track.duration,
              spotify_url: track.spotify_url,
              artist: track.artist,
              album: track.album,
              image: track.image
            }))
          }]
          
          setSearchResults(formattedResults)
        } else {
          console.error('Erreur lors de la recherche Spotify')
          setSearchResults([])
        }
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error)
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchSpotifyTracks(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const handleTrackClick = async (track) => {
    setSpotifyLink(track.spotify_url)
    await submitProposition(track.spotify_url, track.name)
  }

  const handleManualSubmit = async (e) => {
    e.preventDefault()
    if (!spotifyLink.trim()) {
      setError('Veuillez entrer un lien Spotify ou sélectionner un morceau')
      return
    }
    await submitProposition(spotifyLink)
  }

  const submitProposition = async (url, trackName = '') => {
    if (!token) {
      setError('Vous devez être connecté pour proposer un morceau')
      return
    }

    setSuccess(false)
    setError('')

    try {
      if (isTestMode) {
        // Utiliser les mock API en mode test
        await mockApiResponses.submitProposition(session.id, {
          spotify_url: url,
          track_name: trackName,
          message: message.trim()
        })
      } else {
        // Utiliser les vraies API en mode production
        const response = await api.post(`/api/sessions/${session.id}/propositions`, {
          spotify_url: url,
          track_name: trackName,
          message: message.trim()
        }, token)

        if (!response.ok) {
          const data = await response.json()
          
          if (response.status === 409) {
            setError('Ce morceau a déjà été proposé dans cette session')
          } else if (response.status === 422) {
            setError(data.error || 'Ce morceau a été joué dans une session précédente')
          } else {
            setError(data.error || 'Erreur lors de la soumission')
          }
          return
        }
      }

      setSuccess(true)
      setSearchQuery('')
      setSpotifyLink('')
      setMessage('')
      setSearchResults([])
      
      // Recharger les propositions
      fetchMyPropositions()
      
    } catch (err) {
      setError(err.message || 'Erreur réseau. Veuillez réessayer.')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      case 'approved': return 'text-green-400 bg-green-500/10 border-green-500/20'
      case 'rejected': return 'text-red-400 bg-red-500/10 border-red-500/20'
      case 'added': return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'En attente'
      case 'approved': return 'Approuvé'
      case 'rejected': return 'Refusé'
      case 'added': return 'Ajouté à la playlist'
      default: return 'Inconnu'
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Section principale - Proposition */}
      <div className="lg:col-span-2">
        <div className="bg-[#2D0036]/60 backdrop-blur-md rounded-2xl p-6 border border-[#DBFFA8]/20">
          <h2 className="text-2xl font-bold text-[#DBFFA8] mb-6">
            Proposer un morceau
          </h2>

          {/* Indicateur de mode test */}
          {isTestMode && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-6">
              <p className="text-blue-300 text-sm">
                🧪 Mode test activé : Les propositions sont simulées et n'affectent pas de vraies données
              </p>
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="space-y-6">
            {/* Recherche Spotify */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un morceau sur Spotify..."
                className="w-full bg-[#3A3A3A] border border-[#555] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#DBFFA8] transition-colors"
              />
              
              {isLoading && (
                <div className="absolute right-3 top-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#DBFFA8]"></div>
                </div>
              )}
              
              {/* Résultats de recherche */}
              {searchResults.length > 0 && (
                <div className="mt-2 bg-[#3A3A3A] border border-[#555] rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                  <div className="p-2 text-xs text-gray-400 border-b border-[#555] flex items-center justify-between">
                    <span>Cliquez sur un morceau pour l'ajouter directement</span>
                    {!isTestMode && (
                      <span className="flex items-center gap-1 text-green-400">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                        </svg>
                        Spotify
                      </span>
                    )}
                  </div>
                  {searchResults.map((album) => (
                    <div key={album.id} className="p-3 border-b border-[#555] last:border-b-0">
                      <div className="flex items-center gap-3 mb-2">
                        {album.image ? (
                          <img 
                            src={album.image} 
                            alt={album.album}
                            className="w-10 h-10 rounded-md object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-600 rounded-md flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zm12-3c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2z" />
                            </svg>
                          </div>
                        )}
                        <div>
                          <h3 className="text-[#DBFFA8] font-medium text-sm">{album.album}</h3>
                          <p className="text-gray-400 text-xs">{album.artist}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-1 ml-13">
                        {album.tracks.map((track) => (
                          <div
                            key={track.id}
                            onClick={() => handleTrackClick(track)}
                            className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors hover:bg-[#555]/50"
                          >
                            {track.image ? (
                              <img 
                                src={track.image} 
                                alt={track.album}
                                className="w-8 h-8 rounded-md object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-600 rounded-md flex items-center justify-center">
                                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="text-white text-sm">{track.name}</p>
                              <p className="text-gray-400 text-xs">{track.duration}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lien Spotify manuel */}
            <div>
              <input
                type="url"
                value={spotifyLink}
                onChange={(e) => setSpotifyLink(e.target.value)}
                placeholder="Ou collez directement un lien Spotify..."
                className="w-full bg-[#3A3A3A] border border-[#555] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#DBFFA8] transition-colors"
              />
            </div>

            {/* Message optionnel */}
            <div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message pour les modérateurs (optionnel)"
                rows={3}
                className="w-full bg-[#3A3A3A] border border-[#555] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#DBFFA8] transition-colors resize-none"
              />
            </div>

            {/* Bouton soumettre */}
            <button
              type="submit"
              disabled={!spotifyLink.trim()}
              className="w-full py-3 rounded-full font-bold text-lg bg-[#DBFFA8] text-[#2D0036] hover:bg-[#DBFFA8]/90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Proposer le morceau
            </button>
          </form>

          {/* Messages */}
          {success && (
            <div className="mt-4 text-green-400 font-bold text-center bg-green-500/10 py-3 px-4 rounded-lg border border-green-500/20">
              Morceau proposé avec succès !
            </div>
          )}
          {error && (
            <div className="mt-4 text-red-400 font-bold text-center bg-red-500/10 py-3 px-4 rounded-lg border border-red-500/20">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Section latérale - Mes propositions */}
      <div className="lg:col-span-1">
        <div className="bg-[#2D0036]/60 backdrop-blur-md rounded-2xl p-6 border border-[#FF4FAD]/20">
          <h3 className="text-xl font-bold text-[#FF4FAD] mb-4">
            Mes propositions
          </h3>
          
          <div className="space-y-3">
            {myPropositions.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                Aucune proposition pour le moment
              </p>
            ) : (
              myPropositions.map((proposition) => (
                <div
                  key={proposition.id}
                  className="p-4 bg-[#3A3A3A] rounded-lg border border-[#555]"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-white font-medium text-sm">
                        {proposition.track_name || 'Morceau'}
                      </h4>
                      <p className="text-gray-400 text-xs">
                        {proposition.artist || 'Artiste inconnu'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(proposition.status)}`}>
                      {getStatusText(proposition.status)}
                    </span>
                  </div>
                  
                  {proposition.message && (
                    <p className="text-gray-300 text-xs italic mt-2">
                      "{proposition.message}"
                    </p>
                  )}
                  
                  <p className="text-gray-500 text-xs mt-2">
                    {new Date(proposition.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 