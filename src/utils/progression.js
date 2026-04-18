const STORAGE_KEY = 'pushup-duel-progress-v1';

export const CHALLENGE_MODES = {
  maxReps: 'max_reps',
  fixedGoal: 'fixed_goal'
};

export const ONE_MINUTE_MS = 60_000;

export function loadProgression() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return normalizeProgression(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveProgression(progression) {
  const normalized = normalizeProgression(progression);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function createProgression({ nickname, maxPushups }) {
  const now = new Date().toISOString();

  return saveProgression({
    onboarded: true,
    profile: {
      nickname: sanitizeNickname(nickname),
      maxPushups: clampInteger(maxPushups, 1, 999, 20),
      level: 1,
      xp: 0,
      coins: 0
    },
    stats: {
      sessions: 0,
      totalPushups: 0,
      bestOneMinute: 0,
      bestFixedTimeMs: null,
      bestFixedGoal: null,
      lastResult: null
    },
    createdAt: now,
    updatedAt: now
  });
}

export function applyChallengeResult(progression, result) {
  const current = normalizeProgression(progression);
  const isCompleted = result.reason === 'completed' || result.reason === 'timeup';
  const xpEarned = Math.max(5, result.pushups * 2 + (isCompleted ? 10 : 0));
  const coinsEarned = Math.max(2, Math.floor(result.pushups / 2) + (isCompleted ? 5 : 0));
  const nextXp = current.profile.xp + xpEarned;
  const nextLevel = 1 + Math.floor(nextXp / 500);
  const nextStats = {
    ...current.stats,
    sessions: current.stats.sessions + 1,
    totalPushups: current.stats.totalPushups + result.pushups,
    lastResult: {
      ...result,
      xpEarned,
      coinsEarned,
      completedAt: new Date().toISOString()
    }
  };

  if (result.mode === CHALLENGE_MODES.maxReps) {
    nextStats.bestOneMinute = Math.max(current.stats.bestOneMinute, result.pushups);
  }

  if (
    result.mode === CHALLENGE_MODES.fixedGoal &&
    result.reason === 'completed' &&
    (current.stats.bestFixedTimeMs === null || result.timeMs < current.stats.bestFixedTimeMs)
  ) {
    nextStats.bestFixedTimeMs = result.timeMs;
    nextStats.bestFixedGoal = result.goal;
  }

  return saveProgression({
    ...current,
    profile: {
      ...current.profile,
      xp: nextXp,
      coins: current.profile.coins + coinsEarned,
      level: nextLevel,
      maxPushups: Math.max(current.profile.maxPushups, result.pushups)
    },
    stats: nextStats,
    updatedAt: new Date().toISOString()
  });
}

export function makeChallenge({ mode, goal }) {
  const nextMode = mode === CHALLENGE_MODES.fixedGoal ? CHALLENGE_MODES.fixedGoal : CHALLENGE_MODES.maxReps;
  const nextGoal = clampInteger(goal, 1, 999, 20);

  return {
    mode: nextMode,
    goal: nextGoal,
    durationMs: nextMode === CHALLENGE_MODES.maxReps ? ONE_MINUTE_MS : null
  };
}

export function challengeTitle(challenge) {
  if (challenge.mode === CHALLENGE_MODES.fixedGoal) {
    return `${challenge.goal} pompes le plus vite possible`;
  }

  return 'Maximum de pompes en 1 min';
}

export function normalizeProgression(progression) {
  const profile = progression?.profile || {};
  const stats = progression?.stats || {};

  return {
    onboarded: Boolean(progression?.onboarded),
    profile: {
      nickname: sanitizeNickname(profile.nickname || 'Athlète'),
      maxPushups: clampInteger(profile.maxPushups, 1, 999, 20),
      level: clampInteger(profile.level, 1, 999, 1),
      xp: clampInteger(profile.xp, 0, 999999, 0),
      coins: clampInteger(profile.coins, 0, 999999, 0)
    },
    stats: {
      sessions: clampInteger(stats.sessions, 0, 999999, 0),
      totalPushups: clampInteger(stats.totalPushups, 0, 999999, 0),
      bestOneMinute: clampInteger(stats.bestOneMinute, 0, 999999, 0),
      bestFixedTimeMs: typeof stats.bestFixedTimeMs === 'number' ? Math.max(0, stats.bestFixedTimeMs) : null,
      bestFixedGoal: typeof stats.bestFixedGoal === 'number' ? Math.max(0, stats.bestFixedGoal) : null,
      lastResult: stats.lastResult || null
    },
    createdAt: progression?.createdAt || new Date().toISOString(),
    updatedAt: progression?.updatedAt || new Date().toISOString()
  };
}

function sanitizeNickname(value) {
  const nickname = String(value || '').trim().slice(0, 18);
  return nickname || 'Athlète';
}

function clampInteger(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}
