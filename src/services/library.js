import { supabase } from './supabase';
import { buildCacheBustedAvatarUrl, normalizeProfileRow } from './profiles';
import { fetchVotesForReviews, VOTE_TYPE } from './votes';

const ENTRY_FIELDS = `
  id, user_id, game_id, status, rating, review, playtime, platform, created_at, updated_at,
  game:games (id, title, release_year, cover_url, genres, developer, platforms, source),
  profile:profiles (id, username, display_name, avatar_url)
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

function normalizeEntryProfile(rawProfile, timestamp) {
  if (!rawProfile) return rawProfile;
  const normalized = normalizeProfileRow(rawProfile);
  const cacheBustedAvatar = buildCacheBustedAvatarUrl(
    normalized.avatarUrl ?? normalized.avatar_url,
    timestamp
  );
  return {
    ...normalized,
    avatarUrl: cacheBustedAvatar,
    avatar_url: cacheBustedAvatar,
  };
}

function normalizeLibraryEntry(entry, timestamp = Date.now(), voteSummary = null) {
  if (!entry) return entry;
  return {
    ...entry,
    rating: parseNumericRating(entry.rating),
    profile: normalizeEntryProfile(entry.profile, timestamp),
    upvotes: voteSummary?.upvotes ?? entry.upvotes ?? 0,
    downvotes: voteSummary?.downvotes ?? entry.downvotes ?? 0,
    voteScore: voteSummary?.voteScore ?? entry.voteScore ?? 0,
    userVote: voteSummary?.userVote ?? entry.userVote ?? VOTE_TYPE.NONE,
  };
}

async function resolveCurrentUserId(explicitUserId) {
  if (explicitUserId) return explicitUserId;
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

async function attachVoteSummaries(entries, currentUserId) {
  const safeEntries = entries ?? [];
  const fetchTimestamp = Date.now();
  if (safeEntries.length === 0) return [];

  const resolvedUserId = await resolveCurrentUserId(currentUserId);
  const reviewIds = safeEntries.map((entry) => entry.id);
  const votesByReviewId = await fetchVotesForReviews(reviewIds, resolvedUserId);

  return safeEntries.map((entry) =>
    normalizeLibraryEntry(entry, fetchTimestamp, votesByReviewId[Number(entry.id)])
  );
}

export async function getUserLibrary(userId) {
  const { data, error } = await supabase
    .from('user_games')
    .select(ENTRY_FIELDS)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return attachVoteSummaries(data, null);
}

export async function getGameReviews(gameId, currentUserId) {
  const { data, error } = await supabase
    .from('user_games')
    .select(ENTRY_FIELDS)
    .eq('game_id', gameId)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return attachVoteSummaries(data, currentUserId);
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
  return normalizeLibraryEntry(data, Date.now());
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
  return attachVoteSummaries(data, userId);
}
