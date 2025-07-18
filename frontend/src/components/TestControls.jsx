import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fakeUsers } from '../utils/fakeData'

export default function TestControls({ currentUser, onUserChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const handleRoleChange = (role) => {
    onUserChange(fakeUsers[role])
    setIsOpen(false)
  }

  const quickNavigation = [
    { label: 'Accueil', path: '/' },
    { label: 'Session Test', path: '/room/test123' },
    { label: 'Session Privée', path: '/room/private456' }
  ]

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex flex-col items-end space-y-2">
        {/* Navigation rapide */}
        <div className="flex flex-col space-y-2 mb-2">
          {quickNavigation.map((nav) => (
            <button
              key={nav.path}
              onClick={() => navigate(nav.path)}
              className="px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors"
            >
              {nav.label}
            </button>
          ))}
        </div>

        {/* Menu déroulant des rôles */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-4 py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors flex items-center space-x-2"
          >
            <span>🧪</span>
            <span>Test: {currentUser?.display_name || 'Aucun'}</span>
            <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isOpen && (
            <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700 min-w-48">
              <div className="p-2 border-b border-gray-700">
                <p className="text-white text-sm font-medium">Mode Test</p>
                <p className="text-gray-400 text-xs">Changer de rôle utilisateur</p>
              </div>
              
              <div className="p-2 space-y-1">
                {Object.entries(fakeUsers).map(([role, user]) => (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(role)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      currentUser?.id === user.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-medium">{user.display_name}</div>
                    <div className="text-xs opacity-75">
                      {user.isStreamer ? 'Streamer' : user.role === 'moderator' ? 'Modérateur' : 'Viewer'}
                    </div>
                  </button>
                ))}
                
                <button
                  onClick={() => handleRoleChange(null)}
                  className="w-full text-left px-3 py-2 rounded text-sm text-gray-300 hover:bg-gray-700"
                >
                  <div className="font-medium">Déconnecté</div>
                  <div className="text-xs opacity-75">Sans compte</div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 