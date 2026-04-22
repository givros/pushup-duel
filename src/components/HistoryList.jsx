import Icon from './Icon.jsx';
import { CHALLENGE_MODES, RESULT_OUTCOMES } from '../utils/progression.js';
import { EXPIRED_DUEL_REASON } from '../utils/duelExpiration.js';

export default function HistoryList({ history = [], limit = null, emptyLabel = 'No saved fights.' }) {
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
                {opponentLabel(entry)} • {modeLabel(entry)} • {formatRelativeDate(entry.completedAt)}
              </span>
              {hasOpponentScore(entry) && (
                <small>
                  Opponent: {entry.opponentPushups} push-ups
                  {typeof entry.opponentTimeMs === 'number' ? ` in ${formatSeconds(entry.opponentTimeMs)}s` : ''}
                </small>
              )}
            </div>
            <div className="history-score">
              <strong>{entry.pushups}</strong>
              <span>you</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function getHistoryState(entry) {
  if (isExpiredEntry(entry)) {
    return {
      className: 'expired',
      icon: 'timer',
      label: entry.outcome === RESULT_OUTCOMES.victory ? 'Won by expiration' : 'Expired'
    };
  }

  if (entry.outcome === RESULT_OUTCOMES.defeat) {
    return {
      className: 'defeat',
      icon: 'close',
      label: 'Lost'
    };
  }

  if (entry.outcome === RESULT_OUTCOMES.pending) {
    return {
      className: 'pending',
      icon: 'timer',
      label: 'Waiting'
    };
  }

  if (entry.outcome === RESULT_OUTCOMES.draw) {
    return {
      className: 'draw',
      icon: 'radio_button_checked',
      label: 'Draw'
    };
  }

  return {
    className: '',
    icon: 'check_circle',
    label: 'Won'
  };
}

function isExpiredEntry(entry) {
  return entry.reason === EXPIRED_DUEL_REASON || entry.opponentReason === EXPIRED_DUEL_REASON;
}

function opponentLabel(entry) {
  return entry.opponentName ? `vs ${entry.opponentName}` : 'Duel';
}

function hasOpponentScore(entry) {
  return typeof entry.opponentPushups === 'number';
}

function modeLabel(entry) {
  if (entry.mode === CHALLENGE_MODES.fixedGoal) {
    return `${entry.goal} push-ups timed`;
  }

  return '1 min max';
}

function formatRelativeDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  const diffMs = date.getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const units = [
    ['day', 86_400_000],
    ['hour', 3_600_000],
    ['minute', 60_000]
  ];
  const formatter = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });

  for (const [unit, unitMs] of units) {
    if (absMs >= unitMs) {
      return formatter.format(Math.round(diffMs / unitMs), unit);
    }
  }

  return 'just now';
}

function formatSeconds(milliseconds) {
  return (Math.max(0, milliseconds) / 1000).toFixed(1);
}
