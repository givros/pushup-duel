create table if not exists public.player_progressions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  progression jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.player_progressions enable row level security;

drop policy if exists "Players can read own progression" on public.player_progressions;
create policy "Players can read own progression"
on public.player_progressions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Players can insert own progression" on public.player_progressions;
create policy "Players can insert own progression"
on public.player_progressions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Players can update own progression" on public.player_progressions;
create policy "Players can update own progression"
on public.player_progressions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Players can delete own progression" on public.player_progressions;
create policy "Players can delete own progression"
on public.player_progressions
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

drop trigger if exists set_player_progressions_updated_at on public.player_progressions;
create trigger set_player_progressions_updated_at
before update on public.player_progressions
for each row
execute function public.set_updated_at();
