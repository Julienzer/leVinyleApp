import { useState } from 'react'
import TrackSubmission from './components/TrackSubmission'
import ModPanel from './components/ModPanel'
import Playlist from './components/Playlist'
import VinyleLogo from './assets/VinyleLogo'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('submit')

  return (
    <div className="min-h-screen w-full flex flex-col items-center">
      <header className="py-4 w-full flex flex-col items-center">
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
        {activeTab === 'mod' && <ModPanel />}
      </main>
    </div>
  )
}

export default App
