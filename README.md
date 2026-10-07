# RNGWorld

5 tirages par jour parmi 130 000 villes du monde. Garde la meilleure, verrouille-la, compare avec tes amis.

Le site est entièrement statique (GitHub Pages). Les comptes et la partie partagée passent par Firebase (gratuit à cette échelle).

## Mise en ligne (environ 15 minutes)

### 1. Firebase : créer le projet
1. Va sur https://console.firebase.google.com et clique sur **Créer un projet**. Nom : `rngworld`. Google Analytics n'est pas nécessaire.
2. Dans le projet, clique sur l'icône **Web `</>`** pour ajouter une application web. Surnom : `rngworld`. Ne coche pas Firebase Hosting.
3. Firebase affiche un bloc `firebaseConfig`. Copie les six valeurs (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`) dans **`config.js`**, à la place des `REMPLACE_MOI`.
4. Toujours dans `config.js`, remplace `ton.email@exemple.com` par ton adresse e-mail : c'est le compte admin (remise à zéro des tirages et des villes).

> Ces clés sont publiques par conception : la sécurité vient des règles Firestore de l'étape 3.

### 2. Firebase : activer la connexion
1. Menu **Authentication** > **Commencer**.
2. Onglet **Sign-in method** : active **Google** (choisis ton e-mail d'assistance) puis **E-mail/Mot de passe**.
3. Onglet **Paramètres** > **Domaines autorisés** > **Ajouter un domaine** : ajoute l'adresse de ton site, par exemple `rngworld.github.io`.

### 3. Firebase : la base de données
1. Menu **Firestore Database** > **Créer une base de données**. Emplacement : `eur3 (europe-west)`. Démarre en **mode production**.
2. Onglet **Règles** : remplace tout par le contenu du fichier **`firestore.rules`**, mets ton e-mail à la place de `ton.email@exemple.com`, puis **Publier**.

### 4. GitHub Pages
1. Dans ton organisation GitHub, crée un dépôt **public** nommé `NOMDELORGA.github.io` (par exemple `rngworld.github.io`).
2. Envoie tous les fichiers de ce dossier à la racine du dépôt (**Add file** > **Upload files**, ou `git push`). Garde bien le fichier caché `.nojekyll`.
3. **Settings** > **Pages** > Source : **Deploy from a branch**, branche **main**, dossier **/ (root)**. Enregistre.
4. Après une à deux minutes, le jeu est en ligne sur `https://NOMDELORGA.github.io`.

## Fonctionnement
- **Sans compte** : on peut tirer des villes, mais pas les garder. En se connectant, les tirages du jour sont conservés.
- **Avec un compte** (Google ou e-mail + mot de passe) : collection, pseudo unique, amis et classements, sauvegardés en ligne et retrouvés sur tous les appareils.
- **Verrous** : une ville gardée est enregistrée dans `claims/{ville}` par une transaction. Deux joueurs ne peuvent pas obtenir la même ville.
- **Photos** : chargées depuis Wikimedia Commons via Wikidata, avec l'auteur et la licence affichés sur la photo dans la fiche de la ville.
- **Contours** : limites officielles OpenStreetMap quand elles existent (1 requête par seconde maximum), sinon l'emprise urbaine ou un contour estimé.
- **Mode local** : tant que `config.js` contient `REMPLACE_MOI`, le jeu fonctionne sans Firebase et garde tout dans le navigateur.

## Fichiers
| Fichier | Rôle |
|---|---|
| `index.html` | Le jeu |
| `config.js` | Clés Firebase et liste des admins |
| `firestore.rules` | Règles de sécurité à coller dans Firebase |
| `cities.txt`, `names.json`, `regions.json`, `blurbs.json` | Villes et critères |
| `geo/`, `land10.json`, `countries-*.json`, `land-110m.json` | Cartes et contours |
| `lib/` | Bibliothèques (d3, topojson, polygon-clipping, Firebase) |

## Sources
GeoNames (CC BY 4.0), Natural Earth (domaine public), UNESCO, Smithsonian Global Volcanism Program, PB2002 (Bird 2003), Hipo university-domains-list, Wikidata (CC0), Wikimedia Commons (licences par image), OpenStreetMap (ODbL).
