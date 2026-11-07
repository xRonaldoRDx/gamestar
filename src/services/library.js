import { supabase } from './supabase';

const ENTRY_FIELDS = `
  id, user_id, game_id, status, rating, review, playtime, platform, created_at, updated_at,
  game:games (id, title, release_year, cover_url, genres, developer, platforms, source),
  profile:profiles (id, username, display_name)
`;

function parseNumericRating(rating) {
  if (typeof rating === 'number' && !Number.isNaN(rating)) {
    return rating;
  }
  if (typeof rating === 'string' && rating.trim() !== '') {
    const parsed = Number(rating);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function normalizeLibraryEntry(entry) {
  if (!entry) return entry;
  return {
    ...entry,
    rating: parseNumericRating(entry.rating),
  };
}

export async function getUserLibrary(userId) {
  const { data, error } = await supabase
    .from('user_games')
    .select(ENTRY_FIELDS)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data.map(normalizeLibraryEntry);
}

export async function getGameReviews(gameId) {
  const { data, error } = await supabase
    .from('user_games')
    .select(ENTRY_FIELDS)
    .eq('game_id', gameId)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data.map(normalizeLibraryEntry);
}

export async function saveLibraryEntry({ id, game_id, status, rating, review, playtime, platform }) {
  const hasNumericRating = typeof rating === 'number' && !Number.isNaN(rating);
  const values = {
    status,
    rating: hasNumericRating ? rating : null,
    review: (review || '').trim(),
    playtime: playtime === '' || playtime == null ? null : parseInt(playtime, 10),
    platform: (platform || '').trim(),
  };

  const query = id
    ? supabase.from('user_games').update(values).eq('id', id)
    : supabase.from('user_games').insert({ ...values, game_id });

  const { data, error } = await query.select(ENTRY_FIELDS).single();
  if (error) throw error;
  return normalizeLibraryEntry(data);
}

export async function deleteLibraryEntry(entryId) {
  const { error } = await supabase.from('user_games').delete().eq('id', entryId);
  if (error) throw error;
}

export async function getActivityFeed(userId) {
  const { data: follows, error: followsError } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  if (followsError) throw followsError;

  const userIds = [userId, ...follows.map((follow) => follow.following_id)];

  const { data, error } = await supabase
    .from('user_games')
    .select(ENTRY_FIELDS)
    .in('user_id', userIds)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data.map(normalizeLibraryEntry);
}
