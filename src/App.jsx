import { useCallback, useEffect, useState } from 'react';
import WelcomeScreen from './components/WelcomeScreen.jsx';
import ProfileSetupScreen from './components/ProfileSetupScreen.jsx';
import HomeScreen from './components/HomeScreen.jsx';
import MatchmakingScreen from './components/MatchmakingScreen.jsx';
import CameraChallenge from './components/CameraChallenge.jsx';
import ResultScreen from './components/ResultScreen.jsx';
import SettingsScreen from './components/SettingsScreen.jsx';
import BottomNav from './components/BottomNav.jsx';
import {
  CHALLENGE_MODES,
  applyChallengeResult,
  createProgression,
  makeChallenge,
  updateProgressionSettings
} from './utils/progression.js';
import { isSupabaseConfigured } from './services/supabaseClient.js';
import {
  deleteRemoteProgression,
  loadRemoteProgression,
  saveRemoteProgression
} from './services/progressionRepository.js';

const screens = {
  welcome: 'welcome',
  setup: 'setup',
  home: 'home',
  matchmaking: 'matchmaking',
  challenge: 'challenge',
  result: 'result',
  settings: 'settings'
};

export default function App() {
  const [bootStatus, setBootStatus] = useState('loading');
  const [syncError, setSyncError] = useState('');
  const [progression, setProgression] = useState(null);
  const [screen, setScreen] = useState(screens.welcome);
  const [challenge, setChallenge] = useState(() => makeChallenge({ mode: CHALLENGE_MODES.maxReps, goal: 20 }));
  const [result, setResult] = useState(null);
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [challengeKey, setChallengeKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function bootApp() {
      setSyncError('');

      if (!isSupabaseConfigured()) {
        setBootStatus('missing-config');
        return;
      }

      try {
        const savedProgression = await loadRemoteProgression();

        if (cancelled) {
          return;
        }

        setProgression(savedProgression);
        setChallenge(makeChallenge({
          mode: CHALLENGE_MODES.maxReps,
          goal: savedProgression?.profile?.maxPushups || 20
        }));
        setScreen(savedProgression?.onboarded ? screens.home : screens.welcome);
        setBootStatus('ready');
      } catch (error) {
        if (!cancelled) {
          setSyncError(getSyncErrorMessage(error));
          setBootStatus('error');
        }
      }
    }

    bootApp();

    return () => {
      cancelled = true;
    };
  }, []);

  const persistProgression = useCallback(async (nextProgression) => {
    setSyncError('');
    setProgression(nextProgression);

    try {
      const savedProgression = await saveRemoteProgression(nextProgression);
      setProgression(savedProgression);
      return savedProgression;
    } catch (error) {
      setSyncError(getSyncErrorMessage(error));
      throw error;
    }
  }, []);

  const updateCameraPermission = useCallback((cameraPermission) => {
    if (!progression?.onboarded) {
      return;
    }

    const nextProgression = updateProgressionSettings(progression, {
      cameraPermission,
      cameraCheckedAt: new Date().toISOString()
    });

    setProgression(nextProgression);
    persistProgression(nextProgression).catch(() => undefined);
  }, [persistProgression, progression]);

  async function completeSetup(profile) {
    const nextProgression = createProgression(profile);

    try {
      const savedProgression = await persistProgression(nextProgression);
      setChallenge(makeChallenge({ mode: CHALLENGE_MODES.maxReps, goal: savedProgression.profile.maxPushups }));
      setScreen(screens.home);
    } catch {
      setScreen(screens.setup);
    }
  }

  function startChallenge(nextChallenge) {
    setChallenge(nextChallenge);
    setResult(null);
    setSelectedOpponent(null);
    setChallengeKey((key) => key + 1);
    setScreen(screens.matchmaking);
  }

  function enterChallenge(opponent) {
    setSelectedOpponent(opponent);
    setScreen(screens.challenge);
  }

  function completeChallenge(nextResult) {
    const resultWithMode = {
      ...nextResult,
      mode: challenge.mode,
      durationMs: challenge.durationMs
    };
    setResult(resultWithMode);
    if (progression?.onboarded) {
      const nextProgression = applyChallengeResult(progression, resultWithMode);
      setProgression(nextProgression);
      persistProgression(nextProgression).catch(() => undefined);
    }
    setScreen(screens.result);
  }

  function goHome() {
    setResult(null);
    setScreen(screens.home);
  }

  function openSettings() {
    setScreen(screens.settings);
  }

  async function handleDeleteAccount() {
    try {
      await deleteRemoteProgression();
      setProgression(null);
      setResult(null);
      setSelectedOpponent(null);
      setChallenge(makeChallenge({ mode: CHALLENGE_MODES.maxReps, goal: 20 }));
      setScreen(screens.welcome);
    } catch (error) {
      setSyncError(getSyncErrorMessage(error));
    }
  }

  if (bootStatus === 'loading') {
    return (
      <div className="app-shell">
        <SystemScreen
          title="Connexion Supabase"
          message="Synchronisation du profil et de la progression..."
        />
      </div>
    );
  }

  if (bootStatus === 'missing-config') {
    return (
      <div className="app-shell">
        <SystemScreen
          title="Configuration Supabase requise"
          message="Ajoute VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans tes variables d'environnement, puis redéploie l'application."
        />
      </div>
    );
  }

  if (bootStatus === 'error') {
    return (
      <div className="app-shell">
        <SystemScreen
          title="Synchronisation impossible"
          message={syncError || 'Impossible de contacter Supabase pour le moment.'}
        >
          <button className="primary-button" type="button" onClick={() => window.location.reload()}>
            Réessayer
          </button>
        </SystemScreen>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {syncError && (
        <div className="sync-error-banner" role="alert">
          {syncError}
        </div>
      )}

      {screen === screens.welcome && <WelcomeScreen onStart={() => setScreen(screens.setup)} />}

      {screen === screens.setup && <ProfileSetupScreen onComplete={completeSetup} />}

      {screen === screens.home && progression?.onboarded && (
        <HomeScreen
          progression={progression}
          defaultGoal={challenge.goal}
          onStart={startChallenge}
          onOpenSettings={openSettings}
        />
      )}

      {screen === screens.matchmaking && (
        <MatchmakingScreen
          challenge={challenge}
          progression={progression}
          onReady={enterChallenge}
          onCancel={goHome}
          onOpenSettings={openSettings}
        />
      )}

      {screen === screens.challenge && (
        <CameraChallenge
          key={challengeKey}
          challenge={challenge}
          cameraPermission={progression?.settings?.cameraPermission || 'unknown'}
          onCameraPermissionChange={updateCameraPermission}
          onComplete={completeChallenge}
        />
      )}

      {screen === screens.result && result && (
        <ResultScreen
          result={result}
          progression={progression}
          opponent={selectedOpponent}
          onHome={goHome}
        />
      )}

      {screen === screens.settings && progression?.onboarded && (
        <SettingsScreen
          progression={progression}
          onBack={goHome}
          onCameraPermissionChange={updateCameraPermission}
          onDeleteAccount={handleDeleteAccount}
        />
      )}

      {progression?.onboarded && screen !== screens.result && <BottomNav />}
    </div>
  );
}

function SystemScreen({ title, message, children }) {
  return (
    <main className="screen system-screen">
      <section className="system-card">
        <div className="system-loader" aria-hidden="true" />
        <h1>{title}</h1>
        <p>{message}</p>
        {children}
      </section>
    </main>
  );
}

function getSyncErrorMessage(error) {
  return error?.message || 'Synchronisation Supabase impossible.';
}
