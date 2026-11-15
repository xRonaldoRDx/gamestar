import * as SQLite from 'expo-sqlite';
import { supabase } from './supabase';

export const VOTE_TYPE = {
  UPVOTE: 1,
  DOWNVOTE: -1,
  NONE: 0,
};

const DATABASE_NAME = 'gamestar_votes.db';
const FALLBACK_QUEUE_KEY = 'gamestar:offline_vote_queue';
const FALLBACK_CACHE_KEY = 'gamestar:review_votes_cache';

let databaseInstance = null;
let isSyncingQueue = false;
const syncListeners = new Set();

function getDatabase() {
  if (databaseInstance) return databaseInstance;

  try {
    const db = SQLite.openDatabaseSync(DATABASE_NAME);
    db.execSync(`
      CREATE TABLE IF NOT EXISTS offline_vote_queue (
        user_id TEXT NOT NULL,
        review_id INTEGER NOT NULL,
        vote_type INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (user_id, review_id)
      );
      CREATE TABLE IF NOT EXISTS review_votes_cache (
        review_id INTEGER NOT NULL,
        user_id TEXT NOT NULL,
        vote_score INTEGER NOT NULL DEFAULT 0,
        user_vote INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (review_id, user_id)
      );
    `);
    databaseInstance = db;
    return databaseInstance;
  } catch {
    return null;
  }
}

function readFallbackMap(storageKey) {
  try {
    const raw = globalThis.localStorage?.getItem(storageKey);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeFallbackMap(storageKey, value) {
  try {
    globalThis.localStorage?.setItem(storageKey, JSON.stringify(value));
  } catch {}
}

function buildCompositeKey(userId, reviewId) {
  return `${String(userId)}:${Number(reviewId)}`;
}

export function subscribeVoteSync(listener) {
  syncListeners.add(listener);
  return () => {
    syncListeners.delete(listener);
  };
}

function notifyVoteSyncListeners(payload) {
  syncListeners.forEach((listener) => {
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

  const numericReviewId = Number(reviewId);
  const numericScore = Number.isFinite(Number(voteScore)) ? Number(voteScore) : 0;
  const numericVote = Number.isFinite(Number(userVote)) ? Number(userVote) : VOTE_TYPE.NONE;
  const timestamp = Date.now();
  const db = getDatabase();

  if (db) {
    db.runSync(
      `INSERT OR REPLACE INTO review_votes_cache (review_id, user_id, vote_score, user_vote, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [numericReviewId, String(userId), numericScore, numericVote, timestamp]
    );
    return;
  }

  const cacheMap = readFallbackMap(FALLBACK_CACHE_KEY);
  cacheMap[buildCompositeKey(userId, numericReviewId)] = {
    review_id: numericReviewId,
    user_id: String(userId),
    vote_score: numericScore,
    user_vote: numericVote,
    updated_at: timestamp,
  };
  writeFallbackMap(FALLBACK_CACHE_KEY, cacheMap);
}

export function getCachedReviewVoteState({ userId, reviewId }) {
  if (!userId || !reviewId) return null;

  const numericReviewId = Number(reviewId);
  const db = getDatabase();

  if (db) {
    const row = db.getFirstSync(
      `SELECT review_id, user_id, vote_score, user_vote, updated_at
       FROM review_votes_cache
       WHERE review_id = ? AND user_id = ?`,
      [numericReviewId, String(userId)]
    );
    if (!row) return null;
    return {
      reviewId: Number(row.review_id),
      userId: String(row.user_id),
      voteScore: Number(row.vote_score),
      userVote: Number(row.user_vote),
      updatedAt: Number(row.updated_at),
    };
  }

  const cacheMap = readFallbackMap(FALLBACK_CACHE_KEY);
  const entry = cacheMap[buildCompositeKey(userId, numericReviewId)];
  if (!entry) return null;

  return {
    reviewId: Number(entry.review_id),
    userId: String(entry.user_id),
    voteScore: Number(entry.vote_score),
    userVote: Number(entry.user_vote),
    updatedAt: Number(entry.updated_at),
  };
}

export function enqueueOfflineVote({ userId, reviewId, voteType }) {
  if (!userId || !reviewId) return;

  const numericReviewId = Number(reviewId);
  const numericVoteType = Number(voteType);
  const timestamp = Date.now();
  const db = getDatabase();

  if (db) {
    db.runSync(
      `INSERT OR REPLACE INTO offline_vote_queue (user_id, review_id, vote_type, updated_at)
       VALUES (?, ?, ?, ?)`,
      [String(userId), numericReviewId, numericVoteType, timestamp]
    );
  } else {
    const queueMap = readFallbackMap(FALLBACK_QUEUE_KEY);
    queueMap[buildCompositeKey(userId, numericReviewId)] = {
      user_id: String(userId),
      review_id: numericReviewId,
      vote_type: numericVoteType,
      updated_at: timestamp,
    };
    writeFallbackMap(FALLBACK_QUEUE_KEY, queueMap);
  }

  notifyVoteSyncListeners({
    userId: String(userId),
    reviewId: numericReviewId,
    isPendingSync: true,
  });
}

export function removeQueuedVote({ userId, reviewId }) {
  if (!userId || !reviewId) return;

  const numericReviewId = Number(reviewId);
  const db = getDatabase();

  if (db) {
    db.runSync(
      `DELETE FROM offline_vote_queue WHERE user_id = ? AND review_id = ?`,
      [String(userId), numericReviewId]
    );
  } else {
    const queueMap = readFallbackMap(FALLBACK_QUEUE_KEY);
    delete queueMap[buildCompositeKey(userId, numericReviewId)];
    writeFallbackMap(FALLBACK_QUEUE_KEY, queueMap);
  }

  notifyVoteSyncListeners({
    userId: String(userId),
    reviewId: numericReviewId,
    isPendingSync: false,
  });
}

export function isReviewVotePendingSync({ userId, reviewId }) {
  if (!userId || !reviewId) return false;

  const numericReviewId = Number(reviewId);
  const db = getDatabase();

  if (db) {
    const row = db.getFirstSync(
      `SELECT 1 AS pending FROM offline_vote_queue WHERE user_id = ? AND review_id = ?`,
      [String(userId), numericReviewId]
    );
    return Boolean(row?.pending);
  }

  const queueMap = readFallbackMap(FALLBACK_QUEUE_KEY);
  return Boolean(queueMap[buildCompositeKey(userId, numericReviewId)]);
}

export function getPendingVoteQueue(userId) {
  const db = getDatabase();

  if (db) {
    if (userId) {
      return db.getAllSync(
        `SELECT user_id, review_id, vote_type, updated_at
         FROM offline_vote_queue
         WHERE user_id = ?
         ORDER BY updated_at ASC`,
        [String(userId)]
      );
    }
    return db.getAllSync(
      `SELECT user_id, review_id, vote_type, updated_at
       FROM offline_vote_queue
       ORDER BY updated_at ASC`
    );
  }

  const queueMap = readFallbackMap(FALLBACK_QUEUE_KEY);
  const items = Object.values(queueMap);
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
          saveCachedReviewVoteState({
            userId: currentUserId,
            reviewId,
            voteScore: remoteBucket.voteScore,
            userVote: remoteBucket.userVote,
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
