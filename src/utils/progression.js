import { EXPIRED_DUEL_REASON } from './duelExpiration.js';

export const CHALLENGE_MODES = {
  maxReps: 'max_reps',
  fixedGoal: 'fixed_goal'
};

export const RESULT_OUTCOMES = {
  victory: 'victory',
  defeat: 'defeat',
  pending: 'pending',
  draw: 'draw'
};

export const ONE_MINUTE_MS = 60_000;

export function createProgression({ nickname, maxPushups }) {
  const now = new Date().toISOString();

  return normalizeProgression({
    onboarded: true,
    profile: {
      nickname: sanitizeNickname(nickname),
      maxPushups: clampInteger(maxPushups, 1, 999, 15),
      level: 1,
      xp: 0,
      coins: 0
    },
    stats: {
      sessions: 0,
      defeats: 0,
      totalPushups: 0,
      bestOneMinute: 0,
      bestFixedTimeMs: null,
      bestFixedGoal: null,
      lastResult: null,
      history: []
    },
    settings: {
      cameraPermission: 'unknown',
      cameraCheckedAt: null,
      starterChallengeCompleted: false
    },
    createdAt: now,
    updatedAt: now
  });
}

export function applyChallengeResult(progression, result, options = {}) {
  const current = normalizeProgression(progression);
  const isCompleted = result.reason === 'completed' || result.reason === 'timeup';
  const outcome = normalizeOutcome(options.outcome || result.outcome || defaultOutcomeForResult(result));
  const isDefeat = outcome === RESULT_OUTCOMES.defeat;
  const xpEarned = isDefeat ? 0 : Math.max(5, result.pushups * 2 + (isCompleted ? 10 : 0));
  const coinsEarned = isDefeat ? 0 : Math.max(2, Math.floor(result.pushups / 2) + (isCompleted ? 5 : 0));
  const nextXp = current.profile.xp + xpEarned;
  const nextLevel = 1 + Math.floor(nextXp / 500);
  const historyEntry = makeHistoryEntry(result, xpEarned, coinsEarned, outcome, options);
  const nextStats = {
    ...current.stats,
    sessions: current.stats.sessions + 1,
    defeats: current.stats.defeats + (isDefeat ? 1 : 0),
    totalPushups: current.stats.totalPushups + result.pushups,
    lastResult: {
      ...result,
      outcome,
      xpEarned,
      coinsEarned,
      completedAt: new Date().toISOString()
    },
    history: [
      historyEntry,
      ...current.stats.history
    ].slice(0, 100)
  };

  if (result.mode === CHALLENGE_MODES.maxReps && result.reason === 'timeup') {
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

  return normalizeProgression({
    ...current,
    profile: {
      ...current.profile,
      xp: nextXp,
      coins: current.profile.coins + coinsEarned,
      level: nextLevel,
      maxPushups: isDefeat ? current.profile.maxPushups : Math.max(current.profile.maxPushups, result.pushups)
    },
    stats: nextStats,
    updatedAt: new Date().toISOString()
  });
}

export function updateDuelHistoryOutcome(progression, { duelId, role, outcome, opponentResult = null }) {
  const current = normalizeProgression(progression);
  const nextOutcome = normalizeOutcome(outcome);
  const historyId = getDuelHistoryId(duelId, role);
  let previousOutcome = null;
  let changed = false;

  const nextHistory = current.stats.history.map((entry) => {
    if (entry.id !== historyId || entry.outcome === nextOutcome) {
      return entry;
    }

    previousOutcome = entry.outcome;
    changed = true;
    return {
      ...entry,
      outcome: nextOutcome,
      opponentPushups: opponentResult?.pushups ?? entry.opponentPushups ?? null,
      opponentTimeMs: opponentResult?.timeMs ?? entry.opponentTimeMs ?? null,
      opponentReason: opponentResult?.reason ?? entry.opponentReason ?? null
    };
  });

  const lastResult = current.stats.lastResult;
  const shouldUpdateLastResult = lastResult?.duelId === duelId && lastResult?.duelRole === role;

  if (shouldUpdateLastResult && lastResult.outcome !== nextOutcome) {
    changed = true;
  }

  if (!changed) {
    return null;
  }

  const defeatDelta = nextOutcome === RESULT_OUTCOMES.defeat && previousOutcome !== RESULT_OUTCOMES.defeat ? 1 : 0;

  return normalizeProgression({
    ...current,
    stats: {
      ...current.stats,
      defeats: current.stats.defeats + defeatDelta,
      lastResult: shouldUpdateLastResult
        ? {
            ...lastResult,
            outcome: nextOutcome,
            duelOutcome: nextOutcome,
            duelStatus: 'completed',
            opponentPushups: opponentResult?.pushups ?? lastResult.opponentPushups ?? null,
            opponentTimeMs: opponentResult?.timeMs ?? lastResult.opponentTimeMs ?? null,
            opponentReason: opponentResult?.reason ?? lastResult.opponentReason ?? null
          }
        : lastResult,
      history: nextHistory
    },
    updatedAt: new Date().toISOString()
  });
}

export function getDuelHistoryId(duelId, role) {
  return `${role}-${duelId}`;
}

export function updateProgressionSettings(progression, settings) {
  const current = normalizeProgression(progression);

  return normalizeProgression({
    ...current,
    settings: {
      ...current.settings,
      ...settings
    },
    updatedAt: new Date().toISOString()
  });
}

export function makeChallenge({ mode, goal }) {
  const nextMode = mode === CHALLENGE_MODES.fixedGoal ? CHALLENGE_MODES.fixedGoal : CHALLENGE_MODES.maxReps;
  const nextGoal = clampInteger(goal, 1, 999, 15);

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
  const settings = progression?.settings || {};

  return {
    onboarded: Boolean(progression?.onboarded),
    profile: {
      nickname: sanitizeNickname(profile.nickname || 'Athlète'),
      maxPushups: clampInteger(profile.maxPushups, 1, 999, 15),
      level: clampInteger(profile.level, 1, 999, 1),
      xp: clampInteger(profile.xp, 0, 999999, 0),
      coins: clampInteger(profile.coins, 0, 999999, 0)
    },
    stats: {
      sessions: clampInteger(stats.sessions, 0, 999999, 0),
      defeats: clampInteger(stats.defeats, 0, 999999, 0),
      totalPushups: clampInteger(stats.totalPushups, 0, 999999, 0),
      bestOneMinute: clampInteger(stats.bestOneMinute, 0, 999999, 0),
      bestFixedTimeMs: typeof stats.bestFixedTimeMs === 'number' ? Math.max(0, stats.bestFixedTimeMs) : null,
      bestFixedGoal: typeof stats.bestFixedGoal === 'number' ? Math.max(0, stats.bestFixedGoal) : null,
      lastResult: stats.lastResult || null,
      history: Array.isArray(stats.history) ? stats.history.map(normalizeHistoryEntry).filter(Boolean) : []
    },
    settings: {
      cameraPermission: normalizeCameraPermission(settings.cameraPermission),
      cameraCheckedAt: typeof settings.cameraCheckedAt === 'string' ? settings.cameraCheckedAt : null,
      starterChallengeCompleted: settings.starterChallengeCompleted !== false
    },
    createdAt: progression?.createdAt || new Date().toISOString(),
    updatedAt: progression?.updatedAt || new Date().toISOString()
  };
}

function makeHistoryEntry(result, xpEarned, coinsEarned, outcome, options) {
  const completedAt = new Date().toISOString();

  return {
    id: options.historyId || `${completedAt}-${Math.random().toString(36).slice(2, 8)}`,
    mode: result.mode,
    goal: result.goal,
    durationMs: result.durationMs || null,
    pushups: clampInteger(result.pushups, 0, 999999, 0),
    timeMs: Math.max(0, Math.floor(result.timeMs || 0)),
    reason: result.reason,
    outcome,
    duelId: options.duelId || result.duelId || null,
    duelRole: options.duelRole || result.duelRole || null,
    opponentName: options.opponentName || result.opponentName || null,
    opponentPushups: options.opponentPushups ?? result.opponentPushups ?? null,
    opponentTimeMs: options.opponentTimeMs ?? result.opponentTimeMs ?? null,
    opponentReason: options.opponentReason ?? result.opponentReason ?? null,
    xpEarned,
    coinsEarned,
    completedAt
  };
}

function normalizeHistoryEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const completedAt = typeof entry.completedAt === 'string' ? entry.completedAt : new Date().toISOString();
  const reason = typeof entry.reason === 'string' ? entry.reason : 'completed';
  const outcome = normalizeOutcome(entry.outcome || defaultOutcomeForResult({ reason }));

  return {
    id: typeof entry.id === 'string' ? entry.id : `${completedAt}-${Math.random().toString(36).slice(2, 8)}`,
    mode: entry.mode === CHALLENGE_MODES.fixedGoal ? CHALLENGE_MODES.fixedGoal : CHALLENGE_MODES.maxReps,
    goal: clampInteger(entry.goal, 1, 999, 15),
    durationMs: typeof entry.durationMs === 'number' ? Math.max(0, entry.durationMs) : null,
    pushups: clampInteger(entry.pushups, 0, 999999, 0),
    timeMs: typeof entry.timeMs === 'number' ? Math.max(0, entry.timeMs) : 0,
    reason,
    outcome,
    duelId: typeof entry.duelId === 'string' ? entry.duelId : null,
    duelRole: typeof entry.duelRole === 'string' ? entry.duelRole : null,
    opponentName: typeof entry.opponentName === 'string' ? entry.opponentName : null,
    opponentPushups: typeof entry.opponentPushups === 'number' ? Math.max(0, entry.opponentPushups) : null,
    opponentTimeMs: typeof entry.opponentTimeMs === 'number' ? Math.max(0, entry.opponentTimeMs) : null,
    opponentReason: typeof entry.opponentReason === 'string' ? entry.opponentReason : null,
    xpEarned: clampInteger(entry.xpEarned, 0, 999999, 0),
    coinsEarned: clampInteger(entry.coinsEarned, 0, 999999, 0),
    completedAt
  };
}

function defaultOutcomeForResult(result) {
  if (result?.reason === 'forfeit' || result?.reason === 'stopped' || result?.reason === EXPIRED_DUEL_REASON) {
    return RESULT_OUTCOMES.defeat;
  }

  return RESULT_OUTCOMES.victory;
}

function normalizeOutcome(outcome) {
  if (
    outcome === RESULT_OUTCOMES.defeat ||
    outcome === RESULT_OUTCOMES.pending ||
    outcome === RESULT_OUTCOMES.draw
  ) {
    return outcome;
  }

  return RESULT_OUTCOMES.victory;
}

function normalizeCameraPermission(permission) {
  if (permission === 'granted' || permission === 'denied') {
    return permission;
  }

  return 'unknown';
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
