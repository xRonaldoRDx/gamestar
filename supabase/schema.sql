-- =============================================================
-- GAMESTAR - Supabase schema
-- Paste this whole file into the Supabase SQL Editor and run it.
-- Safe to run more than once: it only creates what is missing and
-- migrates data from earlier versions.
-- =============================================================

-- -------------------------------------------------------------
-- PROFILES (1:1 with auth.users)
-- -------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique
    check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null default '',
  bio text not null default '' check (char_length(bio) <= 160),
  created_at timestamptz not null default now()
);

-- Creates the profile automatically on sign up.
-- username comes from options.data.username sent by the app.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    lower(new.raw_user_meta_data ->> 'username'),
    coalesce(new.raw_user_meta_data ->> 'display_name', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Admins curate the catalog. Users cannot promote themselves: they may only
-- update display_name and bio (column-level grant below).
alter table public.profiles add column if not exists is_admin boolean not null default false;

revoke update on public.profiles from anon, authenticated;
grant update (display_name, bio) on public.profiles to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select is_admin from public.profiles where id = (select auth.uid())),
    false
  );
$$;

-- -------------------------------------------------------------
-- GAMES (shared catalog)
-- Imported from IGDB by the `catalog` Edge Function or added by admins.
-- 'steam' rows come from an earlier version and are kept as they are.
-- -------------------------------------------------------------
create table if not exists public.games (
  id bigint generated always as identity primary key,
  title text not null check (char_length(title) between 1 and 120),
  release_year int check (release_year between 1950 and 2100),
  cover_url text,
  genres text not null default '',
  developer text not null default '',
  platforms text not null default '',
  source text not null,
  steam_appid int unique,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

alter table public.games add column if not exists igdb_id bigint unique;
alter table public.games add column if not exists summary text not null default '';
-- Critics score from IGDB, already converted to the app's 0-5 scale
alter table public.games add column if not exists critic_rating numeric(2, 1);
alter table public.games add column if not exists updated_at timestamptz not null default now();

-- The old constraint only allowed 'steam' and 'user', so it must go before the update.
-- Games typed in by users in the first version become admin-curated.
alter table public.games drop constraint if exists games_source_check;
update public.games set source = 'admin' where source = 'user';
alter table public.games add constraint games_source_check
  check (source in ('igdb', 'steam', 'admin'));

create index if not exists games_title_idx on public.games (lower(title));

-- -------------------------------------------------------------
-- USER LIBRARY (status, 0-5 star rating, review...)
-- -------------------------------------------------------------
create table if not exists public.user_games (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  game_id bigint not null references public.games (id) on delete cascade,
  status text not null,
  rating numeric(2, 1),
  review text not null default '' check (char_length(review) <= 2000),
  playtime int check (playtime >= 0),
  platform text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, game_id)
);

-- Migration from the first version: ratings were 0-10 and there was a 'backlog' status.
-- The numeric(3,1) column type marks the old version, so this runs only once.
alter table public.user_games drop constraint if exists user_games_status_check;
alter table public.user_games drop constraint if exists user_games_rating_check;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_games'
      and column_name = 'rating' and numeric_precision = 3
  ) then
    update public.user_games set rating = round(rating) / 2.0 where rating is not null;
    alter table public.user_games alter column rating type numeric(2, 1);
  end if;
end;
$$;

update public.user_games set status = 'wishlist' where status = 'backlog';

alter table public.user_games add constraint user_games_status_check
  check (status in ('playing', 'completed', 'dropped', 'paused', 'wishlist'));

-- Half-star steps from 0 to 5; null means "not rated"
alter table public.user_games add constraint user_games_rating_check
  check (rating between 0 and 5 and rating * 2 = floor(rating * 2));

create index if not exists user_games_user_idx on public.user_games (user_id, updated_at desc);
create index if not exists user_games_game_idx on public.user_games (game_id, updated_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_games_touch on public.user_games;
create trigger user_games_touch
  before update on public.user_games
  for each row execute function public.touch_updated_at();

-- -------------------------------------------------------------
-- FOLLOWS
-- -------------------------------------------------------------
create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists follows_following_idx on public.follows (following_id);

-- -------------------------------------------------------------
-- ROW LEVEL SECURITY
-- Every signed-in user can READ; each user only CHANGES their own rows.
-- -------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.user_games enable row level security;
alter table public.follows enable row level security;

-- Profiles are also readable by anon so sign up can check if a username is taken
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to anon, authenticated using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Only admins write to the catalog directly. IGDB imports go through the
-- Edge Function, which uses the secret key and bypasses RLS.
drop policy if exists "games_select" on public.games;
create policy "games_select" on public.games
  for select to authenticated using (true);

drop policy if exists "games_update_own_manual" on public.games;

drop policy if exists "games_insert" on public.games;
create policy "games_insert" on public.games
  for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists "games_update_admin" on public.games;
create policy "games_update_admin" on public.games
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "user_games_select" on public.user_games;
create policy "user_games_select" on public.user_games
  for select to authenticated using (true);

drop policy if exists "user_games_insert_own" on public.user_games;
create policy "user_games_insert_own" on public.user_games
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "user_games_update_own" on public.user_games;
create policy "user_games_update_own" on public.user_games
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "user_games_delete_own" on public.user_games;
create policy "user_games_delete_own" on public.user_games
  for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "follows_select" on public.follows;
create policy "follows_select" on public.follows
  for select to authenticated using (true);

drop policy if exists "follows_insert_own" on public.follows;
create policy "follows_insert_own" on public.follows
  for insert to authenticated
  with check ((select auth.uid()) = follower_id);

drop policy if exists "follows_delete_own" on public.follows;
create policy "follows_delete_own" on public.follows
  for delete to authenticated
  using ((select auth.uid()) = follower_id);

-- -------------------------------------------------------------
-- GAME REQUESTS
-- Users ask for games missing from IGDB; admins approve or reject them.
-- -------------------------------------------------------------
create table if not exists public.game_requests (
  id bigint generated always as identity primary key,
  title text not null check (char_length(title) between 1 and 120),
  platform text not null default '' check (char_length(platform) <= 60),
  note text not null default '' check (char_length(note) <= 300),
  requested_by uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  game_id bigint references public.games (id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists game_requests_status_idx on public.game_requests (status, created_at);

alter table public.game_requests enable row level security;

drop policy if exists "game_requests_select" on public.game_requests;
create policy "game_requests_select" on public.game_requests
  for select to authenticated
  using ((select auth.uid()) = requested_by or (select public.is_admin()));

drop policy if exists "game_requests_insert_own" on public.game_requests;
create policy "game_requests_insert_own" on public.game_requests
  for insert to authenticated
  with check ((select auth.uid()) = requested_by and status = 'pending');

drop policy if exists "game_requests_update_admin" on public.game_requests;
create policy "game_requests_update_admin" on public.game_requests
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "game_requests_delete" on public.game_requests;
create policy "game_requests_delete" on public.game_requests
  for delete to authenticated
  using (
    ((select auth.uid()) = requested_by and status = 'pending')
    or (select public.is_admin())
  );

-- -------------------------------------------------------------
-- MAKING SOMEONE AN ADMIN
-- Run once, replacing the username (not part of the automatic setup):
--   update public.profiles set is_admin = true where username = 'seu_usuario';
-- -------------------------------------------------------------
