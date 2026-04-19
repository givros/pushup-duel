import { useCallback, useState } from 'react';
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
  deleteProgression,
  loadProgression,
  makeChallenge,
  updateProgressionSettings
} from './utils/progression.js';

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
  const [progression, setProgression] = useState(() => loadProgression());
  const [screen, setScreen] = useState(() => (loadProgression()?.onboarded ? screens.home : screens.welcome));
  const [challenge, setChallenge] = useState(() => {
    const saved = loadProgression();
    return makeChallenge({ mode: CHALLENGE_MODES.maxReps, goal: saved?.profile?.maxPushups || 20 });
  });
  const [result, setResult] = useState(null);
  const [challengeKey, setChallengeKey] = useState(0);

  const updateCameraPermission = useCallback((cameraPermission) => {
    setProgression((current) => {
      if (!current?.onboarded) {
        return current;
      }

      return updateProgressionSettings(current, {
        cameraPermission,
        cameraCheckedAt: new Date().toISOString()
      });
    });
  }, []);

  function completeSetup(profile) {
    const nextProgression = createProgression(profile);
    setProgression(nextProgression);
    setChallenge(makeChallenge({ mode: CHALLENGE_MODES.maxReps, goal: nextProgression.profile.maxPushups }));
    setScreen(screens.home);
  }

  function startChallenge(nextChallenge) {
    setChallenge(nextChallenge);
    setResult(null);
    setChallengeKey((key) => key + 1);
    setScreen(screens.matchmaking);
  }

  function enterChallenge() {
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
      setProgression(applyChallengeResult(progression, resultWithMode));
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

  function handleDeleteAccount() {
    deleteProgression();
    setProgression(null);
    setResult(null);
    setChallenge(makeChallenge({ mode: CHALLENGE_MODES.maxReps, goal: 20 }));
    setScreen(screens.welcome);
  }

  return (
    <div className="app-shell">
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
          onRestart={() => startChallenge(makeChallenge({ mode: result.mode, goal: result.goal }))}
          onHome={goHome}
          onOpenSettings={openSettings}
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

      {progression?.onboarded && <BottomNav />}
    </div>
  );
}
