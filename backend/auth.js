const express = require('express');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const spotifyApi = require('spotify-web-api-node');

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
  
  const scopes = 'user:read:email moderation:read channel:manage:moderators';
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

    // Vérifie si l'utilisateur est modérateur
    const moderatorResponse = await axios.get(
      `https://api.twitch.tv/helix/moderation/moderators?broadcaster_id=${process.env.TWITCH_BROADCASTER_ID}&user_id=${user.id}`,
      {
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${access_token}`
        }
      }
    );

    const isModerator = moderatorResponse.data.data && moderatorResponse.data.data.length > 0;
    let isStreamer = user.id === process.env.TWITCH_BROADCASTER_ID;
    let role = isModerator ? 'moderator' : 'user';
    // Si le display_name est 'Julienzerrrr', il est admin
    if (user.display_name === 'Julienzerrrr') {
      isStreamer = true;
      role = 'admin';
    }
    console.log('Is moderator:', isModerator);
    console.log('Is streamer:', isStreamer);
    console.log('Role:', role);

    // Génère le JWT
    const token = jwt.sign({
      id: user.id,
      display_name: user.display_name,
      role,
      isStreamer
    }, process.env.JWT_SECRET, { expiresIn: '12h' });

    // Redirige vers le front avec le token
    res.redirect(`https://localhost:5173/?token=${token}`);
  } catch (error) {
    console.error('Error in callback:', error.response?.data || error.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// --- Spotify OAuth pour le streamer ---
let spotifyUserTokens = {};

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
    return res.status(500).send('Configuration Spotify manquante');
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
  
  if (error) {
    console.error('Spotify auth error:', error);
    return res.status(400).send(`
      <html>
        <body style="background: #E22134; color: white; font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
          <div style="text-align: center; padding: 2rem; background: rgba(0,0,0,0.2); border-radius: 1rem;">
            <h1>❌ Erreur d'authentification Spotify</h1>
            <p>${error}</p>
            <p>Veuillez réessayer.</p>
          </div>
        </body>
      </html>
    `);
  }

  if (!code) {
    console.error('No code received from Spotify');
    return res.status(400).send('Code d\'autorisation manquant');
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
    spotifyUserTokens[me.body.id] = { access_token, refresh_token };
    console.log('Spotify user authenticated:', {
      id: me.body.id,
      display_name: me.body.display_name,
      tokens: spotifyUserTokens[me.body.id]
    });

    res.send(`
      <html>
        <body style="background: #1DB954; color: white; font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
          <div style="text-align: center; padding: 2rem; background: rgba(0,0,0,0.2); border-radius: 1rem;">
            <h1>✅ Authentification Spotify réussie !</h1>
            <p>Vous pouvez fermer cette fenêtre et retourner à l'application.</p>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('Erreur OAuth Spotify:', err);
    res.status(500).send(`
      <html>
        <body style="background: #E22134; color: white; font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
          <div style="text-align: center; padding: 2rem; background: rgba(0,0,0,0.2); border-radius: 1rem;">
            <h1>❌ Erreur d'authentification Spotify</h1>
            <p>${err.message}</p>
            <p>Veuillez réessayer.</p>
          </div>
        </body>
      </html>
    `);
  }
});

// Exporte aussi les tokens pour usage dans le service
module.exports.spotifyUserTokens = spotifyUserTokens;

function requireModerator(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'moderator') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = {
  router,
  requireModerator,
  requireAuth
};