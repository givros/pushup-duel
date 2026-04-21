import { useEffect, useState } from 'react';
import ChallengeCountdown from './ChallengeCountdown.jsx';
import HistoryList from './HistoryList.jsx';
import Icon from './Icon.jsx';
import TopBar from './TopBar.jsx';
import { RESULT_OUTCOMES, challengeTitle } from '../utils/progression.js';
import { EXPIRED_DUEL_REASON } from '../utils/duelExpiration.js';

export default function ChallengesScreen({
  progression,
  incomingChallenges = [],
  outgoingChallenges = [],
  starterChallengePending = false,
  onAcceptChallenge,
  onDeclineChallenge,
  onRefreshChallenges,
  onStartStarterChallenge,
  onOpenSettings
}) {
  const [now, setNow] = useState(Date.now());
  const history = progression.stats.history;
  const completedHistory = history.filter((entry) => isCompletedEntry(entry) && !isExpiredEntry(entry));
  const expiredHistory = history.filter(isExpiredEntry);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <main className="screen challenges-screen">
      <TopBar compact progression={progression} onProfileClick={onOpenSettings} />

      <header className="challenges-header">
        <div>
          <span>Centre de duels</span>
          <h1>Historique</h1>
        </div>
        <button className="secondary-button" type="button" onClick={onRefreshChallenges}>
          <Icon name="sync" className="filled" />
          Actualiser
        </button>
      </header>

      <section className="challenge-inbox">
        <div className="section-title">
          <h2>Reçus</h2>
          <small>{starterChallengePending || incomingChallenges.length > 0 ? 'À traiter' : 'Aucun'}</small>
        </div>

        {starterChallengePending || incomingChallenges.length > 0 ? (
          <div className="challenge-list">
            {starterChallengePending && (
              <article className="challenge-card starter-challenge-card">
                <div className="challenge-icon" aria-hidden="true">
                  <Icon name="bolt" className="filled" />
                </div>
                <div className="challenge-copy">
                  <span>15 pompes le plus vite possible</span>
                  <strong>MayaCore</strong>
                  <p>Défi reçu</p>
                </div>
                <div className="challenge-actions single">
                  <button className="primary-button" type="button" onClick={onStartStarterChallenge}>
                    Relever
                  </button>
                </div>
              </article>
            )}

            {incomingChallenges.map((duel) => (
              <article className="challenge-card" key={duel.id}>
                <div className="challenge-icon" aria-hidden="true">
                  <Icon name="flag" className="filled" />
                </div>
                <div className="challenge-copy">
                  <span>{challengeTitle(duel.challenge)}</span>
                  <strong>{duel.opponent.pseudo}</strong>
                  <p>{duel.challengerResult.pushups} pompes envoyées</p>
                  <ChallengeCountdown expiresAt={duel.expiresAt} now={now} prefix="À relever dans" />
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
          <EmptyChallengeState label="Aucun défi reçu pour le moment." />
        )}
      </section>

      <section className="challenge-inbox sent-challenge-inbox">
        <div className="section-title">
          <h2>Envoyés</h2>
          <small>{outgoingChallenges.length > 0 ? 'En attente' : 'Aucun'}</small>
        </div>

        {outgoingChallenges.length > 0 ? (
          <div className="challenge-list">
            {outgoingChallenges.map((duel) => (
              <article className="challenge-card sent-challenge-card" key={duel.id}>
                <div className="challenge-icon" aria-hidden="true">
                  <Icon name="timer" className="filled" />
                </div>
                <div className="challenge-copy">
                  <span>{challengeTitle(duel.challenge)}</span>
                  <strong>{duel.opponent.pseudo}</strong>
                  <p>En attente de sa réponse</p>
                  <ChallengeCountdown expiresAt={duel.expiresAt} now={now} prefix="Victoire auto dans" />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyChallengeState label="Aucun défi envoyé en attente." />
        )}
      </section>

      <section className="challenge-history-section">
        <div className="section-title">
          <h2>Terminés</h2>
          <small>{completedHistory.length}</small>
        </div>
        <HistoryList history={completedHistory} limit={6} emptyLabel="Aucun duel terminé pour le moment." />
      </section>

      <section className="challenge-history-section">
        <div className="section-title">
          <h2>Expirés</h2>
          <small>{expiredHistory.length}</small>
        </div>
        <HistoryList history={expiredHistory} limit={6} emptyLabel="Aucun duel expiré." />
      </section>
    </main>
  );
}

function EmptyChallengeState({ label }) {
  return (
    <div className="challenge-empty">
      <Icon name="radio_button_checked" className="filled" />
      <p>{label}</p>
    </div>
  );
}

function isCompletedEntry(entry) {
  return entry.outcome !== RESULT_OUTCOMES.pending;
}

function isExpiredEntry(entry) {
  return entry.reason === EXPIRED_DUEL_REASON || entry.opponentReason === EXPIRED_DUEL_REASON;
}
