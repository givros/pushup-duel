create table if not exists public.player_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  max_pushups integer not null default 20 check (max_pushups between 1 and 999),
  level integer not null default 1 check (level >= 1),
  xp integer not null default 0 check (xp >= 0),
  coins integer not null default 0 check (coins >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.player_settings (
  user_id uuid primary key references public.player_accounts(user_id) on delete cascade,
  camera_permission text not null default 'unknown' check (camera_permission in ('unknown', 'granted', 'denied')),
  camera_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
  outcome text not null check (outcome in ('victory', 'defeat')),
  xp_earned integer not null default 0 check (xp_earned >= 0),
  coins_earned integer not null default 0 check (coins_earned >= 0),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists player_history_user_completed_idx
on public.player_history (user_id, completed_at desc);

alter table public.player_accounts enable row level security;
alter table public.player_settings enable row level security;
alter table public.player_stats enable row level security;
alter table public.player_history enable row level security;

grant select, insert, update, delete on public.player_accounts to authenticated;
grant select, insert, update, delete on public.player_settings to authenticated;
grant select, insert, update, delete on public.player_stats to authenticated;
grant select, insert, update, delete on public.player_history to authenticated;

drop policy if exists "Players can read own account" on public.player_accounts;
create policy "Players can read own account"
on public.player_accounts
for select
to authenticated
using (auth.uid() = user_id);

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
