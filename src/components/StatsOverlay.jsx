import { formatTime } from '../utils/timeFormat.js';
import { CHALLENGE_MODES, challengeTitle } from '../utils/progression.js';
import Icon from './Icon.jsx';

export default function StatsOverlay({ count, challenge, elapsedMs, status, confidence, onStop }) {
  const confidencePercent = Math.round((confidence || 0) * 100);
  const normalizedStatus = status || 'Ready';
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
            <strong>Push-up Duel</strong>
            <small>{isMaxMode ? '1 minute' : 'Timed'}</small>
          </div>
        </div>

        <div className="duel-timebox single">
          <div>
            <span>{isMaxMode ? 'Time left' : 'Time'}</span>
            <strong>{formatTime(remainingMs)}</strong>
          </div>
        </div>

        <button className="cancel-challenge-button" type="button" onClick={onStop} aria-label="Cancel challenge">
          <Icon name="close" />
          <span>Cancel</span>
        </button>
      </header>

      <div className="rep-stage simple">
        <span>{challengeTitle(challenge)}</span>
        <h1>
          {count}
          {!isMaxMode && <small>/{challenge.goal}</small>}
        </h1>
        <div className={`feedback-toast ${statusClass(normalizedStatus)}`}>
          <Icon name={feedback.icon} className="filled" />
          <strong>{feedback.label}</strong>
        </div>
      </div>

      <div className="camera-signal">
        <div>
          <span>Confidence</span>
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
            <Icon name={isMaxMode ? 'timer' : 'flag'} className="filled" />
            <div>
              <small>{isMaxMode ? '1-minute challenge' : 'Goal'}</small>
              <strong>{isMaxMode ? `${count} push-ups` : `${count}/${challenge.goal} push-ups`}</strong>
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
    return { icon: 'check_circle', label: 'Perfect' };
  }
  if (status === 'Go up') {
    return { icon: 'arrow_upward', label: 'Go up' };
  }
  if (status === 'Go down') {
    return { icon: 'arrow_downward', label: 'Go down' };
  }
  if (status === 'bad framing') {
    return { icon: 'center_focus_strong', label: 'Framing' };
  }
  return { icon: 'radio_button_checked', label: 'Ready' };
}

function statusClass(status) {
  if (status === 'OK') {
    return 'status-ok';
  }
  if (status === 'bad framing') {
    return 'status-bad';
  }
  if (status === 'Go up') {
    return 'status-up';
  }
  if (status === 'Go down') {
    return 'status-down';
  }
  return 'status-ready';
}
