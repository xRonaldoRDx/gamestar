import { supabase } from './supabase';
import { normalizeProfileRow } from './profiles';
import { fetchVotesForReviews, VOTE_TYPE } from './votes';

export const FEED_PAGE_SIZE = 15;

export const FEED_TYPE = {
  FOLLOWING: 'following',
  TRENDING: 'trending',
};

const FEED_CACHE_STORAGE_KEY = 'gamestar:feed_cache';

const ENTRY_FIELDS = `
  id, user_id, game_id, status, rating, review, playtime, platform, created_at, updated_at,
  game:games (id, title, release_year, cover_url, genres, developer, platforms, source),
  profile:profiles (id, username, display_name, avatar_url)
`;

function buildFeedCacheKey(feedType, userId) {
  const scope = feedType === FEED_TYPE.FOLLOWING ? String(userId || 'anonymous') : 'global';
  return `${feedType}:${scope}`;
}

// The last loaded feed page is kept in localStorage (backed by expo-sqlite)
// so the feed can still be shown while offline
function readFeedCache() {
  try {
    const raw = globalThis.localStorage?.getItem(FEED_CACHE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCachedFeedEntries(feedType, userId, entries) {
  if (!Array.isArray(entries)) return;

  const cacheMap = readFeedCache();
  cacheMap[buildFeedCacheKey(feedType, userId)] = entries;
  try {
    globalThis.localStorage?.setItem(FEED_CACHE_STORAGE_KEY, JSON.stringify(cacheMap));
  } catch {}
}

export function getCachedFeedEntries(feedType, userId) {
  const cached = readFeedCache()[buildFeedCacheKey(feedType, userId)];
  return Array.isArray(cached) ? cached : null;
}

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

function normalizeEntryProfile(rawProfile) {
  if (!rawProfile) return rawProfile;
  return normalizeProfileRow(rawProfile);
}

function normalizeLibraryEntry(entry, voteSummary = null) {
  if (!entry) return entry;
  return {
    ...entry,
    rating: parseNumericRating(entry.rating),
    profile: normalizeEntryProfile(entry.profile),
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
  if (safeEntries.length === 0) return [];

  const resolvedUserId = await resolveCurrentUserId(currentUserId);
  const reviewIds = safeEntries.map((entry) => entry.id);
  const votesByReviewId = await fetchVotesForReviews(reviewIds, resolvedUserId);

  return safeEntries.map((entry) =>
    normalizeLibraryEntry(entry, votesByReviewId[Number(entry.id)])
  );
}

function compareByTrendingOrder(firstEntry, secondEntry) {
  const upvoteDifference = (secondEntry.upvotes ?? 0) - (firstEntry.upvotes ?? 0);
  if (upvoteDifference !== 0) return upvoteDifference;

  const scoreDifference = (secondEntry.voteScore ?? 0) - (firstEntry.voteScore ?? 0);
  if (scoreDifference !== 0) return scoreDifference;

  return new Date(secondEntry.updated_at).getTime() - new Date(firstEntry.updated_at).getTime();
}

export async function fetchFollowingFeed(
  userId,
  { page = 0, pageSize = FEED_PAGE_SIZE } = {}
) {
  if (!userId) {
    return { entries: [], hasMore: false };
  }

  const { data: follows, error: followsError } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  if (followsError) throw followsError;

  const followingIds = (follows ?? []).map((follow) => follow.following_id);
  if (followingIds.length === 0) {
    if (page === 0) {
      saveCachedFeedEntries(FEED_TYPE.FOLLOWING, userId, []);
    }
    return { entries: [], hasMore: false };
  }

  const rangeStart = page * pageSize;
  const rangeEnd = rangeStart + pageSize;

  const { data, error } = await supabase
    .from('user_games')
    .select(ENTRY_FIELDS)
    .in('user_id', followingIds)
    .order('updated_at', { ascending: false })
    .range(rangeStart, rangeEnd);

  if (error) throw error;

  const rows = data ?? [];
  const hasMore = rows.length > pageSize;
  const pageRows = hasMore ? rows.slice(0, pageSize) : rows;
  const enrichedEntries = await attachVoteSummaries(pageRows, userId);

  if (page === 0) {
    saveCachedFeedEntries(FEED_TYPE.FOLLOWING, userId, enrichedEntries);
  }

  return {
    entries: enrichedEntries,
    hasMore,
  };
}

export async function fetchTrendingFeed({
  userId = null,
  page = 0,
  pageSize = FEED_PAGE_SIZE,
} = {}) {
  const { data, error } = await supabase
    .from('user_games')
    .select(ENTRY_FIELDS)
    .order('updated_at', { ascending: false })
    .limit(200);

  if (error) throw error;

  const enrichedEntries = await attachVoteSummaries(data ?? [], userId);
  const sortedEntries = [...enrichedEntries].sort(compareByTrendingOrder);

  if (page === 0) {
    saveCachedFeedEntries(FEED_TYPE.TRENDING, userId, sortedEntries);
  }

  const rangeStart = page * pageSize;
  const rangeEnd = rangeStart + pageSize;
  const paginatedEntries = sortedEntries.slice(rangeStart, rangeEnd);
  const hasMore = rangeEnd < sortedEntries.length;

  return {
    entries: paginatedEntries,
    hasMore,
  };
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
  return normalizeLibraryEntry(data);
}

export async function deleteLibraryEntry(entryId) {
  const { error } = await supabase.from('user_games').delete().eq('id', entryId);
  if (error) throw error;
}
