import { formatTime } from '../utils/timeFormat.js';
import BottomNav from './BottomNav.jsx';

export default function StatsOverlay({ count, goal, elapsedMs, status, confidence, onStop }) {
  const confidencePercent = Math.round((confidence || 0) * 100);
  const normalizedStatus = status || 'Prêt';
  const rivalCount = Math.max(0, Math.min(goal, count - 1 + (count > 0 ? 0 : 0)));
  const lucasCount = Math.max(0, count - 3);
  const progress = goal > 0 ? Math.min(100, Math.round((count / goal) * 100)) : 0;
  const feedback = feedbackText(normalizedStatus);
  const rhythm = confidencePercent >= 62 ? 'STABLE' : 'INSTABLE';

  return (
    <section className="duel-hud" aria-live="polite">
      <header className="duel-topbar">
        <div className="duel-brand">
          <span className="duel-lvl">LVL 24</span>
          <div>
            <strong>PUSH-UP DEFI</strong>
            <small>MATCH EN COURS</small>
          </div>
        </div>

        <div className="duel-timebox">
          <div>
            <span>Timer</span>
            <strong>{formatTime(elapsedMs)}</strong>
          </div>
          <i />
          <div>
            <span>Streak</span>
            <strong className="streak">x{Math.max(1, Math.min(12, count || 1))}</strong>
          </div>
        </div>

        <div className="duel-actions">
          <strong>540 COINS</strong>
          <button className="pause-button" type="button" onClick={onStop} aria-label="Stopper le duel">
            <span className="material-symbols-outlined">pause</span>
          </button>
        </div>
      </header>

      <div className="biometric-panel">
        <span>Analyse biométrique</span>
        <div className="metric-line">
          <small>Amplitude</small>
          <strong>{confidencePercent}%</strong>
        </div>
        <div className="thin-track">
          <div style={{ width: `${confidencePercent}%` }} />
        </div>
        <div className="metric-line">
          <small>Rythme</small>
          <strong>{rhythm}</strong>
        </div>
        <div className="thin-track">
          <div style={{ width: `${confidencePercent >= 62 ? 78 : 42}%` }} />
        </div>
      </div>

      <div className="rival-panel">
        <div>
          <span>Rival: Marcus</span>
          <small>{rivalCount}/{goal}</small>
        </div>
        <div className="rival-track">
          <div style={{ width: `${goal > 0 ? Math.min(100, (rivalCount / goal) * 100) : 0}%` }} />
        </div>
      </div>

      <div className="rep-stage">
        <span>Reps</span>
        <h1>
          {count}
          <small>/{goal}</small>
        </h1>
        <div className={`feedback-toast ${statusClass(normalizedStatus)}`}>
          <span className="material-symbols-outlined filled">{feedback.icon}</span>
          <strong>{feedback.label}</strong>
        </div>
      </div>

      <div className="leaderboard-panel">
        <span>Classement live</span>
        <RankLine rank="1." name="Vous" score={count} active />
        <RankLine rank="2." name="Marcus" score={rivalCount} />
        <RankLine rank="3." name="Lucas" score={lucasCount} />
      </div>

      <div className="duel-progress">
        <div className="lead-fill" style={{ width: `${progress}%` }} />
        <div className="lead-content">
          <div className="lead-player">
            <span className="material-symbols-outlined filled">person</span>
            <div>
              <small>Current Lead</small>
              <strong>Vous ({count})</strong>
            </div>
          </div>
          <div className="lead-bar">
            <div>
              <span style={{ width: `${progress}%` }} />
            </div>
            <strong>{progress}%</strong>
          </div>
          <div className="lead-rival">
            <div>
              <small>Challenger</small>
              <strong>Marcus ({rivalCount})</strong>
            </div>
            <span className="material-symbols-outlined">groups</span>
          </div>
        </div>
      </div>

      <BottomNav />
    </section>
  );
}

function RankLine({ rank, name, score, active = false }) {
  return (
    <div className={`rank-line ${active ? 'active' : ''}`}>
      <div>
        <strong>{rank}</strong>
        <span>{name}</span>
      </div>
      <small>{score}</small>
    </div>
  );
}

function feedbackText(status) {
  if (status === 'OK') {
    return { icon: 'check_circle', label: 'Parfait' };
  }
  if (status === 'Monte') {
    return { icon: 'arrow_upward', label: 'Monte' };
  }
  if (status === 'Descends') {
    return { icon: 'arrow_downward', label: 'Descends' };
  }
  if (status === 'mal cadré') {
    return { icon: 'center_focus_strong', label: 'Cadrage' };
  }
  return { icon: 'radio_button_checked', label: 'Prêt' };
}

function statusClass(status) {
  if (status === 'OK') {
    return 'status-ok';
  }
  if (status === 'mal cadré') {
    return 'status-bad';
  }
  if (status === 'Monte') {
    return 'status-up';
  }
  if (status === 'Descends') {
    return 'status-down';
  }
  return 'status-ready';
}
