import { CHALLENGE_MODES, challengeTitle } from '../utils/progression.js';

export default function ResultScreen({ result, opponent, onHome }) {
  const isMaxMode = result.mode === CHALLENGE_MODES.maxReps;
  const opponentName = opponent?.pseudo || 'ton adversaire';

  return (
    <main className="screen result-screen async-result-screen">
      <section className="victory-hero compact-result async-result-hero">
        <p>Résultat enregistré</p>
        <h1>Défi envoyé</h1>
      </section>

      <section className="result-focus async-result-focus">
        <span>Ton résultat</span>
        <strong>
          {result.pushups}
          <small>pompes</small>
        </strong>
      </section>

      <section className="result-summary async-result-summary">
        <article>
          <span>Temps</span>
          <strong>
            {formatSeconds(result.timeMs)}
            <small>s</small>
          </strong>
        </article>
        <article>
          <span>{isMaxMode ? 'Score' : 'Objectif'}</span>
          <strong>{isMaxMode ? `${result.pushups}` : `${result.pushups}/${result.goal}`}</strong>
        </article>
      </section>

      <section className="sent-card">
        {opponent && (
          <div className={`opponent-avatar opponent-${opponent.id}`} aria-hidden="true">
            <span>{opponent.pseudo.slice(0, 1)}</span>
          </div>
        )}
        <div>
          <span>{challengeTitle(result)}</span>
          <h2>Ton résultat a été envoyé à {opponentName}</h2>
          {opponent && <p>{opponent.stat} • {opponent.rank}</p>}
        </div>
      </section>

      <section className="result-actions single-action">
        <button className="primary-button" type="button" onClick={onHome}>
          Retour
        </button>
      </section>
    </main>
  );
}

function formatSeconds(milliseconds) {
  return (Math.max(0, milliseconds) / 1000).toFixed(1);
}
