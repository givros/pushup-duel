import { getSupabaseClient } from './supabaseClient.js';
import { challengeTitle, makeChallenge } from '../utils/progression.js';

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
    console.error('Impossible de charger les adversaires.', error);
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
    throw makeDuelError('Impossible de charger tes défis reçus.', error);
  }

  return (data || []).map(challengeFromRow);
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
      status: 'pending'
    })
    .select('*')
    .single();

  if (isMissingChallengeTable(error)) {
    return null;
  }

  if (error) {
    throw makeDuelError('Impossible d’envoyer le défi.', error);
  }

  return challengeFromRow(data);
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
    throw makeDuelError('Impossible d’envoyer ta réponse.', error);
  }

  return challengeFromRow(data);
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
    throw makeDuelError('Impossible de refuser le défi.', error);
  }
}

async function getCurrentSession(supabase) {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw makeDuelError('Session indisponible.', error);
  }

  return data.session || null;
}

function challengeFromRow(row) {
  const mode = row.mode === 'fixed_goal' ? 'fixed_goal' : 'max_reps';
  const challenge = makeChallenge({ mode, goal: row.goal });
  const challenger = row.challenger_snapshot || {};
  const challengerName = challenger.nickname || 'Adversaire';

  return {
    id: row.id,
    status: row.status,
    createdAt: row.created_at,
    challenge,
    challengerResult: {
      pushups: row.challenger_pushups,
      timeMs: row.challenger_time_ms,
      reason: row.challenger_reason,
      completedAt: row.challenger_completed_at
    },
    opponent: {
      id: row.challenger_id,
      userId: row.challenger_id,
      pseudo: challengerName,
      stat: `${row.challenger_pushups} pompes`,
      rank: challengeTitle(challenge)
    }
  };
}

function opponentFromAccount(account) {
  return {
    id: account.user_id,
    userId: account.user_id,
    pseudo: account.nickname,
    stat: `Max déclaré : ${account.max_pushups}`,
    rank: `Niveau ${account.level}`
  };
}

function playerSnapshotFromProgression(progression) {
  return {
    nickname: progression?.profile?.nickname || 'Joueur',
    maxPushups: progression?.profile?.maxPushups || 0,
    level: progression?.profile?.level || 1
  };
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
