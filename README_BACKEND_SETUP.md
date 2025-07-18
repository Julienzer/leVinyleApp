# 🎵 Le Vinyle - Guide de Configuration Complète

## 📋 Architecture

L'application Le Vinyle est maintenant composée de :

### 🔧 Backend (Node.js/Express)
- **Authentification** : Twitch OAuth + JWT
- **Base de données** : PostgreSQL avec sessions, utilisateurs, propositions
- **API REST** : Endpoints pour sessions, propositions, modération
- **Services** : Spotify API pour ajout à la playlist
- **🌟 Multi-streamers** : Tout utilisateur Twitch peut créer des sessions

### 🎨 Frontend (React/Vite)
- **Interface utilisateur** : Interfaces Viewer, Modérateur, Streamer
- **Authentification** : Gestion des tokens JWT
- **Routing** : React Router pour navigation
- **Mode test** : Système de fake data pour développement

---

## 🚀 Installation et Configuration

### 1. Backend Setup

```bash
# 1. Aller dans le dossier backend
cd backend

# 2. Installer les dépendances
npm install

# 3. Créer le fichier .env
cat > .env << 'EOF'
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
EOF

# 4. Créer la base de données PostgreSQL
psql -U postgres -c "CREATE DATABASE le_vinyle;"

# 5. Initialiser les tables avec données de test
npm run setup-db

# 6. Démarrer le serveur
npm run dev
```

### 2. Frontend Setup

```bash
# 1. Aller dans le dossier frontend
cd frontend

# 2. Installer les dépendances
npm install

# 3. Créer le fichier .env
cat > .env << 'EOF'
# === API Configuration ===
VITE_API_URL=http://localhost:3000

# === Test Mode ===
# Set to 'true' to enable test mode (frontend-only testing)
VITE_TEST_MODE=false
EOF

# 4. Démarrer le frontend
npm run dev
```

---

## 🔧 Configuration OAuth

### Twitch OAuth Setup

1. **Créer une application Twitch** :
   - Allez sur https://dev.twitch.tv/console
   - Créez une nouvelle application
   - Copiez le `Client ID` et `Client Secret`
   - Ajoutez l'URL de redirection : `http://localhost:3000/api/auth/twitch/callback`

2. **🎯 Permissions requises** :
   - Seul `user:read:email` est nécessaire
   - **Plus besoin de permissions de modération**
   - **Plus besoin de TWITCH_BROADCASTER_ID**

### Spotify OAuth Setup

1. **Créer une application Spotify** :
   - Allez sur https://developer.spotify.com/dashboard
   - Créez une nouvelle application
   - Copiez le `Client ID` et `Client Secret`
   - Ajoutez l'URL de redirection : `http://localhost:3000/api/auth/spotify/callback`

---

## 📊 Vérification de l'Installation

### 1. Backend Health Check

```bash
# Vérifier que le backend fonctionne
curl http://localhost:3000/api/health

# Réponse attendue :
# {"status":"OK","timestamp":"2024-01-01T00:00:00.000Z","message":"Le Vinyle API is running"}
```

### 2. Base de Données

```bash
# Vérifier les tables créées
psql -U postgres -d le_vinyle -c "\dt"

# Vérifier les données de test
psql -U postgres -d le_vinyle -c "SELECT * FROM users;"
```

### 3. Frontend

```bash
# Accéder à l'application
# http://localhost:5173

# Tester l'authentification
# http://localhost:3000/api/auth/twitch
```

---

## 🧪 Mode Test

### Activer le Mode Test

```bash
# Dans frontend/.env
VITE_TEST_MODE=true
```

### Fonctionnalités du Mode Test

- **Authentification simulée** : Pas besoin de Twitch/Spotify
- **Données factices** : Utilisateurs, sessions, propositions pré-créées
- **Contrôles de test** : Changement de rôle en temps réel
- **API mockées** : Toutes les fonctionnalités sans backend

### Utilisateurs de Test

- **TestViewer** : Utilisateur normal, peut proposer des morceaux
- **TestModerator** : Peut modérer les propositions
- **TestStreamer** : Peut créer des sessions et gérer la playlist

---

## 🗂️ Structure des Données

### Utilisateurs

```sql
-- Tous les utilisateurs Twitch peuvent être streamers
'viewer'     -- Utilisateur normal (peut devenir streamer)
'moderator'  -- Modérateur spécifique à un streamer
'streamer'   -- Rôle dynamique basé sur qui crée les sessions
```

### Sessions

```sql
-- Modes de file d'attente
'chronological'  -- FIFO (premier arrivé, premier servi)
'random'         -- Aléatoire (shuffle)
```

### Propositions

```sql
-- Statuts des propositions
'pending'    -- En attente de modération
'approved'   -- Approuvé par un modérateur
'rejected'   -- Refusé par un modérateur
'added'      -- Ajouté à la playlist Spotify
```

