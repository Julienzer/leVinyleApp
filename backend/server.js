const express = require('express');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
const session = require('express-session');
const SpotifyService = require('./services/spotifyService');
const tracksRouter = require('./routes/tracks');
const auth = require('./auth');

require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Initialize Spotify service
SpotifyService.initialize();

// Routes
app.use('/api/auth', auth.router);
app.use('/api', tracksRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
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

// SSL certificate handling
let options;
try {
  options = {
    key: fs.readFileSync('localhost-key.pem'),
    cert: fs.readFileSync('localhost-cert.pem')
  };
} catch (error) {
  console.error('Error loading SSL certificates:', error);
  console.log('Starting server without HTTPS...');
  app.listen(PORT, () => {
    console.log(`Serveur HTTP sur http://localhost:${PORT}`);
  });
  return;
}

https.createServer(options, app).listen(PORT, () => {
  console.log(`Serveur HTTPS sur https://localhost:${PORT}`);
}); 