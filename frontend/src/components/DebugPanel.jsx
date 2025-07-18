import { useState, useEffect } from 'react';

export default function DebugPanel() {
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testUserId, setTestUserId] = useState('');
  const [testStreamerId, setTestStreamerId] = useState('');
  const [testResult, setTestResult] = useState(null);

  const fetchDebugInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/debug/tokens');
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      console.error('Erreur debug:', error);
    } finally {
      setLoading(false);
    }
  };

  const testModeration = async () => {
    if (!testUserId || !testStreamerId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/auth/debug/moderation/${testStreamerId}/${testUserId}`);
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      console.error('Erreur test modération:', error);
      setTestResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">🔧 Debug Panel</h1>
        
        {/* Tokens Info */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Tokens stockés</h2>
            <button
              onClick={fetchDebugInfo}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Chargement...' : 'Actualiser'}
            </button>
          </div>
          
          {debugInfo ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Tokens Twitch:</h3>
                <div className="bg-gray-50 p-3 rounded">
                  {debugInfo.twitchTokens.length > 0 ? (
                    <ul className="space-y-1">
                      {debugInfo.twitchTokens.map((token, index) => (
                        <li key={index} className="text-sm">
                          <span className="font-mono">{token.userId}</span> - {token.display_name}
                          <span className={`ml-2 px-2 py-1 text-xs rounded ${token.hasToken ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {token.hasToken ? 'Token OK' : 'Pas de token'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">Aucun token Twitch</p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Tokens Spotify:</h3>
                <div className="bg-gray-50 p-3 rounded">
                  {debugInfo.spotifyTokens.length > 0 ? (
                    <ul className="space-y-1">
                      {debugInfo.spotifyTokens.map((token, index) => (
                        <li key={index} className="text-sm">
                          <span className="font-mono">{token.userId}</span> - {token.display_name}
                          <span className={`ml-2 px-2 py-1 text-xs rounded ${token.hasToken ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {token.hasToken ? 'Token OK' : 'Pas de token'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">Aucun token Spotify</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Chargement des informations...</p>
          )}
        </div>

        {/* Test Modération */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Test de modération</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Utilisateur (à tester)
              </label>
              <input
                type="text"
                value={testUserId}
                onChange={(e) => setTestUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 123456789"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Streamer (broadcaster)
              </label>
              <input
                type="text"
                value={testStreamerId}
                onChange={(e) => setTestStreamerId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 987654321"
              />
            </div>
          </div>
          
          <button
            onClick={testModeration}
            disabled={loading || !testUserId || !testStreamerId}
            className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
          >
            {loading ? 'Test en cours...' : 'Tester la modération'}
          </button>
          
          {testResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-700 mb-2">Résultat du test:</h3>
              <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 