import TopBar from './TopBar.jsx';
import { CHALLENGE_MODES, challengeTitle } from '../utils/progression.js';

export default function ResultScreen({ result, progression, onRestart, onHome }) {
  const isMaxMode = result.mode === CHALLENGE_MODES.maxReps;
  const lastResult = progression?.stats?.lastResult;
  const xpEarned = lastResult?.xpEarned ?? Math.max(5, result.pushups * 2);
  const coinsEarned = lastResult?.coinsEarned ?? Math.max(2, Math.floor(result.pushups / 2));
  const bestLabel = isMaxMode
    ? `${progression?.stats?.bestOneMinute || result.pushups} pompes`
    : formatBestTime(progression?.stats?.bestFixedTimeMs);

  return (
    <main className="screen result-screen">
      <TopBar compact progression={progression} />

      <section className="victory-hero compact-result">
        <p>Défi terminé</p>
        <h1>{isMaxMode ? 'Score' : 'Chrono'}</h1>
      </section>

      <section className="result-focus">
        <span>{challengeTitle(result)}</span>
        <strong>
          {isMaxMode ? result.pushups : formatSeconds(result.timeMs)}
          <small>{isMaxMode ? 'pompes' : 's'}</small>
        </strong>
      </section>

      <section className="result-summary">
        <article>
          <span>Pompes</span>
          <strong>{result.pushups}</strong>
        </article>
        <article>
          <span>{isMaxMode ? 'Record 1 min' : 'Meilleur chrono'}</span>
          <strong>{bestLabel}</strong>
        </article>
      </section>

      <section className="reward-card compact">
        <h2>Progression enregistrée</h2>
        <div className="reward-grid">
          <div>
            <span className="material-symbols-outlined filled">star</span>
            <strong>+{xpEarned} XP</strong>
          </div>
          <i />
          <div>
            <span className="material-symbols-outlined filled">payments</span>
            <strong>+{coinsEarned} pièces</strong>
          </div>
        </div>
        <div className="level-row">
          <span>Niveau {progression?.profile?.level || 1}</span>
          <strong>{(progression?.profile?.xp || 0) % 500} / 500 XP</strong>
        </div>
        <div className="level-track">
          <div style={{ width: `${Math.min(100, ((progression?.profile?.xp || 0) % 500) / 5)}%` }} />
        </div>
      </section>

      <section className="result-actions">
        <button className="secondary-button" type="button" onClick={onHome}>
          Accueil
        </button>
        <button className="primary-button" type="button" onClick={onRestart}>
          Rejouer
        </button>
      </section>
    </main>
  );
}

function formatSeconds(milliseconds) {
  return (Math.max(0, milliseconds) / 1000).toFixed(1);
}

function formatBestTime(milliseconds) {
  if (typeof milliseconds !== 'number') {
    return 'Aucun';
  }

  return `${formatSeconds(milliseconds)} s`;
}
