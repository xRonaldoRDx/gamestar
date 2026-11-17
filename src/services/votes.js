import { subscribeNetworkStatus } from './network';
import { supabase } from './supabase';

export const VOTE_TYPE = {
  UPVOTE: 1,
  DOWNVOTE: -1,
  NONE: 0,
};

const QUEUE_STORAGE_KEY = 'gamestar:offline_vote_queue';
const CACHE_STORAGE_KEY = 'gamestar:review_votes_cache';

let isMemoryHydrated = false;
let isSyncingQueue = false;
let isNetworkSyncRegistered = false;

const memoryVoteCache = new Map();
const memoryPendingQueue = new Map();
const syncListenersByReviewId = new Map();

function buildCompositeKey(userId, reviewId) {
  return `${String(userId)}:${Number(reviewId)}`;
}

// The vote cache and the offline queue live in memory and are mirrored to
// localStorage (backed by expo-sqlite), so pending votes survive an app restart
function readStoredMap(storageKey) {
  try {
    const raw = globalThis.localStorage?.getItem(storageKey);
    return Object.entries(raw ? JSON.parse(raw) : {});
  } catch {
    return [];
  }
}

function persistMap(storageKey, memoryMap) {
  try {
    globalThis.localStorage?.setItem(storageKey, JSON.stringify(Object.fromEntries(memoryMap)));
  } catch {}
}

function ensureMemoryHydrated() {
  if (isMemoryHydrated) return;
  isMemoryHydrated = true;

  if (!isNetworkSyncRegistered) {
    isNetworkSyncRegistered = true;
    subscribeNetworkStatus((isOnline) => {
      if (isOnline) {
        flushOfflineVoteQueue();
      }
    });
  }

  readStoredMap(CACHE_STORAGE_KEY).forEach(([key, entry]) => memoryVoteCache.set(key, entry));
  readStoredMap(QUEUE_STORAGE_KEY).forEach(([key, entry]) => memoryPendingQueue.set(key, entry));
}

export function subscribeVoteSync(reviewId, listener) {
  const numericReviewId = Number(reviewId);
  let reviewListeners = syncListenersByReviewId.get(numericReviewId);
  if (!reviewListeners) {
    reviewListeners = new Set();
    syncListenersByReviewId.set(numericReviewId, reviewListeners);
  }
  reviewListeners.add(listener);

  return () => {
    reviewListeners.delete(listener);
    if (reviewListeners.size === 0) {
      syncListenersByReviewId.delete(numericReviewId);
    }
  };
}

function notifyVoteSyncListeners(payload) {
  const reviewListeners = syncListenersByReviewId.get(Number(payload.reviewId));
  if (!reviewListeners) return;

  reviewListeners.forEach((listener) => {
    try {
      listener(payload);
    } catch {}
  });
}

export function calculateOptimisticVoteState({
  currentScore = 0,
  currentUserVote = VOTE_TYPE.NONE,
  targetVoteType,
}) {
  const normalizedScore = Number.isFinite(Number(currentScore)) ? Number(currentScore) : 0;
  const normalizedCurrentVote =
    currentUserVote === VOTE_TYPE.UPVOTE || currentUserVote === VOTE_TYPE.DOWNVOTE
      ? currentUserVote
      : VOTE_TYPE.NONE;

  const nextUserVote =
    normalizedCurrentVote === targetVoteType ? VOTE_TYPE.NONE : targetVoteType;
  const scoreDelta = nextUserVote - normalizedCurrentVote;
  const nextScore = normalizedScore + scoreDelta;

  return {
    nextUserVote,
    nextScore,
    scoreDelta,
  };
}

export function saveCachedReviewVoteState({ userId, reviewId, voteScore, userVote }) {
  if (!userId || !reviewId) return;
  ensureMemoryHydrated();

  const numericReviewId = Number(reviewId);
  const numericScore = Number.isFinite(Number(voteScore)) ? Number(voteScore) : 0;
  const numericVote = Number.isFinite(Number(userVote)) ? Number(userVote) : VOTE_TYPE.NONE;
  const timestamp = Date.now();
  const compositeKey = buildCompositeKey(userId, numericReviewId);

  memoryVoteCache.set(compositeKey, {
    reviewId: numericReviewId,
    userId: String(userId),
    voteScore: numericScore,
    userVote: numericVote,
    updatedAt: timestamp,
  });
  persistMap(CACHE_STORAGE_KEY, memoryVoteCache);
}

export function getCachedReviewVoteState({ userId, reviewId }) {
  if (!userId || !reviewId) return null;
  ensureMemoryHydrated();
  return memoryVoteCache.get(buildCompositeKey(userId, reviewId)) ?? null;
}

export function enqueueOfflineVote({ userId, reviewId, voteType }) {
  if (!userId || !reviewId) return;
  ensureMemoryHydrated();

  const numericReviewId = Number(reviewId);
  const numericVoteType = Number(voteType);
  const timestamp = Date.now();
  const compositeKey = buildCompositeKey(userId, numericReviewId);

  memoryPendingQueue.set(compositeKey, {
    user_id: String(userId),
    review_id: numericReviewId,
    vote_type: numericVoteType,
    updated_at: timestamp,
  });
  persistMap(QUEUE_STORAGE_KEY, memoryPendingQueue);

  notifyVoteSyncListeners({
    userId: String(userId),
    reviewId: numericReviewId,
    isPendingSync: true,
  });
}

