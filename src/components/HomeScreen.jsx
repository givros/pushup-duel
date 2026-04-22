import TopBar from './TopBar.jsx';
import Icon from './Icon.jsx';
import { CHALLENGE_MODES, makeChallenge } from '../utils/progression.js';

export default function HomeScreen({
  progression,
  incomingChallenges = [],
  starterChallengePending = false,
  onStart,
  onStartStarterChallenge,
  onOpenSettings,
  onOpenChallenges
}) {
  const profile = progression.profile;
  const stats = progression.stats;
  const settings = progression.settings;
  const mode = settings.challengeMode || CHALLENGE_MODES.maxReps;
  const goal = mode === CHALLENGE_MODES.fixedGoal ? settings.fixedGoal : profile.maxPushups;
  const dailyCompleted = getDailyDuelCount(stats.history);
  const dailyProgress = Math.min(100, (dailyCompleted / 3) * 100);
  const lastDuel = stats.history[0] || null;
  const topChallenge = starterChallengePending ? null : incomingChallenges[0];

  function handleSubmit(event) {
    event.preventDefault();

    if (starterChallengePending) {
      onStartStarterChallenge?.();
      return;
    }

    onStart(makeChallenge({ mode, goal }));
  }

  return (
    <main className="screen home-screen">
      <TopBar progression={progression} onProfileClick={onOpenSettings} />

      <section className="home-duel-card">
        <div className="duel-card-avatar" aria-hidden="true">
          <span>{lastDuel?.opponentName?.slice(0, 1) || 'D'}</span>
        </div>
        <div className="home-duel-copy">
          <span>Last duel</span>
          <strong className={lastDuel ? (lastDuel.outcome === 'victory' ? 'duel-win' : '') : 'duel-ready'}>
            {lastDuel ? outcomeLabel(lastDuel.outcome) : 'Ready'}
          </strong>
          <p>{lastDuel ? scoreLine(lastDuel) : 'No duel played yet'}</p>
          <small>{lastDuel?.opponentName ? `vs ${lastDuel.opponentName}` : 'Start your first duel'} {lastDuel ? '· recently' : ''}</small>
        </div>
        <div className="duel-card-figure" aria-hidden="true">
          <Icon name="fitness_center" className="filled" />
        </div>
      </section>

      <form className="home-start-panel" onSubmit={handleSubmit}>
        <div>
          <span>{mode === CHALLENGE_MODES.maxReps ? 'Default duel' : 'Profile duel'}</span>
          <strong>{mode === CHALLENGE_MODES.maxReps ? '1 minute max reps' : `${goal} push-ups target`}</strong>
        </div>
        <button className="launch-button" type="submit">
          <Icon name="play_arrow" className="filled" />
          {starterChallengePending ? 'Answer duel' : 'Start Duel'}
        </button>
      </form>

      <section className="daily-duel-card">
        <div>
          <span>Daily Duel</span>
          <strong>Complete 3 duels</strong>
        </div>
        <small>{Math.min(3, dailyCompleted)} / 3</small>
        <div className="daily-track" aria-hidden="true">
          <span style={{ width: `${dailyProgress}%` }} />
        </div>
        <div className="daily-badge" aria-hidden="true">
          <Icon name="workspace_premium" className="filled" />
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

      {(starterChallengePending || topChallenge) && (
        <section className="pending-duel-card">
          <div className="challenge-icon" aria-hidden="true">
            <Icon name="bolt" className="filled" />
          </div>
          <div>
            <span>Received duel</span>
            <strong>{starterChallengePending ? 'MayaCore' : topChallenge.opponent.pseudo}</strong>
            <p>{starterChallengePending ? '15 push-ups as fast as possible' : `${topChallenge.challengerResult.pushups} push-ups sent`}</p>
          </div>
          <button className="secondary-button" type="button" onClick={starterChallengePending ? onStartStarterChallenge : onOpenChallenges}>
            Open
          </button>
        </section>
      )}

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
    </main>
  );
}

function getDailyDuelCount(history = []) {
  const today = new Date().toDateString();

  return history.filter((entry) => new Date(entry.completedAt).toDateString() === today).length;
}

function outcomeLabel(outcome) {
  if (outcome === 'victory') {
    return 'Victory';
  }
  if (outcome === 'draw') {
    return 'Draw';
  }
  if (outcome === 'pending') {
    return 'Waiting';
  }

  return 'Defeat';
}

function scoreLine(entry) {
  const opponentScore = typeof entry.opponentPushups === 'number' ? entry.opponentPushups : '—';

  return `${entry.pushups} - ${opponentScore}`;
}
