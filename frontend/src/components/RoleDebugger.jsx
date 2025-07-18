import { useState, useEffect } from 'react';

export default function RoleDebugger({ user, userRole, session, token, isTestMode }) {
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    setDebugInfo({
      timestamp: new Date().toISOString(),
      userRole,
      userId: user?.id,
      userDisplayName: user?.display_name,
      sessionName: session?.name,
      sessionId: session?.id,
      streamerId: session?.streamer_id,
      isTestMode,
      hasToken: !!token
    });
  }, [userRole, user, session, token, isTestMode]);

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg max-w-md z-50 text-xs">
      <div className="mb-2">
        <span className="font-bold text-yellow-400">🐛 DEBUG - Rôle Utilisateur</span>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Rôle:</span>
          <span className={`font-bold ${
            userRole === 'moderator' ? 'text-green-400' : 
            userRole === 'streamer' ? 'text-purple-400' : 'text-blue-400'
          }`}>
            {userRole}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Utilisateur:</span>
          <span className="text-gray-300">{debugInfo.userDisplayName}</span>
        </div>
        <div className="flex justify-between">
          <span>Session:</span>
          <span className="text-gray-300">{debugInfo.sessionName}</span>
        </div>
        <div className="flex justify-between">
          <span>ID User:</span>
          <span className="text-gray-300 font-mono">{debugInfo.userId}</span>
        </div>
        <div className="flex justify-between">
          <span>ID Streamer:</span>
          <span className="text-gray-300 font-mono">{debugInfo.streamerId}</span>
        </div>
        <div className="flex justify-between">
          <span>Mode Test:</span>
          <span className={debugInfo.isTestMode ? 'text-yellow-400' : 'text-gray-400'}>
            {debugInfo.isTestMode ? 'OUI' : 'NON'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Token:</span>
          <span className={debugInfo.hasToken ? 'text-green-400' : 'text-red-400'}>
            {debugInfo.hasToken ? 'OK' : 'MANQUANT'}
          </span>
        </div>
        <div className="text-xs text-gray-400 mt-2">
          Maj: {debugInfo.timestamp?.split('T')[1]?.split('.')[0]}
        </div>
      </div>
    </div>
  );
} 