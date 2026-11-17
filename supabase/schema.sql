create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique
    check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null default '',
  bio text not null default '' check (char_length(bio) <= 160),
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

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

revoke update on public.profiles from anon, authenticated;
grant update (display_name, bio, avatar_url) on public.profiles to authenticated;

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

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select to public
  using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create table if not exists public.games (
  id bigint generated always as identity primary key,
  title text not null check (char_length(title) between 1 and 120),
  release_year int check (release_year between 1950 and 2100),
  cover_url text,
  genres text not null default '',
  developer text not null default '',
  platforms text not null default '',
  source text not null check (source in ('igdb', 'steam', 'admin')),
  steam_appid int unique,
  igdb_id bigint unique,
  summary text not null default '',
  critic_rating numeric(2, 1),
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists games_title_idx on public.games (lower(title));

create table if not exists public.user_games (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  game_id bigint not null references public.games (id) on delete cascade,
  status text not null check (status in ('playing', 'completed', 'dropped', 'paused', 'wishlist')),
  rating numeric(2, 1) check (rating between 0 and 5 and rating * 2 = floor(rating * 2)),
  review text not null default '' check (char_length(review) <= 2000),
  playtime int check (playtime >= 0),
  platform text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, game_id)
);

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

create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists follows_following_idx on public.follows (following_id);

alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.user_games enable row level security;
alter table public.follows enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to anon, authenticated using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

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

create table if not exists public.review_votes (
  id bigint generated always as identity primary key,
  review_id bigint not null references public.user_games (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  vote_type smallint not null check (vote_type in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (review_id, user_id)
);

create index if not exists review_votes_review_idx on public.review_votes (review_id);
create index if not exists review_votes_user_idx on public.review_votes (user_id);

drop trigger if exists review_votes_touch on public.review_votes;
create trigger review_votes_touch
  before update on public.review_votes
  for each row execute function public.touch_updated_at();

alter table public.review_votes enable row level security;

drop policy if exists "review_votes_select" on public.review_votes;
create policy "review_votes_select" on public.review_votes
  for select to authenticated using (true);

drop policy if exists "review_votes_insert_own" on public.review_votes;
create policy "review_votes_insert_own" on public.review_votes
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "review_votes_update_own" on public.review_votes;
create policy "review_votes_update_own" on public.review_votes
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "review_votes_delete_own" on public.review_votes;
create policy "review_votes_delete_own" on public.review_votes
  for delete to authenticated
  using ((select auth.uid()) = user_id);
