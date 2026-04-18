import { useState } from 'react';
import WelcomeScreen from './components/WelcomeScreen.jsx';
import ProfileSetupScreen from './components/ProfileSetupScreen.jsx';
import HomeScreen from './components/HomeScreen.jsx';
import MatchmakingScreen from './components/MatchmakingScreen.jsx';
import CameraChallenge from './components/CameraChallenge.jsx';
import ResultScreen from './components/ResultScreen.jsx';
import BottomNav from './components/BottomNav.jsx';
import {
  CHALLENGE_MODES,
  applyChallengeResult,
  createProgression,
  loadProgression,
  makeChallenge
} from './utils/progression.js';

const screens = {
  welcome: 'welcome',
  setup: 'setup',
  home: 'home',
  matchmaking: 'matchmaking',
  challenge: 'challenge',
  result: 'result'
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

  return (
    <div className="app-shell">
      {screen === screens.welcome && <WelcomeScreen onStart={() => setScreen(screens.setup)} />}

      {screen === screens.setup && <ProfileSetupScreen onComplete={completeSetup} />}

      {screen === screens.home && progression?.onboarded && (
        <HomeScreen progression={progression} defaultGoal={challenge.goal} onStart={startChallenge} />
      )}

      {screen === screens.matchmaking && (
        <MatchmakingScreen challenge={challenge} progression={progression} onReady={enterChallenge} onCancel={goHome} />
      )}

      {screen === screens.challenge && (
        <CameraChallenge
          key={challengeKey}
          challenge={challenge}
          onComplete={completeChallenge}
          onCancel={goHome}
        />
      )}

      {screen === screens.result && result && (
        <ResultScreen
          result={result}
          progression={progression}
          onRestart={() => startChallenge(makeChallenge({ mode: result.mode, goal: result.goal }))}
          onHome={goHome}
        />
      )}

      {progression?.onboarded && <BottomNav />}
    </div>
  );
}
