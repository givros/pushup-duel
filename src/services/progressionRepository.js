import { getSupabaseClient } from './supabaseClient.js';
import { normalizeProgression } from '../utils/progression.js';

const PROGRESSION_TABLE = 'player_progressions';

export async function loadRemoteProgression() {
  const supabase = getSupabaseClient();
  const session = await ensureAnonymousSession(supabase);

  const { data, error } = await supabase
    .from(PROGRESSION_TABLE)
    .select('progression')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (error) {
    throw makeRepositoryError('Impossible de charger la progression.', error);
  }

  return data?.progression ? normalizeProgression(data.progression) : null;
}

export async function saveRemoteProgression(progression) {
  const supabase = getSupabaseClient();
  const session = await ensureAnonymousSession(supabase);
  const normalized = normalizeProgression(progression);

  const { data, error } = await supabase
    .from(PROGRESSION_TABLE)
    .upsert(
      {
        user_id: session.user.id,
        progression: normalized,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id' }
    )
    .select('progression')
    .single();

  if (error) {
    throw makeRepositoryError('Impossible de sauvegarder la progression.', error);
  }

  return normalizeProgression(data?.progression || normalized);
}

export async function deleteRemoteProgression() {
  const supabase = getSupabaseClient();
  const session = await ensureAnonymousSession(supabase);

  const { error } = await supabase
    .from(PROGRESSION_TABLE)
    .delete()
    .eq('user_id', session.user.id);

  if (error) {
    throw makeRepositoryError('Impossible de supprimer le compte.', error);
  }

  await supabase.auth.signOut({ scope: 'local' });
}

async function ensureAnonymousSession(supabase) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw makeRepositoryError('Session Supabase indisponible.', sessionError);
  }

  if (sessionData.session) {
    return sessionData.session;
  }

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error || !data.session) {
    throw makeRepositoryError('Connexion anonyme Supabase impossible.', error);
  }

  return data.session;
}

function makeRepositoryError(message, cause) {
  const details = cause?.message ? `${message} ${cause.message}` : message;
  return new Error(details);
}
