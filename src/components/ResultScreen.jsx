import TopBar from './TopBar.jsx';
import Icon from './Icon.jsx';
import { CHALLENGE_MODES, challengeTitle } from '../utils/progression.js';

export default function ResultScreen({ result, progression, onRestart, onHome, onOpenSettings }) {
  const isMaxMode = result.mode === CHALLENGE_MODES.maxReps;
  const isDefeat = result.reason === 'forfeit' || result.reason === 'stopped';
  const lastResult = progression?.stats?.lastResult;
  const xpEarned = isDefeat ? 0 : (lastResult?.xpEarned ?? Math.max(5, result.pushups * 2));
  const coinsEarned = isDefeat ? 0 : (lastResult?.coinsEarned ?? Math.max(2, Math.floor(result.pushups / 2)));
  const bestLabel = isMaxMode
    ? `${progression?.stats?.bestOneMinute || result.pushups} pompes`
    : formatBestTime(progression?.stats?.bestFixedTimeMs);

  return (
    <main className="screen result-screen">
      <TopBar compact progression={progression} onProfileClick={onOpenSettings} />

      <section className={`victory-hero compact-result ${isDefeat ? 'defeat-result' : ''}`}>
        <p>{isDefeat ? 'Défi annulé' : 'Défi terminé'}</p>
        <h1>{isDefeat ? 'Défaite' : isMaxMode ? 'Score' : 'Chrono'}</h1>
      </section>

      <section className={`result-focus ${isDefeat ? 'defeat-result' : ''}`}>
        <span>{isDefeat ? 'Défaite par abandon' : challengeTitle(result)}</span>
        <strong>
          {isDefeat || isMaxMode ? result.pushups : formatSeconds(result.timeMs)}
          <small>{isDefeat || isMaxMode ? 'pompes' : 's'}</small>
        </strong>
      </section>

      <section className="result-summary">
        <article>
          <span>{isDefeat ? 'Pompes validées' : 'Pompes'}</span>
          <strong>{result.pushups}</strong>
        </article>
        <article>
          <span>{isDefeat ? 'Issue' : isMaxMode ? 'Record 1 min' : 'Meilleur chrono'}</span>
          <strong>{isDefeat ? 'Défaite' : bestLabel}</strong>
        </article>
      </section>

      <section className="reward-card compact">
        <h2>{isDefeat ? 'Défaite enregistrée' : 'Progression enregistrée'}</h2>
        <div className="reward-grid">
          <div>
            <Icon name="star" className="filled" />
            <strong>+{xpEarned} XP</strong>
          </div>
          <i />
          <div>
            <Icon name="payments" className="filled" />
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
