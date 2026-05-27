# L'Imposteur 🎭

Jeu multijoueur en ligne (Undercover + Mr White) — chacun sur son téléphone.

**Stack** : React 18 + Vite + Firebase (Firestore + Auth anonyme + Hosting)
**Mobile-first** · ~150 paires de mots FR · 8 catégories

---

## 🚀 Setup (10 min)

### 1. Installe les dépendances
```bash
cd imposteur
npm install
```

### 2. Crée un projet Firebase
1. Va sur https://console.firebase.google.com → **Add project** → choisis un nom (ex. `imposteur-app`)
2. Désactive Google Analytics (pas nécessaire)
3. Dans le projet, active :
   - **Authentication** → Sign-in method → **Anonymous** → Enable
   - **Firestore Database** → Create database → mode test ou production (peu importe, on push nos règles)
4. Project Settings (⚙️) → tout en bas, **Your apps** → icône web `</>` → enregistre une app → copie la config

### 3. Configure les variables d'environnement
Copie `.env.example` en `.env` et remplis avec les valeurs Firebase :
```bash
cp .env.example .env
```
```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=imposteur-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=imposteur-app
VITE_FIREBASE_STORAGE_BUCKET=imposteur-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 4. Lance en local
```bash
npm run dev
```
Ouvre http://localhost:5173 (et le QR/IP affiché pour tester sur ton tel)

### 5. Déploie sur Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase use --add   # sélectionne ton projet imposteur-app
firebase deploy --only firestore:rules,hosting   # build + deploy
```

Tu obtiens une URL `https://imposteur-app.web.app` partageable à tes potes. 🎉

---

## 🎮 Règles

- **3 joueurs minimum**
- Chaque joueur reçoit secrètement un rôle :
  - **Civil** (majorité) → tous le même mot
  - **Imposteur** → un mot proche mais différent
  - **Mr White** → aucun mot, doit bluffer total
- À chaque manche : chacun donne **un seul mot** qui décrit son mot secret
- Vote → joueur le plus voté éliminé
- Si Mr White éliminé → il a 1 chance de deviner le mot des civils (gagne solo)
- **Civils gagnent** si tous les méchants sont éliminés
- **Méchants gagnent** s'ils sont en supériorité numérique

---

## 📂 Architecture

```
src/
├── App.jsx              # Routing + subscriptions Firestore
├── firebase.js          # Init Firebase + auth anonyme
├── gameLogic.js         # Attribution rôles, vote, victoire
├── words.js             # 150+ paires de mots, 8 catégories
├── index.css            # Design system (Anton + Manrope, noir/rouge)
└── components/
    ├── Home.jsx         # Créer / rejoindre
    ├── Lobby.jsx        # Salle d'attente + paramètres hôte
    ├── Game.jsx         # Router des phases
    └── phases/
        ├── RoleReveal.jsx
        ├── Discussion.jsx
        ├── Voting.jsx
        ├── MrWhiteGuess.jsx
        ├── RoundEnd.jsx
        └── Finished.jsx
```

## 🗄 Modèle Firestore

```
rooms/{CODE}
  hostId, status, settings, round,
  speakingOrder[], currentTurn,
  civilWord, imposterWord,
  votes{voterId: targetId},
  eliminatedThisRound, mrWhiteGuess, mrWhiteWon, winner

rooms/{CODE}/players/{uid}
  nickname, isHost, alive, role, word, joinedAt
```

## 🎨 Custom

- Ajouter des mots → `src/words.js` (juste push dans une catégorie)
- Changer les couleurs → variables CSS au top de `src/index.css`
- Ajouter une catégorie → ajoute la clé dans `CATEGORIES` + `WORD_PAIRS`

## ⚠️ À durcir avant prod

Les règles Firestore sont volontairement permissives (auth anonyme requise + hôte peut tout faire). Pour une vraie prod :
- Limiter `update` aux champs autorisés selon le statut de la room
- Empêcher un joueur de voter pour lui-même côté serveur (Cloud Function)
- TTL sur les rooms inactives (Cloud Function planifiée)

Have fun. 🎭
