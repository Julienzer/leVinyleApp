# Le Vinyle App 🎵

Une application web moderne pour les streamers Twitch qui permet à leur communauté de proposer des morceaux de musique. Les modérateurs peuvent approuver les propositions, et le streamer peut les ajouter directement à sa playlist Spotify en direct.

## Fonctionnalités ✨

- **Soumission de morceaux** : Les viewers peuvent proposer des morceaux via des liens Spotify
- **Authentification Twitch** : Connexion sécurisée avec les comptes Twitch
- **Panneau de modération** : Les modérateurs peuvent approuver/rejeter les propositions
- **Intégration Spotify** : Le streamer peut se connecter à Spotify pour ajouter automatiquement les morceaux approuvés à sa playlist
- **Interface moderne** : Design cyberpunk avec animations et effets visuels
- **Base de données PostgreSQL** : Stockage persistant des propositions et utilisateurs

## Prérequis 📋

- Node.js (v18 ou supérieur)
- npm (v9 ou supérieur)
- PostgreSQL (v14 ou supérieur)
- Un compte Spotify Developer (pour l'API)
- Un compte Twitch Developer (pour l'authentification)

## Installation 🚀

1. **Clonez le dépôt :**
```bash
git clone https://github.com/Julienzer/leVinyleApp.git
cd leVinyleApp
```

2. **Installez les dépendances :**
```bash
npm install
cd frontend
npm install
cd ..
```

3. **Configurez la base de données PostgreSQL :**
```bash
./init-db.bat
```

## Configuration ⚙️

### 1. Variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
# Database configuration
DB_USER=root
DB_PASSWORD=root
DB_HOST=localhost
DB_PORT=5432
DB_NAME=le_vinyle

# Spotify configuration
SPOTIFY_CLIENT_ID=votre_client_id
SPOTIFY_CLIENT_SECRET=votre_client_secret
SPOTIFY_REDIRECT_URI=https://localhost:3000/api/auth/spotify/callback
SPOTIFY_PLAYLIST_ID=votre_playlist_id

# Twitch configuration
TWITCH_CLIENT_ID=votre_client_id
TWITCH_CLIENT_SECRET=votre_client_secret
TWITCH_REDIRECT_URI=https://localhost:3000/api/auth/twitch/callback
TWITCH_BROADCASTER_ID=votre_broadcaster_id
JWT_SECRET=votre_secret_jwt

# Server configuration
PORT=3000
```

### 2. Configuration Twitch

1. Créez une application sur [https://dev.twitch.tv/console](https://dev.twitch.tv/console)
2. Configurez l'URL de redirection OAuth : `https://localhost:3000/api/auth/twitch/callback`
3. Ajoutez les scopes suivants :
   - `user:read:email`
   - `moderation:read`
   - `channel:manage:moderators`

### 3. Configuration Spotify

1. Créez une application sur [https://developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Configurez l'URL de redirection : `https://localhost:3000/api/auth/spotify/callback`
3. Créez une playlist et notez son ID

## Démarrage 🎬

### Option 1 - Avec npm (recommandé) :
```bash
# Démarrer le backend
npm start

# Dans un autre terminal, démarrer le frontend
cd frontend
npm run dev
```

### Option 2 - Développement avec hot reload :
```bash
# Backend avec nodemon
npm run dev

# Frontend avec Vite
cd frontend
npm run dev
```

### URLs d'accès :
- **Frontend** : https://localhost:5173
- **Backend** : https://localhost:3000

## Structure du Projet 📁

```
leVinyleApp/
├── backend/           # Serveur Node.js/Express
│   ├── controllers/   # Contrôleurs de l'API
│   ├── models/        # Modèles de données
│   ├── routes/        # Routes de l'API
│   ├── services/      # Services (Spotify, Twitch)
│   └── db/           # Scripts de base de données
├── frontend/          # Application React/Vite
│   ├── src/
│   │   ├── components/# Composants React
│   │   └── assets/    # Ressources statiques
│   └── public/        # Fichiers publics
├── package.json       # Dépendances backend
├── init-db.bat        # Script d'initialisation DB
└── README.md
```

## Fonctionnement 🔄

1. **Soumission** : Les viewers se connectent avec Twitch et proposent des morceaux
2. **Modération** : Les modérateurs voient les propositions en attente et peuvent les approuver/rejeter
3. **Playlist** : Le streamer peut se connecter à Spotify pour ajouter automatiquement les morceaux approuvés à sa playlist

## Déploiement 🚀

### Local avec HTTPS
L'application utilise HTTPS en local pour la compatibilité avec les APIs Spotify et Twitch. Les certificats SSL sont automatiquement générés.

### Production
Pour déployer en production, utilisez des services comme :
- **Render.com** (recommandé)
- **Railway.app**
- **Vercel** (frontend)
- **Netlify** (frontend)

## Technologies Utilisées 🛠️

- **Backend** : Node.js, Express, PostgreSQL
- **Frontend** : React, Vite, Tailwind CSS
- **APIs** : Spotify Web API, Twitch API
- **Authentification** : JWT, OAuth2
- **Base de données** : PostgreSQL

## Contribution 🤝

Les contributions sont les bienvenues ! N'hésitez pas à :
1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## Licence 📄

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## Contact 📧

Pour toute question ou suggestion, n'hésitez pas à ouvrir une issue sur GitHub. 