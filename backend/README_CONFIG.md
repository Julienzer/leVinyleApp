# Configuration du Backend Le Vinyle

## 📋 Configuration requise

### 1. Base de données PostgreSQL

Assurez-vous d'avoir PostgreSQL installé et en cours d'exécution.

### 2. Variables d'environnement

Créez un fichier `.env` dans le dossier `backend/` avec les variables suivantes :

```bash
# === DATABASE ===
DB_HOST=localhost
DB_PORT=5432
DB_NAME=le_vinyle
DB_USER=postgres
DB_PASSWORD=your_password

# === SERVER ===
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# === SECURITY ===
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-super-secret-session-key-here

# === TWITCH OAUTH ===
TWITCH_CLIENT_ID=your-twitch-client-id
TWITCH_CLIENT_SECRET=your-twitch-client-secret
TWITCH_REDIRECT_URI=http://localhost:3000/api/auth/twitch/callback

# === SPOTIFY OAUTH ===
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/spotify/callback
```

**💡 Note importante** : Contrairement à d'autres systèmes, **TWITCH_BROADCASTER_ID n'est plus nécessaire** car **tout utilisateur Twitch peut créer des sessions et devenir streamer** dans Le Vinyle !

## 🔧 Étapes de configuration

### 1. Installer les dépendances

```bash
cd backend
npm install
```

### 2. Configurer la base de données

```bash
# Créer la base de données
psql -U postgres -c "CREATE DATABASE le_vinyle;"

# Initialiser les tables (script fourni)
node scripts/setup-database.js
```

### 3. Configurer Twitch OAuth

1. Allez sur https://dev.twitch.tv/console
2. Créez une nouvelle application
3. Copiez le Client ID et Client Secret
4. Ajoutez l'URL de redirection : `http://localhost:3000/api/auth/twitch/callback`

**🎯 Permissions requises** : Seul `user:read:email` est nécessaire (plus besoin de permissions de modération).

### 4. Configurer Spotify OAuth

1. Allez sur https://developer.spotify.com/dashboard
2. Créez une nouvelle application
3. Copiez le Client ID et Client Secret
4. Ajoutez l'URL de redirection : `http://localhost:3000/api/auth/spotify/callback`

### 5. Générer les clés secrètes

Utilisez un générateur de clés secrètes pour `JWT_SECRET` et `SESSION_SECRET`.

## 🚀 Démarrage

```bash
# Mode développement
npm run dev

# Mode production
npm start
```

## 📊 Endpoints API

### Authentification
- `GET /api/auth/twitch` - Démarrer l'authentification Twitch
- `GET /api/auth/spotify` - Démarrer l'authentification Spotify
- `GET /api/me` - Obtenir l'utilisateur connecté

### Sessions
- `POST /api/sessions` - Créer une session
- `GET /api/sessions/:code` - Obtenir une session
- `GET /api/sessions/:id/stats` - Statistiques de session
- `PATCH /api/sessions/:id/queue-mode` - Changer le mode de file d'attente

### Propositions
- `POST /api/sessions/:id/propositions` - Proposer un morceau
- `GET /api/sessions/:id/propositions/pending` - Propositions en attente
- `POST /api/sessions/:id/propositions/:id/approve` - Approuver
- `POST /api/sessions/:id/propositions/:id/reject` - Rejeter

### Test
- `GET /api/health` - Vérifier le statut du serveur

## 🔍 Vérification

Une fois le serveur démarré, vous pouvez tester :

1. **Health check** : `GET http://localhost:3000/api/health`
2. **Authentification Twitch** : `GET http://localhost:3000/api/auth/twitch`
3. **Base de données** : Les données de test sont automatiquement créées

## 🌟 Système de Rôles

### **Tout utilisateur Twitch peut :**
- ✅ **Créer des sessions** (devenir streamer)
- ✅ **Proposer des morceaux** (viewer)
- ✅ **Gérer ses propres sessions**

### **Système de modération (Nouveau !) :**
- Les modérateurs sont **automatiquement détectés** via l'API Twitch
- Si quelqu'un est **modérateur sur votre chaîne Twitch**, il aura automatiquement les droits dans l'app
- **Synchronisation en temps réel** : Gérez vos modérateurs depuis le tableau de bord Twitch
- **Plus simple** : Pas de gestion séparée des modérateurs

## 🐛 Dépannage

### Erreur de connexion à la base de données
- Vérifiez que PostgreSQL est en cours d'exécution
- Vérifiez les variables d'environnement DB_*
- Vérifiez que la base de données existe

### Erreur d'authentification Twitch/Spotify
- Vérifiez les Client ID et Client Secret
- Vérifiez les URLs de redirection
- Vérifiez que les applications sont configurées correctement

### Erreur de JWT
- Vérifiez que JWT_SECRET est défini
- Vérifiez que le token n'est pas expiré

## 📝 Notes importantes

1. **Sécurité** : Ne commitez jamais le fichier `.env` dans Git
2. **HTTPS** : En production, utilisez HTTPS pour tous les endpoints
3. **Variables d'environnement** : Utilisez des valeurs différentes pour chaque environnement
4. **Base de données** : Sauvegardez régulièrement vos données de production
5. **🆕 Multi-streamers** : Chaque utilisateur Twitch peut créer ses propres sessions ! 