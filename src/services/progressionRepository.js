import { getSupabaseClient } from './supabaseClient.js';
import { normalizeProgression } from '../utils/progression.js';

const TABLES = {
  accounts: 'player_accounts',
  settings: 'player_settings',
  stats: 'player_stats',
  history: 'player_history'
};

export async function loadRemoteProgression() {
  const supabase = getSupabaseClient();
  const session = await getCurrentSession(supabase);

  if (!session) {
    return null;
  }

  const { data: account, error: accountError } = await supabase
    .from(TABLES.accounts)
    .select('*')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (accountError) {
    throw makeRepositoryError('Unable to load your profile.', accountError);
  }

  if (!account) {
    return null;
  }

  const [settingsResult, statsResult, historyResult] = await Promise.all([
    supabase
      .from(TABLES.settings)
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle(),
    supabase
      .from(TABLES.stats)
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle(),
    supabase
      .from(TABLES.history)
      .select('*')
      .eq('user_id', session.user.id)
      .order('completed_at', { ascending: false })
      .limit(100)
  ]);

  if (settingsResult.error) {
    throw makeRepositoryError('Unable to load your settings.', settingsResult.error);
  }

  if (statsResult.error) {
    throw makeRepositoryError('Unable to load your statistics.', statsResult.error);
  }

  if (historyResult.error) {
    throw makeRepositoryError('Unable to load your history.', historyResult.error);
  }

  return progressionFromRows({
    account,
    settings: settingsResult.data,
    stats: statsResult.data,
    history: historyResult.data || []
  });
}

export async function recoverRemoteProgressionByNickname(nickname) {
  const normalizedNickname = String(nickname || '').trim();

  if (normalizedNickname.length < 2) {
    return null;
  }

  const supabase = getSupabaseClient();
  await ensureAnonymousSession(supabase);

  const { data, error } = await supabase.rpc('claim_player_account_by_nickname', {
    input_nickname: normalizedNickname
  });

  if (isMissingClaimFunction(error)) {
    throw makeRepositoryError('Profile recovery is not configured yet. Run the latest Supabase schema.', error);
  }

  if (error) {
    throw makeRepositoryError('Unable to check this nickname.', error);
  }

  if (!data?.found) {
    return null;
  }

  return loadRemoteProgression();
}

export async function saveRemoteProgression(progression) {
  const supabase = getSupabaseClient();
  const session = await ensureAnonymousSession(supabase);
  const normalized = normalizeProgression(progression);
  const userId = session.user.id;

  await upsertOrThrow(
    supabase.from(TABLES.accounts).upsert(
      accountRowFromProgression(userId, normalized),
      { onConflict: 'user_id' }
    ),
    'Unable to save your account.'
  );

  const [settingsResult, statsResult] = await Promise.all([
    upsertSettings(supabase, userId, normalized),
    supabase.from(TABLES.stats).upsert(
      statsRowFromProgression(userId, normalized),
      { onConflict: 'user_id' }
    )
  ]);

  if (settingsResult.error) {
    throw makeRepositoryError('Unable to save your settings.', settingsResult.error);
  }

  if (statsResult.error) {
    throw makeRepositoryError('Unable to save your statistics.', statsResult.error);
  }

  if (normalized.stats.history.length > 0) {
    const { error: historyError } = await upsertHistory(supabase, userId, normalized.stats.history);

    if (historyError) {
      throw makeRepositoryError('Unable to save your history.', historyError);
    }
  }

  return loadRemoteProgression();
}

export async function deleteRemoteProgression() {
  const supabase = getSupabaseClient();
  const session = await getCurrentSession(supabase);

  if (session) {
    const { error } = await supabase
      .from(TABLES.accounts)
      .delete()
      .eq('user_id', session.user.id);

    if (error) {
      throw makeRepositoryError('Unable to delete your account.', error);
    }
  }

  await supabase.auth.signOut({ scope: 'local' });
}

async function getCurrentSession(supabase) {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw makeRepositoryError('Session unavailable.', error);
  }

  return data.session || null;
}

async function ensureAnonymousSession(supabase) {
  const existingSession = await getCurrentSession(supabase);

  if (existingSession) {
    return existingSession;
  }

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error || !data.session) {
    throw makeRepositoryError('Unable to create your account.', error);
  }

  return data.session;
}

async function upsertOrThrow(request, message) {
  const { error } = await request;

  if (error) {
    throw makeRepositoryError(message, error);
  }
}

async function upsertSettings(supabase, userId, progression) {
  const result = await supabase.from(TABLES.settings).upsert(
    settingsRowFromProgression(userId, progression),
    { onConflict: 'user_id' }
  );

  if (!isStarterChallengeColumnMissing(result.error)) {
    return result;
  }

  return supabase.from(TABLES.settings).upsert(
    settingsRowFromProgression(userId, progression, { includeStarterChallenge: false }),
    { onConflict: 'user_id' }
  );
}

async function upsertHistory(supabase, userId, history) {
  const result = await supabase
    .from(TABLES.history)
    .upsert(
      history.map((entry) => historyRowFromEntry(userId, entry)),
      { onConflict: 'id' }
    );

  if (!isHistoryMetadataColumnMissing(result.error)) {
    return result;
  }

  return supabase
    .from(TABLES.history)
    .upsert(
      history.map((entry) => historyRowFromEntry(userId, entry, { includeDuelMetadata: false })),
      { onConflict: 'id' }
    );
}

