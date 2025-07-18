// Fake data pour tester l'application sans backend

export const fakeUsers = {
  viewer: {
    id: 'viewer123',
    display_name: 'TestViewer',
    role: 'viewer',
    isStreamer: false
  },
  moderator: {
    id: 'mod123',
    display_name: 'TestModerator',
    role: 'moderator',
    isStreamer: false
  },
  streamer: {
    id: 'streamer123',
    display_name: 'TestStreamer',
    role: 'streamer',
    isStreamer: true
  }
}

export const fakeSessions = {
  'test123': {
    id: 'session1',
    code: 'test123',
    name: 'Session Test de Julien',
    isPrivate: false,
    streamer_id: 'streamer123',
    streamer_name: 'TestStreamer',
    preventDuplicates: true,
    queueMode: 'chronological',
    created_at: new Date(),
    active: true
  },
  'private456': {
    id: 'session2',
    code: 'private456',
    name: 'Session Privée',
    isPrivate: true,
    streamer_id: 'streamer123',
    streamer_name: 'TestStreamer',
    preventDuplicates: false,
    queueMode: 'random',
    created_at: new Date(),
    active: true
  }
}

export const fakePropositions = [
  {
    id: 'prop1',
    session_id: 'session1',
    spotify_url: 'https://open.spotify.com/track/fugees-fu-gee-la',
    track_name: 'Fugees - Fu-Gee-La',
    artist: 'Fugees',
    album: 'The Score',
    duration: '3:56',
    viewer_id: 'viewer123',
    viewer_name: 'TestViewer',
    message: 'Un classique du hip-hop !',
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 10), // Il y a 10 minutes
    moderated_at: null,
    moderator_id: null,
    added_at: null
  },
  {
    id: 'prop2',
    session_id: 'session1',
    spotify_url: 'https://open.spotify.com/track/kendrick-swimming-pools',
    track_name: 'Kendrick Lamar - Swimming Pools (Drank)',
    artist: 'Kendrick Lamar',
    album: 'good kid, m.A.A.d city',
    duration: '5:13',
    viewer_id: 'viewer123',
    viewer_name: 'TestViewer',
    message: 'Pour l\'ambiance !',
    status: 'approved',
    created_at: new Date(Date.now() - 1000 * 60 * 15), // Il y a 15 minutes
    moderated_at: new Date(Date.now() - 1000 * 60 * 5), // Il y a 5 minutes
    moderator_id: 'mod123',
    added_at: null
  },
  {
    id: 'prop3',
    session_id: 'session1',
    spotify_url: 'https://open.spotify.com/track/nas-ny-state-of-mind',
    track_name: 'Nas - N.Y. State of Mind',
    artist: 'Nas',
    album: 'Illmatic',
    duration: '4:54',
    viewer_id: 'viewer123',
    viewer_name: 'TestViewer',
    message: '',
    status: 'rejected',
    created_at: new Date(Date.now() - 1000 * 60 * 20), // Il y a 20 minutes
    moderated_at: new Date(Date.now() - 1000 * 60 * 8), // Il y a 8 minutes
    moderator_id: 'mod123',
    added_at: null
  },
  {
    id: 'prop4',
    session_id: 'session1',
    spotify_url: 'https://open.spotify.com/track/wu-tang-cream',
    track_name: 'Wu-Tang Clan - C.R.E.A.M.',
    artist: 'Wu-Tang Clan',
    album: 'Enter the Wu-Tang (36 Chambers)',
    duration: '4:12',
    viewer_id: 'viewer123',
    viewer_name: 'TestViewer',
    message: 'Cash Rules Everything Around Me',
    status: 'added',
    created_at: new Date(Date.now() - 1000 * 60 * 30), // Il y a 30 minutes
    moderated_at: new Date(Date.now() - 1000 * 60 * 25), // Il y a 25 minutes
    moderator_id: 'mod123',
    added_at: new Date(Date.now() - 1000 * 60 * 10) // Il y a 10 minutes
  },
  {
    id: 'prop5',
    session_id: 'session1',
    spotify_url: 'https://open.spotify.com/track/outkast-ms-jackson',
    track_name: 'OutKast - Ms. Jackson',
    artist: 'OutKast',
    album: 'Stankonia',
    duration: '4:30',
    viewer_id: 'viewer123',
    viewer_name: 'TestViewer',
    message: 'Un tube intemporel',
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 5), // Il y a 5 minutes
    moderated_at: null,
    moderator_id: null,
    added_at: null
  },
  {
    id: 'prop6',
    session_id: 'session1',
    spotify_url: 'https://open.spotify.com/track/tribe-scenario',
    track_name: 'A Tribe Called Quest - Scenario',
    artist: 'A Tribe Called Quest',
    album: 'The Low End Theory',
    duration: '4:10',
    viewer_id: 'viewer123',
    viewer_name: 'TestViewer',
    message: 'Jazz rap à son meilleur',
    status: 'approved',
    created_at: new Date(Date.now() - 1000 * 60 * 12), // Il y a 12 minutes
    moderated_at: new Date(Date.now() - 1000 * 60 * 3), // Il y a 3 minutes
    moderator_id: 'mod123',
    added_at: null
  }
]

