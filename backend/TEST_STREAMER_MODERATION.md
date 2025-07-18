# Test du Système de Modération Streamer

## 🎯 Objectif
Vérifier que le streamer peut maintenant voir et modérer directement les propositions en attente, en plus d'accéder aux propositions déjà approuvées.

## 📋 Nouveautés

### 1. **Accès aux Propositions en Attente**
- ✅ Le streamer peut voir les propositions en attente de modération
- ✅ Le streamer peut approuver/rejeter directement sans passer par un modérateur
- ✅ Les modérateurs continuent d'avoir accès à leur interface de modération

### 2. **Interface Streamer Améliorée**
- **3 onglets** au lieu de 2 :
  - **"En attente"** : Propositions qui n'ont pas encore été modérées
  - **"File d'attente"** : Propositions approuvées prêtes à être ajoutées
  - **"Ajoutés"** : Morceaux déjà ajoutés à Spotify

### 3. **Workflow Flexible**
- **Option A** : Viewer → Streamer (modération directe)
- **Option B** : Viewer → Modérateur → Streamer (modération déléguée)

## 🧪 Procédure de Test

### Étape 1 : Préparer les Comptes
- **Compte Streamer** : Créateur de la session
- **Compte Modérateur** : Modérateur Twitch du streamer
- **Compte Viewer** : Pour proposer des morceaux

### Étape 2 : Test du Workflow Direct
1. **Viewer** propose un morceau
2. **Streamer** voit le morceau dans l'onglet "En attente" 
3. **Streamer** peut approuver/rejeter directement
4. Si approuvé → morceau passe dans "File d'attente"

### Étape 3 : Test du Workflow avec Modérateur
1. **Viewer** propose un morceau
2. **Modérateur** approuve dans son interface
3. **Streamer** voit le morceau dans "File d'attente"
4. **Streamer** ajoute à Spotify

### Étape 4 : Test de Concurrence
1. **Viewer** propose plusieurs morceaux
2. **Modérateur** approuve le 1er
3. **Streamer** approuve le 2ème directement
4. Vérifier que les deux apparaissent dans "File d'attente"

## 🔍 Points de Vérification

### Interface Streamer
- [ ] Onglet "En attente" visible avec compteur
- [ ] Propositions s'affichent avec toutes les infos (titre, artiste, viewer, message)
- [ ] Boutons ✅ Approuver et ❌ Rejeter fonctionnels
- [ ] Actualisation automatique après action

### Interface Modérateur
- [ ] Continue de fonctionner normalement
- [ ] Les propositions approuvées disparaissent de l'interface modérateur
- [ ] Les propositions rejetées disparaissent aussi

### Permissions Backend
- [ ] L'API `/api/sessions/:id/propositions/pending` fonctionne pour le streamer
- [ ] Vérification via API Twitch des permissions de modérateur
- [ ] Logs détaillés pour debugger les permissions

## 🚨 Erreurs à Surveiller

### Frontend
```javascript
// Dans la console, vérifier :
🔍 Token disponible: true
🔍 Headers envoyés: {Authorization: "Bearer ..."}
✅ Propositions en attente récupérées: X items
```

### Backend
```bash
# Dans les logs serveur :
🔍 Vérification modérateur pour propositions pending: {userId, streamerId, isModerator}
📋 Propositions pending trouvées: X items
✅ Token testé avec succès
```

## 📊 Cas d'Usage Réels

1. **Petit Stream** : Streamer modère tout seul
2. **Gros Stream** : Modérateurs filtrent, streamer finalise
3. **Stream Collaboratif** : Plusieurs modérateurs + streamer

## ✅ Critères de Succès

- ✅ Streamer voit les propositions en temps réel
- ✅ Workflow de modération flexible (direct ou via modérateur)
- ✅ Interface claire et intuitive
- ✅ Permissions correctement gérées via API Twitch
- ✅ Pas de conflit entre les actions modérateur/streamer 