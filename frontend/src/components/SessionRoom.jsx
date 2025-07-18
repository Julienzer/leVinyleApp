import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ViewerInterface from './ViewerInterface'
import ModeratorInterface from './ModeratorInterface'
import StreamerInterface from './StreamerInterface'
import VinyleLogo from '../assets/VinyleLogo'
import RoleDebugger from './RoleDebugger'
import { mockApiResponses } from '../utils/fakeData'
import '../utils/testModeration.js'

export default function SessionRoom({ user, token, isTestMode }) {
  const { sessionCode } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userRole, setUserRole] = useState('viewer')
  const [roleCheckCount, setRoleCheckCount] = useState(0)

  useEffect(() => {
    fetchSession()
  }, [sessionCode])

  const fetchSession = async () => {
    console.log('🔍 SessionRoom - fetchSession called with sessionCode:', sessionCode)
    try {
      let sessionData
      if (isTestMode) {
        // Utiliser les mock API en mode test
        const response = await mockApiResponses.getSession(sessionCode)
        sessionData = response.session
      } else {
        // Utiliser les vraies API en mode production
        console.log('📡 Calling API:', `/api/sessions/${sessionCode}`)
        console.log('🔐 SessionRoom - Token:', token);
        console.log('🔐 SessionRoom - Authorization header:', token ? `Bearer ${token}` : 'NO TOKEN');
        const response = await fetch(`/api/sessions/${sessionCode}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })

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
          console.log('🔍 Vérification du statut de modérateur:', {
            userId: user.id,
            userDisplayName: user.display_name,
            streamerId: sessionData.streamer_id,
            token: token ? 'présent' : 'absent'
          })
          
          try {
            const apiUrl = `/api/users/${sessionData.streamer_id}/moderator-status`
            console.log('🔍 Appel API modération:', apiUrl)
            console.log('🔍 Token disponible:', !!token, token ? `${token.substring(0, 20)}...` : 'NULL')
            
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
            console.log('🔍 Headers envoyés:', headers)
            
            const modResponse = await fetch(apiUrl, { headers })
            
            console.log('🔍 Réponse API modération:', {
              url: apiUrl,
              status: modResponse.status,
              ok: modResponse.ok,
              headers: Object.fromEntries(modResponse.headers.entries())
            })
            
            if (modResponse.ok) {
              const modData = await modResponse.json()
              console.log('🔍 Données modération reçues:', modData)
              
              if (modData.isModerator) {
                console.log('✅ SetUserRole: moderator (était:', userRole, ')')
                setUserRole('moderator')
                console.log('✅ Utilisateur détecté comme modérateur')
              } else {
                console.log('👀 SetUserRole: viewer (était:', userRole, ')')
                setUserRole('viewer')
                console.log('👀 Utilisateur détecté comme viewer')
              }
            } else {
              const errorText = await modResponse.text()
              console.log('❌ Erreur API modération:', {
                status: modResponse.status,
                statusText: modResponse.statusText,
                error: errorText
              })
              setUserRole('viewer')
              console.log('⚠️ Impossible de vérifier le statut de modérateur, défaut: viewer')
            }
          } catch (err) {
            console.error('Erreur lors de la vérification du statut de modérateur:', err)
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

  const forceRoleCheck = async () => {
    console.log('🔄 Force Role Check - Début')
    setRoleCheckCount(prev => prev + 1)
    
    if (!session || !user) {
      console.log('🔄 Force Role Check - Session ou user manquant')
      return
    }

    if (session.streamer_id === user.id) {
      console.log('🔄 Force Role Check - Utilisateur est le streamer')
      setUserRole('streamer')
      return
    }

    if (isTestMode) {
      console.log('🔄 Force Role Check - Mode test')
      setUserRole(user.role === 'moderator' ? 'moderator' : 'viewer')
      return
    }

    // Vérification via API
    try {
      console.log('🔄 Force Role Check - Appel API')
      const apiUrl = `/api/users/${session.streamer_id}/moderator-status`
      console.log('🔄 Token disponible:', !!token, token ? `${token.substring(0, 20)}...` : 'NULL')
      
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
      console.log('🔄 Headers envoyés:', headers)
      
      const modResponse = await fetch(apiUrl, { headers })
      
      if (modResponse.ok) {
        const modData = await modResponse.json()
        console.log('🔄 Force Role Check - Résultat API:', modData)
        
        if (modData.isModerator) {
          setUserRole('moderator')
          console.log('🔄 Force Role Check - Utilisateur confirmé modérateur')
        } else {
          setUserRole('viewer')
          console.log('🔄 Force Role Check - Utilisateur confirmé viewer')
        }
      } else {
        console.log('🔄 Force Role Check - Erreur API, défaut viewer')
        setUserRole('viewer')
      }
    } catch (error) {
      console.error('🔄 Force Role Check - Exception:', error)
      setUserRole('viewer')
    }
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
    console.log('🖥️ Rendering interface with userRole:', userRole)
    console.log('🖥️ Current session:', session?.name, 'User:', user?.display_name)
    
    switch (userRole) {
      case 'streamer':
        console.log('📺 Rendering StreamerInterface')
        return <StreamerInterface session={session} user={user} token={token} isTestMode={isTestMode} />
      case 'moderator':
        console.log('🛡️ Rendering ModeratorInterface')
        return <ModeratorInterface session={session} user={user} token={token} isTestMode={isTestMode} />
      default:
        console.log('👀 Rendering ViewerInterface (default)')
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
              <p className="text-gray-400 text-sm">
                Code: {sessionCode} • {session?.isPrivate ? 'Privée' : 'Publique'}
                {isTestMode && <span className="ml-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">TEST</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Badge de rôle */}
            <div className="flex items-center space-x-2">
              <span className="text-white text-sm">
                {user?.display_name || 'Invité'}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                userRole === 'streamer' 
                  ? 'bg-[#FF4FAD] text-white' 
                  : userRole === 'moderator'
                  ? 'bg-[#00FFD0] text-[#2D0036]'
                  : 'bg-[#DBFFA8] text-[#2D0036]'
              }`}>
                {userRole === 'streamer' ? 'Streamer' : userRole === 'moderator' ? 'Modérateur' : 'Viewer'}
              </span>
            </div>

            {/* Bouton debug (uniquement en développement) */}
            {import.meta.env.MODE === 'development' && (
              <button
                onClick={forceRoleCheck}
                className="px-3 py-1 rounded-full bg-yellow-500/20 hover:bg-yellow-500/30 transition-all text-yellow-400 text-sm"
                title="Forcer la vérification du rôle"
              >
                🔄 Check #{roleCheckCount}
              </button>
            )}

            {/* Bouton quitter */}
            <button
              onClick={handleLeaveSession}
              className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 transition-all text-red-400"
              title="Quitter la session"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
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