function progressionFromRows({ account, settings, stats, history }) {
  return normalizeProgression({
    onboarded: true,
    profile: {
      nickname: account.nickname,
      maxPushups: account.max_pushups,
      level: account.level,
      xp: account.xp,
      coins: account.coins
    },
    settings: {
      cameraPermission: settings?.camera_permission,
      cameraCheckedAt: settings?.camera_checked_at,
      starterChallengeCompleted: settings?.starter_challenge_completed
    },
    stats: {
      sessions: stats?.sessions,
      defeats: stats?.defeats,
      totalPushups: stats?.total_pushups,
      bestOneMinute: stats?.best_one_minute,
      bestFixedTimeMs: stats?.best_fixed_time_ms,
      bestFixedGoal: stats?.best_fixed_goal,
      lastResult: stats?.last_result || null,
      history: history.map(historyEntryFromRow)
    },
    createdAt: account.created_at,
    updatedAt: latestDate([
      account.updated_at,
      settings?.updated_at,
      stats?.updated_at
    ])
  });
}

function accountRowFromProgression(userId, progression) {
  return {
    user_id: userId,
    nickname: progression.profile.nickname,
    max_pushups: progression.profile.maxPushups,
    level: progression.profile.level,
    xp: progression.profile.xp,
    coins: progression.profile.coins
  };
}

function settingsRowFromProgression(userId, progression, options = {}) {
  const row = {
    user_id: userId,
    camera_permission: progression.settings.cameraPermission,
    camera_checked_at: progression.settings.cameraCheckedAt
  };

  if (options.includeStarterChallenge !== false) {
    row.starter_challenge_completed = progression.settings.starterChallengeCompleted;
  }

  return row;
}

function statsRowFromProgression(userId, progression) {
  return {
    user_id: userId,
    sessions: progression.stats.sessions,
    defeats: progression.stats.defeats,
    total_pushups: progression.stats.totalPushups,
    best_one_minute: progression.stats.bestOneMinute,
    best_fixed_time_ms: progression.stats.bestFixedTimeMs,
    best_fixed_goal: progression.stats.bestFixedGoal,
    last_result: progression.stats.lastResult
  };
}

function historyRowFromEntry(userId, entry, options = {}) {
  const row = {
    id: entry.id,
    user_id: userId,
    mode: entry.mode,
    goal: entry.goal,
    duration_ms: entry.durationMs,
    pushups: entry.pushups,
    time_ms: entry.timeMs,
    reason: entry.reason,
    outcome: entry.outcome,
    xp_earned: entry.xpEarned,
    coins_earned: entry.coinsEarned,
    completed_at: entry.completedAt
  };

  if (options.includeDuelMetadata !== false) {
    row.duel_id = entry.duelId;
    row.duel_role = entry.duelRole;
    row.opponent_name = entry.opponentName;
    row.opponent_pushups = entry.opponentPushups;
    row.opponent_time_ms = entry.opponentTimeMs;
    row.opponent_reason = entry.opponentReason;
  }

  return row;
}

function historyEntryFromRow(row) {
  return {
    id: row.id,
    mode: row.mode,
    goal: row.goal,
    durationMs: row.duration_ms,
    pushups: row.pushups,
    timeMs: row.time_ms,
    reason: row.reason,
    outcome: row.outcome,
    duelId: row.duel_id,
    duelRole: row.duel_role,
    opponentName: row.opponent_name,
    opponentPushups: row.opponent_pushups,
    opponentTimeMs: row.opponent_time_ms,
    opponentReason: row.opponent_reason,
    xpEarned: row.xp_earned,
    coinsEarned: row.coins_earned,
    completedAt: row.completed_at
  };
}

function latestDate(values) {
  const timestamps = values
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter(Number.isFinite);

  if (timestamps.length === 0) {
    return new Date().toISOString();
  }

  return new Date(Math.max(...timestamps)).toISOString();
}

function makeRepositoryError(message, cause) {
  if (cause) {
    console.error(message, cause);
  }

  const error = new Error(message);
  error.cause = cause;
  return error;
}

function isStarterChallengeColumnMissing(error) {
  return Boolean(
    error &&
      (
        error.code === 'PGRST204' ||
        error.message?.includes('starter_challenge_completed') ||
        error.message?.includes('schema cache')
      )
  );
}

function isHistoryMetadataColumnMissing(error) {
  return Boolean(
    error &&
      (
        error.code === 'PGRST204' ||
        error.message?.includes('duel_id') ||
        error.message?.includes('duel_role') ||
        error.message?.includes('opponent_name') ||
        error.message?.includes('opponent_pushups') ||
        error.message?.includes('opponent_time_ms') ||
        error.message?.includes('opponent_reason') ||
        error.message?.includes('schema cache')
      )
  );
}

function isMissingClaimFunction(error) {
  return Boolean(
    error &&
      (
        error.code === '42883' ||
        error.code === 'PGRST202' ||
        error.message?.includes('claim_player_account_by_nickname') ||
        error.message?.includes('schema cache')
      )
  );
}
