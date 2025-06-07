const express = require('express');
const cors = require('cors');
const SpotifyService = require('./services/spotifyService');
const tracksRouter = require('./routes/tracks');

require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Spotify service
SpotifyService.initialize();

// Routes
app.use('/api', tracksRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 