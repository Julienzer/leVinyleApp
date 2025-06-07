const express = require('express');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const axios = require('axios');

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

// Route pour démarrer l'auth Twitch
router.get('/twitch', (req, res) => {
  console.log('Starting Twitch authentication...');
  const state = Math.random().toString(36).substring(7);
  req.session.state = state;
  
  const scopes = 'user:read:email moderation:read channel:manage:moderators';
  const url = `https://id.twitch.tv/oauth2/authorize?client_id=${process.env.TWITCH_CLIENT_ID}&redirect_uri=${process.env.TWITCH_REDIRECT_URI}&response_type=code&scope=${scopes}&state=${state}`;
  
  console.log('Redirecting to:', url);
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
    console.log('Is moderator:', isModerator);

    // Génère le JWT
    const token = jwt.sign({
      id: user.id,
      display_name: user.display_name,
      role: isModerator ? 'moderator' : 'user'
    }, process.env.JWT_SECRET, { expiresIn: '12h' });

    // Redirige vers le front avec le token
    res.redirect(`http://localhost:5173/?token=${token}`);
  } catch (error) {
    console.error('Error in callback:', error.response?.data || error.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

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

module.exports = {
  router,
  requireModerator
};