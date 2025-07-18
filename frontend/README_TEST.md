# 🧪 Guide de Test - Le Vinyle

Ce guide explique comment utiliser le système de test intégré pour tester toutes les interfaces de l'application sans avoir besoin d'un backend.

## 🚀 Démarrage rapide

1. **Lancez l'application en mode développement :**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Le mode test est automatiquement activé en développement** et vous verrez :
   - Un panneau de contrôle en bas à droite (🧪 Test)
   - Des indicateurs "MODE TEST" dans les interfaces
   - Des données de démonstration pré-chargées

## 🎮 Contrôles de test

### Panneau de contrôle (coin bas-droit)
- **Navigation rapide** : Accès direct aux différentes pages
- **Changement de rôle** : Basculer entre Viewer, Modérateur, Streamer
- **Déconnexion** : Tester l'état non-connecté

### Sessions de test disponibles
- **`test123`** : Session Test de Julien (publique)
- **`private456`** : Session Privée (privée)

## 👥 Rôles utilisateur

### 🔵 Viewer (TestViewer)
**Fonctionnalités testables :**
- Recherche de morceaux avec AJAX simulé
- Proposition de morceaux (clic direct)
- Suivi du statut des propositions
- Gestion des erreurs (doublons, etc.)

**Comment tester :**
1. Sélectionnez le rôle "Viewer" 
2. Allez dans une session (`/room/test123`)
3. Recherchez des morceaux (ex: "Kendrick", "Fugees")
4. Cliquez sur un morceau pour le proposer
5. Regardez vos propositions dans la colonne de droite

### 🟢 Modérateur (TestModerator)
**Fonctionnalités testables :**
- Visualisation des propositions en attente
- Approbation/refus des morceaux
- Historique des décisions
- Remise en file d'attente

**Comment tester :**
1. Sélectionnez le rôle "Modérateur"
2. Allez dans une session (`/room/test123`)
3. Utilisez les boutons ✅ et ❌ pour modérer
4. Basculez entre les onglets "En attente" et "Historique"
5. Testez le bouton "Actualiser"

### 🟡 Streamer (TestStreamer)
**Fonctionnalités testables :**
- Création de nouvelles sessions
- Visualisation des statistiques
- Gestion de la file d'attente
- Modes chronologique/aléatoire
- Ajout à la playlist Spotify (simulé)

**Comment tester :**
1. Sélectionnez le rôle "Streamer"
2. Créez une session depuis l'accueil
3. Basculez entre les modes de file d'attente
4. Utilisez le bouton "Mélanger la file"
5. Ajoutez des morceaux à la playlist

## 🎯 Scénarios de test recommandés

### Scénario 1 : Workflow complet
1. **Viewer** → Proposer un morceau
2. **Modérateur** → Approuver le morceau
3. **Streamer** → Ajouter à la playlist

### Scénario 2 : Gestion des erreurs
1. **Viewer** → Proposer le même morceau plusieurs fois
2. Observer les messages d'erreur
3. Tester sans connexion

### Scénario 3 : Modes de file d'attente
1. **Streamer** → Changer le mode en "Aléatoire"
2. Mélanger la file d'attente
3. Revenir au mode "Chronologique"

## 📊 Données de test

### Morceaux disponibles dans la recherche
- **Fugees** : Fu-Gee-La, Ready or Not, Killing Me Softly
- **Kendrick Lamar** : Swimming Pools, King Kunta, Alright
- **Nas** : N.Y. State of Mind, Life's a Bitch
- Et plus encore...

### Propositions pré-existantes
- Morceaux en attente de modération
- Morceaux déjà approuvés
- Morceaux rejetés
- Morceaux ajoutés à la playlist

## 🔄 Fonctionnalités simulées

### ✅ Fonctionnalités testables
- Recherche Spotify AJAX
- Proposition de morceaux
- Modération (approbation/refus)
- Ajout à la playlist
- Changement de mode de file d'attente
- Statistiques de session
- Navigation entre les rôles

### ⚠️ Limitations du mode test
- Pas de vraie connexion Spotify
- Pas de vraie base de données
- Données réinitialisées à chaque rechargement
- Pas de temps réel entre utilisateurs

## 🛠️ Développement

### Structure des fichiers de test
```
src/
├── utils/
│   └── fakeData.js          # Données et API simulées
├── components/
│   └── TestControls.jsx     # Panneau de contrôle
└── App.jsx                  # Integration du mode test
```

### Ajouter de nouvelles données
Éditez `src/utils/fakeData.js` pour ajouter :
- Nouveaux utilisateurs
- Nouvelles sessions
- Nouvelles propositions
- Nouveaux morceaux dans la recherche

### Désactiver le mode test
Le mode test est automatiquement désactivé en production. Pour le désactiver manuellement, modifiez `isTestMode` dans `App.jsx`.

## 🎨 Interface utilisateur

### Indicateurs visuels
- **🧪 Badge jaune** : Mode test actif
- **Bandeaux bleus** : Rappels que c'est un mode test
- **Données factices** : Noms commençant par "Test"

### Navigation
- **Boutons de navigation rapide** pour changer de page
- **Menu déroulant de rôles** pour changer d'utilisateur
- **Liens directs** vers les sessions de test

## 📱 Test responsive

Testez sur différentes tailles d'écran :
- **Desktop** : Interfaces complètes
- **Mobile** : Adaptation responsive
- **Tablet** : Grilles adaptatives

---

**Bon test ! 🎵** 

Ce système vous permet de tester toutes les fonctionnalités sans backend. N'hésitez pas à explorer tous les scénarios et à vérifier que l'UX est fluide pour chaque rôle utilisateur. 