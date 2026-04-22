import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import { CHALLENGE_MODES, RESULT_OUTCOMES, challengeTitle } from '../utils/progression.js';
import { formatDuelRemainingTime, getDuelRemainingMs } from '../utils/duelExpiration.js';

export default function ResultScreen({ result, opponent, flow = 'outgoing', onHome }) {
  const isMaxMode = result.mode === CHALLENGE_MODES.maxReps;
  const isStarterFlow = flow === 'starter';
  const opponentName = opponent?.pseudo || result.opponentName || 'your opponent';
  const isIncomingAnswer = flow === 'incoming';
  const outcome = result.duelOutcome || result.outcome || RESULT_OUTCOMES.pending;
  const isPending = outcome === RESULT_OUTCOMES.pending;
  const isDefeat = outcome === RESULT_OUTCOMES.defeat;
  const hasOpponentScore = typeof result.opponentPushups === 'number';
  const [now, setNow] = useState(Date.now());
  const remainingMs = isPending && result.duelExpiresAt ? getDuelRemainingMs(result.duelExpiresAt, now) : 0;

  useEffect(() => {
    if (!isPending || !result.duelExpiresAt) {
      return undefined;
    }

    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(intervalId);
  }, [isPending, result.duelExpiresAt]);

  return (
    <main className={`screen result-screen async-result-screen ${isPending ? 'pending-duel-result' : ''}`}>
      <section className={`victory-hero compact-result async-result-hero ${isDefeat ? 'defeat-result' : ''} ${isPending ? 'pending-result' : ''}`}>
        <p>{isStarterFlow ? 'Duel answered' : isPending ? 'Duel sent' : 'Final result'}</p>
        <h1>{isStarterFlow ? 'Score sent' : getResultTitle(outcome)}</h1>
      </section>

      <section className="result-focus async-result-focus">
        <span>Your result</span>
        <strong>
          {result.pushups}
          <small>push-ups</small>
        </strong>
      </section>

      <section className="result-summary async-result-summary">
        <article>
          <span>Time</span>
          <strong>
            {formatSeconds(result.timeMs)}
            <small>s</small>
          </strong>
        </article>
        <article>
          <span>{isMaxMode ? 'Score' : 'Goal'}</span>
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
          <h2>{isStarterFlow ? `Your score is saved against ${opponentName}. Welcome to the arena.` : getResultMessage({ outcome, isIncomingAnswer, opponentName })}</h2>
          {hasOpponentScore ? (
            <p>
              Opponent score: {result.opponentPushups} push-ups
              {typeof result.opponentTimeMs === 'number' ? ` in ${formatSeconds(result.opponentTimeMs)}s` : ''}
            </p>
          ) : isPending && result.duelExpiresAt ? (
            <p className="result-countdown">
              {remainingMs > 0
                ? `Automatic win if there is no answer within ${formatDuelRemainingTime(remainingMs)}.`
                : 'Time is up, duel resolution is in progress.'}
            </p>
          ) : (
            opponent && <p>{opponent.stat} - {opponent.rank}</p>
          )}
        </div>
      </section>

      {isPending && !isStarterFlow && (
        <section className="async-result-help" aria-label="Duel follow-up">
          <article>
            <Icon name="timer" className="filled" />
            <span>Your opponent has 24h to answer.</span>
          </article>
          <article>
            <Icon name="check_circle" className="filled" />
            <span>If no score is sent, you automatically win.</span>
          </article>
          <article>
            <Icon name="leaderboard" className="filled" />
            <span>You will see the result in your history.</span>
          </article>
        </section>
      )}

      <section className="result-actions single-action">
        <button className="primary-button" type="button" onClick={onHome}>
          {isStarterFlow ? 'Enter the arena' : 'Back'}
        </button>
      </section>
    </main>
  );
}

function getResultTitle(outcome) {
  if (outcome === RESULT_OUTCOMES.victory) {
    return 'Victory';
  }

  if (outcome === RESULT_OUTCOMES.defeat) {
    return 'Defeat';
  }

  if (outcome === RESULT_OUTCOMES.draw) {
    return 'Draw';
  }

  return 'Waiting';
}

function getResultMessage({ outcome, isIncomingAnswer, opponentName }) {
  if (outcome === RESULT_OUTCOMES.pending) {
    return "Waiting for your opponent's score";
  }

  if (outcome === RESULT_OUTCOMES.victory) {
    return `You are ahead of ${opponentName}.`;
  }

  if (outcome === RESULT_OUTCOMES.defeat) {
    return `${opponentName} has the better score.`;
  }

  if (outcome === RESULT_OUTCOMES.draw) {
    return `You tied with ${opponentName}.`;
  }

  return isIncomingAnswer
    ? `Your result was sent back to ${opponentName}.`
    : `Your result was sent to ${opponentName}.`;
}

function formatSeconds(milliseconds) {
  return (Math.max(0, milliseconds) / 1000).toFixed(1);
}
