import { useCallback, useEffect, useRef, useState } from 'react';
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
import {
  completeIncomingChallenge,
  createOutgoingChallenge,
  declineIncomingChallenge,
  listIncomingChallenges,
  listOpponentCandidates
} from './services/duelChallengeService.js';

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
  const [opponentCandidates, setOpponentCandidates] = useState([]);
  const [incomingChallenges, setIncomingChallenges] = useState([]);
  const [activeDuel, setActiveDuel] = useState(null);
  const [challengeKey, setChallengeKey] = useState(0);
  const progressionRef = useRef(null);

  useEffect(() => {
    progressionRef.current = progression;
  }, [progression]);

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
    progressionRef.current = nextProgression;
    setProgression(nextProgression);

    try {
      const savedProgression = await saveRemoteProgression(nextProgression);
      progressionRef.current = savedProgression;
      setProgression(savedProgression);
      return savedProgression;
    } catch (error) {
      setSyncError(getSyncErrorMessage(error));
      throw error;
    }
  }, []);

  const refreshIncomingChallenges = useCallback(async () => {
    if (!progressionRef.current?.onboarded) {
      setIncomingChallenges([]);
      return;
    }

    try {
      const challenges = await listIncomingChallenges();
      setIncomingChallenges(challenges);
    } catch (error) {
      setSyncError(getSyncErrorMessage(error));
    }
  }, []);

  useEffect(() => {
    if (bootStatus === 'ready' && progression?.onboarded) {
      refreshIncomingChallenges();
    }
  }, [bootStatus, progression?.onboarded, refreshIncomingChallenges]);

  const updateCameraPermission = useCallback((cameraPermission) => {
    const currentProgression = progressionRef.current;

    if (!currentProgression?.onboarded) {
      return;
    }

    const nextProgression = updateProgressionSettings(currentProgression, {
      cameraPermission,
      cameraCheckedAt: new Date().toISOString()
    });

    progressionRef.current = nextProgression;
    setProgression(nextProgression);
    persistProgression(nextProgression).catch(() => undefined);
  }, [persistProgression]);

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
    setActiveDuel(null);
    setOpponentCandidates([]);
    setChallengeKey((key) => key + 1);
    setScreen(screens.matchmaking);

    listOpponentCandidates()
      .then(setOpponentCandidates)
      .catch((error) => {
        setOpponentCandidates([]);
        setSyncError(getSyncErrorMessage(error));
      });
  }

  function enterChallenge(opponent) {
    setSelectedOpponent(opponent);
    setScreen(screens.challenge);
  }

  function acceptIncomingChallenge(duel) {
    setChallenge(duel.challenge);
    setResult(null);
    setSelectedOpponent(duel.opponent);
    setActiveDuel({ type: 'incoming', duel });
    setChallengeKey((key) => key + 1);
    setScreen(screens.challenge);
  }

  async function declineChallenge(duelId) {
    try {
      await declineIncomingChallenge(duelId);
      setIncomingChallenges((current) => current.filter((duel) => duel.id !== duelId));
    } catch (error) {
      setSyncError(getSyncErrorMessage(error));
    }
  }

  function completeChallenge(nextResult) {
    const currentProgression = progressionRef.current;
    const resultWithMode = {
      ...nextResult,
      mode: challenge.mode,
      durationMs: challenge.durationMs
    };
    setResult(resultWithMode);
    if (currentProgression?.onboarded) {
      const nextProgression = applyChallengeResult(currentProgression, resultWithMode);
      progressionRef.current = nextProgression;
      setProgression(nextProgression);
      persistProgression(nextProgression).catch(() => undefined);
    }

    if (currentProgression?.onboarded && activeDuel?.type === 'incoming') {
      completeIncomingChallenge({
        duel: activeDuel.duel,
        result: resultWithMode,
        progression: currentProgression
      })
        .then(() => {
          setIncomingChallenges((current) => current.filter((duel) => duel.id !== activeDuel.duel.id));
        })
        .catch((error) => setSyncError(getSyncErrorMessage(error)));
    }

    if (
      currentProgression?.onboarded &&
      !activeDuel &&
      selectedOpponent?.userId &&
      resultWithMode.reason !== 'forfeit' &&
      resultWithMode.reason !== 'stopped'
    ) {
      createOutgoingChallenge({
        challenge: resultWithMode,
        result: resultWithMode,
        opponent: selectedOpponent,
        progression: currentProgression
      }).catch((error) => setSyncError(getSyncErrorMessage(error)));
    }

    setScreen(screens.result);
  }

  function goHome() {
    setResult(null);
    setActiveDuel(null);
    setScreen(screens.home);
    refreshIncomingChallenges();
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
          title="Chargement"
          message="Préparation de ton profil..."
        />
      </div>
    );
  }

  if (bootStatus === 'missing-config') {
    return (
      <div className="app-shell">
        <SystemScreen
          title="Application indisponible"
          message="La sauvegarde des profils n'est pas encore configurée. Réessaie dans quelques instants."
        />
      </div>
    );
  }

  if (bootStatus === 'error') {
    return (
      <div className="app-shell">
        <SystemScreen
          title="Connexion impossible"
          message={syncError || 'Impossible de charger ton profil pour le moment.'}
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
          incomingChallenges={incomingChallenges}
          onStart={startChallenge}
          onAcceptChallenge={acceptIncomingChallenge}
          onDeclineChallenge={declineChallenge}
          onRefreshChallenges={refreshIncomingChallenges}
          onOpenSettings={openSettings}
        />
      )}

      {screen === screens.matchmaking && (
        <MatchmakingScreen
          challenge={challenge}
          progression={progression}
          opponents={opponentCandidates}
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
          flow={activeDuel?.type || 'outgoing'}
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
  return error?.message || 'Impossible de sauvegarder ton profil.';
}
