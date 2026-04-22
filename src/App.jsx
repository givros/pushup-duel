import { useCallback, useEffect, useRef, useState } from 'react';
import WelcomeScreen from './components/WelcomeScreen.jsx';
import ProfileSetupScreen from './components/ProfileSetupScreen.jsx';
import StarterChallengePrompt from './components/StarterChallengePrompt.jsx';
import CameraGuideScreen from './components/CameraGuideScreen.jsx';
import HomeScreen from './components/HomeScreen.jsx';
import ChallengesScreen from './components/ChallengesScreen.jsx';
import StatsScreen from './components/StatsScreen.jsx';
import MatchmakingScreen from './components/MatchmakingScreen.jsx';
import CameraChallenge from './components/CameraChallenge.jsx';
import ResultScreen from './components/ResultScreen.jsx';
import SettingsScreen from './components/SettingsScreen.jsx';
import BottomNav from './components/BottomNav.jsx';
import {
  CHALLENGE_MODES,
  RESULT_OUTCOMES,
  applyChallengeResult,
  createProgression,
  getDuelHistoryId,
  makeChallenge,
  updateDuelHistoryOutcome,
  updateProgressionSettings
} from './utils/progression.js';
import { getDuelOutcome, getOpponentResult, getPlayerResult } from './utils/duelOutcome.js';
import { isDuelExpired } from './utils/duelExpiration.js';
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
  expireStaleDuelChallenges,
  getDuelChallenge,
  listIncomingChallenges,
  listCompletedDuelChallenges,
  listOutgoingChallenges,
  listOpponentCandidates
} from './services/duelChallengeService.js';
import { usePortraitOrientation } from './hooks/usePortraitOrientation.js';

const screens = {
  welcome: 'welcome',
  setup: 'setup',
  starter: 'starter',
  cameraGuide: 'cameraGuide',
  home: 'home',
  challenges: 'challenges',
  stats: 'stats',
  matchmaking: 'matchmaking',
  challenge: 'challenge',
  result: 'result',
  settings: 'settings'
};

const HOME_REFRESH_INTERVAL_MS = 7000;
const STARTER_OPPONENT = {
  id: 'maya-starter',
  pseudo: 'MayaCore',
  stat: '15-push-up challenge',
  rank: 'Silver rank'
};
const DEFAULT_PUSHUP_GOAL = 15;
const STARTER_CHALLENGE_GOAL = 15;

