create extension if not exists pgcrypto;

create table if not exists public.player_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  max_pushups integer not null default 15 check (max_pushups between 1 and 999),
  level integer not null default 1 check (level >= 1),
  xp integer not null default 0 check (xp >= 0),
  coins integer not null default 0 check (coins >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists player_accounts_nickname_lookup_idx
on public.player_accounts (lower(btrim(nickname)));

create table if not exists public.player_settings (
  user_id uuid primary key references public.player_accounts(user_id) on delete cascade,
  camera_permission text not null default 'unknown' check (camera_permission in ('unknown', 'granted', 'denied')),
  camera_checked_at timestamptz,
  starter_challenge_completed boolean not null default true,
  challenge_mode text not null default 'max_reps' check (challenge_mode in ('max_reps', 'fixed_goal')),
  fixed_goal integer not null default 15 check (fixed_goal between 1 and 999),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.player_settings
add column if not exists starter_challenge_completed boolean not null default true;

alter table public.player_settings
add column if not exists challenge_mode text not null default 'max_reps';

alter table public.player_settings
add column if not exists fixed_goal integer not null default 15;

alter table public.player_settings drop constraint if exists player_settings_challenge_mode_check;
alter table public.player_settings
add constraint player_settings_challenge_mode_check
check (challenge_mode in ('max_reps', 'fixed_goal'));

alter table public.player_settings drop constraint if exists player_settings_fixed_goal_check;
alter table public.player_settings
add constraint player_settings_fixed_goal_check
check (fixed_goal between 1 and 999);

create table if not exists public.player_stats (
  user_id uuid primary key references public.player_accounts(user_id) on delete cascade,
  sessions integer not null default 0 check (sessions >= 0),
  defeats integer not null default 0 check (defeats >= 0),
  total_pushups integer not null default 0 check (total_pushups >= 0),
  best_one_minute integer not null default 0 check (best_one_minute >= 0),
  best_fixed_time_ms double precision check (best_fixed_time_ms is null or best_fixed_time_ms >= 0),
  best_fixed_goal integer check (best_fixed_goal is null or best_fixed_goal >= 0),
  last_result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.player_history (
  id text primary key,
  user_id uuid not null references public.player_accounts(user_id) on delete cascade,
  mode text not null check (mode in ('max_reps', 'fixed_goal')),
  goal integer not null check (goal between 1 and 999),
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  pushups integer not null default 0 check (pushups >= 0),
  time_ms double precision not null default 0 check (time_ms >= 0),
  reason text not null,
  outcome text not null check (outcome in ('victory', 'defeat', 'pending', 'draw')),
  duel_id uuid,
  duel_role text check (duel_role is null or duel_role in ('challenger', 'receiver')),
  opponent_name text,
  opponent_pushups integer check (opponent_pushups is null or opponent_pushups >= 0),
  opponent_time_ms double precision check (opponent_time_ms is null or opponent_time_ms >= 0),
  opponent_reason text,
  xp_earned integer not null default 0 check (xp_earned >= 0),
  coins_earned integer not null default 0 check (coins_earned >= 0),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.player_history drop constraint if exists player_history_outcome_check;
alter table public.player_history
add constraint player_history_outcome_check
check (outcome in ('victory', 'defeat', 'pending', 'draw'));

alter table public.player_history
add column if not exists duel_id uuid;

alter table public.player_history
add column if not exists duel_role text;

alter table public.player_history
add column if not exists opponent_name text;

alter table public.player_history
add column if not exists opponent_pushups integer;

alter table public.player_history
add column if not exists opponent_time_ms double precision;

alter table public.player_history
add column if not exists opponent_reason text;

alter table public.player_history drop constraint if exists player_history_duel_role_check;
alter table public.player_history
add constraint player_history_duel_role_check
check (duel_role is null or duel_role in ('challenger', 'receiver'));

alter table public.player_history drop constraint if exists player_history_opponent_pushups_check;
alter table public.player_history
add constraint player_history_opponent_pushups_check
check (opponent_pushups is null or opponent_pushups >= 0);

alter table public.player_history drop constraint if exists player_history_opponent_time_ms_check;
alter table public.player_history
add constraint player_history_opponent_time_ms_check
check (opponent_time_ms is null or opponent_time_ms >= 0);

create table if not exists public.duel_challenges (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid not null references public.player_accounts(user_id) on delete cascade,
  receiver_id uuid not null references public.player_accounts(user_id) on delete cascade,
  mode text not null check (mode in ('max_reps', 'fixed_goal')),
  goal integer not null check (goal between 1 and 999),
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  challenger_pushups integer not null default 0 check (challenger_pushups >= 0),
  challenger_time_ms double precision not null default 0 check (challenger_time_ms >= 0),
  challenger_reason text not null,
  challenger_completed_at timestamptz not null default now(),
  challenger_snapshot jsonb not null default '{}'::jsonb,
  receiver_pushups integer check (receiver_pushups is null or receiver_pushups >= 0),
  receiver_time_ms double precision check (receiver_time_ms is null or receiver_time_ms >= 0),
  receiver_reason text,
  receiver_completed_at timestamptz,
  receiver_snapshot jsonb,
  status text not null default 'pending' check (status in ('pending', 'completed', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (challenger_id <> receiver_id)
);

create index if not exists player_history_user_completed_idx
on public.player_history (user_id, completed_at desc);

create index if not exists duel_challenges_receiver_status_idx
on public.duel_challenges (receiver_id, status, created_at desc);

create index if not exists duel_challenges_challenger_created_idx
on public.duel_challenges (challenger_id, created_at desc);

alter table public.player_accounts enable row level security;
alter table public.player_settings enable row level security;
alter table public.player_stats enable row level security;
alter table public.player_history enable row level security;
alter table public.duel_challenges enable row level security;

grant select, insert, update, delete on public.player_accounts to authenticated;
grant select, insert, update, delete on public.player_settings to authenticated;
grant select, insert, update, delete on public.player_stats to authenticated;
grant select, insert, update, delete on public.player_history to authenticated;
grant select, insert, update, delete on public.duel_challenges to authenticated;

drop policy if exists "Players can read own account" on public.player_accounts;
drop policy if exists "Players can read player directory" on public.player_accounts;
create policy "Players can read player directory"
on public.player_accounts
for select
to authenticated
using (true);

drop policy if exists "Players can insert own account" on public.player_accounts;
create policy "Players can insert own account"
on public.player_accounts
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Players can update own account" on public.player_accounts;
create policy "Players can update own account"
on public.player_accounts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Players can delete own account" on public.player_accounts;
create policy "Players can delete own account"
on public.player_accounts
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Players can read own settings" on public.player_settings;
create policy "Players can read own settings"
on public.player_settings
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Players can insert own settings" on public.player_settings;
create policy "Players can insert own settings"
on public.player_settings
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Players can update own settings" on public.player_settings;
create policy "Players can update own settings"
on public.player_settings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Players can delete own settings" on public.player_settings;
create policy "Players can delete own settings"
on public.player_settings
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Players can read own stats" on public.player_stats;
create policy "Players can read own stats"
on public.player_stats
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Players can insert own stats" on public.player_stats;
create policy "Players can insert own stats"
on public.player_stats
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Players can update own stats" on public.player_stats;
create policy "Players can update own stats"
on public.player_stats
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Players can delete own stats" on public.player_stats;
create policy "Players can delete own stats"
on public.player_stats
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Players can read own history" on public.player_history;
create policy "Players can read own history"
on public.player_history
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Players can insert own history" on public.player_history;
create policy "Players can insert own history"
on public.player_history
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Players can update own history" on public.player_history;
create policy "Players can update own history"
on public.player_history
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Players can delete own history" on public.player_history;
create policy "Players can delete own history"
on public.player_history
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Players can read own duel challenges" on public.duel_challenges;
create policy "Players can read own duel challenges"
on public.duel_challenges
for select
to authenticated
using (auth.uid() = challenger_id or auth.uid() = receiver_id);

drop policy if exists "Players can create sent duel challenges" on public.duel_challenges;
create policy "Players can create sent duel challenges"
on public.duel_challenges
for insert
to authenticated
with check (auth.uid() = challenger_id);

drop policy if exists "Players can update own duel challenges" on public.duel_challenges;
create policy "Players can update own duel challenges"
on public.duel_challenges
for update
to authenticated
using (auth.uid() = challenger_id or auth.uid() = receiver_id)
with check (auth.uid() = challenger_id or auth.uid() = receiver_id);

drop policy if exists "Players can delete own duel challenges" on public.duel_challenges;
create policy "Players can delete own duel challenges"
on public.duel_challenges
for delete
to authenticated
using (auth.uid() = challenger_id or auth.uid() = receiver_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_player_accounts_updated_at on public.player_accounts;
create trigger set_player_accounts_updated_at
before update on public.player_accounts
for each row
execute function public.set_updated_at();

drop trigger if exists set_player_settings_updated_at on public.player_settings;
create trigger set_player_settings_updated_at
before update on public.player_settings
for each row
execute function public.set_updated_at();

drop trigger if exists set_player_stats_updated_at on public.player_stats;
create trigger set_player_stats_updated_at
before update on public.player_stats
for each row
execute function public.set_updated_at();

drop trigger if exists set_player_history_updated_at on public.player_history;
create trigger set_player_history_updated_at
before update on public.player_history
for each row
execute function public.set_updated_at();

drop trigger if exists set_duel_challenges_updated_at on public.duel_challenges;
create trigger set_duel_challenges_updated_at
before update on public.duel_challenges
for each row
execute function public.set_updated_at();

create or replace function public.claim_player_account_by_nickname(input_nickname text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  requested_nickname text := lower(btrim(input_nickname));
  target_user_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if length(requested_nickname) < 2 then
    return jsonb_build_object('found', false);
  end if;

  select user_id
  into target_user_id
  from public.player_accounts
  where lower(btrim(nickname)) = requested_nickname
  order by updated_at desc, created_at desc
  limit 1;

  if target_user_id is null then
    return jsonb_build_object('found', false);
  end if;

  if target_user_id = current_user_id then
    return jsonb_build_object('found', true, 'claimed', false);
  end if;

  delete from public.player_accounts
  where user_id = current_user_id;

  insert into public.player_accounts (
    user_id,
    nickname,
    max_pushups,
    level,
    xp,
    coins,
    created_at,
    updated_at
  )
  select
    current_user_id,
    nickname,
    max_pushups,
    level,
    xp,
    coins,
    created_at,
    now()
  from public.player_accounts
  where user_id = target_user_id;

  update public.player_settings
  set user_id = current_user_id
  where user_id = target_user_id;

  update public.player_stats
  set user_id = current_user_id
  where user_id = target_user_id;

  update public.player_history
  set user_id = current_user_id
  where user_id = target_user_id;

  update public.duel_challenges
  set challenger_id = current_user_id
  where challenger_id = target_user_id;

  update public.duel_challenges
  set receiver_id = current_user_id
  where receiver_id = target_user_id;

  delete from public.player_accounts
  where user_id = target_user_id;

  return jsonb_build_object('found', true, 'claimed', true);
end;
$$;

grant execute on function public.claim_player_account_by_nickname(text) to authenticated;