export function removeQueuedVote({ userId, reviewId }) {
  if (!userId || !reviewId) return;
  ensureMemoryHydrated();

  const numericReviewId = Number(reviewId);
  const compositeKey = buildCompositeKey(userId, numericReviewId);
  memoryPendingQueue.delete(compositeKey);
  persistMap(QUEUE_STORAGE_KEY, memoryPendingQueue);

  notifyVoteSyncListeners({
    userId: String(userId),
    reviewId: numericReviewId,
    isPendingSync: false,
  });
}

export function isReviewVotePendingSync({ userId, reviewId }) {
  if (!userId || !reviewId) return false;
  ensureMemoryHydrated();
  return memoryPendingQueue.has(buildCompositeKey(userId, reviewId));
}

export function getPendingVoteQueue(userId) {
  ensureMemoryHydrated();
  const items = Array.from(memoryPendingQueue.values());
  const filtered = userId
    ? items.filter((item) => String(item.user_id) === String(userId))
    : items;
  return filtered.sort((a, b) => a.updated_at - b.updated_at);
}

export async function upsertReviewVote({ userId, reviewId, voteType }) {
  if (voteType !== VOTE_TYPE.UPVOTE && voteType !== VOTE_TYPE.DOWNVOTE) {
    throw new Error('Invalid vote type.');
  }

  const { data, error } = await supabase
    .from('review_votes')
    .upsert(
      {
        user_id: userId,
        review_id: Number(reviewId),
        vote_type: voteType,
      },
      { onConflict: 'review_id,user_id' }
    )
    .select('id, review_id, user_id, vote_type, updated_at')
    .single();

  if (error) throw error;
  return data;
}

export async function removeReviewVote({ userId, reviewId }) {
  const { error } = await supabase
    .from('review_votes')
    .delete()
    .eq('user_id', userId)
    .eq('review_id', Number(reviewId));

  if (error) throw error;
}

export async function submitReviewVoteToRemote({ userId, reviewId, voteType }) {
  if (voteType === VOTE_TYPE.NONE) {
    await removeReviewVote({ userId, reviewId });
    return null;
  }

  return upsertReviewVote({ userId, reviewId, voteType });
}

export async function flushOfflineVoteQueue(userId) {
  if (isSyncingQueue) return { syncedCount: 0, remainingCount: getPendingVoteQueue(userId).length };

  const pendingItems = getPendingVoteQueue(userId);
  if (pendingItems.length === 0) {
    return { syncedCount: 0, remainingCount: 0 };
  }

  isSyncingQueue = true;
  let syncedCount = 0;

  try {
    for (const item of pendingItems) {
      const targetUserId = item.user_id;
      const targetReviewId = Number(item.review_id);
      const targetVoteType = Number(item.vote_type);

      try {
        await submitReviewVoteToRemote({
          userId: targetUserId,
          reviewId: targetReviewId,
          voteType: targetVoteType,
        });
        removeQueuedVote({ userId: targetUserId, reviewId: targetReviewId });
        syncedCount += 1;
      } catch {
        break;
      }
    }
  } finally {
    isSyncingQueue = false;
  }

  return {
    syncedCount,
    remainingCount: getPendingVoteQueue(userId).length,
  };
}

export async function fetchVotesForReviews(reviewIds, currentUserId) {
  ensureMemoryHydrated();

  const normalizedIds = Array.from(
    new Set((reviewIds ?? []).map((id) => Number(id)).filter((id) => Number.isFinite(id)))
  );

  const summaryByReviewId = {};
  normalizedIds.forEach((reviewId) => {
    summaryByReviewId[reviewId] = {
      upvotes: 0,
      downvotes: 0,
      voteScore: 0,
      userVote: VOTE_TYPE.NONE,
    };
  });

  if (normalizedIds.length === 0) {
    return summaryByReviewId;
  }

  try {
    const { data, error } = await supabase
      .from('review_votes')
      .select('review_id, user_id, vote_type')
      .in('review_id', normalizedIds);

    if (error) throw error;

    (data ?? []).forEach((row) => {
      const reviewId = Number(row.review_id);
      const voteType = Number(row.vote_type);
      const bucket = summaryByReviewId[reviewId];
      if (!bucket) return;

      if (voteType === VOTE_TYPE.UPVOTE) {
        bucket.upvotes += 1;
        bucket.voteScore += 1;
      } else if (voteType === VOTE_TYPE.DOWNVOTE) {
        bucket.downvotes += 1;
        bucket.voteScore -= 1;
      }

      if (currentUserId && String(row.user_id) === String(currentUserId)) {
        bucket.userVote = voteType;
      }
    });

    if (currentUserId) {
      normalizedIds.forEach((reviewId) => {
        const remoteBucket = summaryByReviewId[reviewId];
        const pendingSync = isReviewVotePendingSync({ userId: currentUserId, reviewId });

        if (pendingSync) {
          const cached = getCachedReviewVoteState({ userId: currentUserId, reviewId });
          if (cached) {
            remoteBucket.voteScore = cached.voteScore;
            remoteBucket.userVote = cached.userVote;
          }
        } else {
          memoryVoteCache.set(buildCompositeKey(currentUserId, reviewId), {
            reviewId,
            userId: String(currentUserId),
            voteScore: remoteBucket.voteScore,
            userVote: remoteBucket.userVote,
            updatedAt: Date.now(),
          });
        }
      });
    }
  } catch {
    if (currentUserId) {
      normalizedIds.forEach((reviewId) => {
        const cached = getCachedReviewVoteState({ userId: currentUserId, reviewId });
        if (cached) {
          summaryByReviewId[reviewId].voteScore = cached.voteScore;
          summaryByReviewId[reviewId].userVote = cached.userVote;
        }
      });
    }
  }

  return summaryByReviewId;
}
