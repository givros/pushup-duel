import Icon from './Icon.jsx';
import { CHALLENGE_MODES } from '../utils/progression.js';

export default function HistoryList({ history = [], limit = null, emptyLabel = 'Aucun combat enregistré.' }) {
  const visibleHistory = typeof limit === 'number' ? history.slice(0, limit) : history;

  if (!visibleHistory.length) {
    return <p className="history-empty">{emptyLabel}</p>;
  }

  return (
    <div className="history-list">
      {visibleHistory.map((entry) => {
        const isDefeat = entry.outcome === 'defeat';

        return (
          <article className={`history-item ${isDefeat ? 'defeat' : ''}`} key={entry.id}>
            <div className="history-icon">
              <Icon name={isDefeat ? 'close' : 'check_circle'} className="filled" />
            </div>
            <div className="history-copy">
              <strong>{isDefeat ? 'Défaite' : 'Victoire'}</strong>
              <span>
                {modeLabel(entry)} • {formatDate(entry.completedAt)}
              </span>
            </div>
            <div className="history-score">
              <strong>{entry.pushups}</strong>
              <span>pompes</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function modeLabel(entry) {
  if (entry.mode === CHALLENGE_MODES.fixedGoal) {
    return `${entry.goal} pompes chrono`;
  }

  return 'Max en 1 min';
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date inconnue';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}
