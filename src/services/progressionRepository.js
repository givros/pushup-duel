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
    throw makeRepositoryError('Impossible de charger ton profil.', accountError);
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
    throw makeRepositoryError('Impossible de charger tes réglages.', settingsResult.error);
  }

  if (statsResult.error) {
    throw makeRepositoryError('Impossible de charger tes statistiques.', statsResult.error);
  }

  if (historyResult.error) {
    throw makeRepositoryError('Impossible de charger ton historique.', historyResult.error);
  }

  return progressionFromRows({
    account,
    settings: settingsResult.data,
    stats: statsResult.data,
    history: historyResult.data || []
  });
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
    'Impossible de sauvegarder ton compte.'
  );

  const [settingsResult, statsResult] = await Promise.all([
    upsertSettings(supabase, userId, normalized),
    supabase.from(TABLES.stats).upsert(
      statsRowFromProgression(userId, normalized),
      { onConflict: 'user_id' }
    )
  ]);

  if (settingsResult.error) {
    throw makeRepositoryError('Impossible de sauvegarder tes réglages.', settingsResult.error);
  }

  if (statsResult.error) {
    throw makeRepositoryError('Impossible de sauvegarder tes statistiques.', statsResult.error);
  }

  if (normalized.stats.history.length > 0) {
    const { error: historyError } = await supabase
      .from(TABLES.history)
      .upsert(
        normalized.stats.history.map((entry) => historyRowFromEntry(userId, entry)),
        { onConflict: 'id' }
      );

    if (historyError) {
      throw makeRepositoryError('Impossible de sauvegarder ton historique.', historyError);
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
      throw makeRepositoryError('Impossible de supprimer ton compte.', error);
    }
  }

  await supabase.auth.signOut({ scope: 'local' });
}

async function getCurrentSession(supabase) {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw makeRepositoryError('Session indisponible.', error);
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
    throw makeRepositoryError('Impossible de créer ton compte.', error);
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

function historyRowFromEntry(userId, entry) {
  return {
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
