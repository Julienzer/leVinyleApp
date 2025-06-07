import { useState, useEffect } from 'react'
import TrackSubmission from './components/TrackSubmission'
import ModPanel from './components/ModPanel'
import Playlist from './components/Playlist'
import VinyleLogo from './assets/VinyleLogo'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('submit')
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Récupère le token depuis l'URL si présent
    const params = new URLSearchParams(window.location.search)
    const tokenFromUrl = params.get('token')
    if (tokenFromUrl) {
      setToken(tokenFromUrl)
      // Décode le token pour obtenir les infos utilisateur
      try {
        const payload = JSON.parse(atob(tokenFromUrl.split('.')[1]))
        setUser(payload)
      } catch (e) {
        console.error('Error decoding token:', e)
      }
      // Nettoie l'URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const handleLogin = () => {
    window.location.href = 'http://localhost:3000/api/auth/twitch'
  }

  const handleLogout = () => {
    setToken(null)
    setUser(null)
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center">
      <header className="py-4 w-full flex flex-col items-center relative">
        {/* User menu en haut à droite */}
        <div className="absolute top-4 right-4">
          {!token ? (
            <button
              onClick={handleLogin}
              className="px-6 py-2 rounded-full font-bold text-base bg-[#9146FF] text-white hover:bg-[#9146FF]/80 transition-all shadow-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
              </svg>
              Se connecter
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-white font-medium">
                {user?.display_name}
                {user?.role === 'moderator' && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-[#00FFD0] text-[#2D0036] rounded-full">
                    Modo
                  </span>
                )}
              </span>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 transition-all text-red-500"
                title="Déconnexion"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <VinyleLogo className="h-20 w-20 flex-shrink-0 hover:scale-110 transition-transform duration-300 mb-1" />
        <h1 className="text-3xl md:text-5xl font-extrabold text-[#CFFF04] tracking-widest drop-shadow-[0_0_16px_#CFFF04] font-mono select-none text-center mb-2">
          LE VINYLE
        </h1>
        <nav className="flex flex-col md:flex-row gap-3 md:gap-6 justify-center items-center w-full">
          <button
            onClick={() => setActiveTab('submit')}
            className={`px-6 py-2 rounded-full font-bold text-base md:text-lg transition-all shadow-lg border-2 border-[#CFFF04]/40 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#CFFF04] focus:ring-offset-2 focus:ring-offset-[#1a1a40] ${activeTab === 'submit' ? 'bg-[#CFFF04] text-[#2D0036] shadow-[0_0_16px_#CFFF04] scale-105' : 'bg-[#2D0036] text-[#CFFF04] hover:bg-[#CFFF04]/20'}`}
          >
            Proposer
          </button>
          <button
            onClick={() => setActiveTab('playlist')}
            className={`px-6 py-2 rounded-full font-bold text-base md:text-lg transition-all shadow-lg border-2 border-[#FF4FAD]/40 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#FF4FAD] focus:ring-offset-2 focus:ring-offset-[#1a1a40] ${activeTab === 'playlist' ? 'bg-[#FF4FAD] text-white shadow-[0_0_16px_#FF4FAD] scale-105' : 'bg-[#2D0036] text-[#FF4FAD] hover:bg-[#FF4FAD]/20'}`}
          >
            Playlist
          </button>
          <button
            onClick={() => setActiveTab('mod')}
            className={`px-6 py-2 rounded-full font-bold text-base md:text-lg transition-all shadow-lg border-2 border-[#00FFD0]/40 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#00FFD0] focus:ring-offset-2 focus:ring-offset-[#1a1a40] ${activeTab === 'mod' ? 'bg-[#00FFD0] text-[#2D0036] shadow-[0_0_16px_#00FFD0] scale-105' : 'bg-[#2D0036] text-[#00FFD0] hover:bg-[#00FFD0]/20'}`}
          >
            Modération
          </button>
        </nav>
      </header>
      <main className="w-full flex flex-col items-center px-2 sm:px-4 lg:px-8 py-4 gap-8">
        {activeTab === 'submit' && <TrackSubmission />}
        {activeTab === 'playlist' && <Playlist />}
        {activeTab === 'mod' && <ModPanel token={token} />}
      </main>
    </div>
  )
}

export default App
