import { supabase } from './supabase';

const PROFILE_FIELDS = 'id, username, display_name, bio, is_admin, created_at';

export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_FIELDS)
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function isUsernameAvailable(username) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (error) throw error;
  return !data;
}

export async function searchProfiles(searchQuery) {
  // Commas and parentheses are syntax inside .or() filters, so they are stripped
  const sanitizedQuery = (searchQuery || '').trim().toLowerCase().replace(/[,()]/g, '');
  const escapedQuery = sanitizedQuery.replace(/[%_\\]/g, (char) => `\\${char}`);

  let request = supabase.from('profiles').select(PROFILE_FIELDS).order('username').limit(30);
  if (escapedQuery) {
    request = request.or(
      `username.ilike.%${escapedQuery}%,display_name.ilike.%${escapedQuery}%`
    );
  }

  const { data, error } = await request;
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, { display_name, bio }) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ display_name: display_name.trim(), bio: bio.trim() })
    .eq('id', userId)
    .select(PROFILE_FIELDS)
    .single();

  if (error) throw error;
  return data;
}

export async function getProfileStats(userId) {
  const countRows = (table, column, applyFilter) => {
    let query = supabase.from(table).select('*', { count: 'exact', head: true }).eq(column, userId);
    if (applyFilter) query = applyFilter(query);
    return query;
  };

  const results = await Promise.all([
    countRows('user_games', 'user_id'),
    countRows('user_games', 'user_id', (query) => query.eq('status', 'completed')),
    countRows('follows', 'following_id'),
    countRows('follows', 'follower_id'),
  ]);

  const failed = results.find((result) => result.error);
  if (failed) throw failed.error;

  const [total, completed, followers, following] = results.map((result) => result.count ?? 0);
  return { total, completed, followers, following };
}

export async function isFollowing(followerId, followingId) {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function followUser(followingId) {
  const { error } = await supabase.from('follows').insert({ following_id: followingId });
  // 23505 = already following; treat as success
  if (error && error.code !== '23505') throw error;
}

export async function unfollowUser(followerId, followingId) {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);

  if (error) throw error;
}
