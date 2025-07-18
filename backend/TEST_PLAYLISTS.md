# Test des Playlists Streamer

## 🎯 Objectif
Tester la nouvelle fonctionnalité de gestion des playlists pour les streamers, permettant de créer et gérer des playlists personnalisées.

## 🎵 Nouvelles Fonctionnalités

### 1. **Gestionnaire de Playlists**
- ✅ Créer de nouvelles playlists
- ✅ Sélectionner une playlist active
- ✅ Voir la liste des playlists existantes
- ✅ Compter les morceaux par playlist
- ✅ Interface toggle (afficher/masquer)

### 2. **Intégration avec l'ajout de morceaux**
- ✅ Bouton "Ajouter à la playlist" nécessite une playlist sélectionnée
- ✅ Validation avant ajout (playlist obligatoire)
- ✅ Feedback visuel de la playlist active
- ✅ Mise à jour du statut des morceaux

### 3. **Backend API**
- ✅ Endpoints CRUD pour les playlists
- ✅ Validation des données
- ✅ Gestion des erreurs
- ✅ Base de données avec relations

## 🧪 Plan de Test

### Test 1 : Affichage du Gestionnaire de Playlists
1. **Connectez-vous** en tant que streamer
2. **Rejoignez** une session active
3. **Cliquez** sur "Gérer les playlists"
4. **Vérifiez** :
   - Le panneau de gestion s'affiche
   - Les playlists existantes apparaissent
   - Le bouton "Nouvelle playlist" est visible

### Test 2 : Création de Playlist
1. **Cliquez** sur "Nouvelle playlist"
2. **Remplissez** :
   - Nom : "Ma Session Test"
   - Description : "Playlist de test pour la session"
3. **Cliquez** "Créer"
4. **Vérifiez** :
   - La playlist apparaît dans la liste
   - Elle est automatiquement sélectionnée
   - Le compteur affiche "0 morceaux"

### Test 3 : Sélection de Playlist
1. **Ouvrez** le gestionnaire de playlists
2. **Cliquez** sur une playlist dans la liste
3. **Vérifiez** :
   - La playlist est mise en surbrillance
   - Elle apparaît dans le sélecteur
   - L'indicateur "Playlist active" s'affiche

### Test 4 : Ajout de Morceau à la Playlist
1. **Assurez-vous** qu'une playlist est sélectionnée
2. **Allez** dans l'onglet "File d'attente"
3. **Cliquez** "Ajouter à la playlist" sur un morceau approuvé
4. **Vérifiez** :
   - Message de succès s'affiche
   - Morceau passe au statut "Ajouté"
   - Compteur de la playlist augmente

### Test 5 : Validation sans Playlist
1. **Désélectionnez** la playlist (option vide)
2. **Tentez** d'ajouter un morceau
3. **Vérifiez** :
   - Message d'erreur : "Veuillez sélectionner une playlist"
   - Morceau reste au statut "Approuvé"

### Test 6 : Masquage du Gestionnaire
1. **Cliquez** "Masquer les playlists"
2. **Vérifiez** :
   - Le gestionnaire se ferme
   - L'indicateur de playlist active reste visible
   - Le bouton devient "Gérer les playlists"

## 🔍 Éléments à Vérifier

### Interface Utilisateur
- [ ] Bouton "Gérer les playlists" dans les contrôles
- [ ] Panneau de gestion avec liste des playlists
- [ ] Formulaire de création avec validation
- [ ] Sélecteur de playlist active
- [ ] Indicateur de playlist sélectionnée

### Fonctionnalités
- [ ] Création de playlist avec nom et description
- [ ] Sélection de playlist par clic
- [ ] Validation obligatoire pour l'ajout
- [ ] Mise à jour du statut des morceaux
- [ ] Compteur de morceaux par playlist

### Gestion d'Erreurs
- [ ] Nom de playlist requis
- [ ] Playlist requise pour l'ajout
- [ ] Gestion des erreurs réseau
- [ ] Feedback utilisateur approprié

## 📊 Données de Test

### Playlists Simulées (Mode Test)
```javascript
{
  id: 'playlist-1',
  name: 'Session Live Stream',
  description: 'Morceaux de ma session en direct',
  tracks_count: 2
}
```

### Scénarios d'Erreur
- **Nom vide** : "Le nom de la playlist est requis"
- **Playlist non sélectionnée** : "Veuillez sélectionner une playlist"
- **Nom dupliqué** : "Une playlist avec ce nom existe déjà"

## 🎯 Test Complet : Workflow Streamer

### Étape 1 : Préparation
1. **Proposez** quelques morceaux en tant que viewer
2. **Connectez-vous** en tant que streamer
3. **Rejoignez** la session

### Étape 2 : Gestion des Playlists
1. **Créez** une playlist "Session du jour"
2. **Créez** une playlist "Coups de cœur"
3. **Sélectionnez** "Session du jour"

### Étape 3 : Modération et Ajout
1. **Approuvez** les morceaux en attente
2. **Ajoutez** 2 morceaux à "Session du jour"
3. **Changez** pour "Coups de cœur"
4. **Ajoutez** 1 morceau à "Coups de cœur"

### Étape 4 : Vérification
1. **Vérifiez** les compteurs : 2 et 1 morceaux
2. **Vérifiez** le statut : "Ajouté"
3. **Vérifiez** la persistence après actualisation

## 🛠️ Endpoints API à Tester

### Mode Production
```bash
# Récupérer les playlists
GET /api/playlists

# Créer une playlist
POST /api/playlists
{
  "name": "Ma Playlist",
  "description": "Description optionnelle"
}

# Ajouter un morceau
POST /api/playlists/:playlistId/tracks/:trackId
```

### Mode Test
```javascript
// Dans la console du navigateur
console.log('Test des playlists en mode simulé activé')
```

## ✅ Critères de Succès

### Fonctionnalités de Base
- [ ] Création de playlists avec nom et description
- [ ] Sélection de playlist active
- [ ] Ajout de morceaux à la playlist sélectionnée
- [ ] Validation des données utilisateur

### Expérience Utilisateur
- [ ] Interface intuitive et réactive
- [ ] Feedback visuel clair
- [ ] Gestion d'erreurs explicite
- [ ] Persistence des données

### Intégration
- [ ] Workflow naturel avec la modération
- [ ] Compatibilité avec le mode test
- [ ] Pas de régression sur les fonctionnalités existantes

## 🎉 Fonctionnalités Ajoutées

### Avant
- ❌ Ajout direct à une playlist Spotify générique
- ❌ Pas de gestion personnalisée des playlists
- ❌ Pas de choix pour le streamer

### Maintenant
- ✅ Création de playlists personnalisées
- ✅ Sélection de la playlist cible
- ✅ Gestion complète des playlists
- ✅ Contrôle total pour le streamer

## 🔄 Prochaines Améliorations

### Fonctionnalités Futures
- [ ] Suppression de playlists
- [ ] Modification des playlists existantes
- [ ] Réorganisation des morceaux dans les playlists
- [ ] Export vers Spotify réel
- [ ] Partage de playlists avec les viewers 