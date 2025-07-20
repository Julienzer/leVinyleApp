import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import VinyleLogo from '../assets/VinyleLogo'
import { mockApiResponses } from '../utils/fakeData'
import { api } from '../utils/api'

export default function HomePage({ user, token, isTestMode }) {
  const [sessionCode, setSessionCode] = useState('')
  const [sessionName, setSessionName] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [preventDuplicates, setPreventDuplicates] = useState(true)
  const [queueMode, setQueueMode] = useState('chronological')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleCreateSession = async () => {
    if (!user?.isStreamer) {
      setError('Seuls les streamers peuvent créer des sessions')
      return
    }

    if (!sessionName.trim()) {
      setError('Veuillez entrer un nom de session')
      return
    }

    setLoading(true)
    setError('')

    try {
      let response
      if (isTestMode) {
        // Utiliser les mock API en mode test
        response = await mockApiResponses.createSession({
          name: sessionName,
          isPrivate,
          preventDuplicates,
          queueMode
        })
        navigate(`/room/${response.session.code}`)
      } else {
        // Utiliser les vraies API en mode production
        const httpResponse = await api.post('/api/sessions', {
          name: sessionName,
          isPrivate,
          preventDuplicates,
          queueMode
        }, token)

        if (!httpResponse.ok) {
          const data = await httpResponse.json()
          throw new Error(data.error || 'Erreur lors de la création de la session')
        }

        const response = await httpResponse.json()
        navigate(`/room/${response.session.code}`)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinSession = () => {
    if (!sessionCode.trim()) {
      setError('Veuillez entrer un code de session')
      return
    }

    navigate(`/room/${sessionCode}`)
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#2D0036] via-[#3D1A4B] to-[#2D0036] flex flex-col items-center justify-center px-6 py-8">
      {/* Header */}
      <div className="flex flex-col items-center space-y-6 mb-12">
        <VinyleLogo className="h-32 w-32" />
        <h1 className="text-6xl font-bold text-[#DBFFA8] tracking-wide">
          Le Vinyle
        </h1>
        <p className="text-xl text-gray-300 text-center max-w-2xl">
          Créez des sessions musicales interactives avec votre communauté Twitch
        </p>
        
        {/* Indicateur de mode test */}
        {isTestMode && (
          <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg px-4 py-2">
            <p className="text-yellow-300 text-sm font-medium">
              🧪 Mode Test Activé - Sessions de démonstration disponibles
            </p>
          </div>
        )}
      </div>

      {/* Actions principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        
        {/* Créer une session (Streamers uniquement) */}
        {user?.isStreamer && (
          <div className="bg-[#2D0036]/60 backdrop-blur-md rounded-2xl p-8 border border-[#DBFFA8]/20">
            <h2 className="text-2xl font-bold text-[#DBFFA8] mb-6">
              Créer une session
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">
                  Nom de la session
                </label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="Ma session musicale"
                  className="w-full bg-[#3A3A3A] border border-[#555] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#DBFFA8] transition-colors"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="private"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="w-4 h-4 text-[#DBFFA8] rounded focus:ring-[#DBFFA8]"
                  />
                  <label htmlFor="private" className="text-white">
                    Session privée (code d'accès requis)
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="preventDuplicates"
                    checked={preventDuplicates}
                    onChange={(e) => setPreventDuplicates(e.target.checked)}
                    className="w-4 h-4 text-[#DBFFA8] rounded focus:ring-[#DBFFA8]"
                  />
                  <label htmlFor="preventDuplicates" className="text-white">
                    Empêcher les doublons des sessions précédentes
                  </label>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">
                    Mode de file d'attente
                  </label>
                  <select
                    value={queueMode}
                    onChange={(e) => setQueueMode(e.target.value)}
                    className="w-full bg-[#3A3A3A] border border-[#555] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#DBFFA8] transition-colors"
                  >
                    <option value="chronological">Chronologique (FIFO)</option>
                    <option value="random">Aléatoire (Shuffle)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleCreateSession}
                disabled={loading}
                className="w-full py-3 rounded-full font-bold text-lg bg-[#DBFFA8] text-[#2D0036] hover:bg-[#DBFFA8]/90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transform"
              >
                {loading ? 'Création...' : 'Créer la session'}
              </button>
            </div>
          </div>
        )}

        {/* Rejoindre une session */}
        <div className="bg-[#2D0036]/60 backdrop-blur-md rounded-2xl p-8 border border-[#FF4FAD]/20">
          <h2 className="text-2xl font-bold text-[#FF4FAD] mb-6">
            Rejoindre une session
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-white font-medium mb-2">
                Code de la session
              </label>
              <input
                type="text"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value)}
                placeholder="ex: julien ou ABC123"
                className="w-full bg-[#3A3A3A] border border-[#555] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#FF4FAD] transition-colors"
              />
              <p className="text-sm text-gray-400 mt-2">
                Utilisez l'URL personnalisée du streamer ou le code de session
              </p>
            </div>

            {/* Sessions de test disponibles */}
            {isTestMode && (
              <div className="bg-[#3A3A3A]/50 rounded-lg p-4 border border-[#555]/50">
                <p className="text-white font-medium mb-2 text-sm">Sessions de test disponibles :</p>
                <div className="space-y-2">
                  <button
                    onClick={() => setSessionCode('test123')}
                    className="w-full text-left px-3 py-2 bg-[#555]/30 rounded text-gray-300 hover:bg-[#555]/50 transition-colors text-sm"
                  >
                    <span className="font-medium">test123</span> - Session Test de Julien
                  </button>
                  <button
                    onClick={() => setSessionCode('private456')}
                    className="w-full text-left px-3 py-2 bg-[#555]/30 rounded text-gray-300 hover:bg-[#555]/50 transition-colors text-sm"
                  >
                    <span className="font-medium">private456</span> - Session Privée
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleJoinSession}
              className="w-full py-3 rounded-full font-bold text-lg bg-[#FF4FAD] text-white hover:bg-[#FF4FAD]/90 transition-all shadow-lg hover:scale-[1.02] transform"
            >
              Rejoindre
            </button>
          </div>
        </div>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="mt-6 text-red-400 font-bold text-center text-base bg-red-500/10 py-3 px-4 rounded-lg border border-red-500/20">
          {error}
        </div>
      )}
    </div>
  )
} 