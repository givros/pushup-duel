import { useState } from 'react';
import TopBar from './TopBar.jsx';
import Icon from './Icon.jsx';
import HistoryList from './HistoryList.jsx';
import { CHALLENGE_MODES, makeChallenge } from '../utils/progression.js';

export default function HomeScreen({
  progression,
  defaultGoal,
  starterChallengePending = false,
  onStart,
  onStartStarterChallenge,
  onOpenSettings
}) {
  const profile = progression.profile;
  const stats = progression.stats;
  const [mode, setMode] = useState(CHALLENGE_MODES.maxReps);
  const [goal, setGoal] = useState(String(defaultGoal || profile.maxPushups || 15));
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    const parsedGoal = Number(goal);

    if (starterChallengePending) {
      setError('');
      onStartStarterChallenge?.();
      return;
    }

    if (mode === CHALLENGE_MODES.fixedGoal && (!Number.isInteger(parsedGoal) || parsedGoal < 1 || parsedGoal > 999)) {
      setError('Enter a goal between 1 and 999 push-ups.');
      return;
    }

    setError('');
    onStart(makeChallenge({ mode, goal: mode === CHALLENGE_MODES.fixedGoal ? parsedGoal : profile.maxPushups }));
  }

  return (
    <main className="screen home-screen">
      <TopBar progression={progression} onProfileClick={onOpenSettings} />

      <section className="arena-hero compact-hero">
        <div className="arena-bg" aria-hidden="true" />
        <div className="arena-content">
          <span>Ready for the duel</span>
          <h1>
            PUSH-UP <em>DUEL</em>
          </h1>

          <form className="duel-launcher" onSubmit={handleSubmit} noValidate>
            <fieldset className="mode-selector">
              <legend>Challenge type</legend>
              <label className={mode === CHALLENGE_MODES.maxReps ? 'selected' : ''}>
                <input
                  type="radio"
                  name="challenge-mode"
                  value={CHALLENGE_MODES.maxReps}
                  checked={mode === CHALLENGE_MODES.maxReps}
                  onChange={() => setMode(CHALLENGE_MODES.maxReps)}
                />
                <span>1 min max</span>
              </label>
              <label className={mode === CHALLENGE_MODES.fixedGoal ? 'selected' : ''}>
                <input
                  type="radio"
                  name="challenge-mode"
                  value={CHALLENGE_MODES.fixedGoal}
                  checked={mode === CHALLENGE_MODES.fixedGoal}
                  onChange={() => setMode(CHALLENGE_MODES.fixedGoal)}
                />
                <span>Timed goal</span>
              </label>
            </fieldset>

            {mode === CHALLENGE_MODES.fixedGoal && (
              <>
                <label htmlFor="pushup-goal">Number of push-ups</label>
                <div className="goal-control">
                  <input
                    id="pushup-goal"
                    inputMode="numeric"
                    min="1"
                    max="999"
                    pattern="[0-9]*"
                    type="number"
                    value={goal}
                    onChange={(event) => setGoal(event.target.value)}
                    required
                  />
                  <span>Push-ups</span>
                </div>
              </>
            )}

            <div className="challenge-note">
              <Icon name={mode === CHALLENGE_MODES.maxReps ? 'timer' : 'bolt'} className="filled" />
              {mode === CHALLENGE_MODES.maxReps
                ? 'Do as many push-ups as possible in 60 seconds.'
                : 'Reach your goal as fast as possible.'}
            </div>

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <button className="launch-button" type="submit">
              <Icon name="play_arrow" className="filled" />
              {starterChallengePending ? 'Answer received duel' : 'Start a duel'}
            </button>
          </form>
        </div>
      </section>

      <section className="progress-overview" aria-label="Progress">
        <article>
          <span>1 min best</span>
          <strong>{stats.bestOneMinute}</strong>
          <small>push-ups</small>
        </article>
        <article>
          <span>Total</span>
          <strong>{stats.totalPushups}</strong>
          <small>push-ups</small>
        </article>
        <article>
          <span>Declared max</span>
          <strong>{profile.maxPushups}</strong>
          <small>profile</small>
        </article>
      </section>

      <section className="mission-card compact">
        <div className="mission-head">
          <div>
            <span>Progress</span>
            <strong>{profile.nickname}</strong>
          </div>
          <small>Level {profile.level}</small>
        </div>
        <div className="mission-track" aria-hidden="true">
          <div style={{ width: `${Math.min(100, (profile.xp % 500) / 5)}%` }} />
        </div>
        <p>{profile.xp % 500} / 500 XP before the next level</p>
      </section>

      <section className="home-history">
        <div className="section-title">
          <h2>Recent fights</h2>
          <button type="button" onClick={onOpenSettings}>View all</button>
        </div>
        <HistoryList history={stats.history} limit={3} emptyLabel="Your last 3 fights will appear here." />
      </section>
    </main>
  );
}
