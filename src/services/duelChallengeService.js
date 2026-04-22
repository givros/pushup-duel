import { getSupabaseClient } from './supabaseClient.js';
import { challengeTitle, makeChallenge } from '../utils/progression.js';
import {
  EXPIRED_DUEL_REASON,
  getDuelExpiresAt,
  getDuelRemainingMs,
  isDuelCreatedAtExpired
} from '../utils/duelExpiration.js';

const CHALLENGES_TABLE = 'duel_challenges';

export async function listOpponentCandidates() {
  const supabase = getSupabaseClient();
  const session = await getCurrentSession(supabase);

  if (!session) {
    return [];
  }

  const { data, error } = await supabase
    .from('player_accounts')
    .select('user_id, nickname, max_pushups, level')
    .neq('user_id', session.user.id)
    .order('updated_at', { ascending: false })
    .limit(24);

  if (error) {
    console.error('Unable to load opponents.', error);
    return [];
  }

  return (data || []).map(opponentFromAccount);
}

export async function listIncomingChallenges() {
  const supabase = getSupabaseClient();
  const session = await getCurrentSession(supabase);

  if (!session) {
    return [];
  }

  const { data, error } = await supabase
    .from(CHALLENGES_TABLE)
    .select('*')
    .eq('receiver_id', session.user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(10);

  if (isMissingChallengeTable(error)) {
    return [];
  }

  if (error) {
    throw makeDuelError('Unable to load your received duels.', error);
  }

  return (data || []).map((row) => challengeFromRow(row, session.user.id));
}

export async function listOutgoingChallenges() {
  const supabase = getSupabaseClient();
  const session = await getCurrentSession(supabase);

  if (!session) {
    return [];
  }

  const { data, error } = await supabase
    .from(CHALLENGES_TABLE)
    .select('*')
    .eq('challenger_id', session.user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(10);

  if (isMissingChallengeTable(error)) {
    return [];
  }

  if (error) {
    throw makeDuelError('Unable to load your sent duels.', error);
  }

  return (data || []).map((row) => challengeFromRow(row, session.user.id));
}

export async function expireStaleDuelChallenges() {
  const supabase = getSupabaseClient();
  const session = await getCurrentSession(supabase);

  if (!session) {
    return [];
  }

  const { data, error } = await supabase
    .from(CHALLENGES_TABLE)
    .select('*')
    .or(`challenger_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
    .eq('status', 'pending')
    .limit(30);

  if (isMissingChallengeTable(error)) {
    return [];
  }

  if (error) {
    throw makeDuelError('Unable to check expired duels.', error);
  }

  const expiredRows = (data || []).filter((row) => isDuelCreatedAtExpired(row.created_at));
  const resolvedDuels = [];

  for (const row of expiredRows) {
    const resolved = await expireDuelRow(supabase, row, session.user.id);

    if (resolved) {
      resolvedDuels.push(resolved);
    }
  }

  return resolvedDuels;
}

export async function listCompletedDuelChallenges() {
  const supabase = getSupabaseClient();
  const session = await getCurrentSession(supabase);

  if (!session) {
    return [];
  }

  const { data, error } = await supabase
    .from(CHALLENGES_TABLE)
    .select('*')
    .or(`challenger_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
    .eq('status', 'completed')
    .order('updated_at', { ascending: false })
    .limit(30);

  if (isMissingChallengeTable(error)) {
    return [];
  }

  if (error) {
    throw makeDuelError('Unable to sync your duels.', error);
  }

  return (data || []).map((row) => challengeFromRow(row, session.user.id));
}

export async function getDuelChallenge(duelId) {
  if (!duelId) {
    return null;
  }

  const supabase = getSupabaseClient();
  const session = await getCurrentSession(supabase);

  if (!session) {
    return null;
  }

  const expiredDuel = await expireDuelByIdIfNeeded(supabase, duelId, session.user.id);

  if (expiredDuel) {
    return expiredDuel;
  }

  const { data, error } = await supabase
    .from(CHALLENGES_TABLE)
    .select('*')
    .eq('id', duelId)
    .maybeSingle();

  if (isMissingChallengeTable(error)) {
    return null;
  }

  if (error) {
    throw makeDuelError('Unable to load the duel.', error);
  }

  return data ? challengeFromRow(data, session.user.id) : null;
}

export async function createOutgoingChallenge({ challenge, result, opponent, progression }) {
  if (!opponent?.userId) {
    return null;
  }

  const supabase = getSupabaseClient();
  const session = await getCurrentSession(supabase);

  if (!session) {
    return null;
  }

  const { data, error } = await supabase
    .from(CHALLENGES_TABLE)
    .insert({
      challenger_id: session.user.id,
      receiver_id: opponent.userId,
      mode: challenge.mode,
      goal: challenge.goal,
      duration_ms: challenge.durationMs,
      challenger_pushups: result.pushups,
      challenger_time_ms: result.timeMs,
      challenger_reason: result.reason,
      challenger_completed_at: new Date().toISOString(),
      challenger_snapshot: playerSnapshotFromProgression(progression),
      receiver_snapshot: playerSnapshotFromOpponent(opponent),
      status: 'pending'
    })
    .select('*')
    .single();

  if (isMissingChallengeTable(error)) {
    return null;
  }

  if (error) {
    throw makeDuelError('Unable to send the duel.', error);
  }

  return challengeFromRow(data, session.user.id);
}

export async function completeIncomingChallenge({ duel, result, progression }) {
  if (!duel?.id) {
    return null;
  }

  const supabase = getSupabaseClient();
  const session = await getCurrentSession(supabase);

  if (!session) {
    return null;
  }

  const expiredDuel = await expireDuelByIdIfNeeded(supabase, duel.id, session.user.id);

  if (expiredDuel) {
    return expiredDuel;
  }

  const { data, error } = await supabase
    .from(CHALLENGES_TABLE)
    .update({
      receiver_pushups: result.pushups,
      receiver_time_ms: result.timeMs,
      receiver_reason: result.reason,
      receiver_completed_at: new Date().toISOString(),
      receiver_snapshot: playerSnapshotFromProgression(progression),
      status: 'completed'
    })
    .eq('id', duel.id)
    .eq('receiver_id', session.user.id)
    .eq('status', 'pending')
    .select('*')
    .single();

  if (isMissingChallengeTable(error)) {
    return null;
  }

  if (error) {
    throw makeDuelError('Unable to send your answer.', error);
  }

  return challengeFromRow(data, session.user.id);
}

export async function declineIncomingChallenge(duelId) {
  const supabase = getSupabaseClient();
  const session = await getCurrentSession(supabase);

  if (!session || !duelId) {
    return;
  }

  const { error } = await supabase
    .from(CHALLENGES_TABLE)
    .update({ status: 'declined' })
    .eq('id', duelId)
    .eq('receiver_id', session.user.id)
    .eq('status', 'pending');

  if (isMissingChallengeTable(error)) {
    return;
  }

  if (error) {
    throw makeDuelError('Unable to decline the duel.', error);
  }
}

async function expireDuelByIdIfNeeded(supabase, duelId, userId) {
  const { data, error } = await supabase
    .from(CHALLENGES_TABLE)
    .select('*')
    .eq('id', duelId)
    .maybeSingle();

  if (isMissingChallengeTable(error)) {
    return null;
  }

  if (error) {
    throw makeDuelError('Unable to check this duel.', error);
  }

  if (!data || data.status !== 'pending' || !isDuelCreatedAtExpired(data.created_at)) {
    return null;
  }

  return expireDuelRow(supabase, data, userId);
}

async function expireDuelRow(supabase, row, userId) {
  const { data, error } = await supabase
    .from(CHALLENGES_TABLE)
    .update({
      receiver_pushups: 0,
      receiver_time_ms: row.duration_ms || 0,
      receiver_reason: EXPIRED_DUEL_REASON,
      receiver_completed_at: new Date().toISOString(),
      receiver_snapshot: row.receiver_snapshot || {},
      status: 'completed'
    })
    .eq('id', row.id)
    .eq('status', 'pending')
    .select('*')
    .maybeSingle();

  if (isMissingChallengeTable(error)) {
    return null;
  }

  if (error) {
    throw makeDuelError('Unable to close an expired duel.', error);
  }

  return data ? challengeFromRow(data, userId) : null;
}

async function getCurrentSession(supabase) {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw makeDuelError('Session unavailable.', error);
  }

  return data.session || null;
}

function challengeFromRow(row, userId) {
  const mode = row.mode === 'fixed_goal' ? 'fixed_goal' : 'max_reps';
  const challenge = makeChallenge({ mode, goal: row.goal });
  const challenger = row.challenger_snapshot || {};
  const receiver = row.receiver_snapshot || {};
  const role = row.challenger_id === userId ? 'challenger' : 'receiver';
  const opponentSnapshot = role === 'challenger' ? receiver : challenger;
  const opponentResult = role === 'challenger'
    ? makeResultFromRow(row, 'receiver')
    : makeResultFromRow(row, 'challenger');
  const opponentName = opponentSnapshot.nickname || 'Opponent';
  const expiresAt = getDuelExpiresAt(row.created_at);

  return {
    id: row.id,
    status: row.status,
    role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt,
    remainingMs: getDuelRemainingMs(expiresAt),
    challenge,
    challengerResult: makeResultFromRow(row, 'challenger'),
    receiverResult: makeResultFromRow(row, 'receiver'),
    opponent: {
      id: role === 'challenger' ? row.receiver_id : row.challenger_id,
      userId: role === 'challenger' ? row.receiver_id : row.challenger_id,
      pseudo: opponentName,
      stat: opponentResult ? `${opponentResult.pushups} push-ups` : snapshotStat(opponentSnapshot),
      rank: challengeTitle(challenge)
    }
  };
}

function makeResultFromRow(row, role) {
  if (role === 'receiver' && row.receiver_pushups === null) {
    return null;
  }

  return {
    pushups: role === 'challenger' ? row.challenger_pushups : row.receiver_pushups,
    timeMs: role === 'challenger' ? row.challenger_time_ms : row.receiver_time_ms,
    reason: role === 'challenger' ? row.challenger_reason : row.receiver_reason,
    completedAt: role === 'challenger' ? row.challenger_completed_at : row.receiver_completed_at
  };
}

function opponentFromAccount(account) {
  return {
    id: account.user_id,
    userId: account.user_id,
    pseudo: account.nickname,
    maxPushups: account.max_pushups,
    level: account.level,
    stat: `Declared max: ${account.max_pushups}`,
    rank: `Level ${account.level}`
  };
}

function playerSnapshotFromProgression(progression) {
  return {
    nickname: progression?.profile?.nickname || 'Player',
    maxPushups: progression?.profile?.maxPushups || 0,
    level: progression?.profile?.level || 1
  };
}

function playerSnapshotFromOpponent(opponent) {
  return {
    nickname: opponent?.pseudo || 'Opponent',
    maxPushups: opponent?.maxPushups || 0,
    level: opponent?.level || 1
  };
}

function snapshotStat(snapshot) {
  if (snapshot?.maxPushups) {
    return `Declared max: ${snapshot.maxPushups}`;
  }

  if (snapshot?.level) {
    return `Level ${snapshot.level}`;
  }

  return 'Score pending';
}

function isMissingChallengeTable(error) {
  return error?.code === '42P01' || error?.message?.includes(CHALLENGES_TABLE);
}

function makeDuelError(message, cause) {
  if (cause) {
    console.error(message, cause);
  }

  const error = new Error(message);
  error.cause = cause;
  return error;
}
