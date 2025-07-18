# 🔧 Diagnostic Spotify Timeout

## 🚨 Problème Actuel
**Symptôme** : "❌ Timeout: Spotify non disponible" après 15 secondes de chargement

## 📋 Plan de Diagnostic

### Étape 1 : Test de Connectivité

1. **Ouvrez la console** (F12)
2. **Tapez cette commande** :
   ```javascript
   fetch('https://open.spotify.com/embed/iframe-api/v1')
     .then(response => console.log('✅ Spotify accessible:', response.status))
     .catch(err => console.log('❌ Erreur réseau:', err))
   ```
3. **Résultat attendu** : `✅ Spotify accessible: 200`

### Étape 2 : Page de Test Dédiée

1. **Allez sur** : `http://localhost:5173/spotify-test`
2. **Observez les logs** en temps réel
3. **Vérifiez** :
   - Script présent : `true`
   - Connectivité : `✅ Connectivité Spotify OK`
   - État API : `Prêt` (vert) ou `Timeout` (rouge)

### Étape 3 : Vérification Manuelle

Dans la console, tapez :
```javascript
// Vérifier le script
console.log('Script présent:', !!document.querySelector('script[src*="spotify.com/embed/iframe-api"]'))

// Vérifier l'API
console.log('onSpotifyIframeApiReady:', typeof window.onSpotifyIframeApiReady)
console.log('IFrameAPI:', !!window.IFrameAPI)

// Auto-diagnostic
window.spotifyDebug.checkAPI()
```

## 🛠️ Solutions Possibles

### Solution 1 : Problème de Script

**Si le script n'est pas présent** :
```javascript
// Charger manuellement le script
const script = document.createElement('script');
script.src = 'https://open.spotify.com/embed/iframe-api/v1';
script.async = true;
document.head.appendChild(script);
```

### Solution 2 : Problème de Timing

**Si l'API n'est pas prête** :
```javascript
// Forcer le rechargement de l'API
delete window.onSpotifyIframeApiReady;
delete window.IFrameAPI;
location.reload(); // Puis retester
```

### Solution 3 : Problème de Navigateur

1. **Désactiver les bloqueurs de pub** (AdBlock, etc.)
2. **Vider le cache** (Ctrl+Shift+Delete)
3. **Essayer en navigation privée**
4. **Tester avec un autre navigateur**

### Solution 4 : Problème de Réseau/Pare-feu

1. **Vérifier que Spotify.com est accessible**
2. **Désactiver temporairement le pare-feu**
3. **Essayer avec un autre réseau** (mobile, etc.)

## 🧪 Test des Lecteurs

### Lecteur V2 (Actuel)
- ✅ Gestion automatique du script
- ✅ Polling intelligent de l'API
- ✅ Debug info intégré
- ✅ Timeout de 15 secondes

### Test Manuel Simple
```javascript
// Test direct dans la console
window.onSpotifyIframeApiReady = (IFrameAPI) => {
  console.log('🎉 API reçue!', IFrameAPI);
  
  const testDiv = document.createElement('div');
  testDiv.style.width = '300px';
  testDiv.style.height = '152px';
  document.body.appendChild(testDiv);
  
  IFrameAPI.createController(testDiv, {
    uri: 'spotify:track:4iV5W9uYEdYUVa79Axb7Rh',
    width: '100%',
    height: 152
  }, (controller) => {
    console.log('✅ Test réussi!', controller);
  });
};
```

## 📊 Codes de Statut

### ✅ Succès
```
🚀 Initialisation du lecteur V2
🎵 Track ID: 4iV5W9uYEdYUVa79Axb7Rh
✅ Script Spotify déjà présent
🔍 Tentative 1/30 - Vérification API
✅ API Spotify détectée et prête
🎮 Création du controller...
✅ Controller créé avec succès
```

### ❌ Échec Typique
```
🚀 Initialisation du lecteur V2
🎵 Track ID: 4iV5W9uYEdYUVa79Axb7Rh
✅ Script Spotify déjà présent
🔍 Tentative 1/30 - Vérification API
🔍 Tentative 2/30 - Vérification API
...
🔍 Tentative 30/30 - Vérification API
❌ API non disponible après 30 tentatives
❌ Erreur: API Spotify non disponible
```

## 🔍 Actions Selon le Diagnostic

### Cas 1 : Script non chargé
- **Cause** : Problème réseau ou bloqueur
- **Action** : Vérifier la connectivité et désactiver les bloqueurs

### Cas 2 : Script chargé mais API timeout
- **Cause** : L'API ne s'initialise pas
- **Action** : Recharger la page, tester en navigation privée

### Cas 3 : Erreur de création du controller
- **Cause** : URL Spotify invalide ou problème DOM
- **Action** : Vérifier l'URL et l'élément iframe

## 🎯 Test Final

Une fois le diagnostic fait, testez avec :
1. **Proposez un morceau** avec une URL Spotify valide
2. **Allez dans l'interface streamer**
3. **Vérifiez l'onglet "En attente"**
4. **Ouvrez la section "Debug Info"** pour voir les logs détaillés

## 📞 Rapport de Bug

Si rien ne fonctionne, fournissez :
1. **Navigateur et version** (Chrome 120, Firefox 110, etc.)
2. **Système d'exploitation** (Windows 10, macOS, Linux)
3. **Logs de la console** (copier-coller complet)
4. **Résultat de** `window.spotifyDebug.checkAPI()`
5. **URL de test utilisée**

## 🚀 Prochaines Étapes

Selon le résultat :
- ✅ **Si ça marche** : Lecteur Spotify embeddé fonctionnel
- ⚠️ **Si problème réseau** : Fallback vers liens Spotify
- ❌ **Si bloqué** : Désactivation temporaire du lecteur embeddé 