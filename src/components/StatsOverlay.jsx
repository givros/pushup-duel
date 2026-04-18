import { formatTime } from '../utils/timeFormat.js';

export default function StatsOverlay({ count, goal, elapsedMs, status, confidence, onStop }) {
  const confidencePercent = Math.round((confidence || 0) * 100);
  const normalizedStatus = status || 'Prêt';

  return (
    <section className="stats-overlay" aria-live="polite">
      <div className="stats-row">
        <div className="stat-block">
          <span>Pompes</span>
          <strong>
            {count} / {goal}
          </strong>
        </div>
        <div className="stat-block">
          <span>Temps</span>
          <strong>{formatTime(elapsedMs)}</strong>
        </div>
        <button className="stop-button" type="button" onClick={onStop}>
          STOP
        </button>
      </div>

      <div className="signal-row">
        <span className={`status-pill ${statusClass(normalizedStatus)}`}>{normalizedStatus}</span>
        <div className="confidence-wrap" aria-label={`Confiance ${confidencePercent} pour cent`}>
          <span>Confiance</span>
          <div className="confidence-track">
            <div className="confidence-fill" style={{ width: `${confidencePercent}%` }} />
          </div>
          <strong>{confidencePercent}%</strong>
        </div>
      </div>
    </section>
  );
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
