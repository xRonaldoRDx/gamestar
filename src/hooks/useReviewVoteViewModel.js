import { useCallback, useEffect, useRef, useState } from 'react';
import { checkIsOnline, useNetworkStatus } from '../services/network';
import {
  calculateOptimisticVoteState,
  enqueueOfflineVote,
  flushOfflineVoteQueue,
  getCachedReviewVoteState,
  isReviewVotePendingSync,
  removeQueuedVote,
  saveCachedReviewVoteState,
  submitReviewVoteToRemote,
  subscribeVoteSync,
  VOTE_TYPE,
} from '../services/votes';

function resolveInitialVoteState({ userId, reviewId, initialScore, initialUserVote }) {
  const numericScore = Number.isFinite(Number(initialScore)) ? Number(initialScore) : 0;
  const numericVote =
    initialUserVote === VOTE_TYPE.UPVOTE || initialUserVote === VOTE_TYPE.DOWNVOTE
      ? initialUserVote
      : VOTE_TYPE.NONE;

  if (!userId || !reviewId) {
    return {
      voteScore: numericScore,
      userVote: numericVote,
      isPendingSync: false,
    };
  }

  const pendingSync = isReviewVotePendingSync({ userId, reviewId });
  const cached = getCachedReviewVoteState({ userId, reviewId });

  if (cached) {
    return {
      voteScore: cached.voteScore,
      userVote: cached.userVote,
      isPendingSync: pendingSync,
    };
  }

  return {
    voteScore: numericScore,
    userVote: numericVote,
    isPendingSync: pendingSync,
  };
}

export function useReviewVoteViewModel({
  reviewId,
  userId,
  initialScore = 0,
  initialUserVote = VOTE_TYPE.NONE,
}) {
  const { isOnline } = useNetworkStatus();

  const initialState = resolveInitialVoteState({
    userId,
    reviewId,
    initialScore,
    initialUserVote,
  });

  const [voteScore, setVoteScore] = useState(initialState.voteScore);
  const [userVote, setUserVote] = useState(initialState.userVote);
  const [isPendingSync, setIsPendingSync] = useState(initialState.isPendingSync);

  const voteStateRef = useRef({
    voteScore: initialState.voteScore,
    userVote: initialState.userVote,
  });

  useEffect(() => {
    const resolved = resolveInitialVoteState({
      userId,
      reviewId,
      initialScore,
      initialUserVote,
    });
    voteStateRef.current = {
      voteScore: resolved.voteScore,
      userVote: resolved.userVote,
    };
    setVoteScore(resolved.voteScore);
    setUserVote(resolved.userVote);
    setIsPendingSync(resolved.isPendingSync);
  }, [reviewId, userId, initialScore, initialUserVote]);

  useEffect(() => {
    if (!userId || !reviewId) return undefined;

    return subscribeVoteSync((event) => {
      if (
        String(event.userId) === String(userId) &&
        Number(event.reviewId) === Number(reviewId)
      ) {
        setIsPendingSync(Boolean(event.isPendingSync));
      }
    });
  }, [userId, reviewId]);

  useEffect(() => {
    if (!isOnline || !userId) return;
    flushOfflineVoteQueue(userId);
  }, [isOnline, userId]);

  const handleVote = useCallback(
    async (targetVoteType) => {
      if (!userId || !reviewId) return;

      const { voteScore: currentScore, userVote: currentUserVote } = voteStateRef.current;
      const { nextUserVote, nextScore } = calculateOptimisticVoteState({
        currentScore,
        currentUserVote,
        targetVoteType,
      });

      voteStateRef.current = {
        voteScore: nextScore,
        userVote: nextUserVote,
      };
      setVoteScore(nextScore);
      setUserVote(nextUserVote);

      saveCachedReviewVoteState({
        userId,
        reviewId,
        voteScore: nextScore,
        userVote: nextUserVote,
      });

      const currentlyOnline = isOnline && (await checkIsOnline());

      if (!currentlyOnline) {
        enqueueOfflineVote({
          userId,
          reviewId,
          voteType: nextUserVote,
        });
        return;
      }

      try {
        await submitReviewVoteToRemote({
          userId,
          reviewId,
          voteType: nextUserVote,
        });
        removeQueuedVote({ userId, reviewId });
        await flushOfflineVoteQueue(userId);
      } catch {
        enqueueOfflineVote({
          userId,
          reviewId,
          voteType: nextUserVote,
        });
      }
    },
    [isOnline, reviewId, userId]
  );

  const handleUpvote = useCallback(() => {
    handleVote(VOTE_TYPE.UPVOTE);
  }, [handleVote]);

  const handleDownvote = useCallback(() => {
    handleVote(VOTE_TYPE.DOWNVOTE);
  }, [handleVote]);

  return {
    voteScore,
    userVote,
    isUpvoted: userVote === VOTE_TYPE.UPVOTE,
    isDownvoted: userVote === VOTE_TYPE.DOWNVOTE,
    isPendingSync,
    isOnline,
    handleUpvote,
    handleDownvote,
  };
}
