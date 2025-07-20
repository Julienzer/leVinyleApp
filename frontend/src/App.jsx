import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './components/HomePage'
import SessionRoom from './components/SessionRoom'
import TestControls from './components/TestControls'
import Avatar from './components/Avatar'
import DebugPanel from './components/DebugPanel'
import SpotifyTest from './components/SpotifyTest'
import { fakeUsers } from './utils/fakeData'
import './App.css'
import './utils/spotifyDebug.js'

// Variable d'environnement pour activer/désactiver le mode test
// En production, le mode test est automatiquement désactivé
const isTestMode = import.meta.env.MODE === 'development' && import.meta.env.VITE_TEST_MODE === 'true'

function App() {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState(null)
  const [spotifyRefreshKey, setSpotifyRefreshKey] = useState(0)
  
  // Nouvel état pour Spotify (similaire à Twitch)
  const [spotifyUser, setSpotifyUser] = useState(null)
  const [spotifyConnected, setSpotifyConnected] = useState(false)

  useEffect(() => {
    if (isTestMode) {
      // En mode test, commencer avec un utilisateur viewer par défaut
      setUser(fakeUsers.viewer)
      setToken('fake-token-123')
      setLoading(false)
    } else {
      // Mode production normal
      const params = new URLSearchParams(window.location.search)
      const tokenFromUrl = params.get('token')
      const spotifySuccess = params.get('spotify_success')
      const spotifyError = params.get('spotify_error')
      const spotifyUser = params.get('spotify_user')
      
      // Gérer l'authentification Twitch
      if (tokenFromUrl) {
        setToken(tokenFromUrl)
        localStorage.setItem('token', tokenFromUrl)
        try {
          const payload = JSON.parse(atob(tokenFromUrl.split('.')[1]))
          setUser(payload)
          localStorage.setItem('user', JSON.stringify(payload))
        } catch (e) {
          console.error('Error decoding token:', e)
        }
        // Nettoyer l'URL après avoir récupéré le token
        window.history.replaceState({}, document.title, window.location.pathname)
      } else {
        // Essayer de récupérer le token depuis localStorage
        const storedToken = localStorage.getItem('token')
        const storedUser = localStorage.getItem('user')
        
        if (storedToken && storedUser) {
          setToken(storedToken)
          try {
            const userData = JSON.parse(storedUser)
            setUser(userData)
          } catch (e) {
            console.error('Error parsing stored user:', e)
            // Nettoyer le localStorage si les données sont corrompues
            localStorage.removeItem('token')
            localStorage.removeItem('user')
          }
        }
      }

      // Gérer le retour de l'authentification Spotify
      if (spotifySuccess === 'true') {
        setNotification({
          type: 'success',
          message: `Spotify connecté avec succès !${spotifyUser ? ` (${decodeURIComponent(spotifyUser)})` : ''}`
        })
        
        // Stocker les infos Spotify comme pour Twitch
        if (spotifyUser) {
          const spotifyUserData = {
            display_name: decodeURIComponent(spotifyUser),
            connected: true
          }
          setSpotifyUser(spotifyUserData)
          setSpotifyConnected(true)
          localStorage.setItem('spotifyUser', JSON.stringify(spotifyUserData))
          localStorage.setItem('spotifyConnected', 'true')
        } else {
          setSpotifyConnected(true)
          localStorage.setItem('spotifyConnected', 'true')
        }
        
        // Déclencher un rafraîchissement du bouton Spotify
        setSpotifyRefreshKey(prev => prev + 1)
      } else if (spotifyError) {
        setNotification({
          type: 'error',
          message: `Erreur Spotify : ${decodeURIComponent(spotifyError)}`
        })
        
        // Nettoyer l'état Spotify en cas d'erreur
        setSpotifyUser(null)
        setSpotifyConnected(false)
        localStorage.removeItem('spotifyUser')
        localStorage.removeItem('spotifyConnected')
      } else {
        // Récupérer l'état Spotify depuis localStorage au démarrage
        const storedSpotifyUser = localStorage.getItem('spotifyUser')
        const storedSpotifyConnected = localStorage.getItem('spotifyConnected')
        
        if (storedSpotifyConnected === 'true') {
          setSpotifyConnected(true)
          if (storedSpotifyUser) {
            try {
              const spotifyUserData = JSON.parse(storedSpotifyUser)
              setSpotifyUser(spotifyUserData)
            } catch (e) {
              console.error('Error parsing stored Spotify user:', e)
              localStorage.removeItem('spotifyUser')
            }
          }
        }
      }

      // Nettoyer l'URL
      if (tokenFromUrl || spotifySuccess || spotifyError) {
        window.history.replaceState({}, document.title, window.location.pathname)
      }
      
      setLoading(false)
    }
  }, [])

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const handleLogin = () => {
    if (isTestMode) {
      // En mode test, simuler la connexion
      setUser(fakeUsers.viewer)
      setToken('fake-token-123')
    } else {
      // Rediriger vers l'authentification Twitch du backend
      window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/twitch`
    }
  }

  const handleLogout = () => {
    if (!isTestMode) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Nettoyer aussi les données Spotify lors de la déconnexion Twitch
      localStorage.removeItem('spotifyUser')
      localStorage.removeItem('spotifyConnected')
    }
    setToken(null)
    setUser(null)
    setSpotifyUser(null)
    setSpotifyConnected(false)
    setNotification({
      type: 'success',
      message: 'Déconnecté avec succès'
    })
  }

  const handleSpotifyLogin = () => {
    if (isTestMode) {
      // En mode test, simuler la connexion Spotify
      const mockSpotifyUser = { display_name: 'TestSpotifyUser', connected: true }
      setSpotifyUser(mockSpotifyUser)
      setSpotifyConnected(true)
      setNotification({
        type: 'success',
        message: 'Spotify connecté avec succès (mode test)'
      })
    } else {
      // Vérifier qu'on a un token Twitch
      if (!token) {
        setNotification({
          type: 'error',
          message: 'Vous devez être connecté à Twitch pour connecter Spotify'
        })
        return
      }
      
      // Rediriger vers l'authentification Spotify en passant le token via query parameter
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      window.location.href = `${apiUrl}/api/auth/spotify?token=${encodeURIComponent(token)}`
    }
  }

  const handleSpotifyLogout = () => {
    if (!isTestMode) {
      localStorage.removeItem('spotifyUser')
      localStorage.removeItem('spotifyConnected')
    }
    setSpotifyUser(null)
    setSpotifyConnected(false)
    setNotification({
      type: 'success',
      message: 'Déconnecté de Spotify avec succès'
    })
  }

  const handleTestUserChange = (newUser) => {
    setUser(newUser)
    setToken(newUser ? 'fake-token-123' : null)
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-[#2D0036] via-[#3D1A4B] to-[#2D0036] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DBFFA8] mx-auto mb-4"></div>
          <p className="text-white text-lg">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen w-full bg-gradient-to-br from-[#2D0036] via-[#3D1A4B] to-[#2D0036]">
        {/* Notification Toast - En bas à droite */}
        {notification && (
          <div className="fixed bottom-6 right-6 z-50 max-w-sm">
            <div className={`rounded-lg p-4 shadow-lg backdrop-blur-md border transition-all duration-300 transform ${
              notification.type === 'success' 
                ? 'bg-green-600/90 border-green-500 text-white' 
                : 'bg-red-600/90 border-red-500 text-white'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="mr-3">
                    {notification.type === 'success' ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm font-medium">{notification.message}</p>
                </div>
                <button
                  onClick={() => setNotification(null)}
                  className="ml-4 text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header global avec authentification */}
        <div className="absolute top-6 right-6 flex gap-3 z-40">
          {/* Lien debug (uniquement en développement) */}
          {import.meta.env.MODE === 'development' && (
            <a
              href="/debug"
              className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
            >
              🔧 Debug
            </a>
          )}
          {!token ? (
            <>
              <button
                onClick={handleLogin}
                className="px-6 py-3 rounded-full font-bold text-base bg-[#9146FF] text-white hover:bg-[#9146FF]/80 transition-all shadow-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                </svg>
                Se connecter
              </button>
              {/* Le bouton Spotify n'est plus affiché quand l'utilisateur n'est pas connecté à Twitch */}
            </>
          ) : (
            <div className="flex items-center gap-3">
              {/* Bouton Twitch - Se déconnecter de Twitch */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-[#9146FF]/20 hover:bg-[#9146FF]/30 px-3 py-2 rounded-full transition-all group"
                title="Se déconnecter de Twitch"
              >
                <Avatar 
                  src={user?.profile_picture} 
                  alt={user?.display_name}
                  size="md"
                />
                <span className="text-white font-medium group-hover:text-gray-200">
                  {user?.display_name}
                </span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-red-400 transition-colors opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
              
              {/* Bouton Spotify - Uniquement visible quand connecté à Twitch */}
              {!isTestMode && token && (
                spotifyConnected && spotifyUser ? (
                  <button
                    onClick={handleSpotifyLogout}
                    className="flex items-center gap-2 bg-[#1DB954]/20 hover:bg-[#1DB954]/30 px-3 py-2 rounded-full transition-all group"
                    title="Se déconnecter de Spotify"
                  >
                    <div className="w-8 h-8 bg-[#1DB954] rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                    </div>
                    <span className="text-white font-medium group-hover:text-gray-200">
                      {spotifyUser.display_name}
                    </span>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-red-400 transition-colors opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={handleSpotifyLogin}
                    className="px-6 py-3 rounded-full font-bold text-base bg-[#1DB954] text-white hover:bg-[#1DB954]/80 transition-all shadow-lg flex items-center gap-2"
                    title={`Connecter Spotify pour ${user.display_name}`}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                    Connecter Spotify
                  </button>
                )
              )}
              
              {/* Mode test - Afficher les boutons Spotify aussi */}
              {isTestMode && token && (
                spotifyConnected && spotifyUser ? (
                  <button
                    onClick={handleSpotifyLogout}
                    className="flex items-center gap-2 bg-[#1DB954]/20 hover:bg-[#1DB954]/30 px-3 py-2 rounded-full transition-all group"
                    title="Se déconnecter de Spotify (mode test)"
                  >
                    <div className="w-8 h-8 bg-[#1DB954] rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                    </div>
                    <span className="text-white font-medium group-hover:text-gray-200">
                      {spotifyUser.display_name}
                    </span>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-red-400 transition-colors opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={handleSpotifyLogin}
                    className="px-6 py-3 rounded-full font-bold text-base bg-[#1DB954] text-white hover:bg-[#1DB954]/80 transition-all shadow-lg flex items-center gap-2"
                    title="Connecter Spotify (mode test)"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                    Connecter Spotify
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Contrôles de test (uniquement en mode test) */}
        {isTestMode && (
          <TestControls 
            currentUser={user} 
            onUserChange={handleTestUserChange}
          />
        )}

        {/* Routes principales */}
        <Routes>
          <Route 
            path="/" 
            element={<HomePage user={user} token={token} isTestMode={isTestMode} />} 
          />
          
          <Route 
            path="/room/:sessionCode" 
            element={<SessionRoom user={user} token={token} isTestMode={isTestMode} />} 
          />
          
          {/* Route de debug (uniquement en développement) */}
          {import.meta.env.MODE === 'development' && (
            <Route 
              path="/debug" 
              element={<DebugPanel />} 
            />
          )}
          
          {/* Route de test Spotify (uniquement en développement) */}
          {import.meta.env.MODE === 'development' && (
            <Route 
              path="/spotify-test" 
              element={<SpotifyTest />} 
            />
          )}
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
