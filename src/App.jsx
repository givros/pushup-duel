import { useState } from 'react';
import HomeScreen from './components/HomeScreen.jsx';
import MatchmakingScreen from './components/MatchmakingScreen.jsx';
import CameraChallenge from './components/CameraChallenge.jsx';
import ResultScreen from './components/ResultScreen.jsx';
import BottomNav from './components/BottomNav.jsx';

const screens = {
  home: 'home',
  matchmaking: 'matchmaking',
  challenge: 'challenge',
  result: 'result'
};

export default function App() {
  const [screen, setScreen] = useState(screens.home);
  const [goal, setGoal] = useState(10);
  const [result, setResult] = useState(null);
  const [challengeKey, setChallengeKey] = useState(0);

  function startChallenge(nextGoal) {
    setGoal(nextGoal);
    setResult(null);
    setChallengeKey((key) => key + 1);
    setScreen(screens.matchmaking);
  }

  function enterChallenge() {
    setScreen(screens.challenge);
  }

  function completeChallenge(nextResult) {
    setResult(nextResult);
    setScreen(screens.result);
  }

  function goHome() {
    setResult(null);
    setScreen(screens.home);
  }

  return (
    <div className="app-shell">
      {screen === screens.home && <HomeScreen defaultGoal={goal} onStart={startChallenge} />}

      {screen === screens.matchmaking && (
        <MatchmakingScreen goal={goal} onReady={enterChallenge} onCancel={goHome} />
      )}

      {screen === screens.challenge && (
        <CameraChallenge
          key={challengeKey}
          goal={goal}
          onComplete={completeChallenge}
          onCancel={goHome}
        />
      )}

      {screen === screens.result && result && (
        <ResultScreen result={result} onRestart={() => startChallenge(result.goal)} onHome={goHome} />
      )}

      <BottomNav />
    </div>
  );
}
