import { CHALLENGE_MODES, RESULT_OUTCOMES, challengeTitle } from '../utils/progression.js';

export default function ResultScreen({ result, opponent, flow = 'outgoing', onHome }) {
  const isMaxMode = result.mode === CHALLENGE_MODES.maxReps;
  const isStarterFlow = flow === 'starter';
  const opponentName = opponent?.pseudo || result.opponentName || 'votre adversaire';
  const isIncomingAnswer = flow === 'incoming';
  const outcome = result.duelOutcome || result.outcome || RESULT_OUTCOMES.pending;
  const isPending = outcome === RESULT_OUTCOMES.pending;
  const isDefeat = outcome === RESULT_OUTCOMES.defeat;
  const hasOpponentScore = typeof result.opponentPushups === 'number';

  return (
    <main className={`screen result-screen async-result-screen ${isPending ? 'pending-duel-result' : ''}`}>
      <section className={`victory-hero compact-result async-result-hero ${isDefeat ? 'defeat-result' : ''} ${isPending ? 'pending-result' : ''}`}>
        <p>{isStarterFlow ? 'Profil calibré' : isPending ? 'Duel envoyé' : 'Résultat final'}</p>
        <h1>{isStarterFlow ? 'Premier score' : getResultTitle(outcome)}</h1>
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
          <h2>{isStarterFlow ? 'Ton profil est prêt. Tu peux maintenant accéder à l’arène.' : getResultMessage({ outcome, isIncomingAnswer, opponentName })}</h2>
          {hasOpponentScore ? (
            <p>
              Score adversaire : {result.opponentPushups} pompes
              {typeof result.opponentTimeMs === 'number' ? ` en ${formatSeconds(result.opponentTimeMs)}s` : ''}
            </p>
          ) : (
            opponent && <p>{opponent.stat} • {opponent.rank}</p>
          )}
        </div>
      </section>

      <section className="result-actions single-action">
        <button className="primary-button" type="button" onClick={onHome}>
          {isStarterFlow ? 'Accéder à l’accueil' : 'Retour'}
        </button>
      </section>
    </main>
  );
}

function getResultTitle(outcome) {
  if (outcome === RESULT_OUTCOMES.victory) {
    return 'Victoire';
  }

  if (outcome === RESULT_OUTCOMES.defeat) {
    return 'Défaite';
  }

  if (outcome === RESULT_OUTCOMES.draw) {
    return 'Égalité';
  }

  return 'En attente';
}

function getResultMessage({ outcome, isIncomingAnswer, opponentName }) {
  if (outcome === RESULT_OUTCOMES.pending) {
    return 'En attente du score de votre adversaire';
  }

  if (outcome === RESULT_OUTCOMES.victory) {
    return `Tu passes devant ${opponentName}.`;
  }

  if (outcome === RESULT_OUTCOMES.defeat) {
    return `Le score de ${opponentName} est meilleur.`;
  }

  if (outcome === RESULT_OUTCOMES.draw) {
    return `Score identique avec ${opponentName}.`;
  }

  return isIncomingAnswer
    ? `Ton résultat a été renvoyé à ${opponentName}.`
    : `Ton résultat a été envoyé à ${opponentName}.`;
}

function formatSeconds(milliseconds) {
  return (Math.max(0, milliseconds) / 1000).toFixed(1);
}
