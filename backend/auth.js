const express = require('express');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const spotifyApi = require('spotify-web-api-node');
const User = require('./models/User');

require('dotenv').config();

const router = express.Router();

// Middleware session
router.use(session({
  secret: process.env.JWT_SECRET || 'supersecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Session error handling
router.use((req, res, next) => {
  if (!req.session) {
    console.error('Session not available in auth router');
    return res.status(500).json({ error: 'Session not available' });
  }
  next();
});

// Route pour démarrer l'auth Twitch
router.get('/twitch', (req, res) => {
  console.log('Starting Twitch authentication...');
  const state = Math.random().toString(36).substring(7);
  req.session.state = state;
  
  const scopes = 'user:read:email moderation:read';
  const url = `https://id.twitch.tv/oauth2/authorize?client_id=${process.env.TWITCH_CLIENT_ID}&redirect_uri=${process.env.TWITCH_REDIRECT_URI}&response_type=code&scope=${scopes}&state=${state}`;
  
  console.log('Redirecting to:', url);
  console.log('Session state:', req.session.state);
  res.redirect(url);
});

// Callback OAuth Twitch
router.get('/twitch/callback', async (req, res) => {
  console.log('Received Twitch callback');
  console.log('Query params:', req.query);

  const { code, state } = req.query;
  
  // Vérifie le state pour la sécurité
  if (state !== req.session.state) {
    console.error('State mismatch');
    return res.status(400).json({ error: 'Invalid state' });
  }

  try {
    // Échange le code contre un token
    const tokenResponse = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.TWITCH_REDIRECT_URI
      }
    });

    console.log('Token response:', tokenResponse.data);
    const { access_token } = tokenResponse.data;

    // Récupère les infos de l'utilisateur
    const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
      headers: {
        'Client-ID': process.env.TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${access_token}`
      }
    });

    const user = userResponse.data.data[0];
    console.log('User info:', user);

    // Stocker le token Twitch pour les vérifications futures
    twitchUserTokens[user.id] = {
      access_token,
      user_id: user.id,
      display_name: user.display_name
    };

    console.log('🔑 Token Twitch stocké pour:', user.display_name, '(ID:', user.id, ')');
    console.log('🔑 Tokens Twitch actuellement stockés:', Object.keys(twitchUserTokens));
    
    // Test immédiat pour vérifier que le token fonctionne
    try {
      const testUrl = `https://api.twitch.tv/helix/users?id=${user.id}`;
      const testResponse = await axios.get(testUrl, {
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${access_token}`
        }
      });
      console.log('✅ Token testé avec succès:', testResponse.data);
    } catch (testError) {
      console.error('❌ Erreur lors du test du token:', testError.response?.data || testError.message);
    }

    // NOUVELLE LOGIQUE : Tout utilisateur Twitch peut être streamer
    const userData = {
      id: user.id,
      display_name: user.display_name,
      email: user.email,
      role: 'viewer',        // Par défaut viewer
      is_streamer: true,     // TOUS les utilisateurs peuvent créer des sessions
      profile_picture: user.profile_image_url  // Photo de profil Twitch
    };

    // Créer ou mettre à jour l'utilisateur dans la base de données
    const dbUser = await User.createOrUpdate(userData);
    console.log('User saved to database:', dbUser);

    // Génère le JWT avec les infos complètes
    const token = jwt.sign({
      id: user.id,
      display_name: user.display_name,
      email: user.email,
      role: 'viewer',        // Rôle par défaut
      isStreamer: true,      // Tous peuvent créer des sessions
      profile_picture: user.profile_image_url  // Photo de profil Twitch
    }, process.env.JWT_SECRET, { expiresIn: '12h' });

    // Redirige vers le front avec le token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/?token=${token}`);
  } catch (error) {
    console.error('Error in callback:', error.response?.data || error.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// --- Tokens utilisateurs ---
let spotifyUserTokens = {};
let twitchUserTokens = {};

router.get('/spotify', (req, res) => {
  console.log('Starting Spotify authentication...');
  const scopes = [
    'playlist-modify-public',
    'playlist-modify-private',
    'user-read-email',
  ];
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  
  // Vérification des variables d'environnement
  if (!clientId || !redirectUri) {
    console.error('Missing Spotify configuration:', { clientId, redirectUri });
    return res.status(500).json({ error: 'Configuration Spotify manquante' });
  }

  const url = new URL('https://accounts.spotify.com/authorize');
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('client_id', clientId);
  url.searchParams.append('scope', scopes.join(' '));
  url.searchParams.append('redirect_uri', redirectUri);
  url.searchParams.append('show_dialog', 'true'); // Force la page de connexion

  console.log('Redirecting to Spotify auth URL:', url.toString());
  res.redirect(url.toString());
});

router.get('/spotify/callback', async (req, res) => {
  console.log('Received Spotify callback');
  console.log('Query params:', req.query);

  const { code, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  if (error) {
    console.error('Spotify auth error:', error);
    // Rediriger vers le frontend avec un paramètre d'erreur
    return res.redirect(`${frontendUrl}/?spotify_error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    console.error('No code received from Spotify');
    return res.redirect(`${frontendUrl}/?spotify_error=${encodeURIComponent('Code d\'autorisation manquant')}`);
  }

  const api = new spotifyApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI,
  });

  try {
    console.log('Exchanging code for tokens...');
    const data = await api.authorizationCodeGrant(code);
    const access_token = data.body['access_token'];
    const refresh_token = data.body['refresh_token'];
    
    console.log('Tokens received, getting user info...');
    api.setAccessToken(access_token);
    const me = await api.getMe();
    
    // Stocke le token utilisateur en mémoire (clé = id Spotify)
    spotifyUserTokens[me.body.id] = { 
      access_token, 
      refresh_token,
      display_name: me.body.display_name,
      profile_picture: me.body.images && me.body.images.length > 0 ? me.body.images[0].url : null
    };
    console.log('Spotify user authenticated:', {
      id: me.body.id,
      display_name: me.body.display_name,
      profile_picture: me.body.images && me.body.images.length > 0 ? me.body.images[0].url : null,
      tokens: spotifyUserTokens[me.body.id]
    });

    // Rediriger vers le frontend avec un paramètre de succès
    res.redirect(`${frontendUrl}/?spotify_success=true&spotify_user=${encodeURIComponent(me.body.display_name)}`);
  } catch (err) {
    console.error('Erreur OAuth Spotify:', err);
    // Rediriger vers le frontend avec un paramètre d'erreur
    res.redirect(`${frontendUrl}/?spotify_error=${encodeURIComponent(err.message)}`);
  }
});

// Route pour vérifier le statut de l'authentification Spotify
router.get('/spotify/status', (req, res) => {
  const spotifyUserCount = Object.keys(spotifyUserTokens).length;
  const spotifyUsers = Object.keys(spotifyUserTokens).map(id => ({
    id,
    display_name: spotifyUserTokens[id].display_name,
    profile_picture: spotifyUserTokens[id].profile_picture,
    hasToken: !!spotifyUserTokens[id]
  }));
  
  res.json({
    success: true,
    authenticated: spotifyUserCount > 0,
    userCount: spotifyUserCount,
    users: spotifyUsers,
    // Retourner le premier utilisateur comme utilisateur principal
    currentUser: spotifyUsers.length > 0 ? spotifyUsers[0] : null
  });
});

// Route pour déconnexion
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Fonction pour vérifier si un utilisateur est modérateur d'un streamer via l'API Twitch
async function checkTwitchModeratorStatus(userId, streamerId) {
  try {
    // Vérifier si nous avons un token pour le STREAMER (pas l'utilisateur)
    const streamerToken = twitchUserTokens[streamerId];
    if (!streamerToken) {
      console.log('❌ Aucun token Twitch trouvé pour le streamer:', streamerId);
      return false;
    }

    console.log('🔍 Vérification du statut de modérateur via Twitch API...');
    console.log('   - Utilisateur à vérifier:', userId);
    console.log('   - Streamer (broadcaster):', streamerId);
    console.log('   - Token du streamer disponible:', !!streamerToken.access_token);

    // Appel à l'API Twitch pour obtenir les modérateurs du streamer
    // Documentation: https://dev.twitch.tv/docs/api/reference/#get-moderators
    const apiUrl = `https://api.twitch.tv/helix/moderation/moderators?broadcaster_id=${streamerId}`;
    console.log('🔗 URL API Twitch:', apiUrl);
    console.log('🔑 Headers:', {
      'Client-ID': process.env.TWITCH_CLIENT_ID,
      'Authorization': `Bearer ${streamerToken.access_token.substring(0, 10)}...`
    });
    
    const response = await axios.get(apiUrl, {
      headers: {
        'Client-ID': process.env.TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${streamerToken.access_token}`
      }
    });

    console.log('📡 Réponse API Twitch:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });

    const moderators = response.data.data || [];
    console.log('📋 Modérateurs trouvés:', moderators.map(mod => `${mod.user_name} (${mod.user_id})`));
    console.log('📋 Total modérateurs:', moderators.length);
    
    const isModerator = moderators.some(mod => mod.user_id === userId);
    
    console.log(`${isModerator ? '✅' : '❌'} Résultat: ${userId} ${isModerator ? 'EST' : 'N\'EST PAS'} modérateur de ${streamerId}`);
    
    return isModerator;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification du statut de modérateur:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    
    // Diagnostics selon la documentation Twitch
    if (error.response?.status === 401) {
      console.log('🔄 Erreur 401: Token invalide ou expiré');
      console.log('   - Vérifiez que le token du streamer est valide');
      console.log('   - Vérifiez que le scope "moderation:read" est accordé');
    } else if (error.response?.status === 403) {
      console.log('🚫 Erreur 403: Permissions insuffisantes');
      console.log('   - Le streamer doit avoir le scope "moderation:read"');
      console.log('   - Ou le token utilisé ne correspond pas au broadcaster_id');
    } else if (error.response?.status === 400) {
      console.log('❌ Erreur 400: Requête invalide');
      console.log('   - Vérifiez que broadcaster_id est correct');
    }
    
    return false;
  }
}

// Endpoint de debug pour voir les tokens stockés
router.get('/debug/tokens', (req, res) => {
  res.json({
    success: true,
    twitchTokens: Object.keys(twitchUserTokens).map(userId => ({
      userId,
      display_name: twitchUserTokens[userId].display_name,
      hasToken: !!twitchUserTokens[userId].access_token
    })),
    spotifyTokens: Object.keys(spotifyUserTokens).map(userId => ({
      userId,
      display_name: spotifyUserTokens[userId].display_name,
      hasToken: !!spotifyUserTokens[userId].access_token
    }))
  });
});

// Endpoint de debug pour tester la modération
router.get('/debug/moderation/:streamerId/:userId', async (req, res) => {
  try {
    const { streamerId, userId } = req.params;
    
    console.log('🧪 Test de modération demandé:', { streamerId, userId });
    
    const isModerator = await checkTwitchModeratorStatus(userId, streamerId);
    
    res.json({
      success: true,
      isModerator,
      userId,
      streamerId,
      method: 'twitch_api_debug'
    });
  } catch (error) {
    console.error('Erreur debug modération:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint pour tester si la fonction est bien exportée
router.get('/debug/function-test', (req, res) => {
  res.json({
    success: true,
    message: 'La fonction checkTwitchModeratorStatus est bien exportée',
    functionExists: typeof checkTwitchModeratorStatus === 'function'
  });
});

// Endpoint pour tester directement l'API Twitch (raw)
router.get('/debug/twitch-api/:streamerId', async (req, res) => {
  try {
    const { streamerId } = req.params;
    
    console.log('🧪 Test raw API Twitch pour streamer:', streamerId);
    
    const streamerToken = twitchUserTokens[streamerId];
    if (!streamerToken) {
      return res.status(400).json({ 
        error: 'Token non trouvé pour ce streamer',
        availableTokens: Object.keys(twitchUserTokens)
      });
    }
    
    const apiUrl = `https://api.twitch.tv/helix/moderation/moderators?broadcaster_id=${streamerId}`;
    console.log('🔗 Test URL:', apiUrl);
    
    const response = await axios.get(apiUrl, {
      headers: {
        'Client-ID': process.env.TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${streamerToken.access_token}`
      }
    });
    
    res.json({
      success: true,
      status: response.status,
      data: response.data,
      streamerId,
      tokenInfo: {
        hasToken: !!streamerToken.access_token,
        displayName: streamerToken.display_name
      }
    });
  } catch (error) {
    console.error('Erreur test API Twitch:', error);
    res.status(500).json({ 
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
});

// Les exports se font dans l'objet final en bas du fichier

// Middleware pour vérifier le rôle modérateur
function requireModerator(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
  
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'moderator' && payload.role !== 'streamer') {
      return res.status(403).json({ error: 'Forbidden - Moderator access required' });
    }
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Middleware pour vérifier le rôle streamer
function requireStreamer(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
  
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload.isStreamer) {
      return res.status(403).json({ error: 'Forbidden - Streamer access required' });
    }
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Middleware pour vérifier l'authentification
function requireAuth(req, res, next) {
  console.log('🔐 requireAuth - Headers:', req.headers.authorization);
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('❌ requireAuth - No authorization header');
    return res.status(401).json({ error: 'Unauthorized - Token required' });
  }
  
  const token = authHeader.split(' ')[1];
  console.log('🔐 requireAuth - Token:', token);
  console.log('🔐 requireAuth - JWT_SECRET exists:', !!process.env.JWT_SECRET);
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ requireAuth - Token valid, payload:', payload);
    req.user = payload;
    next();
  } catch (err) {
    console.log('❌ requireAuth - Token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = {
  router,
  requireModerator,
  requireStreamer,
  requireAuth,
  checkTwitchModeratorStatus,
  spotifyUserTokens,
  twitchUserTokens
};