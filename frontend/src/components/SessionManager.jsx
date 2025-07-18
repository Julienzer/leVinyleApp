import { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  TrashIcon, 
  StopIcon, 
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const SessionManager = ({ user, token, isTestMode = false }) => {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (isTestMode) {
        // Données simulées
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setStats({
          total: 8,
          active: 3,
          inactive: 2,
          old: 3,
          cleanup_candidates: 4
        });
        
        setSessions([
          {
            id: 1,
            code: 'test123',
            name: 'Session Test Actuelle',
            streamer_name: user?.display_name || 'TestStreamer',
            active: true,
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            last_activity: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            hours_inactive: 0.5,
            days_old: 0.1,
            cleanup_status: 'Actif',
            total_propositions: 5,
            auto_cleanup: true
          },
          {
            id: 2,
            code: 'session_old',
            name: 'Ancienne Session',
            streamer_name: user?.display_name || 'TestStreamer',
            active: false,
            created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            last_activity: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
            hours_inactive: 36,
            days_old: 2,
            cleanup_status: 'À désactiver',
            total_propositions: 12,
            auto_cleanup: true
          },
          {
            id: 3,
            code: 'very_old',
            name: 'Très Ancienne Session',
            streamer_name: user?.display_name || 'TestStreamer',
            active: false,
            created_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
            last_activity: new Date(Date.now() - 34 * 24 * 60 * 60 * 1000).toISOString(),
            hours_inactive: 816,
            days_old: 35,
            cleanup_status: 'À supprimer',
            total_propositions: 8,
            auto_cleanup: true
          }
        ]);
        
      } else {
        // Requêtes API réelles
        const [statsResponse, sessionsResponse] = await Promise.all([
          fetch('/api/session-cleanup/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/session-cleanup/view', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        
        if (!statsResponse.ok || !sessionsResponse.ok) {
          throw new Error('Erreur lors du chargement des données');
        }
        
        const statsData = await statsResponse.json();
        const sessionsData = await sessionsResponse.json();
        
        setStats(statsData.stats);
        setSessions(sessionsData.sessions);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deactivateSession = async (sessionId, sessionName) => {
    if (!confirm(`Êtes-vous sûr de vouloir désactiver la session "${sessionName}" ?`)) {
      return;
    }
    
    try {
      if (isTestMode) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setSessions(prev => prev.map(s => 
          s.id === sessionId ? { ...s, active: false, cleanup_status: 'Inactif' } : s
        ));
        setSuccess('Session désactivée en mode test');
      } else {
        const response = await fetch(`/api/session-cleanup/${sessionId}/deactivate`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Erreur lors de la désactivation');
        }
        
        setSuccess('Session désactivée avec succès');
        fetchData();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteSession = async (sessionId, sessionName) => {
    if (!confirm(`⚠️ ATTENTION : Êtes-vous sûr de vouloir SUPPRIMER définitivement la session "${sessionName}" ?\n\nCette action supprimera également toutes les propositions associées et ne peut pas être annulée.`)) {
      return;
    }
    
    try {
      if (isTestMode) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        setSuccess('Session supprimée en mode test');
      } else {
        const response = await fetch(`/api/session-cleanup/${sessionId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Erreur lors de la suppression');
        }
        
        setSuccess('Session supprimée avec succès');
        fetchData();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleAutoCleanup = async (sessionId, currentValue) => {
    try {
      if (isTestMode) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setSessions(prev => prev.map(s => 
          s.id === sessionId ? { ...s, auto_cleanup: !currentValue } : s
        ));
        setSuccess(`Nettoyage automatique ${!currentValue ? 'activé' : 'désactivé'}`);
      } else {
        const response = await fetch(`/api/session-cleanup/${sessionId}/auto-cleanup`, {
          method: 'PATCH',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ auto_cleanup: !currentValue })
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Erreur lors de la mise à jour');
        }
        
        setSuccess(`Nettoyage automatique ${!currentValue ? 'activé' : 'désactivé'}`);
        fetchData();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Actif': return 'text-green-400';
      case 'À désactiver': return 'text-yellow-400';
      case 'À supprimer': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Actif': return <CheckCircleIcon className="w-4 h-4" />;
      case 'À désactiver': return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'À supprimer': return <XCircleIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-[#2D0036]/60 backdrop-blur-md rounded-lg p-6 border border-[#FF4FAD]/20">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF4FAD] mr-3"></div>
          <span className="text-white">Chargement des sessions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#2D0036]/60 backdrop-blur-md rounded-lg p-6 border border-[#FF4FAD]/20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-[#FF4FAD]">
          🗂️ Gestion des Sessions
        </h3>
        <button
          onClick={fetchData}
          className="flex items-center space-x-2 px-4 py-2 bg-[#FF4FAD]/20 text-[#FF4FAD] rounded-lg hover:bg-[#FF4FAD]/30 transition-colors"
        >
          <ChartBarIcon className="w-4 h-4" />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-[#3A3A3A] rounded-lg p-3 text-center">
          <div className="text-white text-lg font-bold">{stats.total || 0}</div>
          <div className="text-gray-400 text-sm">Total</div>
        </div>
        <div className="bg-green-500/20 rounded-lg p-3 text-center">
          <div className="text-green-400 text-lg font-bold">{stats.active || 0}</div>
          <div className="text-green-400 text-sm">Actives</div>
        </div>
        <div className="bg-gray-500/20 rounded-lg p-3 text-center">
          <div className="text-gray-400 text-lg font-bold">{stats.inactive || 0}</div>
          <div className="text-gray-400 text-sm">Inactives</div>
        </div>
        <div className="bg-yellow-500/20 rounded-lg p-3 text-center">
          <div className="text-yellow-400 text-lg font-bold">{stats.old || 0}</div>
          <div className="text-yellow-400 text-sm">Anciennes</div>
        </div>
        <div className="bg-red-500/20 rounded-lg p-3 text-center">
          <div className="text-red-400 text-lg font-bold">{stats.cleanup_candidates || 0}</div>
          <div className="text-red-400 text-sm">À nettoyer</div>
        </div>
      </div>

      {/* Liste des sessions */}
      <div className="space-y-3">
        <h4 className="text-white font-medium">Vos sessions ({sessions.length})</h4>
        
        {sessions.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            <ChartBarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Aucune session trouvée</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sessions.map(session => (
              <div 
                key={session.id}
                className={`p-4 rounded-lg border transition-colors ${
                  session.active 
                    ? 'bg-green-500/10 border-green-500/20' 
                    : 'bg-[#3A3A3A] border-[#555]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h5 className="font-medium text-white">{session.name}</h5>
                      <span className="text-xs bg-[#555] text-gray-300 px-2 py-1 rounded">
                        {session.code}
                      </span>
                      <div className={`flex items-center space-x-1 text-xs ${getStatusColor(session.cleanup_status)}`}>
                        {getStatusIcon(session.cleanup_status)}
                        <span>{session.cleanup_status}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-400">
                      <div>
                        <span className="text-gray-500">Créée:</span><br/>
                        {formatDate(session.created_at)}
                      </div>
                      <div>
                        <span className="text-gray-500">Dernière activité:</span><br/>
                        {formatDate(session.last_activity)}
                      </div>
                      <div>
                        <span className="text-gray-500">Inactivité:</span><br/>
                        {session.hours_inactive < 24 
                          ? `${Math.round(session.hours_inactive)}h`
                          : `${Math.round(session.days_old)}j`
                        }
                      </div>
                      <div>
                        <span className="text-gray-500">Propositions:</span><br/>
                        {session.total_propositions}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 mt-3">
                      <label className="flex items-center space-x-2 text-xs">
                        <input
                          type="checkbox"
                          checked={session.auto_cleanup}
                          onChange={() => toggleAutoCleanup(session.id, session.auto_cleanup)}
                          className="rounded border-gray-600 bg-gray-700 text-[#FF4FAD] focus:ring-[#FF4FAD] focus:ring-offset-0"
                        />
                        <span className="text-gray-400">Nettoyage automatique</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    {session.active && (
                      <button
                        onClick={() => deactivateSession(session.id, session.name)}
                        className="flex items-center space-x-1 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs hover:bg-yellow-500/30 transition-colors"
                      >
                        <StopIcon className="w-3 h-3" />
                        <span>Désactiver</span>
                      </button>
                    )}
                    
                    {!session.active && (
                      <button
                        onClick={() => deleteSession(session.id, session.name)}
                        className="flex items-center space-x-1 px-3 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors"
                      >
                        <TrashIcon className="w-3 h-3" />
                        <span>Supprimer</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mode test indicator */}
      {isTestMode && (
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-blue-400 text-sm">
            🧪 Mode test : Données de sessions simulées
          </p>
        </div>
      )}

      {/* Informations sur le nettoyage automatique */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <h5 className="text-blue-400 font-medium mb-2">ℹ️ Nettoyage Automatique</h5>
        <ul className="text-blue-300 text-sm space-y-1">
          <li>• Sessions <strong>désactivées</strong> après 24h d'inactivité</li>
          <li>• Sessions <strong>supprimées</strong> après 30 jours d'inactivité</li>
          <li>• Vous pouvez désactiver le nettoyage automatique par session</li>
          <li>• Les propositions sont supprimées avec la session</li>
        </ul>
      </div>
    </div>
  );
};

export default SessionManager; 