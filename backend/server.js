const express = require('express');
const cors = require('cors');
const session = require('express-session');
const SpotifyService = require('./services/spotifyService');
const auth = require('./auth');

// Import des nouvelles routes
const sessionsRouter = require('./routes/sessions');
const propositionsRouter = require('./routes/propositions');
const tracksRouter = require('./routes/tracks');
const searchRouter = require('./routes/search');
const usersRouter = require('./routes/users');
const playlistsRouter = require('./routes/playlists');
const spotifyRouter = require('./routes/spotify');

require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,  // Changé de true à false pour HTTP
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Initialize Spotify service
SpotifyService.initialize();

// Route de test (AVANT les autres routes pour éviter les conflits)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Le Vinyle API is running' 
  });
});

// Routes
app.use('/api/auth', auth.router);
app.use('/api/sessions', sessionsRouter);
app.use('/api', propositionsRouter);
app.use('/api', tracksRouter);
app.use('/api/search', searchRouter);
app.use('/api/users', usersRouter);
app.use('/api/playlists', playlistsRouter);
app.use('/api/spotify', spotifyRouter);

// Route pour obtenir les infos de l'utilisateur connecté
app.get('/api/me', auth.requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Route 404 pour les API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`${new Date().toISOString()} - Error:`, err.stack);
  
  // Erreur de validation JSON
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON format' });
  }
  
  // Erreur de payload trop large
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request entity too large' });
  }
  
  // Erreur générique
  res.status(500).json({ error: 'Something went wrong!' });
});

// Session error handling
app.use((req, res, next) => {
  if (!req.session) {
    console.error('Session not available');
    return res.status(500).json({ error: 'Session not available' });
  }
  next();
});

// Connection error handling
app.use((req, res, next) => {
  req.on('error', (err) => {
    console.error('Connection error:', err);
    res.status(500).json({ error: 'Connection error' });
  });
  next();
});

const PORT = process.env.PORT || 3000;

// Gestionnaire d'arrêt propre
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Démarrage du serveur
const server = app.listen(PORT, () => {
  console.log(`🚀 Le Vinyle API server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Twitch auth: http://localhost:${PORT}/api/auth/twitch`);
  console.log(`🎵 Spotify auth: http://localhost:${PORT}/api/auth/spotify`);
}); 