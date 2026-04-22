# Push-up Duel

Mobile-first React MVP for push-up duels with camera tracking, MediaPipe Pose Landmarker Web, Supabase storage, PWA support, and GitHub Pages deployment:

https://givros.github.io/pushup-duel/

## Requirements

Use a recent Node.js version. Node 20+ is recommended, and Node 22 works well.

```bash
node -v
npm -v
```

## Project Setup

From scratch, the project can be created with Vite:

```bash
npm create vite@latest pushup-duel -- --template react
cd pushup-duel
npm install
```

In this repository, the Vite and React files are already located at the `pushup-duel` root.

## Dependencies

Main dependencies:

```bash
npm install @mediapipe/tasks-vision
npm install @supabase/supabase-js
npm install -D vite-plugin-pwa
```

## Supabase Configuration

The app uses Supabase Auth with anonymous sign-in, then stores data in separate tables:

- `player_accounts`: player account, nickname, level, XP, and coins.
- `player_settings`: user settings, including camera permission state.
- `player_stats`: aggregate statistics and the latest result.
- `player_history`: duel history.
- `duel_challenges`: asynchronous duels sent and received between players.

The anonymous session keeps one profile per browser without a login screen. The in-app account is created only when the user completes onboarding.

On first launch, onboarding explains the app in 3 steps, then asks the user to create a profile. New accounts then receive a discovery duel presented as a challenge sent by a local opponent. This first duel is shown only once.

Received, sent, completed, and expired duels are grouped in the `History` tab. To test the full flow, create two accounts from two browsers or two separate browser profiles, then start a duel from the first account against the second.

A sent duel stays pending until the opponent completes their score. When both scores are available, the app compares the results automatically and updates the result screen plus history as a win, loss, or draw.

Each pending duel displays a 24h countdown. When it expires, the duel is resolved on the next home refresh or result-screen refresh: the player who answered wins, and the player who did not answer loses.

The `supabase/schema.sql` file also adds the history metadata required to display the opponent, opponent score, duel role, and expirations.

In Supabase:

1. Create a Supabase project.
2. Enable anonymous sign-ins in `Authentication -> Sign In / Providers -> Anonymous sign-ins`.
3. Open the SQL Editor and run `supabase/schema.sql`.
4. Copy the project URL and anon or publishable key from `Project Settings -> API`.

Locally, create a `.env` file from `.env.example`:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

For GitHub Pages, add these secrets in `Settings -> Secrets and variables -> Actions`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

`npm run build` generates the `/dist` folder, which is deployed to GitHub Pages.

## GitHub Pages Setup

Critical settings live in `vite.config.js`:

- `base: '/pushup-duel/'`
- PWA `start_url: '/pushup-duel/'`
- PWA `scope: '/pushup-duel/'`
- PWA `orientation: 'portrait-primary'`
- icons in `public/icons/`

The `.github/workflows/deploy.yml` workflow installs Node, runs `npm install`, injects Supabase variables from GitHub secrets, builds with `npm run build`, then publishes `/dist`.

In GitHub:

1. Go to `Settings -> Pages`.
2. Choose `GitHub Actions` as the source.
3. Every push to `main` deploys the app automatically.

## Mobile Testing

The camera requires a secure context. To test on mobile, use the HTTPS GitHub Pages URL after deployment:

https://givros.github.io/pushup-duel/

Locally, `localhost` works on the development machine, but a phone accessing a local IP over HTTP may block camera access.

## Push-up Detection

Detection is implemented in:

- `src/utils/poseMath.js`
- `src/utils/pushupDetector.js`
- `src/services/poseLandmarkerService.js`

The detector selects the most reliable side of the body, calculates the shoulder-elbow-wrist angle, filters low-confidence frames, then counts only a complete cycle:

1. high position detected with extended arms.
2. low position detected with bent elbows.
3. return to high position.
4. count after hysteresis, minimum transition time, and cooldown.

Main thresholds in `PUSHUP_DETECTOR_DEFAULTS`:

- `minConfidence`: minimum confidence for MediaPipe landmarks.
- `highElbowAngle`: minimum angle for the high position.
- `lowElbowAngle`: maximum angle for the low position.
- `minStableFrames`: number of consistent frames before a transition.
- `minTransitionMs`: minimum duration between high and low positions.
- `cooldownMs`: double-count protection.
- `minShoulderTravel`: minimum shoulder movement normalized by torso length.
- `minTorsoLength`: filters users who are too small or too far from the camera.

To tune accuracy:

- if the app counts too easily, increase `minConfidence`, decrease `lowElbowAngle`, or increase `minShoulderTravel`.
- if the app misses valid reps, slightly lower `minConfidence`, increase `lowElbowAngle`, or lower `minShoulderTravel`.
- place the phone to the side, fairly low, with the upper body visible.