export default function App() {
  usePortraitOrientation();

  const [bootStatus, setBootStatus] = useState('loading');
  const [syncError, setSyncError] = useState('');
  const [progression, setProgression] = useState(null);
  const [screen, setScreen] = useState(screens.welcome);
  const [challenge, setChallenge] = useState(() => makeChallenge({ mode: CHALLENGE_MODES.maxReps, goal: DEFAULT_PUSHUP_GOAL }));
  const [result, setResult] = useState(null);
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [opponentCandidates, setOpponentCandidates] = useState([]);
  const [incomingChallenges, setIncomingChallenges] = useState([]);
  const [outgoingChallenges, setOutgoingChallenges] = useState([]);
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
          goal: savedProgression?.profile?.maxPushups || DEFAULT_PUSHUP_GOAL
        }));
        setScreen(getInitialScreen(savedProgression));
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

  const syncCompletedDuelOutcomes = useCallback(async () => {
    const currentProgression = progressionRef.current;

    if (!currentProgression?.onboarded) {
      return;
    }

    const completedDuels = await listCompletedDuelChallenges();
    let nextProgression = currentProgression;
    let changed = false;

    completedDuels.forEach((duel) => {
      const outcome = getDuelOutcome(duel, duel.role);
      const historyId = getDuelHistoryId(duel.id, duel.role);
      const hasHistoryEntry = nextProgression.stats.history.some((entry) => entry.id === historyId);

      if (!hasHistoryEntry && duel.role === 'receiver') {
        const recoveredResult = makeResultFromDuel(duel, duel.role);

        if (recoveredResult) {
          nextProgression = applyChallengeResult(
            nextProgression,
            recoveredResult,
            makeDuelProgressionOptions(duel, duel.role, recoveredResult)
          );
          changed = true;
        }

        return;
      }

      const resolvedProgression = updateDuelHistoryOutcome(nextProgression, {
        duelId: duel.id,
        role: duel.role,
        outcome,
        opponentResult: getOpponentResult(duel, duel.role)
      });

      if (resolvedProgression) {
        nextProgression = resolvedProgression;
        changed = true;
      }
    });

    if (changed) {
      await persistProgression(nextProgression);
    }
  }, [persistProgression]);

  const refreshIncomingChallenges = useCallback(async () => {
    if (!progressionRef.current?.onboarded) {
      setIncomingChallenges([]);
      setOutgoingChallenges([]);
      return;
    }

    try {
      await expireStaleDuelChallenges();
      const [receivedChallenges, sentChallenges] = await Promise.all([
        listIncomingChallenges(),
        listOutgoingChallenges()
      ]);
      setIncomingChallenges(receivedChallenges);
      setOutgoingChallenges(sentChallenges);
      await syncCompletedDuelOutcomes();
    } catch (error) {
      setSyncError(getSyncErrorMessage(error));
    }
  }, [syncCompletedDuelOutcomes]);

  useEffect(() => {
    if (
      bootStatus !== 'ready' ||
      !progression?.onboarded ||
      (screen !== screens.home && screen !== screens.challenges)
    ) {
      return undefined;
    }

    let cancelled = false;
    let refreshing = false;

    async function refreshHomeData() {
      if (cancelled || refreshing || document.visibilityState === 'hidden') {
        return;
      }

      refreshing = true;

      try {
        await refreshIncomingChallenges();
      } finally {
        refreshing = false;
      }
    }

    refreshHomeData();
    const intervalId = window.setInterval(refreshHomeData, HOME_REFRESH_INTERVAL_MS);
    window.addEventListener('focus', refreshHomeData);
    document.addEventListener('visibilitychange', refreshHomeData);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshHomeData);
      document.removeEventListener('visibilitychange', refreshHomeData);
    };
  }, [bootStatus, progression?.onboarded, refreshIncomingChallenges, screen]);

  useEffect(() => {
    if (
      screen !== screens.result ||
      result?.duelOutcome !== RESULT_OUTCOMES.pending ||
      !result?.duelId ||
      !result?.duelRole
    ) {
      return undefined;
    }

    let cancelled = false;
    let intervalId = 0;

    async function refreshDuelResult() {
      try {
        const duel = await getDuelChallenge(result.duelId);
        const outcome = getDuelOutcome(duel, result.duelRole);

        if (cancelled || outcome === RESULT_OUTCOMES.pending) {
          return;
        }

        const resolvedResult = decorateResultWithDuel(result, duel, result.duelRole);
        setResult((current) => (current?.duelId === result.duelId ? resolvedResult : current));
        resolveDuelInProgression(duel, result.duelRole);
        window.clearInterval(intervalId);
      } catch (error) {
        if (!cancelled) {
          setSyncError(getSyncErrorMessage(error));
        }
      }
    }

    refreshDuelResult();
    intervalId = window.setInterval(refreshDuelResult, 4500);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [result, screen]);

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
      await persistProgression(nextProgression);
      setScreen(screens.starter);
    } catch {
      setScreen(screens.setup);
    }
  }

  function openStarterCameraGuide() {
    setChallenge(makeChallenge({
      mode: CHALLENGE_MODES.fixedGoal,
      goal: STARTER_CHALLENGE_GOAL
    }));
    setResult(null);
    setSelectedOpponent(STARTER_OPPONENT);
    setActiveDuel({ type: 'starter' });
    setScreen(screens.cameraGuide);
  }

  function startStarterChallenge() {
    setChallenge(makeChallenge({
      mode: CHALLENGE_MODES.fixedGoal,
      goal: STARTER_CHALLENGE_GOAL
    }));
    setResult(null);
    setSelectedOpponent(STARTER_OPPONENT);
    setActiveDuel({ type: 'starter' });
    setChallengeKey((key) => key + 1);
    setScreen(screens.challenge);
  }

  function startChallenge(nextChallenge) {
    if (progressionRef.current?.onboarded && !progressionRef.current.settings.starterChallengeCompleted) {
      openStarterCameraGuide();
      return;
    }

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
    if (isDuelExpired(duel.expiresAt)) {
      refreshIncomingChallenges();
      return;
    }

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

  function resolveDuelInProgression(duel, role) {
    const currentProgression = progressionRef.current;
    const outcome = getDuelOutcome(duel, role);

    if (!currentProgression?.onboarded || outcome === RESULT_OUTCOMES.pending) {
      return;
    }

    const resolvedProgression = updateDuelHistoryOutcome(currentProgression, {
      duelId: duel.id,
      role,
      outcome,
      opponentResult: getOpponentResult(duel, role)
    });

    if (resolvedProgression) {
      progressionRef.current = resolvedProgression;
      setProgression(resolvedProgression);
      persistProgression(resolvedProgression).catch(() => undefined);
    }
  }

  async function completeChallenge(nextResult) {
    const currentProgression = progressionRef.current;
    const resultWithMode = {
      ...nextResult,
      mode: challenge.mode,
      durationMs: challenge.durationMs
    };

    if (activeDuel?.type === 'starter' && isAbandonedResult(resultWithMode)) {
      setResult(null);
      setActiveDuel(null);
      setSelectedOpponent(null);
      setScreen(screens.home);
      return;
    }

    let displayResult = {
      ...resultWithMode,
      outcome: getLocalOutcome(resultWithMode)
    };
    let progressionOptions = {
      outcome: displayResult.outcome
    };

    if (currentProgression?.onboarded) {
      try {
        if (activeDuel?.type === 'incoming') {
          const completedDuel = await completeIncomingChallenge({
            duel: activeDuel.duel,
            result: resultWithMode,
            progression: currentProgression
          });

          if (completedDuel) {
            displayResult = decorateResultWithDuel(resultWithMode, completedDuel, 'receiver');
            progressionOptions = makeDuelProgressionOptions(completedDuel, 'receiver', displayResult);
            setIncomingChallenges((current) => current.filter((duel) => duel.id !== activeDuel.duel.id));
          } else {
            displayResult = makePendingResult(resultWithMode, activeDuel.duel.opponent);
            progressionOptions = {
              outcome: RESULT_OUTCOMES.pending,
              opponentName: activeDuel.duel.opponent?.pseudo || null
            };
          }
        } else if (activeDuel?.type === 'starter') {
          displayResult = {
            ...resultWithMode,
            outcome: getLocalOutcome(resultWithMode),
            starterChallenge: true
          };
          progressionOptions = {
            outcome: displayResult.outcome
          };
        } else if (shouldSendOutgoingDuel(resultWithMode, activeDuel, selectedOpponent)) {
          const sentDuel = await createOutgoingChallenge({
            challenge,
            result: resultWithMode,
            opponent: selectedOpponent,
            progression: currentProgression
          });

          if (sentDuel) {
            displayResult = decorateResultWithDuel(resultWithMode, sentDuel, 'challenger');
            progressionOptions = makeDuelProgressionOptions(sentDuel, 'challenger', displayResult);
          } else {
            displayResult = makePendingResult(resultWithMode, selectedOpponent);
            progressionOptions = {
              outcome: RESULT_OUTCOMES.pending,
              opponentName: selectedOpponent?.pseudo || null
            };
          }
        } else if (!activeDuel && !isAbandonedResult(resultWithMode)) {
          displayResult = makePendingResult(resultWithMode, selectedOpponent);
          progressionOptions = {
            outcome: RESULT_OUTCOMES.pending,
            opponentName: selectedOpponent?.pseudo || null
          };
        }
      } catch (error) {
        setSyncError(getSyncErrorMessage(error));

        if (!isAbandonedResult(resultWithMode)) {
          displayResult = makePendingResult(resultWithMode, selectedOpponent);
          progressionOptions = {
            outcome: RESULT_OUTCOMES.pending,
            opponentName: selectedOpponent?.pseudo || null
          };
        }
      }

      const resultProgression = applyChallengeResult(currentProgression, displayResult, progressionOptions);
      const nextProgression = activeDuel?.type === 'starter'
        ? updateProgressionSettings(resultProgression, { starterChallengeCompleted: true })
        : resultProgression;
      progressionRef.current = nextProgression;
      setProgression(nextProgression);
      persistProgression(nextProgression).catch(() => undefined);
    }

    setResult(displayResult);
    setScreen(screens.result);
  }

  function goHome() {
    setResult(null);
    setActiveDuel(null);
    setScreen(screens.home);
    refreshIncomingChallenges();
  }

  function handleNavNavigate(destination) {
    if (destination === 'history') {
      setScreen(screens.challenges);
      refreshIncomingChallenges();
      return;
    }

    if (destination === 'stats') {
      setScreen(screens.stats);
      return;
    }

    if (destination === 'profile') {
      openSettings();
      return;
    }

    if (destination === 'home') {
      goHome();
    }
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
      setIncomingChallenges([]);
      setOutgoingChallenges([]);
      setActiveDuel(null);
      setChallenge(makeChallenge({ mode: CHALLENGE_MODES.maxReps, goal: DEFAULT_PUSHUP_GOAL }));
      setScreen(screens.welcome);
    } catch (error) {
      setSyncError(getSyncErrorMessage(error));
    }
  }

  if (bootStatus === 'loading') {
    return (
      <div className="app-shell">
        <SystemScreen
          title="Loading"
          message="Preparing your profile..."
        />
      </div>
    );
  }

  if (bootStatus === 'missing-config') {
    return (
      <div className="app-shell">
        <SystemScreen
          title="App unavailable"
          message="Profile saving is not configured yet. Try again in a few moments."
        />
      </div>
    );
  }

  if (bootStatus === 'error') {
    return (
      <div className="app-shell">
        <SystemScreen
          title="Connection failed"
          message={syncError || 'Unable to load your profile right now.'}
        >
          <button className="primary-button" type="button" onClick={() => window.location.reload()}>
            Retry
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

      {screen === screens.starter && progression?.onboarded && (
        <StarterChallengePrompt
          profile={progression.profile}
          onStart={openStarterCameraGuide}
        />
      )}

      {screen === screens.cameraGuide && progression?.onboarded && (
        <CameraGuideScreen onStart={startStarterChallenge} />
      )}

      {screen === screens.home && progression?.onboarded && (
        <HomeScreen
          progression={progression}
          defaultGoal={challenge.goal}
          starterChallengePending={!progression.settings.starterChallengeCompleted}
          onStart={startChallenge}
          onStartStarterChallenge={openStarterCameraGuide}
          onOpenSettings={openSettings}
        />
      )}

      {screen === screens.challenges && progression?.onboarded && (
        <ChallengesScreen
          progression={progression}
          incomingChallenges={incomingChallenges}
          outgoingChallenges={outgoingChallenges}
          starterChallengePending={!progression.settings.starterChallengeCompleted}
          onAcceptChallenge={acceptIncomingChallenge}
          onDeclineChallenge={declineChallenge}
          onRefreshChallenges={refreshIncomingChallenges}
          onStartStarterChallenge={openStarterCameraGuide}
          onOpenSettings={openSettings}
        />
      )}

      {screen === screens.stats && progression?.onboarded && (
        <StatsScreen
          progression={progression}
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

      {progression?.onboarded && screen !== screens.result && screen !== screens.starter && screen !== screens.cameraGuide && activeDuel?.type !== 'starter' && (
        <BottomNav active={getActiveNav(screen)} onNavigate={handleNavNavigate} />
      )}
    </div>
  );
}

function getInitialScreen(progression) {
  if (!progression?.onboarded) {
    return screens.welcome;
  }

  return progression.settings.starterChallengeCompleted ? screens.home : screens.starter;
}

function getActiveNav(screen) {
  if (screen === screens.challenges) {
    return 'history';
  }

  if (screen === screens.stats) {
    return 'stats';
  }

  if (screen === screens.settings) {
    return 'profile';
  }

  return 'home';
}

function decorateResultWithDuel(result, duel, role) {
  const outcome = getDuelOutcome(duel, role);
  const opponentResult = getOpponentResult(duel, role);
  const playerResult = getPlayerResult(duel, role);

  return {
    ...result,
    pushups: playerResult?.pushups ?? result.pushups,
    timeMs: playerResult?.timeMs ?? result.timeMs,
    reason: playerResult?.reason ?? result.reason,
    mode: duel.challenge.mode,
    goal: duel.challenge.goal,
    durationMs: duel.challenge.durationMs,
    outcome,
    duelId: duel.id,
    duelRole: role,
    duelStatus: duel.status,
    duelOutcome: outcome,
    duelCreatedAt: duel.createdAt,
    duelExpiresAt: duel.expiresAt,
    opponentName: duel.opponent?.pseudo || result.opponentName || null,
    opponentPushups: opponentResult?.pushups ?? null,
    opponentTimeMs: opponentResult?.timeMs ?? null,
    opponentReason: opponentResult?.reason ?? null
  };
}

function makeDuelProgressionOptions(duel, role, result) {
  return {
    outcome: result.outcome,
    historyId: getDuelHistoryId(duel.id, role),
    duelId: duel.id,
    duelRole: role,
    opponentName: duel.opponent?.pseudo || null,
    opponentPushups: result.opponentPushups,
    opponentTimeMs: result.opponentTimeMs,
    opponentReason: result.opponentReason
  };
}

function makeResultFromDuel(duel, role) {
  const playerResult = getPlayerResult(duel, role);

  if (!playerResult) {
    return null;
  }

  return decorateResultWithDuel({
    pushups: playerResult.pushups,
    timeMs: playerResult.timeMs,
    reason: playerResult.reason,
    mode: duel.challenge.mode,
    goal: duel.challenge.goal,
    durationMs: duel.challenge.durationMs
  }, duel, role);
}

function makePendingResult(result, opponent) {
  return {
    ...result,
    outcome: RESULT_OUTCOMES.pending,
    duelOutcome: RESULT_OUTCOMES.pending,
    duelStatus: 'pending',
    opponentName: opponent?.pseudo || null
  };
}

function shouldSendOutgoingDuel(result, activeDuel, opponent) {
  return !activeDuel && Boolean(opponent?.userId) && !isAbandonedResult(result);
}

function getLocalOutcome(result) {
  return isAbandonedResult(result) ? RESULT_OUTCOMES.defeat : RESULT_OUTCOMES.victory;
}

function isAbandonedResult(result) {
  return result.reason === 'forfeit' || result.reason === 'stopped';
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
  return error?.message || 'Unable to save your profile.';
}
