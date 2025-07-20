# Checklist de Déploiement Render.com

## ✅ Avant le Déploiement

- [ ] **Code pushé sur Git** (GitHub, GitLab, ou Bitbucket)
- [ ] **Variables d'environnement préparées** :
  - [ ] `TWITCH_CLIENT_ID` et `TWITCH_CLIENT_SECRET`
  - [ ] `SPOTIFY_CLIENT_ID` et `SPOTIFY_CLIENT_SECRET`
- [ ] **URLs de callback configurées** dans Twitch/Spotify (temporairement avec placeholder)

## ✅ Déploiement Render

### Option 1 : Infrastructure as Code (Recommandé)
- [ ] **Connecter repository** sur Render Dashboard
- [ ] **Sélectionner "Blueprint"** et pointer vers `render.yaml`
- [ ] **Configurer les variables manuelles** :
  - [ ] `TWITCH_CLIENT_ID`
  - [ ] `TWITCH_CLIENT_SECRET` 
  - [ ] `SPOTIFY_CLIENT_ID`
  - [ ] `SPOTIFY_CLIENT_SECRET`

### Option 2 : Création Manuelle
- [ ] **Créer base de données PostgreSQL** (`levinyle-db`)
- [ ] **Créer service backend** (Node.js, free tier)
- [ ] **Créer service frontend** (Static site, free tier)
- [ ] **Configurer toutes les variables d'environnement**

## ✅ Après le Déploiement

- [ ] **Récupérer les URLs** des services déployés
- [ ] **Mettre à jour les callbacks** :
  - [ ] Twitch : `https://VOTRE-BACKEND.onrender.com/api/auth/twitch/callback`
  - [ ] Spotify : `https://VOTRE-BACKEND.onrender.com/api/auth/spotify/callback`
- [ ] **Initialiser la base de données** :
  ```bash
  psql [DATABASE_URL] -f backend/db/init.sql
  psql [DATABASE_URL] -f backend/db/playlists.sql
  ```

## ✅ Tests de Production

- [ ] **Health check** : `GET https://VOTRE-BACKEND.onrender.com/api/health`
- [ ] **Frontend accessible** : `https://VOTRE-FRONTEND.onrender.com`
- [ ] **Auth Twitch** : `https://VOTRE-BACKEND.onrender.com/api/auth/twitch`
- [ ] **Auth Spotify** : `https://VOTRE-BACKEND.onrender.com/api/auth/spotify`
- [ ] **Créer une session** et tester les fonctionnalités principales

## 🔧 En cas de Problème

### Logs à vérifier :
- [ ] **Logs backend** dans Render Dashboard
- [ ] **Logs build frontend** dans Render Dashboard
- [ ] **Connexion base de données** dans les logs backend

### Problèmes courants :
- [ ] **CORS errors** → Vérifier `FRONTEND_URL` dans variables backend
- [ ] **404 sur routes React** → Vérifier fichier `_redirects` dans `frontend/public/`
- [ ] **Auth redirect loops** → Vérifier URLs de callback dans Twitch/Spotify
- [ ] **DB connection failed** → Vérifier `DATABASE_URL` et variables DB

## 📊 Surveillance

- [ ] **Bookmarker le dashboard Render** pour accès rapide aux logs
- [ ] **Tester le cold start** (attendre 15min puis accéder à l'app)
- [ ] **Surveiller l'usage** du free tier (750h/mois)

---

**🎯 URLs à retenir après déploiement :**
- Frontend : `https://levinyle-frontend.onrender.com`
- Backend : `https://levinyle-backend.onrender.com`
- Health Check : `https://levinyle-backend.onrender.com/api/health` 