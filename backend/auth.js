const express = require('express');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('./models/User');

require('dotenv').config();

const router = express.Router();

// Session configuration is handled globally in server.js
// No need for separate session config here

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
  
  // Générer un state et le signer avec JWT (plus fiable que les sessions)
  const state = Math.random().toString(36).substring(7);
  const stateToken = jwt.sign({ state, timestamp: Date.now() }, process.env.JWT_SECRET, { expiresIn: '10m' });
  
  const scopes = 'user:read:email moderation:read';
  const url = `https://id.twitch.tv/oauth2/authorize?client_id=${process.env.TWITCH_CLIENT_ID}&redirect_uri=${process.env.TWITCH_REDIRECT_URI}&response_type=code&scope=${scopes}&state=${stateToken}`;
  
  console.log('Redirecting to:', url);
  console.log('Generated state token (JWT):', stateToken.substring(0, 20) + '...');
  res.redirect(url);
});

// Callback OAuth Twitch
router.get('/twitch/callback', async (req, res) => {
  console.log('Received Twitch callback');
  console.log('Query params:', req.query);

  const { code, state } = req.query;
  
  // Vérifier le state JWT (plus fiable que les sessions)
  try {
    const decoded = jwt.verify(state, process.env.JWT_SECRET);
    console.log('State JWT verified successfully:', decoded);
    
    // Vérifier que le token n'est pas trop ancien (10 minutes max)
    const tokenAge = Date.now() - decoded.timestamp;
    if (tokenAge > 10 * 60 * 1000) {
      console.error('State token expired');
      return res.status(400).json({ error: 'State token expired' });
    }
  } catch (error) {
    console.error('Invalid state token:', error.message);
    return res.status(400).json({ error: 'Invalid state token' });
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

// --- Variables globales supprimées : plus de tokens partagés ! ---
// Les tokens Spotify sont maintenant stockés en base de données par utilisateur
// Les tokens Twitch sont utilisés uniquement pour les JWT

let twitchUserTokens = {}; // Garde seulement pour la modération Twitch

router.get('/spotify', (req, res) => {
  console.log('🎵 [Backend] === DÉBUT AUTHENTIFICATION SPOTIFY ===');
  console.log('🎵 [Backend] Timestamp:', new Date().toISOString());
  console.log('🎵 [Backend] Méthode:', req.method);
  console.log('🎵 [Backend] URL complète:', req.originalUrl);
  console.log('🎵 [Backend] Base URL:', req.baseUrl);
  console.log('🎵 [Backend] Path:', req.path);
  console.log('🔍 [Backend] Query params reçus:', JSON.stringify(req.query, null, 2));
  console.log('🔍 [Backend] Headers reçus:', JSON.stringify({
    authorization: req.headers.authorization ? `${req.headers.authorization.substring(0, 30)}...` : 'absent',
    'user-agent': req.headers['user-agent'],
    referer: req.headers.referer,
    origin: req.headers.origin
  }, null, 2));
  
  // Récupérer le token Twitch depuis les headers ou query params
  let currentUserId = null;
  let twitchToken = null;
  let userDisplayName = null;
  
  console.log('🔍 [Backend] === ANALYSE TOKEN TWITCH ===');
  
  // Essayer d'abord les headers (pour les appels API)
  const authHeader = req.headers.authorization;
  console.log('🔍 [Backend] Authorization header présent:', !!authHeader);
  
  if (authHeader) {
    console.log('🔍 [Backend] Tentative décodage token depuis headers...');
    try {
      twitchToken = authHeader.split(' ')[1];
      console.log('🔍 [Backend] Token extrait du header:', twitchToken ? `${twitchToken.substring(0, 20)}...` : 'null');
      
      const payload = jwt.verify(twitchToken, process.env.JWT_SECRET);
      currentUserId = payload.id;
      userDisplayName = payload.display_name;
      console.log('✅ [Backend] Token JWT headers décodé avec succès:', {
        userId: currentUserId,
        displayName: userDisplayName,
        role: payload.role,
        isStreamer: payload.isStreamer
      });
    } catch (error) {
      console.log('⚠️ [Backend] Erreur décodage token JWT headers:', error.message);
    }
  } else {
    console.log('🔍 [Backend] Aucun authorization header trouvé');
  }
  
  // Si pas de token dans headers, essayer query params (pour les redirections)
  if (!currentUserId && req.query.token) {
    console.log('🔍 [Backend] Tentative décodage token depuis query params...');
    console.log('🔍 [Backend] Token query param présent:', !!req.query.token);
    console.log('🔍 [Backend] Token query param (tronqué):', req.query.token ? `${req.query.token.substring(0, 20)}...` : 'null');
    
    try {
      twitchToken = req.query.token;
      const payload = jwt.verify(twitchToken, process.env.JWT_SECRET);
      currentUserId = payload.id;
      userDisplayName = payload.display_name;
      console.log('✅ [Backend] Token JWT query params décodé avec succès:', {
        userId: currentUserId,
        displayName: userDisplayName,
        role: payload.role,
        isStreamer: payload.isStreamer
      });
    } catch (error) {
      console.log('⚠️ [Backend] Erreur décodage token JWT query params:', error.message);
      console.log('⚠️ [Backend] Détails erreur:', {
        name: error.name,
        message: error.message,
        expiredAt: error.expiredAt
      });
    }
  } else if (!currentUserId) {
    console.log('🔍 [Backend] Aucun token en query params non plus');
  }
  
  if (!currentUserId) {
    console.log('⚠️ [Backend] === AUCUN TOKEN TWITCH VALIDE TROUVÉ ===');
    console.log('⚠️ [Backend] La connexion Spotify se fera sans liaison Twitch');
  } else {
    console.log('✅ [Backend] === TOKEN TWITCH VALIDÉ ===');
    console.log('✅ [Backend] Utilisateur Twitch identifié:', {
      id: currentUserId,
      name: userDisplayName
    });
  }
  
  console.log('🔍 [Backend] === GÉNÉRATION STATE JWT ===');
  // Stocker l'ID utilisateur dans un state JWT pour le callback
  const stateData = { 
    userId: currentUserId,
    userName: userDisplayName,
    twitchToken: twitchToken, // Stocker aussi le token pour le callback
    timestamp: Date.now() 
  };
  console.log('🔍 [Backend] Données à stocker dans state:', {
    userId: stateData.userId,
    userName: stateData.userName,
    hasToken: !!stateData.twitchToken,
    timestamp: new Date(stateData.timestamp).toISOString()
  });
  
  const state = jwt.sign(stateData, process.env.JWT_SECRET, { expiresIn: '10m' });
  console.log('✅ [Backend] State JWT généré:', `${state.substring(0, 30)}...`);
  
  console.log('🔍 [Backend] === VÉRIFICATION CONFIGURATION SPOTIFY ===');
  const scopes = [
    'playlist-modify-public',
    'playlist-modify-private',
    'user-read-email',
  ];
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  
  console.log('🔍 [Backend] Configuration Spotify:', {
    clientId: clientId ? `${clientId.substring(0, 10)}...` : 'MANQUANT',
    redirectUri: redirectUri || 'MANQUANT',
    scopes: scopes,
    hasClientSecret: !!process.env.SPOTIFY_CLIENT_SECRET
  });
  
  // Vérification des variables d'environnement
  if (!clientId || !redirectUri) {
    console.error('❌ [Backend] === CONFIGURATION SPOTIFY MANQUANTE ===');
    console.error('❌ [Backend] clientId présent:', !!clientId);
    console.error('❌ [Backend] redirectUri présent:', !!redirectUri);
    console.error('❌ [Backend] Variables d\'environnement manquantes');
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const errorUrl = `${frontendUrl}/?spotify_error=${encodeURIComponent('Configuration Spotify manquante')}`;
    console.error('❌ [Backend] Redirection vers erreur:', errorUrl);
    return res.redirect(errorUrl);
  }

  console.log('🔍 [Backend] === CONSTRUCTION URL SPOTIFY ===');
  const url = new URL('https://accounts.spotify.com/authorize');
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('client_id', clientId);
  url.searchParams.append('scope', scopes.join(' '));
  url.searchParams.append('redirect_uri', redirectUri);
  url.searchParams.append('state', state);
  url.searchParams.append('show_dialog', 'true'); // Force la page de connexion

  console.log('✅ [Backend] URL Spotify construite:', url.toString());
  console.log('✅ [Backend] Paramètres de l\'URL:', {
    response_type: url.searchParams.get('response_type'),
    client_id: url.searchParams.get('client_id'),
    scope: url.searchParams.get('scope'),
    redirect_uri: url.searchParams.get('redirect_uri'),
    state: url.searchParams.get('state') ? `${url.searchParams.get('state').substring(0, 30)}...` : 'null',
    show_dialog: url.searchParams.get('show_dialog')
  });

  console.log('🔄 [Backend] === REDIRECTION VERS SPOTIFY ===');
  console.log('🔄 [Backend] Timestamp redirection:', new Date().toISOString());
  res.redirect(url.toString());
});

// Fonction utilitaire pour convertir n'importe quelle erreur en string lisible
function safeErrorToString(error, defaultMessage = 'Erreur inconnue') {
  console.log('🔧 [Backend] === CONVERSION ERREUR SÉCURISÉE ===');
  console.log('🔧 [Backend] Type erreur reçu:', typeof error);
  console.log('🔧 [Backend] Erreur brute:', error);
  console.log('🔧 [Backend] Constructor name:', error?.constructor?.name);
  console.log('🔧 [Backend] Message brut:', error?.message);
  
  // Si c'est déjà une string, la retourner SAUF si c'est "[object Object]"
  if (typeof error === 'string' && error.trim().length > 0) {
    if (error === '[object Object]') {
      console.log('⚠️ [Backend] Erreur string "[object Object]" détectée, conversion nécessaire');
      return 'Erreur d\'authentification Spotify';
    }
    console.log('✅ [Backend] Erreur déjà string valide:', error);
    return error;
  }
  
  // Si c'est un objet avec message
  if (error && typeof error === 'object') {
    console.log('🔍 [Backend] Analyse objet erreur...');
    
    // Gestion spéciale pour WebapiError de spotify-web-api-node (avec plusieurs checks)
    const isWebapiError = (
      (error.constructor && error.constructor.name === 'WebapiError') ||
      error.statusCode !== undefined ||
      (error.body !== undefined && error.headers !== undefined) ||
      (error.message && error.message.includes && error.message.includes('WebapiError'))
    );
    
    if (isWebapiError) {
      console.log('🎵 [Backend] WebapiError détectée de Spotify (via multiple checks)');
      console.log('🎵 [Backend] StatusCode:', error.statusCode);
      console.log('🎵 [Backend] Body empty:', !error.body || Object.keys(error.body).length === 0);
      
      // Gestion spécifique pour les erreurs 403 Spotify
      if (error.statusCode === 403) {
        console.log('🚫 [Backend] Erreur 403 Spotify détectée');
        
        // Si le body est vide, c'est probablement un problème de permissions
        if (!error.body || Object.keys(error.body).length === 0) {
          console.log('✅ [Backend] Erreur 403 avec body vide → permissions Spotify');
          return 'Accès refusé par Spotify - Vérifiez vos permissions ou réessayez plus tard';
        }
      }
      
      // Gestion spécifique pour les erreurs 400/401
      if (error.statusCode === 400) {
        return 'Requête Spotify invalide - Vérifiez la configuration';
      }
      if (error.statusCode === 401) {
        return 'Token Spotify invalide ou expiré';
      }
      if (error.statusCode === 429) {
        return 'Trop de requêtes Spotify - Veuillez réessayer plus tard';
      }
      if (error.statusCode === 500) {
        return 'Erreur serveur Spotify - Réessayez plus tard';
      }
      
      // Essayer d'extraire les données de l'erreur Spotify
      if (error.body && typeof error.body === 'object') {
        console.log('🔍 [Backend] Body WebapiError:', error.body);
        
        // Si le body a une propriété error avec description
        if (error.body.error) {
          if (error.body.error.message && error.body.error.message !== '[object Object]') {
            console.log('✅ [Backend] Message extrait du body.error:', error.body.error.message);
            return error.body.error.message;
          }
          if (error.body.error_description && error.body.error_description !== '[object Object]') {
            console.log('✅ [Backend] Description extraite du body:', error.body.error_description);
            return error.body.error_description;
          }
          if (typeof error.body.error === 'string' && error.body.error !== '[object Object]') {
            console.log('✅ [Backend] Error string extrait du body:', error.body.error);
            return error.body.error;
          }
        }
        
        // Essayer error_description directement dans body
        if (error.body.error_description && error.body.error_description !== '[object Object]') {
          console.log('✅ [Backend] Error_description direct du body:', error.body.error_description);
          return error.body.error_description;
        }
      }
      
      // Essayer le statusCode pour les erreurs HTTP
      if (error.statusCode) {
        const httpMessage = `Erreur Spotify HTTP ${error.statusCode}`;
        console.log('✅ [Backend] Code statut WebapiError:', httpMessage);
        return httpMessage;
      }
      
      // Fallback pour WebapiError
      console.log('⚠️ [Backend] WebapiError sans détails exploitables');
      return 'Erreur de communication avec Spotify';
    }
    
    // Essayer error.message (cas général) - avec filtrage [object Object]
    if (error.message && typeof error.message === 'string') {
      // Éviter les messages "[object Object]"
      if (error.message !== '[object Object]') {
        console.log('✅ [Backend] Message extrait:', error.message);
        return error.message;
      } else {
        console.log('⚠️ [Backend] Message est [object Object], continuons...');
      }
    }
    
    // Essayer error.error (pour les erreurs Spotify)
    if (error.error && typeof error.error === 'string' && error.error !== '[object Object]') {
      console.log('✅ [Backend] Error.error extrait:', error.error);
      return error.error;
    }
    
    // Essayer error.error_description (pour OAuth)
    if (error.error_description && typeof error.error_description === 'string' && error.error_description !== '[object Object]') {
      console.log('✅ [Backend] Error_description extrait:', error.error_description);
      return error.error_description;
    }
    
    // Essayer les propriétés de réponse HTTP
    if (error.response && error.response.body) {
      console.log('🔍 [Backend] Analyse response.body...');
      
      if (error.response.body.error_description && error.response.body.error_description !== '[object Object]') {
        console.log('✅ [Backend] Error_description de response.body:', error.response.body.error_description);
        return error.response.body.error_description;
      }
      
      if (error.response.body.error && typeof error.response.body.error === 'string' && error.response.body.error !== '[object Object]') {
        console.log('✅ [Backend] Error de response.body:', error.response.body.error);
        return error.response.body.error;
      }
    }
    
    // Si l'objet a une méthode toString personnalisée
    if (error.toString && typeof error.toString === 'function') {
      const toStringResult = error.toString();
      if (toStringResult !== '[object Object]' && toStringResult !== 'Error' && toStringResult !== 'WebapiError: [object Object]') {
        console.log('✅ [Backend] ToString utilisé:', toStringResult);
        return toStringResult;
      }
    }
    
    // Essayer JSON.stringify comme dernier recours pour les objets simples
    try {
      const jsonString = JSON.stringify(error);
      if (jsonString && jsonString !== '{}' && jsonString !== 'null' && !jsonString.includes('[object Object]')) {
        console.log('✅ [Backend] JSON stringify utilisé:', jsonString);
        return `Erreur: ${jsonString}`;
      }
    } catch (jsonError) {
      console.log('⚠️ [Backend] Impossible de stringify l\'erreur');
    }
  }
  
  // Fallback absolu
  console.log('🔧 [Backend] Utilisation message par défaut:', defaultMessage);
  return defaultMessage;
}

router.get('/spotify/callback', async (req, res) => {
  console.log('🔄 [Backend] === DÉBUT CALLBACK SPOTIFY ===');
  console.log('🔄 [Backend] Timestamp:', new Date().toISOString());
  console.log('🔄 [Backend] Méthode:', req.method);
  console.log('🔄 [Backend] URL complète:', req.originalUrl);
  console.log('📥 [Backend] Query params reçus:', JSON.stringify(req.query, null, 2));
  console.log('📥 [Backend] Headers callback:', JSON.stringify({
    'user-agent': req.headers['user-agent'],
    referer: req.headers.referer,
    origin: req.headers.origin
  }, null, 2));

  const { code, error, state } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  console.log('🔍 [Backend] === ANALYSE PARAMÈTRES CALLBACK ===');
  console.log('🔍 [Backend] Code présent:', !!code);
  console.log('🔍 [Backend] Code (tronqué):', code ? `${code.substring(0, 30)}...` : 'absent');
  console.log('🔍 [Backend] Error présent:', !!error);
  console.log('🔍 [Backend] Error valeur:', error);
  console.log('🔍 [Backend] Error type:', typeof error);
  console.log('🔍 [Backend] State présent:', !!state);
  console.log('🔍 [Backend] State (tronqué):', state ? `${state.substring(0, 30)}...` : 'absent');
  console.log('🔍 [Backend] Frontend URL:', frontendUrl);
  
  if (error) {
    console.error('❌ [Backend] === ERREUR SPOTIFY OAUTH ===');
    console.error('❌ [Backend] Erreur Spotify brute:', error);
    console.error('❌ [Backend] Type erreur:', typeof error);
    console.error('❌ [Backend] Erreur stringifiée:', JSON.stringify(error));
    
    // Utiliser la fonction de conversion sécurisée
    const errorMessage = safeErrorToString(error, 'Erreur d\'authentification Spotify');
    console.log('✅ [Backend] Message d\'erreur converti final:', errorMessage);
    console.log('✅ [Backend] Type du message final:', typeof errorMessage);
    
    const errorUrl = `${frontendUrl}/?spotify_error=${encodeURIComponent(errorMessage)}`;
    console.error('❌ [Backend] Redirection vers erreur:', errorUrl);
    return res.redirect(errorUrl);
  }

  if (!code) {
    console.error('❌ [Backend] === CODE AUTORISATION MANQUANT ===');
    console.error('❌ [Backend] Aucun code reçu de Spotify');
    const errorUrl = `${frontendUrl}/?spotify_error=${encodeURIComponent('Code d\'autorisation manquant')}`;
    console.error('❌ [Backend] Redirection vers erreur:', errorUrl);
    return res.redirect(errorUrl);
  }

  console.log('🔍 [Backend] === DÉCODAGE STATE JWT ===');
  // Décoder le state pour récupérer l'utilisateur Twitch
  let twitchUserId = null;
  let twitchUserName = null;
  let originalTwitchToken = null;
  
  if (state) {
    console.log('🔍 [Backend] State présent, tentative de décodage...');
    try {
      const decoded = jwt.verify(state, process.env.JWT_SECRET);
      twitchUserId = decoded.userId;
      twitchUserName = decoded.userName;
      originalTwitchToken = decoded.twitchToken;
      
      console.log('✅ [Backend] State JWT décodé avec succès:', {
        userId: twitchUserId,
        userName: twitchUserName,
        hasOriginalToken: !!originalTwitchToken,
        timestamp: new Date(decoded.timestamp).toISOString()
      });
    } catch (error) {
      console.log('⚠️ [Backend] Erreur décodage state JWT:', error.message);
      console.log('⚠️ [Backend] Détails erreur state:', {
        name: error.name,
        message: error.message,
        expiredAt: error.expiredAt
      });
    }
  } else {
    console.log('⚠️ [Backend] Aucun state fourni');
  }

  if (!twitchUserId) {
    console.log('⚠️ [Backend] === CONNEXION SPOTIFY SANS LIEN TWITCH ===');
  } else {
    console.log('✅ [Backend] === UTILISATEUR TWITCH IDENTIFIÉ ===');
    console.log('✅ [Backend] Lien avec compte Twitch:', {
      id: twitchUserId,
      name: twitchUserName
    });
  }

  console.log('🔍 [Backend] === VÉRIFICATION CONFIGURATION SPOTIFY ===');
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  
  console.log('🔍 [Backend] Configuration Spotify:', {
    clientId: clientId ? `${clientId.substring(0, 10)}...` : 'MANQUANT',
    hasClientSecret: !!clientSecret,
    redirectUri: redirectUri
  });

  if (!clientId || !clientSecret || !redirectUri) {
    console.error('❌ [Backend] Configuration Spotify incomplète');
    const errorUrl = `${frontendUrl}/?spotify_error=${encodeURIComponent('Configuration Spotify manquante')}`;
    return res.redirect(errorUrl);
  }

  try {
    console.log('🔄 [Backend] === ÉCHANGE CODE CONTRE TOKENS (AXIOS) ===');
    console.log('🔄 [Backend] Méthode: Axios directement comme Twitch');
    
    // ÉCHANGE DE TOKENS - MÉTHODE AXIOS (comme Twitch)
    const tokenResponse = await axios.post('https://accounts.spotify.com/api/token', null, {
      params: {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('✅ [Backend] Réponse tokens Spotify (axios):', {
      status: tokenResponse.status,
      statusText: tokenResponse.statusText,
      hasData: !!tokenResponse.data
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    
    console.log('✅ [Backend] Tokens reçus de Spotify:', {
      hasAccessToken: !!access_token,
      accessTokenLength: access_token ? access_token.length : 0,
      hasRefreshToken: !!refresh_token,
      refreshTokenLength: refresh_token ? refresh_token.length : 0,
      expiresIn: expires_in,
      expiresAt: new Date(Date.now() + expires_in * 1000).toISOString()
    });
    
    console.log('🔑 [Backend] === RÉCUPÉRATION PROFIL SPOTIFY (AXIOS) ===');
    console.log('🔑 [Backend] Méthode: Axios directement comme Twitch');
    
    // RÉCUPÉRATION PROFIL - MÉTHODE AXIOS (comme Twitch)
    const userResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    console.log('✅ [Backend] Réponse profil Spotify (axios):', {
      status: userResponse.status,
      statusText: userResponse.statusText,
      hasData: !!userResponse.data
    });

    const me = userResponse.data;
    console.log('✅ [Backend] Profil Spotify récupéré:', {
      id: me.id,
      display_name: me.display_name,
      email: me.email,
      country: me.country,
      hasImages: me.images && me.images.length > 0,
      imageUrl: me.images && me.images.length > 0 ? me.images[0].url : null,
      followers: me.followers ? me.followers.total : 0,
      product: me.product
    });
    
    const spotifyData = {
      spotify_id: me.id,
      spotify_access_token: access_token,
      spotify_refresh_token: refresh_token,
      expires_in: expires_in,
      display_name: me.display_name,
      profile_picture: me.images && me.images.length > 0 ? me.images[0].url : null
    };
    
    console.log('💾 [Backend] === DONNÉES SPOTIFY À STOCKER ===');
    console.log('💾 [Backend] Données Spotify formatées:', {
      spotify_id: spotifyData.spotify_id,
      display_name: spotifyData.display_name,
      hasAccessToken: !!spotifyData.spotify_access_token,
      hasRefreshToken: !!spotifyData.spotify_refresh_token,
      expires_in: spotifyData.expires_in,
      hasProfilePicture: !!spotifyData.profile_picture
    });

    // Si l'utilisateur est connecté via Twitch, lier les tokens Spotify à son compte
    if (twitchUserId) {
      console.log('🔗 [Backend] === LIAISON AVEC COMPTE TWITCH ===');
      console.log('🔗 [Backend] Tentative de liaison avec Twitch ID:', twitchUserId);
      
      try {
        await User.updateSpotifyTokens(twitchUserId, spotifyData);
        console.log('✅ [Backend] Tokens Spotify liés au compte Twitch avec succès');
        console.log('✅ [Backend] Utilisateur:', twitchUserName, '(ID:', twitchUserId, ')');
        
        // Rediriger avec succès et nom d'utilisateur
        const successUrl = `${frontendUrl}/?spotify_success=true&spotify_user=${encodeURIComponent(me.display_name)}&linked_to_twitch=true`;
        console.log('✅ [Backend] === SUCCÈS AVEC LIAISON TWITCH ===');
        console.log('✅ [Backend] Redirection vers:', successUrl);
        return res.redirect(successUrl);
      } catch (dbError) {
        console.error('❌ [Backend] === ERREUR LIAISON BASE DE DONNÉES ===');
        console.error('❌ [Backend] Erreur lors de la liaison avec Twitch:', dbError);
        console.error('❌ [Backend] Type erreur DB:', typeof dbError);
        console.error('❌ [Backend] Message erreur DB:', dbError.message);
        console.error('❌ [Backend] Stack erreur DB:', dbError.stack);
        
        // Continuer sans lier - l'utilisateur pourra réessayer
        console.log('⚠️ [Backend] Continuation sans lier, connexion Spotify simple');
      }
    }

    // Si pas de compte Twitch ou erreur de liaison, succès simple
    console.log('✅ [Backend] === SUCCÈS SPOTIFY SIMPLE ===');
    console.log('✅ [Backend] Utilisateur Spotify authentifié sans lien Twitch:', me.display_name);
    
    const simpleSuccessUrl = `${frontendUrl}/?spotify_success=true&spotify_user=${encodeURIComponent(me.display_name)}&linked_to_twitch=false`;
    console.log('✅ [Backend] Redirection vers:', simpleSuccessUrl);
    res.redirect(simpleSuccessUrl);
    
  } catch (err) {
    console.error('❌ [Backend] === ERREUR OAUTH SPOTIFY (AXIOS) ===');
    console.error('❌ [Backend] Type erreur:', typeof err);
    console.error('❌ [Backend] Erreur complète:', err);
    console.error('❌ [Backend] Message erreur:', err.message);
    console.error('❌ [Backend] Stack erreur:', err.stack);
    
    // Gestion d'erreur pour axios (comme Twitch)
    if (err.response) {
      console.error('❌ [Backend] Réponse HTTP erreur:', {
        status: err.response.status,
        statusText: err.response.statusText,
        data: err.response.data,
        headers: err.response.headers
      });
      
      // Gérer les codes d'erreur HTTP spécifiques
      let errorMessage = 'Erreur lors de l\'authentification Spotify';
      
      if (err.response.status === 400) {
        errorMessage = 'Requête Spotify invalide - Code d\'autorisation incorrect';
      } else if (err.response.status === 401) {
        errorMessage = 'Identifiants Spotify invalides';
      } else if (err.response.status === 403) {
        errorMessage = 'Accès refusé par Spotify - Vérifiez vos permissions';
      } else if (err.response.status === 429) {
        errorMessage = 'Trop de requêtes Spotify - Réessayez plus tard';
      } else if (err.response.status === 500) {
        errorMessage = 'Erreur serveur Spotify - Réessayez plus tard';
      } else {
        errorMessage = `Erreur Spotify HTTP ${err.response.status}`;
      }
      
      // Essayer d'extraire plus de détails de la réponse
      if (err.response.data && typeof err.response.data === 'object') {
        if (err.response.data.error_description) {
          errorMessage = err.response.data.error_description;
        } else if (err.response.data.error && typeof err.response.data.error === 'string') {
          errorMessage = err.response.data.error;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      }
      
      console.log('📝 [Backend] Message d\'erreur HTTP final:', errorMessage);
      
      const finalErrorUrl = `${frontendUrl}/?spotify_error=${encodeURIComponent(errorMessage)}`;
      console.error('❌ [Backend] === REDIRECTION ERREUR FINALE ===');
      console.error('❌ [Backend] URL erreur finale:', finalErrorUrl);
      return res.redirect(finalErrorUrl);
    }
    
    // Autres types d'erreurs (réseau, etc.)
    const errorMessage = err.message || 'Erreur de connexion à Spotify';
    console.log('📝 [Backend] Message d\'erreur général final:', errorMessage);
    
    const finalErrorUrl = `${frontendUrl}/?spotify_error=${encodeURIComponent(errorMessage)}`;
    console.error('❌ [Backend] === REDIRECTION ERREUR FINALE ===');
    console.error('❌ [Backend] URL erreur finale:', finalErrorUrl);
    res.redirect(finalErrorUrl);
  }
});

// Route pour vérifier le statut de l'authentification Spotify
router.get('/spotify/status', async (req, res) => {
  console.log('🔍 [Backend] === VÉRIFICATION STATUT SPOTIFY ===');
  console.log('🔍 [Backend] Timestamp:', new Date().toISOString());
  console.log('🔍 [Backend] Headers status:', JSON.stringify({
    authorization: req.headers.authorization ? `${req.headers.authorization.substring(0, 30)}...` : 'absent',
    'user-agent': req.headers['user-agent']
  }, null, 2));
  
  try {
    // Récupérer l'utilisateur depuis le JWT
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('⚠️ [Backend] Aucun token d\'authentification fourni');
      return res.json({
        success: true,
        authenticated: false,
        currentUser: null,
        message: 'Aucun token d\'authentification fourni'
      });
    }

    console.log('🔍 [Backend] Décodage token JWT pour statut...');
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = payload.id;

    console.log('✅ [Backend] Token JWT décodé:', {
      userId: userId,
      displayName: payload.display_name,
      role: payload.role
    });
    console.log('🔍 [Backend] Recherche tokens Spotify pour utilisateur:', userId);

    // Récupérer les tokens Spotify de cet utilisateur depuis la DB
    const spotifyTokens = await User.getSpotifyTokens(userId);
    
    if (!spotifyTokens) {
      console.log('❌ [Backend] Aucun token Spotify trouvé pour cet utilisateur');
      return res.json({
        success: true,
        authenticated: false,
        currentUser: null,
        message: 'Utilisateur non connecté à Spotify'
      });
    }

    console.log('✅ [Backend] Tokens Spotify trouvés:', {
      spotify_id: spotifyTokens.spotify_id,
      display_name: spotifyTokens.display_name,
      hasAccessToken: !!spotifyTokens.spotify_access_token,
      hasRefreshToken: !!spotifyTokens.spotify_refresh_token,
      expired: spotifyTokens.is_expired,
      expiresAt: spotifyTokens.expires_at ? new Date(spotifyTokens.expires_at).toISOString() : 'inconnu'
    });

    const responseData = {
      success: true,
      authenticated: !spotifyTokens.is_expired,
      currentUser: {
        id: spotifyTokens.spotify_id,
        display_name: spotifyTokens.display_name,
        profile_picture: spotifyTokens.profile_picture,
        hasToken: true,
        is_expired: spotifyTokens.is_expired
      },
      userCount: 1, // Toujours 1 car c'est lié à l'utilisateur actuel
      linked_to_twitch: true
    };

    console.log('✅ [Backend] Réponse statut Spotify:', {
      authenticated: responseData.authenticated,
      user: responseData.currentUser.display_name,
      expired: responseData.currentUser.is_expired
    });
    
    res.json(responseData);

  } catch (error) {
    console.error('❌ [Backend] === ERREUR VÉRIFICATION STATUT SPOTIFY ===');
    console.error('❌ [Backend] Erreur complète:', error);
    console.error('❌ [Backend] Message:', error.message);
    console.error('❌ [Backend] Stack:', error.stack);
    
    res.json({
      success: true,
      authenticated: false,
      currentUser: null,
      error: 'Erreur lors de la vérification'
    });
  }
});

// Route pour déconnexion générale
router.post('/logout', (req, res) => {
  console.log('🚪 [Backend] === DÉCONNEXION GÉNÉRALE ===');
  console.log('🚪 [Backend] Timestamp:', new Date().toISOString());
  
  req.session.destroy((err) => {
    if (err) {
      console.error('❌ [Backend] Erreur destruction session:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    console.log('✅ [Backend] Session détruite avec succès');
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Route pour déconnexion Spotify uniquement
router.post('/spotify/logout', async (req, res) => {
  console.log('🎵 [Backend] === DÉCONNEXION SPOTIFY ===');
  console.log('🎵 [Backend] Timestamp:', new Date().toISOString());
  console.log('🎵 [Backend] Headers logout:', JSON.stringify({
    authorization: req.headers.authorization ? `${req.headers.authorization.substring(0, 30)}...` : 'absent',
    'user-agent': req.headers['user-agent']
  }, null, 2));
  
  try {
    // Récupérer l'utilisateur depuis le JWT
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.error('❌ [Backend] Token d\'authentification requis pour déconnexion');
      return res.status(401).json({
        success: false,
        error: 'Token d\'authentification requis'
      });
    }

    console.log('🔍 [Backend] Décodage token JWT pour déconnexion...');
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = payload.id;

    console.log('✅ [Backend] Token JWT décodé pour déconnexion:', {
      userId: userId,
      displayName: payload.display_name
    });
    console.log('🗑️ [Backend] Suppression tokens Spotify pour utilisateur:', userId);

    // Supprimer les tokens Spotify de cet utilisateur
    await User.clearSpotifyTokens(userId);
    
    console.log('✅ [Backend] Tokens Spotify supprimés avec succès pour:', payload.display_name);
    res.json({ 
      success: true, 
      message: 'Déconnecté de Spotify avec succès',
      authenticated: false 
    });
  } catch (error) {
    console.error('❌ [Backend] === ERREUR DÉCONNEXION SPOTIFY ===');
    console.error('❌ [Backend] Erreur complète:', error);
    console.error('❌ [Backend] Message:', error.message);
    console.error('❌ [Backend] Stack:', error.stack);
    
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la déconnexion Spotify' 
    });
  }
});

// Fonction pour vérifier si un utilisateur est modérateur d'un streamer via l'API Twitch
async function checkTwitchModeratorStatus(userId, streamerId) {
  try {
    // Vérifier si nous avons un token pour le STREAMER (pas l'utilisateur)
    const streamerToken = twitchUserTokens[streamerId];
    if (!streamerToken) {
      console.log('❌ Aucun token Twitch trouvé pour le streamer:', streamerId);
      console.log('🔍 Tokens disponibles:', Object.keys(twitchUserTokens).map(id => ({
        id,
        display_name: twitchUserTokens[id]?.display_name
      })));
      console.log('⚠️ Le streamer doit se connecter à l\'application pour que les modérateurs soient détectés');
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
    const isModerator = moderators.some(mod => 
      mod.user_id === userId || mod.user_id === String(userId) || String(mod.user_id) === String(userId)
    );
    
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

// Endpoint de debug pour voir les tokens stockés (mise à jour pour multi-users)
router.get('/debug/tokens', async (req, res) => {
  try {
    // Récupérer l'utilisateur depuis le JWT si disponible
    let currentUser = null;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        currentUser = payload;
      } catch (error) {
        // Token invalide, ignorer
      }
    }

    // Statistiques générales des tokens Twitch
    const twitchTokensCount = Object.keys(twitchUserTokens).length;
    const twitchUsers = Object.keys(twitchUserTokens).map(userId => ({
      userId,
      display_name: twitchUserTokens[userId].display_name,
      hasToken: !!twitchUserTokens[userId].access_token
    }));

    // Statistiques des tokens Spotify (depuis la DB)
    let spotifyStats = null;
    if (currentUser) {
      const spotifyTokens = await User.getSpotifyTokens(currentUser.id);
      spotifyStats = {
        connected: !!spotifyTokens,
        expired: spotifyTokens?.is_expired || false,
        display_name: spotifyTokens?.display_name || null
      };
    }

    res.json({
      success: true,
      currentUser: currentUser ? {
        id: currentUser.id,
        display_name: currentUser.display_name,
        spotify: spotifyStats
      } : null,
      stats: {
        twitchTokens: twitchTokensCount,
        architecture: 'multi-users',
        spotify_storage: 'database'
      },
      twitchUsers: twitchUsers
    });
  } catch (error) {
    console.error('❌ Erreur debug tokens:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des informations de debug'
    });
  }
});

// Endpoint de debug pour tester la modération
router.get('/debug/moderation/:streamerId/:userId', async (req, res) => {
  try {
    const { streamerId, userId } = req.params;
    
    console.log('🧪 Test de modération demandé:', { streamerId, userId });
    
    // Vérifier si nous avons le token du streamer
    const hasStreamerToken = !!twitchUserTokens[streamerId];
    const availableTokens = Object.keys(twitchUserTokens);
    
    console.log('🔍 Debug tokens:', {
      streamerId,
      hasStreamerToken,
      availableTokens: availableTokens.map(id => ({
        id,
        display_name: twitchUserTokens[id]?.display_name
      }))
    });
    
    const isModerator = await checkTwitchModeratorStatus(userId, streamerId);
    
    res.json({
      success: true,
      isModerator,
      userId,
      streamerId,
      hasStreamerToken,
      availableTokens,
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

// ===== ENDPOINT DEBUG SPOTIFY =====
router.get('/debug/spotify', (req, res) => {
  console.log('🔧 [Backend] === DEBUG SPOTIFY ===');
  
  const config = {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI,
    frontendUrl: process.env.FRONTEND_URL
  };
  
  const configStatus = {
    hasClientId: !!config.clientId,
    hasClientSecret: !!config.clientSecret,
    hasRedirectUri: !!config.redirectUri,
    hasFrontendUrl: !!config.frontendUrl,
    clientIdLength: config.clientId ? config.clientId.length : 0,
    redirectUriValid: config.redirectUri ? config.redirectUri.includes('callback') : false
  };
  
  console.log('🔧 [Backend] Configuration Spotify:', {
    ...configStatus,
    clientIdPreview: config.clientId ? `${config.clientId.substring(0, 10)}...` : 'MANQUANT',
    redirectUri: config.redirectUri,
    frontendUrl: config.frontendUrl
  });
  
  // Test de l'API Spotify avec axios (plus de spotify-web-api-node)
  let spotifyApiStatus = 'axios prêt (plus de dépendance spotify-web-api-node)';
  
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    ...configStatus,
    spotifyApiStatus,
    method: 'axios_direct_like_twitch',
    urls: {
      authUrl: config.clientId ? `https://accounts.spotify.com/authorize?client_id=${config.clientId}` : 'impossible - pas de client_id',
      tokenUrl: 'https://accounts.spotify.com/api/token',
      userUrl: 'https://api.spotify.com/v1/me',
      callbackUrl: config.redirectUri || 'non configuré',
      frontendUrl: config.frontendUrl || 'non configuré'
    },
    recommendations: []
  };
  
  // Recommandations
  if (!config.clientId) {
    debugInfo.recommendations.push('Ajouter SPOTIFY_CLIENT_ID dans .env');
  }
  if (!config.clientSecret) {
    debugInfo.recommendations.push('Ajouter SPOTIFY_CLIENT_SECRET dans .env');
  }
  if (!config.redirectUri) {
    debugInfo.recommendations.push('Ajouter SPOTIFY_REDIRECT_URI dans .env');
  }
  if (!config.frontendUrl) {
    debugInfo.recommendations.push('Ajouter FRONTEND_URL dans .env');
  }
  if (config.redirectUri && !config.redirectUri.includes('callback')) {
    debugInfo.recommendations.push('SPOTIFY_REDIRECT_URI doit finir par /callback');
  }
  
  res.json({
    success: true,
    debug: debugInfo
  });
});

// ===== ENDPOINT TEST TOKEN =====
router.get('/debug/test-token', (req, res) => {
  console.log('🔧 [Backend] === TEST TOKEN ===');
  
  const authHeader = req.headers.authorization;
  const tokenFromQuery = req.query.token;
  
  const testResults = {
    timestamp: new Date().toISOString(),
    headers: {
      hasAuthHeader: !!authHeader,
      authHeaderPreview: authHeader ? `${authHeader.substring(0, 20)}...` : null
    },
    query: {
      hasTokenParam: !!tokenFromQuery,
      tokenParamPreview: tokenFromQuery ? `${tokenFromQuery.substring(0, 20)}...` : null
    },
    tokenTests: []
  };
  
  // Test du token dans les headers
  if (authHeader) {
    try {
      const token = authHeader.split(' ')[1];
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      testResults.tokenTests.push({
        source: 'headers',
        status: 'valide',
        userId: payload.id,
        displayName: payload.display_name,
        expiresAt: new Date(payload.exp * 1000).toISOString()
      });
    } catch (error) {
      testResults.tokenTests.push({
        source: 'headers',
        status: 'invalide',
        error: error.message
      });
    }
  }
  
  // Test du token dans query params
  if (tokenFromQuery) {
    try {
      const payload = jwt.verify(tokenFromQuery, process.env.JWT_SECRET);
      testResults.tokenTests.push({
        source: 'query',
        status: 'valide',
        userId: payload.id,
        displayName: payload.display_name,
        expiresAt: new Date(payload.exp * 1000).toISOString()
      });
    } catch (error) {
      testResults.tokenTests.push({
        source: 'query',
        status: 'invalide',
        error: error.message
      });
    }
  }
  
  res.json({
    success: true,
    test: testResults
  });
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
  twitchUserTokens
};