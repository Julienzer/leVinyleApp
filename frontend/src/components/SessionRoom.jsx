import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ViewerInterface from './ViewerInterface'
import ModeratorInterface from './ModeratorInterface'
import StreamerInterface from './StreamerInterface'
import VinyleLogo from '../assets/VinyleLogo'
import RoleDebugger from './RoleDebugger'
import { mockApiResponses } from '../utils/fakeData'
import { api } from '../utils/api'
import '../utils/testModeration.js'

export default function SessionRoom({ user, token, isTestMode }) {
  const { sessionCode } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userRole, setUserRole] = useState('viewer')


  useEffect(() => {
    fetchSession()
  }, [sessionCode])

  const fetchSession = async () => {
    try {
      let sessionData
      if (isTestMode) {
        // Utiliser les mock API en mode test
        const response = await mockApiResponses.getSession(sessionCode)
        sessionData = response.session
      } else {
        // Utiliser les vraies API en mode production
        const response = await api.get(`/api/sessions/${sessionCode}`, token)

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Session non trouvée')
          }
          if (response.status === 403) {
            throw new Error('Session privée - accès refusé')
          }
          throw new Error('Erreur lors du chargement de la session')
        }

        const data = await response.json()
        sessionData = data.session
      }

      setSession(sessionData)

      // Déterminer le rôle de l'utilisateur dans cette session
      if (user) {
        if (sessionData.streamer_id === user.id) {
          setUserRole('streamer')
        } else if (isTestMode) {
          // En mode test, utiliser l'ancien système
          if (user.role === 'moderator') {
            setUserRole('moderator')
          } else {
            setUserRole('viewer')
          }
        } else {
          // En mode production, vérifier dynamiquement si l'utilisateur est modérateur          
          try {
            const modResponse = await api.get(`/api/users/${sessionData.streamer_id}/moderator-status`, token)
            
            if (modResponse.ok) {
              const modData = await modResponse.json()
              setUserRole(modData.isModerator ? 'moderator' : 'viewer')
            } else {
              setUserRole('viewer')
            }
          } catch (err) {
            setUserRole('viewer')
          }
        }
      }
      
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLeaveSession = () => {
    navigate('/')
  }



  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-[#2D0036] via-[#3D1A4B] to-[#2D0036] flex items-center justify-center">
        <div className="text-center">
          <VinyleLogo className="h-24 w-24 mx-auto mb-4" />
          <p className="text-white text-xl">Chargement de la session...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-[#2D0036] via-[#3D1A4B] to-[#2D0036] flex items-center justify-center">
        <div className="text-center">
          <VinyleLogo className="h-24 w-24 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-400 mb-4">Erreur</h2>
          <p className="text-white text-lg mb-6">{error}</p>
          <button
            onClick={handleLeaveSession}
            className="px-6 py-3 bg-[#DBFFA8] text-[#2D0036] rounded-full font-bold hover:bg-[#DBFFA8]/90 transition-all"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  const renderInterface = () => {
    switch (userRole) {
      case 'streamer':
        return <StreamerInterface session={session} user={user} token={token} isTestMode={isTestMode} />
      case 'moderator':
        return <ModeratorInterface session={session} user={user} token={token} isTestMode={isTestMode} />
      default:
        return <ViewerInterface session={session} user={user} token={token} isTestMode={isTestMode} />
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#2D0036] via-[#3D1A4B] to-[#2D0036]">
      {/* Header de la session */}
      <div className="bg-[#2D0036]/60 backdrop-blur-md border-b border-[#DBFFA8]/20 px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-4">
            <VinyleLogo className="h-12 w-12" />
            <div>
              <h1 className="text-xl font-bold text-[#DBFFA8]">
                {session?.name || 'Session musicale'}
              </h1>
              <p className="text-gray-400 text-sm flex items-center gap-2">
                <span>Code: {sessionCode} • {session?.isPrivate ? 'Privée' : 'Publique'}</span>
                {isTestMode && <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">TEST</span>}
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                  userRole === 'streamer' 
                    ? 'bg-[#FF4FAD] text-white' 
                    : userRole === 'moderator'
                    ? 'bg-[#00FFD0] text-[#2D0036]'
                    : 'bg-[#DBFFA8] text-[#2D0036]'
                }`}>
                  {userRole === 'streamer' ? 'Host' : userRole === 'moderator' ? 'Modérateur' : 'Viewer'}
                </span>
              </p>
            </div>
          </div>


        </div>
      </div>

      {/* Interface spécifique au rôle */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {renderInterface()}
        </div>
      </div>
      
      {/* Debug Component - uniquement en développement */}
      {import.meta.env.MODE === 'development' && (
        <RoleDebugger 
          user={user} 
          userRole={userRole} 
          session={session} 
          token={token} 
          isTestMode={isTestMode} 
        />
      )}
    </div>
  )
} 