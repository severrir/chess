-- Chess club schema, applied to the shared `rveuli` Supabase project.
--
-- The club lives under a `chess_` prefix because the free tier allows two
-- active projects and both are already in use elsewhere.
--
-- Anyone reads. Only an account with a row in chess_admins writes — having
-- an account is not enough, which is the whole point of the admin table.
--
-- Ratings are never stored: the client replays the game log, so a mistyped
-- result can be corrected and the ladder re-derives itself. That is also
-- why chess_games has no rating columns to drift out of date.
--
-- Safe to re-run.

-- ─────────────────────────────────────────────────────────────
-- Who may write
-- ─────────────────────────────────────────────────────────────

create table if not exists public.chess_admins (
  id         uuid primary key references auth.users (id) on delete cascade,
  label      text not null default 'კლუბის ხელმძღვანელი',
  created_at timestamptz not null default now()
);

-- A policy that selected from chess_admins directly would recurse, so the
-- membership test is a security-definer function instead.
create schema if not exists private;

create or replace function private.is_chess_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.chess_admins a where a.id = auth.uid());
$$;

-- ─────────────────────────────────────────────────────────────
-- The club
-- ─────────────────────────────────────────────────────────────

create table if not exists public.chess_players (
  id        uuid primary key default gen_random_uuid(),
  name      text not null check (length(trim(name)) between 2 and 60),
  klass     text not null check (length(trim(klass)) between 1 and 10),
  joined_at timestamptz not null default now()
);

create table if not exists public.chess_games (
  id        uuid primary key default gen_random_uuid(),
  white_id  uuid not null references public.chess_players (id) on delete cascade,
  black_id  uuid not null references public.chess_players (id) on delete cascade,
  -- The score from white's point of view: 1, ½ or 0.
  result    numeric not null check (result in (0, 0.5, 1)),
  type      text not null check (type in ('blitz', 'classical', 'rapid')),
  played_at timestamptz not null default now(),
  note      text,
  constraint chess_games_distinct_players check (white_id <> black_id)
);

create index if not exists chess_games_played_at_idx
  on public.chess_games (played_at);

create table if not exists public.chess_events (
  id        uuid primary key default gen_random_uuid(),
  title     text not null,
  kind      text not null,
  starts_at timestamptz not null,
  location  text not null default 'სკოლა',
  note      text
);

-- A knockout is a tree, and a tree is one document, so the bracket is
-- jsonb: [{ name, matches: [{ a, b, winner, score }] }].
create table if not exists public.chess_tournaments (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  status       text not null default 'live' check (status in ('live', 'finished')),
  format       text,
  started_at   timestamptz not null default now(),
  rounds       jsonb not null default '[]'::jsonb,
  winner_id    uuid references public.chess_players (id) on delete set null,
  runner_up_id uuid references public.chess_players (id) on delete set null
);

-- ─────────────────────────────────────────────────────────────
-- Row-level security
-- ─────────────────────────────────────────────────────────────

alter table public.chess_admins      enable row level security;
alter table public.chess_players     enable row level security;
alter table public.chess_games       enable row level security;
alter table public.chess_events      enable row level security;
alter table public.chess_tournaments enable row level security;

do $$
declare
  t text;
begin
  -- Everyone reads the club, signed in or not.
  foreach t in array array[
    'chess_admins', 'chess_players', 'chess_games',
    'chess_events', 'chess_tournaments'
  ] loop
    execute format(
      'drop policy if exists %1$s_read on public.%1$s', t);
    execute format(
      'create policy %1$s_read on public.%1$s for select using (true)', t);
  end loop;

  -- Writes are the club leader's alone. chess_admins itself is managed in
  -- the dashboard, so it gets no write policy at all.
  foreach t in array array[
    'chess_players', 'chess_games', 'chess_events', 'chess_tournaments'
  ] loop
    execute format(
      'drop policy if exists %1$s_write on public.%1$s', t);
    execute format(
      'create policy %1$s_write on public.%1$s for all to authenticated
         using (private.is_chess_admin())
         with check (private.is_chess_admin())', t);
  end loop;
end
$$;

-- ─────────────────────────────────────────────────────────────
-- Realtime — a result entered at the board reaches every phone
-- ─────────────────────────────────────────────────────────────

do $$
declare
  t text;
begin
  foreach t in array array[
    'chess_players', 'chess_games', 'chess_events', 'chess_tournaments'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format(
        'alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end
$$;
