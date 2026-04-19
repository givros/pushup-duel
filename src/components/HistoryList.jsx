import Icon from './Icon.jsx';
import { CHALLENGE_MODES, RESULT_OUTCOMES } from '../utils/progression.js';

export default function HistoryList({ history = [], limit = null, emptyLabel = 'Aucun combat enregistré.' }) {
  const visibleHistory = typeof limit === 'number' ? history.slice(0, limit) : history;

  if (!visibleHistory.length) {
    return <p className="history-empty">{emptyLabel}</p>;
  }

  return (
    <div className="history-list">
      {visibleHistory.map((entry) => {
        const state = getHistoryState(entry);

        return (
          <article className={`history-item ${state.className}`} key={entry.id}>
            <div className="history-icon">
              <Icon name={state.icon} className="filled" />
            </div>
            <div className="history-copy">
              <strong>{state.label}</strong>
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

function getHistoryState(entry) {
  if (entry.outcome === RESULT_OUTCOMES.defeat) {
    return {
      className: 'defeat',
      icon: 'close',
      label: 'Défaite'
    };
  }

  if (entry.outcome === RESULT_OUTCOMES.pending) {
    return {
      className: 'pending',
      icon: 'timer',
      label: 'En attente'
    };
  }

  if (entry.outcome === RESULT_OUTCOMES.draw) {
    return {
      className: 'draw',
      icon: 'radio_button_checked',
      label: 'Égalité'
    };
  }

  return {
    className: '',
    icon: 'check_circle',
    label: 'Victoire'
  };
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
