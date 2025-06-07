# Le Vinyle App 🎵

Une application web moderne pour gérer et partager vos playlists musicales. Développée avec React et Node.js, cette application vous permet de créer, modifier et partager vos playlists de manière intuitive.

## Fonctionnalités ✨

- Création et gestion de playlists
- Intégration avec Spotify
- Interface utilisateur moderne et responsive
- Système de modération des soumissions
- Base de données SQLite pour le stockage local

## Prérequis 📋

- Node.js (v18 ou supérieur)
- npm (v9 ou supérieur)
- Un compte Spotify (pour l'API)

## Installation 🚀

1. Clonez le dépôt :
```bash
git clone https://github.com/Julienzer/leVinyleApp.git
cd leVinyleApp
```

2. Installez les dépendances du backend :
```bash
cd backend
npm install
```

3. Installez les dépendances du frontend :
```bash
cd ../frontend
npm install
```

4. Initialisez la base de données :
```bash
cd ..
./init-db.bat
```

## Configuration ⚙️

1. Dans le dossier `backend`, créez un fichier `.env` avec les variables suivantes :
```env
SPOTIFY_CLIENT_ID=votre_client_id
SPOTIFY_CLIENT_SECRET=votre_client_secret
PORT=3000
```

2. Dans le dossier `frontend`, créez un fichier `.env` :
```env
VITE_API_URL=http://localhost:3000
```

## Démarrage 🎬

Pour lancer l'application, exécutez simplement :
```bash
./start-app.bat
```

Cela démarrera :
- Le serveur backend sur http://localhost:3000
- L'application frontend sur http://localhost:5173

## Structure du Projet 📁

```
leVinyleApp/
├── backend/           # Serveur Node.js
│   ├── controllers/   # Contrôleurs de l'API
│   ├── models/        # Modèles de données
│   ├── routes/        # Routes de l'API
│   └── services/      # Services (Spotify, etc.)
├── frontend/          # Application React
│   ├── src/
│   │   ├── components/# Composants React
│   │   └── assets/    # Ressources statiques
│   └── public/        # Fichiers publics
└── scripts/           # Scripts utilitaires
```

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