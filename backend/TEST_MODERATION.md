# Test du Système de Modération Twitch

## 🎯 Objectif
Vérifier que le système détecte automatiquement les modérateurs Twitch quand ils rejoignent une session.

## 📋 Prérequis

### 1. Configuration Twitch
- Avoir **2 comptes Twitch** :
  - **Compte A** : Le streamer (qui va créer la session)
  - **Compte B** : Le modérateur (qui va rejoindre la session)

### 2. Configuration de la modération sur Twitch
1. Connectez-vous avec le **Compte A** sur Twitch
2. Allez sur https://dashboard.twitch.tv/u/VOTRE_PSEUDO/settings/moderation
3. Ajoutez le **Compte B** comme modérateur de votre chaîne

## 🧪 Procédure de Test

### Étape 1 : Connexion du Streamer
1. Connectez-vous à l'app avec le **Compte A** (streamer)
2. Vérifiez dans les logs backend : `Token du streamer disponible: true`
3. Créez une session (ex: "test-moderation")

### Étape 2 : Connexion du Modérateur
1. Ouvrez un autre navigateur/onglet privé
2. Connectez-vous avec le **Compte B** (modérateur)
3. Rejoignez la session créée par le Compte A

### Étape 3 : Vérification
1. **Dans les logs backend**, vous devriez voir :
   ```
   🔍 Vérification du statut de modérateur via Twitch API...
   📋 Modérateurs trouvés: [nom_compte_b (id_compte_b)]
   ✅ Résultat: ID_COMPTE_B EST modérateur de ID_COMPTE_A
   ```

2. **Dans l'interface**, le Compte B devrait voir l'interface de modération

## 🐛 Dépannage

### Problème : "Aucun token Twitch trouvé pour le streamer"
- Le streamer (Compte A) n'est pas connecté à l'app
- Reconnectez-vous avec le Compte A

### Problème : "permissions insuffisantes"
- Le scope `moderation:read` n'est pas accordé
- Déconnectez-vous et reconnectez-vous pour avoir les nouveaux scopes

### Problème : "Modérateurs trouvés: []"
- Le Compte B n'est pas vraiment modérateur du Compte A sur Twitch
- Vérifiez sur le dashboard Twitch

### Problème : "N'EST PAS modérateur"
- Vérifiez que les IDs Twitch correspondent
- Regardez les logs pour voir les IDs utilisés

## 🔧 Debug

### 1. Panel de Debug
1. Allez sur http://localhost:5173/debug (lien "🔧 Debug" dans le header)
2. Vérifiez les tokens stockés
3. Testez la modération en saisissant les IDs utilisateur

### 2. Debug en Temps Réel
- Un **panneau de debug** apparaît en bas à droite de l'écran dans les sessions
- Il affiche le rôle actuel, les IDs et l'état en temps réel
- Surveillez si le rôle change de "viewer" à "moderator"

### 3. Test Manuel depuis la Console
Dans la console du navigateur, utilisez :
```javascript
// Tester l'API de modération manuellement
await testModeration('STREAMER_ID', 'USER_ID', 'TOKEN')
```

### 4. Endpoints de Debug
- `GET /api/auth/debug/tokens` - Voir les tokens stockés
- `GET /api/auth/debug/moderation/:streamerId/:userId` - Tester la modération
- `GET /api/auth/debug/twitch-api/:streamerId` - Tester directement l'API Twitch (raw)

### Logs à surveiller
Les logs suivants apparaîtront dans la console du navigateur et du serveur :

**Frontend :**
```javascript
🔍 Vérification du statut de modérateur: {userId, streamerId, token}
🔍 Réponse API modération: {status, ok}
🔍 Données modération reçues: {isModerator, method}
```

**Backend :**
```javascript
🔑 Token Twitch stocké pour: NOM_UTILISATEUR (ID: 123456789)
🔍 Vérification du statut de modérateur via Twitch API...
📋 Modérateurs trouvés: [nom_utilisateur (id)]
✅ Résultat: USER_ID EST/N'EST PAS modérateur de STREAMER_ID
``` 