---

## 🎯 Workflow d'Utilisation

### 1. Créer une Session (N'importe quel utilisateur Twitch)

1. Se connecter avec Twitch
2. Aller à l'accueil
3. Créer une nouvelle session
4. Configurer les options (privée, anti-doublons, mode de file)
5. Partager le code de session

### 2. Proposer des Morceaux (Viewers)

1. Se connecter avec Twitch
2. Rejoindre une session avec le code
3. Rechercher des morceaux
4. Cliquer pour proposer directement
5. Suivre le statut des propositions

### 3. Modérer (Modérateurs désignés par le streamer)

1. Se connecter avec Twitch
2. Être ajouté comme modérateur par le streamer
3. Accéder à la session
4. Voir les propositions en attente
5. Approuver ou rejeter
6. Consulter l'historique

### 4. Gérer la Playlist (Créateur de la session)

1. Voir les morceaux approuvés
2. Ajouter à la playlist Spotify
3. Changer le mode de file d'attente
4. Mélanger la file si nécessaire

---

## 🌟 Nouveau Système de Rôles

### **Tout utilisateur Twitch peut :**
- ✅ **Créer des sessions** (devenir streamer de ses sessions)
- ✅ **Proposer des morceaux** dans n'importe quelle session
- ✅ **Gérer ses propres sessions**
- ✅ **Inviter des modérateurs** pour ses sessions

### **Système de modération décentralisé :**
- Chaque **streamer** gère ses propres modérateurs
- Les modérateurs sont **spécifiques à chaque streamer**
- Plus besoin d'un "broadcaster principal"
- **Flexibilité totale** pour chaque communauté

---

## 🔍 Endpoints API Principaux

### Sessions

- `POST /api/sessions` - Créer une session
- `GET /api/sessions/:code` - Obtenir une session
- `GET /api/sessions/:id/stats` - Statistiques

### Propositions

- `POST /api/sessions/:id/propositions` - Proposer un morceau
- `GET /api/sessions/:id/propositions/pending` - Propositions en attente
- `POST /api/sessions/:id/propositions/:id/approve` - Approuver
- `POST /api/sessions/:id/propositions/:id/reject` - Rejeter

### Authentification

- `GET /api/auth/twitch` - Connexion Twitch
- `GET /api/auth/spotify` - Connexion Spotify
- `GET /api/me` - Utilisateur connecté

---

## 🐛 Dépannage

### Problèmes Courants

1. **Erreur de connexion à la base de données** :
   - Vérifier que PostgreSQL est en cours d'exécution
   - Vérifier les credentials dans `.env`

2. **Erreur d'authentification** :
   - Vérifier les Client ID/Secret Twitch/Spotify
   - Vérifier les URLs de redirection
   - **Plus besoin de TWITCH_BROADCASTER_ID**

3. **CORS Errors** :
   - Vérifier que `FRONTEND_URL` est correct dans le backend
   - Vérifier que `VITE_API_URL` est correct dans le frontend

4. **JWT Errors** :
   - Vérifier que `JWT_SECRET` est défini
   - Vérifier que le token n'est pas expiré

---

## 🚀 Déploiement

### Variables d'Environnement Production

```bash
# Backend
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
JWT_SECRET=very-long-random-string
SESSION_SECRET=another-very-long-random-string

# Frontend
VITE_API_URL=https://api.your-domain.com
VITE_TEST_MODE=false
```

### Sécurité

1. **HTTPS** : Obligatoire en production
2. **Variables secrètes** : Générées aléatoirement
3. **CORS** : Configuré pour votre domaine uniquement
4. **Base de données** : Sauvegarde automatique

---

## 📝 Prochaines Étapes

1. **Tester l'authentification** : Twitch et Spotify
2. **Créer une session** : Tester le workflow complet
3. **Inviter des utilisateurs** : Tester la modération
4. **Configurer la production** : Déployer sur votre serveur

---

## 🎉 **Avantages du Nouveau Système**

### **✅ Décentralisation**
- Chaque utilisateur peut créer ses sessions
- Pas de "broadcaster principal"
- Système évolutif pour toute la communauté Twitch

### **✅ Flexibilité**
- Chaque streamer gère ses modérateurs
- Sessions publiques ou privées
- Configurations personnalisées

### **✅ Simplicité**
- Plus besoin de TWITCH_BROADCASTER_ID
- Configuration OAuth simplifiée
- Déploiement plus facile

---

**Le backend est maintenant entièrement fonctionnel et décentralisé !** 🎉

Toutes les fonctionnalités du frontend sont supportées par de vraies APIs et une base de données PostgreSQL. **Tout utilisateur Twitch peut maintenant créer ses propres sessions** et gérer sa propre communauté musicale ! 