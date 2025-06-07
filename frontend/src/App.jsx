import { useState } from 'react'
import TrackSubmission from './components/TrackSubmission'
import ModPanel from './components/ModPanel'
import Playlist from './components/Playlist'
import VinyleLogo from './assets/VinyleLogo'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('submit')

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2D0036] via-[#0A0A23] to-[#1a1a40]">
      <header className="backdrop-blur bg-[#1a1a40]/80 shadow-lg border-b border-[#CFFF04]/20 py-16 mb-20">
        <div className="w-full px-8 sm:px-12 lg:px-24 flex items-center gap-20">
          <div className="flex items-center gap-12">
            <VinyleLogo className="h-32 w-32 flex-shrink-0 hover:scale-110 transition-transform duration-300" />
            <h1 className="text-8xl font-extrabold text-[#CFFF04] tracking-widest drop-shadow-[0_0_32px_#CFFF04] font-mono select-none">
              LE VINYLE
            </h1>
          </div>
          <nav className="flex space-x-20 ml-auto">

            <button
              onClick={() => setActiveTab('submit')}
              className={`px-12 py-5 rounded-full font-bold text-2xl transition-all shadow-lg border-2 border-transparent hover:scale-105 ${activeTab === 'submit' ? 'bg-[#CFFF04] text-[#2D0036] shadow-[0_0_32px_#CFFF04] scale-105' : 'bg-[#2D0036] text-[#CFFF04] hover:border-[#CFFF04]/60'}`}
            >
              Proposer
            </button>
            <button
              onClick={() => setActiveTab('playlist')}
              className={`px-12 py-5 rounded-full font-bold text-2xl transition-all shadow-lg border-2 border-transparent hover:scale-105 ${activeTab === 'playlist' ? 'bg-[#FF4FAD] text-white shadow-[0_0_32px_#FF4FAD] scale-105' : 'bg-[#2D0036] text-[#FF4FAD] hover:border-[#FF4FAD]/60'}`}
            >
              Playlist
            </button>
            <button
              onClick={() => setActiveTab('mod')}
              className={`px-12 py-5 rounded-full font-bold text-2xl transition-all shadow-lg border-2 border-transparent hover:scale-105 ${activeTab === 'mod' ? 'bg-[#00FFD0] text-[#2D0036] shadow-[0_0_32px_#00FFD0] scale-105' : 'bg-[#2D0036] text-[#00FFD0] hover:border-[#00FFD0]/60'}`}
            >
              Modération
            </button>
          </nav>
        </div>
      </header>

      <main className="w-full px-8 sm:px-12 lg:px-24 py-16 flex flex-col gap-32">
        <div className="w-full max-w-[2000px] mx-auto">
          {activeTab === 'submit' && <TrackSubmission />}
          {activeTab === 'playlist' && <Playlist />}
          {activeTab === 'mod' && <ModPanel />}
        </div>
      </main>
    </div>
  )
}

export default App
