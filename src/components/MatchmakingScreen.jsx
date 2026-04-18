import { useEffect, useState } from 'react';
import TopBar from './TopBar.jsx';

const MATCHMAKING_DURATION_MS = 3600;

export default function MatchmakingScreen({ goal, onReady, onCancel }) {
  const [progress, setProgress] = useState(18);

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
      <TopBar compact />

      <section className="matchmaking-content">
        <div className="versus-heading">
          <p>Matchmaking Session</p>
          <h1>
            Push-up <span>Defi</span>
          </h1>
          <div className="mode-chip">
            <span className="material-symbols-outlined filled">bolt</span>
            <strong>{goal} Pompes - Mode Sprint</strong>
          </div>
        </div>

        <DuelistCard
          tone="player"
          badge="YOU"
          name="Alex Thorne"
          meta="Rank #1,402 • 78% Win Rate"
          tags={['Veteran', 'Powerhouse']}
        />

        <div className="vs-orb" aria-hidden="true">
          <span>VS</span>
        </div>

        <DuelistCard
          tone="opponent"
          badge="OPPONENT"
          name="Marcus Vane"
          meta="Rank #1,250 • 82% Win Rate"
          tags={['Elite', 'Sprinter']}
        />

        <div className="sync-block">
          <div className="sync-row">
            <span>System Synchronizing...</span>
            <strong>{Math.round(progress)}%</strong>
          </div>
          <div className="sync-track">
            <div style={{ width: `${progress}%` }} />
          </div>
          <p>Awaiting connection protocol 0.44.2</p>
        </div>

        <button className="ghost-cancel" type="button" onClick={onCancel}>
          Annuler
        </button>
      </section>
    </main>
  );
}

function DuelistCard({ tone, badge, name, meta, tags }) {
  return (
    <article className={`duelist-card ${tone}`}>
      <div className="duelist-portrait" aria-hidden="true">
        <div className="portrait-head" />
        <div className="portrait-shoulders" />
      </div>
      <span className="duelist-badge">{badge}</span>
      <h2>{name}</h2>
      <p>{meta}</p>
      <div className="duelist-tags">
        {tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    </article>
  );
}
