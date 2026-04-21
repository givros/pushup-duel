export const DUEL_EXPIRATION_MS = 24 * 60 * 60 * 1000;
export const EXPIRED_DUEL_REASON = 'expired';

export function getDuelExpiresAt(createdAt) {
  const createdTime = new Date(createdAt).getTime();

  if (Number.isNaN(createdTime)) {
    return null;
  }

  return new Date(createdTime + DUEL_EXPIRATION_MS).toISOString();
}

export function getDuelRemainingMs(expiresAt, now = Date.now()) {
  const expiresTime = new Date(expiresAt).getTime();

  if (Number.isNaN(expiresTime)) {
    return 0;
  }

  return Math.max(0, expiresTime - now);
}

export function isDuelExpired(expiresAt, now = Date.now()) {
  return getDuelRemainingMs(expiresAt, now) <= 0;
}

export function isDuelCreatedAtExpired(createdAt, now = Date.now()) {
  return isDuelExpired(getDuelExpiresAt(createdAt), now);
}

export function formatDuelRemainingTime(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}min`;
  }

  if (minutes > 0) {
    return `${minutes}min ${String(seconds).padStart(2, '0')}s`;
  }

  return `${seconds}s`;
}
