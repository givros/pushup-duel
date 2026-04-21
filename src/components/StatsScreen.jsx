import HistoryList from './HistoryList.jsx';
import Icon from './Icon.jsx';
import TopBar from './TopBar.jsx';
import { RESULT_OUTCOMES } from '../utils/progression.js';

export default function StatsScreen({ progression, onOpenSettings }) {
  const profile = progression.profile;
  const stats = progression.stats;
  const history = stats.history;
  const victories = history.filter((entry) => entry.outcome === RESULT_OUTCOMES.victory).length;
  const draws = history.filter((entry) => entry.outcome === RESULT_OUTCOMES.draw).length;
  const pending = history.filter((entry) => entry.outcome === RESULT_OUTCOMES.pending).length;
  const bestFixed = stats.bestFixedTimeMs === null
    ? '—'
    : `${(stats.bestFixedTimeMs / 1000).toFixed(1)}s`;

  return (
    <main className="screen stats-screen">
      <TopBar compact progression={progression} onProfileClick={onOpenSettings} />

      <header className="stats-header">
        <span>Suivi joueur</span>
        <h1>Stats</h1>
      </header>

      <section className="stats-highlight">
        <article>
          <Icon name="bolt" className="filled" />
          <span>Total</span>
          <strong>{stats.totalPushups}</strong>
          <small>pompes</small>
        </article>
        <article>
          <Icon name="timer" className="filled" />
          <span>Record 1 min</span>
          <strong>{stats.bestOneMinute}</strong>
          <small>pompes</small>
        </article>
      </section>

      <section className="settings-grid stats-grid" aria-label="Statistiques détaillées">
        <article>
          <span>Combats</span>
          <strong>{stats.sessions}</strong>
        </article>
        <article>
          <span>Victoires</span>
          <strong>{victories}</strong>
        </article>
        <article>
          <span>Défaites</span>
          <strong>{stats.defeats}</strong>
        </article>
        <article>
          <span>Égalités</span>
          <strong>{draws}</strong>
        </article>
        <article>
          <span>En attente</span>
          <strong>{pending}</strong>
        </article>
        <article>
          <span>Chrono</span>
          <strong>{bestFixed}</strong>
        </article>
      </section>

      <section className="mission-card compact stats-xp-card">
        <div className="mission-head">
          <div>
            <span>Niveau {profile.level}</span>
            <strong>{profile.nickname}</strong>
          </div>
          <small>{profile.xp} XP</small>
        </div>
        <div className="mission-track" aria-hidden="true">
          <div style={{ width: `${Math.min(100, (profile.xp % 500) / 5)}%` }} />
        </div>
        <p>{profile.xp % 500} / 500 XP avant le prochain niveau</p>
      </section>

      <section className="home-history">
        <div className="section-title">
          <h2>Derniers combats</h2>
          <small>{history.length}</small>
        </div>
        <HistoryList history={history} limit={5} emptyLabel="Aucun combat enregistré." />
      </section>
    </main>
  );
}
