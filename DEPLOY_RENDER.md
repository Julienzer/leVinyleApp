# Guide de Déploiement sur Render.com

Ce guide vous explique comment déployer leVinyleApp sur Render.com pour un environnement de production.

## Prérequis

1. Compte sur [Render.com](https://render.com)
2. Repository Git (GitHub, GitLab, ou Bitbucket)
3. Clés API Twitch et Spotify configurées

## Architecture de Déploiement

L'application sera déployée avec 3 services Render :
- **Backend API** : Service web Node.js
- **Frontend** : Site statique React 
- **Base de données** : PostgreSQL managé

## Étape 1 : Préparation du Code

### 1.1 Configuration Frontend pour Production

Modifiez `frontend/vite.config.js` pour utiliser les variables d'environnement :

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://localhost:3000')
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
```

### 1.2 Mise à jour du Code Frontend

Dans vos composants React, remplacez les URLs hardcodées par :

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
```

### 1.3 Configuration Backend pour Production

Mettez à jour `backend/server.js` pour supporter la production :

```javascript
// Configuration CORS pour production
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:5173'  // Pour le développement
  ],
  credentials: true
}));

// Configuration session pour production
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS en production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));
```

## Étape 2 : Déploiement avec Infrastructure as Code

### 2.1 Utilisation du fichier render.yaml

Le fichier `render.yaml` est déjà configuré dans votre projet. Il définit :
- Service backend Node.js
- Service frontend statique  
- Base de données PostgreSQL

### 2.2 Déploiement automatique

1. **Connectez votre repository** :
   - Allez sur [Render Dashboard](https://dashboard.render.com)
   - Cliquez "New" → "Blueprint"
   - Connectez votre repository GitHub/GitLab
   - Render détectera automatiquement le `render.yaml`

2. **Configuration automatique** :
   - Render créera automatiquement les 3 services
   - Les variables d'environnement seront configurées automatiquement
   - La base de données sera provisionnée

## Étape 3 : Configuration Manuelle (Alternative)

Si vous préférez créer les services manuellement :

### 3.1 Créer la Base de Données

1. Dashboard Render → "New" → "PostgreSQL"
2. Nom : `levinyle-db`
3. Database Name : `le_vinyle`
4. User : `le_vinyle_user`
5. Plan : Free (ou Starter pour plus de performance)

### 3.2 Créer le Service Backend

1. Dashboard Render → "New" → "Web Service"
2. Connectez votre repository
3. Configuration :
   - **Name** : `levinyle-backend`
   - **Environment** : Node
   - **Build Command** : `cd backend && npm install`
   - **Start Command** : `cd backend && npm start`
   - **Plan** : Free

### 3.3 Variables d'Environnement Backend

Ajoutez ces variables dans les settings du service backend :

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=[URL de la DB créée automatiquement]
DB_HOST=[Host de la DB]
DB_PORT=[Port de la DB]
DB_NAME=le_vinyle
DB_USER=[User de la DB]
DB_PASSWORD=[Password de la DB]
FRONTEND_URL=[URL du frontend une fois déployé]

# À configurer avec vos vraies valeurs
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
TWITCH_REDIRECT_URI=https://votre-backend.onrender.com/api/auth/twitch/callback

SPOTIFY_CLIENT_ID=your_spotify_client_id  
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=https://votre-backend.onrender.com/api/auth/spotify/callback

# Génération automatique recommandée
JWT_SECRET=generated_jwt_secret_32_chars_min
SESSION_SECRET=generated_session_secret_32_chars_min
```

### 3.4 Créer le Service Frontend

1. Dashboard Render → "New" → "Static Site"
2. Connectez votre repository
3. Configuration :
   - **Name** : `levinyle-frontend`
   - **Build Command** : `cd frontend && npm install && npm run build`
   - **Publish Directory** : `frontend/dist`

### 3.5 Variables d'Environnement Frontend

```env
VITE_API_URL=https://votre-backend.onrender.com
```

## Étape 4 : Configuration des APIs Externes

### 4.1 Twitch Developer Console

1. Allez sur [Twitch Developer Console](https://dev.twitch.tv/console)
2. Mettez à jour votre application :
   - **OAuth Redirect URLs** : `https://votre-backend.onrender.com/api/auth/twitch/callback`

### 4.2 Spotify Developer Dashboard

1. Allez sur [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Mettez à jour votre application :
   - **Redirect URIs** : `https://votre-backend.onrender.com/api/auth/spotify/callback`

## Étape 5 : Initialisation de la Base de Données

Une fois les services déployés :

1. **Connectez-vous à votre base de données** via le Render Dashboard
2. **Exécutez les scripts d'initialisation** :
   ```sql
   -- Utilisez le contenu de backend/db/init.sql
   -- Puis backend/db/playlists.sql
   ```

Ou utilisez le script de setup depuis votre machine locale :
```bash
# Avec l'URL de connexion fournie par Render
psql [DATABASE_URL] -f backend/db/init.sql
psql [DATABASE_URL] -f backend/db/playlists.sql
```

## Étape 6 : Tests de Production

### 6.1 Health Check

Testez que votre backend répond :
```
GET https://votre-backend.onrender.com/api/health
```

### 6.2 Frontend

Accédez à votre frontend :
```
https://votre-frontend.onrender.com
```

### 6.3 Authentification

Testez les flows d'authentification :
- Twitch : `https://votre-backend.onrender.com/api/auth/twitch`
- Spotify : `https://votre-backend.onrender.com/api/auth/spotify`

## Étape 7 : Monitoring et Logs

### 7.1 Logs Render

- Accédez aux logs via le Dashboard Render
- Surveillez les erreurs de démarrage
- Vérifiez les connexions à la base de données

### 7.2 Monitoring des Performances

Render Free tier limitations :
- **Spinning down** : Services gratuits s'arrêtent après 15min d'inactivité
- **Démarrage à froid** : ~30 secondes pour redémarrer
- **Ressources** : 0.1 CPU, 512MB RAM

## Troubleshooting

### Problèmes Courants

1. **CORS Errors** :
   - Vérifiez que `FRONTEND_URL` est bien configurée
   - Ajoutez le domaine Render dans la config CORS

2. **Database Connection** :
   - Vérifiez `DATABASE_URL` dans les variables d'environnement
   - Testez la connexion depuis les logs du backend

3. **404 sur les routes React** :
   - Ajoutez un fichier `_redirects` dans `frontend/public/` :
   ```
   /*    /index.html   200
   ```

4. **Authentication Redirect Loops** :
   - Vérifiez les URLs de callback dans Twitch/Spotify
   - Assurez-vous que les secrets sont bien configurés

### Support

- [Documentation Render](https://render.com/docs)
- [Community Render](https://community.render.com)

## Coûts Render.com

- **Free Tier** : 750h/mois services web + PostgreSQL gratuit
- **Starter Tier** : $7/mois pour services illimités
- Parfait pour tester en production !

---

✅ **Votre application leVinyleApp sera accessible en production sur Render.com !** 