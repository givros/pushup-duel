import { useState } from 'react';
import TopBar from './TopBar.jsx';
import Icon from './Icon.jsx';
import HistoryList from './HistoryList.jsx';
import { CHALLENGE_MODES, challengeTitle, makeChallenge } from '../utils/progression.js';

export default function HomeScreen({
  progression,
  defaultGoal,
  incomingChallenges = [],
  onStart,
  onAcceptChallenge,
  onDeclineChallenge,
  onRefreshChallenges,
  onOpenSettings
}) {
  const profile = progression.profile;
  const stats = progression.stats;
  const [mode, setMode] = useState(CHALLENGE_MODES.maxReps);
  const [goal, setGoal] = useState(String(defaultGoal || profile.maxPushups || 20));
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    const parsedGoal = Number(goal);

    if (mode === CHALLENGE_MODES.fixedGoal && (!Number.isInteger(parsedGoal) || parsedGoal < 1 || parsedGoal > 999)) {
      setError('Entre un objectif entre 1 et 999 pompes.');
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
          <span>Prêt pour le défi</span>
          <h1>
            PUSH-UP <em>DÉFI</em>
          </h1>

          <form className="duel-launcher" onSubmit={handleSubmit} noValidate>
            <fieldset className="mode-selector">
              <legend>Type de défi</legend>
              <label className={mode === CHALLENGE_MODES.maxReps ? 'selected' : ''}>
                <input
                  type="radio"
                  name="challenge-mode"
                  value={CHALLENGE_MODES.maxReps}
                  checked={mode === CHALLENGE_MODES.maxReps}
                  onChange={() => setMode(CHALLENGE_MODES.maxReps)}
                />
                <span>Max en 1 min</span>
              </label>
              <label className={mode === CHALLENGE_MODES.fixedGoal ? 'selected' : ''}>
                <input
                  type="radio"
                  name="challenge-mode"
                  value={CHALLENGE_MODES.fixedGoal}
                  checked={mode === CHALLENGE_MODES.fixedGoal}
                  onChange={() => setMode(CHALLENGE_MODES.fixedGoal)}
                />
                <span>Objectif chrono</span>
              </label>
            </fieldset>

            {mode === CHALLENGE_MODES.fixedGoal && (
              <>
                <label htmlFor="pushup-goal">Nombre de pompes</label>
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
                  <span>Pompes</span>
                </div>
              </>
            )}

            <div className="challenge-note">
              <Icon name={mode === CHALLENGE_MODES.maxReps ? 'timer' : 'bolt'} className="filled" />
              {mode === CHALLENGE_MODES.maxReps
                ? 'Faire le maximum de pompes en 60 secondes.'
                : 'Atteindre ton objectif le plus rapidement possible.'}
            </div>

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <button className="launch-button" type="submit">
              <Icon name="play_arrow" className="filled" />
              Lancer un duel
            </button>
          </form>
        </div>
      </section>

      <section className="challenge-inbox">
        <div className="section-title">
          <h2>Défis reçus</h2>
          <button type="button" onClick={onRefreshChallenges}>Actualiser</button>
        </div>

        {incomingChallenges.length > 0 ? (
          <div className="challenge-list">
            {incomingChallenges.slice(0, 3).map((duel) => (
              <article className="challenge-card" key={duel.id}>
                <div className="challenge-icon" aria-hidden="true">
                  <Icon name="flag" className="filled" />
                </div>
                <div className="challenge-copy">
                  <span>{challengeTitle(duel.challenge)}</span>
                  <strong>{duel.opponent.pseudo}</strong>
                  <p>{duel.challengerResult.pushups} pompes envoyées</p>
                </div>
                <div className="challenge-actions">
                  <button className="primary-button" type="button" onClick={() => onAcceptChallenge(duel)}>
                    Relever
                  </button>
                  <button className="secondary-button icon-only-button" type="button" onClick={() => onDeclineChallenge(duel.id)} aria-label="Refuser le défi">
                    <Icon name="close" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="challenge-empty">
            <Icon name="radio_button_checked" className="filled" />
            <p>Aucun défi reçu pour le moment.</p>
          </div>
        )}
      </section>

      <section className="progress-overview" aria-label="Progression">
        <article>
          <span>Record 1 min</span>
          <strong>{stats.bestOneMinute}</strong>
          <small>pompes</small>
        </article>
        <article>
          <span>Total</span>
          <strong>{stats.totalPushups}</strong>
          <small>pompes</small>
        </article>
        <article>
          <span>Max déclaré</span>
          <strong>{profile.maxPushups}</strong>
          <small>profil</small>
        </article>
      </section>

      <section className="mission-card compact">
        <div className="mission-head">
          <div>
            <span>Progression</span>
            <strong>{profile.nickname}</strong>
          </div>
          <small>Niveau {profile.level}</small>
        </div>
        <div className="mission-track" aria-hidden="true">
          <div style={{ width: `${Math.min(100, (profile.xp % 500) / 5)}%` }} />
        </div>
        <p>{profile.xp % 500} / 500 XP avant le prochain niveau</p>
      </section>

      <section className="home-history">
        <div className="section-title">
          <h2>Derniers combats</h2>
          <button type="button" onClick={onOpenSettings}>Tout voir</button>
        </div>
        <HistoryList history={stats.history} limit={3} emptyLabel="Tes 3 derniers combats apparaîtront ici." />
      </section>
    </main>
  );
}
