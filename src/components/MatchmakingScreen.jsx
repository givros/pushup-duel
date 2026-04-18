import { useEffect, useState } from 'react';
import TopBar from './TopBar.jsx';
import { challengeTitle } from '../utils/progression.js';

const MATCHMAKING_DURATION_MS = 3600;

export default function MatchmakingScreen({ challenge, progression, onReady, onCancel }) {
  const [progress, setProgress] = useState(18);
  const nickname = progression?.profile?.nickname || 'Vous';

  useEffect(() => {
    const startedAt = performance.now();
    const intervalId = window.setInterval(() => {
      const elapsed = performance.now() - startedAt;
      const nextProgress = Math.min(100, 18 + (elapsed / MATCHMAKING_DURATION_MS) * 82);
      setProgress(nextProgress);

      if (nextProgress >= 100) {
        window.clearInterval(intervalId);
        window.setTimeout(onReady, 260);
      }
    }, 90);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [onReady]);

  return (
    <main className="screen matchmaking-screen">
      <TopBar compact progression={progression} />

      <section className="matchmaking-content">
        <div className="versus-heading">
          <p>Préparation du défi</p>
          <h1>
            Push-up <span>Défi</span>
          </h1>
          <div className="mode-chip">
            <span className="material-symbols-outlined filled">bolt</span>
            <strong>{challengeTitle(challenge)}</strong>
          </div>
        </div>

        <DuelistCard
          tone="player"
          badge="Vous"
          name={nickname}
          meta="Profil prêt"
        />

        <div className="vs-orb" aria-hidden="true">
          <span>VS</span>
        </div>

        <DuelistCard
          tone="opponent"
          badge="Rival"
          name="Marcus Vane"
          meta="Rival simulé"
        />

        <div className="sync-block">
          <div className="sync-row">
            <span>Synchronisation...</span>
            <strong>{Math.round(progress)}%</strong>
          </div>
          <div className="sync-track">
            <div style={{ width: `${progress}%` }} />
          </div>
          <p>Préparation de la caméra et du chrono</p>
        </div>

        <button className="ghost-cancel" type="button" onClick={onCancel}>
          Annuler
        </button>
      </section>
    </main>
  );
}

function DuelistCard({ tone, badge, name, meta }) {
  return (
    <article className={`duelist-card ${tone}`}>
      <div className="duelist-portrait" aria-hidden="true">
        <div className="portrait-head" />
        <div className="portrait-shoulders" />
      </div>
      <span className="duelist-badge">{badge}</span>
      <h2>{name}</h2>
      <p>{meta}</p>
    </article>
  );
}
