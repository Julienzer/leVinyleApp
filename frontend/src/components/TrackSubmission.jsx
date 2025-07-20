import { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function TrackSubmission({ token }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [spotifyLink, setSpotifyLink] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fake data pour simuler l'AJAX
  const fakeDatabase = [
    {
      id: 1,
      album: "Fugees The Score",
      artist: "Fugees",
      image: "/api/placeholder/48/48",
      tracks: [
        { id: "1-1", name: "Fugees - Fu-Gee-La", duration: "3:56", spotify_url: "https://open.spotify.com/track/fugees-fu-gee-la" },
        { id: "1-2", name: "Fugees - Ready or not", duration: "3:47", spotify_url: "https://open.spotify.com/track/fugees-ready-or-not" },
        { id: "1-3", name: "Fugees - Killing Me Softly", duration: "4:58", spotify_url: "https://open.spotify.com/track/fugees-killing-me-softly" }
      ]
    },
    {
      id: 2,
      album: "Good Kid, M.A.A.D City",
      artist: "Kendrick Lamar",
      image: "/api/placeholder/48/48",
      tracks: [
        { id: "2-1", name: "Kendrick Lamar - Swimming Pools (Drank)", duration: "5:13", spotify_url: "https://open.spotify.com/track/kendrick-swimming-pools" },
        { id: "2-2", name: "Kendrick Lamar - Bitch, Don't Kill My Vibe", duration: "5:10", spotify_url: "https://open.spotify.com/track/kendrick-bitch-dont-kill-my-vibe" },
        { id: "2-3", name: "Kendrick Lamar - Money Trees", duration: "6:26", spotify_url: "https://open.spotify.com/track/kendrick-money-trees" }
      ]
    },
    {
      id: 3,
      album: "To Pimp a Butterfly",
      artist: "Kendrick Lamar",
      image: "/api/placeholder/48/48",
      tracks: [
        { id: "3-1", name: "Kendrick Lamar - King Kunta", duration: "3:54", spotify_url: "https://open.spotify.com/track/kendrick-king-kunta" },
        { id: "3-2", name: "Kendrick Lamar - Alright", duration: "3:39", spotify_url: "https://open.spotify.com/track/kendrick-alright" },
        { id: "3-3", name: "Kendrick Lamar - The Blacker the Berry", duration: "5:28", spotify_url: "https://open.spotify.com/track/kendrick-blacker-berry" }
      ]
    },
    {
      id: 4,
      album: "Illmatic",
      artist: "Nas",
      image: "/api/placeholder/48/48",
      tracks: [
        { id: "4-1", name: "Nas - N.Y. State of Mind", duration: "4:54", spotify_url: "https://open.spotify.com/track/nas-ny-state-of-mind" },
        { id: "4-2", name: "Nas - Life's a Bitch", duration: "3:30", spotify_url: "https://open.spotify.com/track/nas-lifes-a-bitch" },
        { id: "4-3", name: "Nas - The World Is Yours", duration: "4:50", spotify_url: "https://open.spotify.com/track/nas-world-is-yours" }
      ]
    },
    {
      id: 5,
      album: "The Low End Theory",
      artist: "A Tribe Called Quest",
      image: "/api/placeholder/48/48",
      tracks: [
        { id: "5-1", name: "A Tribe Called Quest - Check the Rhime", duration: "3:36", spotify_url: "https://open.spotify.com/track/atcq-check-the-rhime" },
        { id: "5-2", name: "A Tribe Called Quest - Jazz (We've Got)", duration: "4:09", spotify_url: "https://open.spotify.com/track/atcq-jazz-weve-got" },
        { id: "5-3", name: "A Tribe Called Quest - Scenario", duration: "4:10", spotify_url: "https://open.spotify.com/track/atcq-scenario" }
      ]
    },
    {
      id: 6,
      album: "Enter the Wu-Tang (36 Chambers)",
      artist: "Wu-Tang Clan",
      image: "/api/placeholder/48/48",
      tracks: [
        { id: "6-1", name: "Wu-Tang Clan - C.R.E.A.M.", duration: "4:12", spotify_url: "https://open.spotify.com/track/wu-tang-cream" },
        { id: "6-2", name: "Wu-Tang Clan - Method Man", duration: "3:29", spotify_url: "https://open.spotify.com/track/wu-tang-method-man" },
        { id: "6-3", name: "Wu-Tang Clan - Protect Ya Neck", duration: "4:51", spotify_url: "https://open.spotify.com/track/wu-tang-protect-ya-neck" }
      ]
    },
    {
      id: 7,
      album: "Stankonia",
      artist: "OutKast",
      image: "/api/placeholder/48/48",
      tracks: [
        { id: "7-1", name: "OutKast - Ms. Jackson", duration: "4:30", spotify_url: "https://open.spotify.com/track/outkast-ms-jackson" },
        { id: "7-2", name: "OutKast - So Fresh, So Clean", duration: "4:00", spotify_url: "https://open.spotify.com/track/outkast-so-fresh-so-clean" },
        { id: "7-3", name: "OutKast - B.O.B.", duration: "5:04", spotify_url: "https://open.spotify.com/track/outkast-bob" }
      ]
    }
  ];

  // Fonction pour simuler un appel AJAX avec délai
  const simulateAjaxSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

    // Filtrer les résultats basés sur la requête
    const filtered = fakeDatabase.filter(album => 
      album.album.toLowerCase().includes(query.toLowerCase()) ||
      album.artist.toLowerCase().includes(query.toLowerCase()) ||
      album.tracks.some(track => 
        track.name.toLowerCase().includes(query.toLowerCase())
      )
    );

    setSearchResults(filtered);
    setIsLoading(false);
  };

  // Effect pour déclencher la recherche quand searchQuery change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      simulateAjaxSearch(searchQuery);
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleTrackClick = async (track) => {
    setSpotifyLink(track.spotify_url);
    setSuccess(false);
    setError('');
    
    if (!token) {
      setError('Vous devez être connecté pour proposer un morceau');
      return;
    }

    try {
      const response = await api.post('/api/submit-track', {
        spotify_url: track.spotify_url,
        track_name: track.name,
        message: message
      }, token);

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 401) {
          setError('Votre session a expiré. Veuillez vous reconnecter.');
        } else {
          setError(data.error || 'Erreur lors de la soumission');
        }
        return;
      }

      setSuccess(true);
      setSearchQuery('');
      setSpotifyLink('');
      setMessage('');
      setSearchResults([]);
    } catch (err) {
      setError('Erreur réseau ou session expirée. Veuillez vous reconnecter.');
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    setError('');
    
    if (!token) {
      setError('Vous devez être connecté pour proposer un morceau');
      return;
    }

    if (!spotifyLink) {
      setError('Veuillez entrer un lien Spotify ou sélectionner un morceau');
      return;
    }

    try {
      const response = await api.post('/api/submit-track', {
        spotify_url: spotifyLink,
        message: message
      }, token);

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 401) {
          setError('Votre session a expiré. Veuillez vous reconnecter.');
        } else {
          setError(data.error || 'Erreur lors de la soumission');
        }
        return;
      }

      setSuccess(true);
      setSearchQuery('');
      setSpotifyLink('');
      setMessage('');
      setSearchResults([]);
    } catch (err) {
      setError('Erreur réseau ou session expirée. Veuillez vous reconnecter.');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleManualSubmit} className="space-y-6">
        {/* Zone de recherche */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un album ou un artiste..."
            className="w-full bg-[#3A3A3A] border border-[#555] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#DBFFA8] transition-colors"
          />
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute right-3 top-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#DBFFA8]"></div>
            </div>
          )}
          
          {/* Résultats de recherche */}
          {searchResults.length > 0 && (
            <div className="mt-2 bg-[#3A3A3A] border border-[#555] rounded-lg overflow-hidden max-h-96 overflow-y-auto">
              <div className="p-2 text-xs text-gray-400 border-b border-[#555]">
                {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''} trouvé{searchResults.length > 1 ? 's' : ''} - Cliquez sur un morceau pour l'ajouter
              </div>
              {searchResults.map((album) => (
                <div key={album.id} className="p-3 border-b border-[#555] last:border-b-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gray-600 rounded-md flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zm12-3c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-[#DBFFA8] font-medium">{album.album}</h3>
                      <p className="text-gray-400 text-sm">{album.artist}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1 ml-15">
                    {album.tracks.map((track) => (
                      <div
                        key={track.id}
                        onClick={() => handleTrackClick(track)}
                        className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-[#555]/50 hover:scale-[1.02] transform"
                      >
                        <div className="w-10 h-10 bg-gray-600 rounded-md flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm">{track.name}</p>
                          <p className="text-gray-400 text-xs">{track.duration}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Message si aucun résultat */}
          {searchQuery && !isLoading && searchResults.length === 0 && (
            <div className="mt-2 bg-[#3A3A3A] border border-[#555] rounded-lg p-4 text-center text-gray-400">
              Aucun résultat trouvé pour "{searchQuery}"
            </div>
          )}
        </div>

        {/* Champ lien Spotify */}
        <div>
          <input
            type="url"
            value={spotifyLink}
            onChange={(e) => setSpotifyLink(e.target.value)}
            placeholder="Ou collez directement un lien Spotify..."
            className="w-full bg-[#3A3A3A] border border-[#555] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#DBFFA8] transition-colors"
          />
        </div>

        {/* Message optionnel */}
        <div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message (optionnel)"
            rows={3}
            className="w-full bg-[#3A3A3A] border border-[#555] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#DBFFA8] transition-colors resize-none"
          />
        </div>

        {/* Bouton Envoyer pour soumission manuelle */}
        <button
          type="submit"
          disabled={!spotifyLink}
          className="w-full py-3 rounded-full font-bold text-lg bg-[#FF4FAD] text-white hover:bg-[#FF4FAD]/90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transform"
        >
          Envoyer
        </button>

        {/* Messages de succès/erreur */}
        {success && (
          <div className="text-green-400 font-bold text-center text-base bg-green-500/10 py-3 px-4 rounded-lg border border-green-500/20">
            Merci pour ta proposition !
          </div>
        )}
        {error && (
          <div className="text-red-400 font-bold text-center text-base bg-red-500/10 py-3 px-4 rounded-lg border border-red-500/20">
            {error}
          </div>
        )}
      </form>
    </div>
  );
} 