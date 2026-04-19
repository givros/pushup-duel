# Push Challenge

MVP React mobile-first de challenge de pompes, avec caméra, MediaPipe Pose Landmarker Web, stockage Supabase, PWA et déploiement GitHub Pages sur :

https://givros.github.io/pushup-duel/

## Prerequis

Utiliser une version récente de Node.js. Node 20+ est recommandé, Node 22 fonctionne très bien.

```bash
node -v
npm -v
```

## Creation du projet

Depuis zéro, le projet peut être créé avec Vite :

```bash
npm create vite@latest pushup-duel -- --template react
cd pushup-duel
npm install
```

Dans ce dépôt, les fichiers Vite/React sont déjà placés à la racine `pushup-duel`.

## Dependances

Les dependances principales sont :

```bash
npm install @mediapipe/tasks-vision
npm install @supabase/supabase-js
npm install -D vite-plugin-pwa
```

## Configuration Supabase

L'application utilise Supabase Auth en connexion anonyme, puis stocke les données dans des tables séparées :

- `player_accounts` : compte joueur, pseudo, niveau, XP, pièces ;
- `player_settings` : réglages utilisateur, dont l'autorisation caméra ;
- `player_stats` : statistiques agrégées et dernier résultat ;
- `player_history` : historique des défis.

La session anonyme permet de garder un profil par navigateur sans écran de login. Le compte applicatif est créé uniquement lorsque l'utilisateur valide l'onboarding.

Dans Supabase :

1. Créer un projet Supabase.
2. Activer les connexions anonymes dans `Authentication -> Sign In / Providers -> Anonymous sign-ins`.
3. Ouvrir le SQL Editor et exécuter le fichier `supabase/schema.sql`.
4. Récupérer l'URL du projet et la clé anon/publishable depuis `Project Settings -> API`.

En local, créer un fichier `.env` à partir de `.env.example` :

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Pour GitHub Pages, ajouter ces secrets dans `Settings -> Secrets and variables -> Actions` :

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Commandes

```bash
npm install
npm run dev
npm run build
npm run preview
```

`npm run build` genere le dossier `/dist`, qui est le dossier deploye sur GitHub Pages.

## Configuration GitHub Pages

La configuration critique est dans `vite.config.js` :

- `base: '/pushup-duel/'`
- PWA `start_url: '/pushup-duel/'`
- PWA `scope: '/pushup-duel/'`
- icones dans `public/icons/`

Le workflow `.github/workflows/deploy.yml` installe Node, lance `npm install`, injecte les variables Supabase depuis les secrets GitHub, construit avec `npm run build`, puis publie `/dist`.

Dans GitHub :

1. Aller dans `Settings -> Pages`.
2. Choisir `GitHub Actions` comme source.
3. Chaque push sur `main` déploie automatiquement l'application.

## Test sur iPhone

La caméra exige un contexte sécurisé. Pour tester sur iPhone, utiliser l'URL HTTPS GitHub Pages après déploiement :

https://givros.github.io/pushup-duel/

En local, `localhost` fonctionne sur la machine de développement, mais un iPhone qui accède à une IP locale en HTTP peut refuser la caméra.

## Detection des pompes

La détection est implémentée dans :

- `src/utils/poseMath.js`
- `src/utils/pushupDetector.js`
- `src/services/poseLandmarkerService.js`

Le détecteur sélectionne le côté du corps le plus fiable, calcule l'angle épaule-coude-poignet, filtre les frames peu fiables, puis compte uniquement un cycle complet :

1. position haute détectée avec bras tendus ;
2. position basse détectée avec coude plié ;
3. retour en position haute ;
4. comptage après hysteresis, délai minimum et cooldown.

Seuils principaux dans `PUSHUP_DETECTOR_DEFAULTS` :

- `minConfidence` : confiance minimale des points MediaPipe ;
- `highElbowAngle` : angle minimum pour la position haute ;
- `lowElbowAngle` : angle maximum pour la position basse ;
- `minStableFrames` : nombre de frames cohérentes avant transition ;
- `minTransitionMs` : durée minimale entre haut/bas ;
- `cooldownMs` : anti double-comptage ;
- `minShoulderTravel` : déplacement minimal de l'épaule, normalisé par le torse ;
- `minTorsoLength` : filtre les personnes trop petites ou trop loin dans l'image.

Pour ajuster la precision :

- si l'app compte trop facilement, augmenter `minConfidence`, diminuer `lowElbowAngle` ou augmenter `minShoulderTravel` ;
- si l'app manque des répétitions valides, baisser légèrement `minConfidence`, augmenter `lowElbowAngle` ou baisser `minShoulderTravel` ;
- placer le téléphone de côté, assez bas, avec le haut du corps visible.