export const fakeSessionStats = {
  'session1': {
    total_propositions: 6,
    pending_propositions: 2,
    approved_propositions: 2,
    rejected_propositions: 1,
    added_propositions: 1,
    active_viewers: 3,
    total_duration: '26:25'
  }
}

// Fonction pour simuler les appels API
export const fakeApiDelay = (min = 200, max = 800) => {
  return new Promise(resolve => {
    setTimeout(resolve, Math.random() * (max - min) + min)
  })
}

// Simulation des réponses API
export const mockApiResponses = {
  // Authentification
  async login(role = 'viewer') {
    await fakeApiDelay()
    return { success: true, user: fakeUsers[role] }
  },

  // Sessions
  async createSession(sessionData) {
    await fakeApiDelay()
    const newSession = {
      id: 'session_' + Math.random().toString(36).substr(2, 9),
      code: sessionData.name.toLowerCase().replace(/\s+/g, ''),
      ...sessionData,
      streamer_id: 'streamer123',
      streamer_name: 'TestStreamer',
      created_at: new Date(),
      active: true
    }
    return { success: true, session: newSession }
  },

  async getSession(sessionCode) {
    await fakeApiDelay()
    const session = fakeSessions[sessionCode]
    if (!session) {
      throw new Error('Session non trouvée')
    }
    return { success: true, session }
  },

  // Propositions
  async getPropositions(sessionId, filter = 'all') {
    await fakeApiDelay()
    let propositions = fakePropositions.filter(p => p.session_id === sessionId)
    
    switch (filter) {
      case 'pending':
        propositions = propositions.filter(p => p.status === 'pending')
        break
      case 'approved':
        propositions = propositions.filter(p => p.status === 'approved' || p.status === 'added')
        break
      case 'history':
        propositions = propositions.filter(p => p.status === 'approved' || p.status === 'rejected')
        break
      case 'my':
        propositions = propositions.filter(p => p.viewer_id === 'viewer123')
        break
    }
    
    return { success: true, propositions }
  },

  async submitProposition(sessionId, propositionData) {
    await fakeApiDelay()
    
    // Simuler différents cas d'erreur parfois
    if (Math.random() < 0.1) { // 10% de chance d'erreur de doublon
      throw new Error('Ce morceau a déjà été proposé dans cette session')
    }
    
    const newProposition = {
      id: 'prop_' + Math.random().toString(36).substr(2, 9),
      session_id: sessionId,
      viewer_id: 'viewer123',
      viewer_name: 'TestViewer',
      status: 'pending',
      created_at: new Date(),
      moderated_at: null,
      moderator_id: null,
      added_at: null,
      ...propositionData
    }
    
    fakePropositions.push(newProposition)
    return { success: true, proposition: newProposition }
  },

  async moderateProposition(sessionId, propositionId, action) {
    await fakeApiDelay()
    
    const proposition = fakePropositions.find(p => p.id === propositionId)
    if (proposition) {
      proposition.status = action // 'approved' ou 'rejected'
      proposition.moderated_at = new Date()
      proposition.moderator_id = 'mod123'
    }
    
    return { success: true }
  },

  async addToPlaylist(sessionId, propositionId, playlistId = null) {
    await fakeApiDelay()
    
    if (!playlistId) {
      throw new Error('Veuillez sélectionner une playlist')
    }
    
    console.log(`🎵 Ajout du morceau ${propositionId} à la playlist ${playlistId}`)
    
    const proposition = fakePropositions.find(p => p.id === propositionId)
    if (proposition) {
      proposition.status = 'added'
      proposition.added_at = new Date()
      proposition.playlist_id = playlistId
    }
    
    return { success: true }
  },

  // Playlists (nouvelles fonctions)
  async getPlaylists() {
    await fakeApiDelay()
    return {
      success: true,
      playlists: [
        {
          id: 'playlist-1',
          name: 'Session Live Stream',
          description: 'Morceaux de ma session en direct',
          streamer_id: 'streamer123',
          tracks_count: 2,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // Il y a 2 jours
          updated_at: new Date(Date.now() - 1000 * 60 * 30) // Il y a 30 minutes
        },
        {
          id: 'playlist-2', 
          name: 'Viewer Favorites',
          description: 'Les coups de cœur des viewers',
          streamer_id: 'streamer123',
          tracks_count: 1,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24), // Il y a 1 jour
          updated_at: new Date(Date.now() - 1000 * 60 * 15) // Il y a 15 minutes
        }
      ]
    }
  },

  async createPlaylist(playlistData) {
    await fakeApiDelay()
    
    // Simuler une erreur de nom dupliqué parfois
    if (Math.random() < 0.15) { // 15% de chance
      throw new Error('Une playlist avec ce nom existe déjà')
    }
    
    const newPlaylist = {
      id: `playlist-${Date.now()}`,
      name: playlistData.name,
      description: playlistData.description || '',
      streamer_id: 'streamer123',
      tracks_count: 0,
      created_at: new Date(),
      updated_at: new Date()
    }
    
    console.log('🎵 Playlist créée:', newPlaylist.name)
    
    return {
      success: true,
      playlist: newPlaylist
    }
  },

  async getSessionStats(sessionId) {
    await fakeApiDelay()
    return { success: true, stats: fakeSessionStats[sessionId] || {} }
  },

  async shuffleQueue(sessionId) {
    await fakeApiDelay()
    return { success: true }
  },

  async updateQueueMode(sessionId, queueMode) {
    await fakeApiDelay()
    const session = Object.values(fakeSessions).find(s => s.id === sessionId)
    if (session) {
      session.queueMode = queueMode
    }
    return { success: true }
  },

  // Playlists Spotify (nouvelles fonctions)
  async getSpotifyPlaylists() {
    await fakeApiDelay()
    return {
      success: true,
      playlists: [
        {
          id: 'spotify-playlist-1',
          name: 'Ma Playlist de Stream',
          description: 'Mes morceaux préférés pour les streams',
          tracks: { total: 25 },
          images: [{ url: 'https://via.placeholder.com/60x60?text=🎵' }],
          owner: { display_name: 'TestStreamer', id: 'test_spotify_user' },
          public: true,
          collaborative: false
        },
        {
          id: 'spotify-playlist-2', 
          name: 'Chill Vibes',
          description: 'Pour les moments détente',
          tracks: { total: 12 },
          images: [{ url: 'https://via.placeholder.com/60x60?text=🎶' }],
          owner: { display_name: 'TestStreamer', id: 'test_spotify_user' },
          public: false,
          collaborative: false
        },
        {
          id: 'spotify-playlist-3',
          name: 'Hip-Hop Classics',
          description: '',
          tracks: { total: 45 },
          images: [{ url: 'https://via.placeholder.com/60x60?text=🎤' }],
          owner: { display_name: 'TestStreamer', id: 'test_spotify_user' },
          public: true,
          collaborative: true
        }
      ],
      user: {
        id: 'test_spotify_user',
        display_name: 'TestStreamer'
      }
    }
  },

  async addToSpotifyPlaylist(playlistId, trackId, spotifyUrl) {
    await fakeApiDelay()
    
    console.log(`🎵 Ajout simulé du morceau ${trackId} à la playlist Spotify ${playlistId}`)
    console.log(`🔗 URL Spotify: ${spotifyUrl}`)
    
    // Simuler différents cas d'erreur parfois
    if (Math.random() < 0.1) { // 10% de chance
      throw new Error('Permissions insuffisantes pour modifier cette playlist')
    }
    
    return {
      success: true,
      message: 'Morceau ajouté à la playlist Spotify avec succès',
      track_uri: `spotify:track:${Math.random().toString(36).substr(2, 9)}`,
      playlist_id: playlistId
    }
  }
} 