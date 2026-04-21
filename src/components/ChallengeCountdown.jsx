import Icon from './Icon.jsx';
import { formatDuelRemainingTime, getDuelRemainingMs } from '../utils/duelExpiration.js';

export default function ChallengeCountdown({ expiresAt, now, prefix }) {
  const remainingMs = getDuelRemainingMs(expiresAt, now);
  const isUrgent = remainingMs > 0 && remainingMs <= 60 * 60 * 1000;

  return (
    <small className={`challenge-timer ${isUrgent ? 'urgent' : ''}`}>
      <Icon name={remainingMs > 0 ? 'timer' : 'sync'} className="filled" />
      {remainingMs > 0 ? `${prefix} ${formatDuelRemainingTime(remainingMs)}` : 'Résolution en cours'}
    </small>
  );
}
