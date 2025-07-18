# Configuration .env pour Le Vinyle Backend

Créez un fichier `.env` dans le dossier `backend/` avec le contenu suivant :

```env
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=le_vinyle
DB_USER=postgres
DB_PASSWORD=

# Serveur
PORT=3000
NODE_ENV=development

# Sécurité
JWT_SECRET=super_secret_jwt_key_for_testing_123456789
SESSION_SECRET=super_secret_session_key_for_testing_123456789

# Frontend
FRONTEND_URL=http://localhost:5173

# Twitch OAuth
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
TWITCH_REDIRECT_URI=http://localhost:3000/api/auth/twitch/callback

# Spotify OAuth
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/spotify/callback
```

## Configuration importante

- **JWT_SECRET** : Clé secrète pour signer les tokens JWT (obligatoire)
- **SESSION_SECRET** : Clé secrète pour les sessions (obligatoire)
- **DB_PASSWORD** : Mot de passe de votre base PostgreSQL (peut être vide si pas de mot de passe)
- **TWITCH_CLIENT_ID** et **TWITCH_CLIENT_SECRET** : À obtenir sur https://dev.twitch.tv/console
- **SPOTIFY_CLIENT_ID** et **SPOTIFY_CLIENT_SECRET** : À obtenir sur https://developer.spotify.com/dashboard

## Après création du fichier .env

1. Redémarrez le serveur backend : `npm run dev`
2. Testez l'authentification avec Twitch
3. Créez et rejoignez des sessions 