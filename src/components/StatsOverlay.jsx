import { formatTime } from '../utils/timeFormat.js';
import { CHALLENGE_MODES, challengeTitle } from '../utils/progression.js';

export default function StatsOverlay({ count, challenge, elapsedMs, status, confidence, onStop }) {
  const confidencePercent = Math.round((confidence || 0) * 100);
  const normalizedStatus = status || 'Prêt';
  const isMaxMode = challenge.mode === CHALLENGE_MODES.maxReps;
  const remainingMs = isMaxMode ? Math.max(0, challenge.durationMs - elapsedMs) : elapsedMs;
  const progress = isMaxMode
    ? Math.min(100, Math.round((elapsedMs / challenge.durationMs) * 100))
    : Math.min(100, Math.round((count / challenge.goal) * 100));
  const feedback = feedbackText(normalizedStatus);

  return (
    <section className="duel-hud simplified" aria-live="polite">
      <header className="duel-topbar">
        <div className="duel-brand">
          <span className="duel-lvl">DEF</span>
          <div>
            <strong>Push-up Défi</strong>
            <small>{isMaxMode ? '1 minute' : 'Chrono'}</small>
          </div>
        </div>

        <div className="duel-timebox single">
          <div>
            <span>{isMaxMode ? 'Temps restant' : 'Temps'}</span>
            <strong>{formatTime(remainingMs)}</strong>
          </div>
        </div>

        <button className="pause-button" type="button" onClick={onStop} aria-label="Stopper le défi">
          <span className="material-symbols-outlined">pause</span>
        </button>
      </header>

      <div className="rep-stage simple">
        <span>{challengeTitle(challenge)}</span>
        <h1>
          {count}
          {!isMaxMode && <small>/{challenge.goal}</small>}
        </h1>
        <div className={`feedback-toast ${statusClass(normalizedStatus)}`}>
          <span className="material-symbols-outlined filled">{feedback.icon}</span>
          <strong>{feedback.label}</strong>
        </div>
      </div>

      <div className="camera-signal">
        <div>
          <span>Confiance</span>
          <strong>{confidencePercent}%</strong>
        </div>
        <div className="thin-track">
          <div style={{ width: `${confidencePercent}%` }} />
        </div>
      </div>

      <div className="duel-progress simple">
        <div className="lead-fill" style={{ width: `${progress}%` }} />
        <div className="lead-content">
          <div className="lead-player">
            <span className="material-symbols-outlined filled">{isMaxMode ? 'timer' : 'flag'}</span>
            <div>
              <small>{isMaxMode ? 'Défi 1 minute' : 'Objectif'}</small>
              <strong>{isMaxMode ? `${count} pompes` : `${count}/${challenge.goal} pompes`}</strong>
            </div>
          </div>
          <div className="lead-bar">
            <div>
              <span style={{ width: `${progress}%` }} />
            </div>
            <strong>{progress}%</strong>
          </div>
        </div>
      </div>
    </section>
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
