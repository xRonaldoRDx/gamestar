import { useCallback, useEffect, useRef, useState } from 'react';
import { checkIsOnline, getIsOnlineSync } from '../services/network';
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
  const [voteState, setVoteState] = useState(() =>
    resolveInitialVoteState({
      userId,
      reviewId,
      initialScore,
      initialUserVote,
    })
  );

  const voteStateRef = useRef(voteState);

  useEffect(() => {
    const resolved = resolveInitialVoteState({
      userId,
      reviewId,
      initialScore,
      initialUserVote,
    });
    voteStateRef.current = resolved;
    setVoteState((prev) => {
      if (
        prev.voteScore === resolved.voteScore &&
        prev.userVote === resolved.userVote &&
        prev.isPendingSync === resolved.isPendingSync
      ) {
        return prev;
      }
      return resolved;
    });
  }, [reviewId, userId, initialScore, initialUserVote]);

  useEffect(() => {
    if (!userId || !reviewId) return undefined;

    return subscribeVoteSync(reviewId, (event) => {
      if (String(event.userId) === String(userId)) {
        const nextPending = Boolean(event.isPendingSync);
        voteStateRef.current = {
          ...voteStateRef.current,
          isPendingSync: nextPending,
        };
        setVoteState((prev) =>
          prev.isPendingSync === nextPending ? prev : { ...prev, isPendingSync: nextPending }
        );
      }
    });
  }, [userId, reviewId]);

  const handleVote = useCallback(
    async (targetVoteType) => {
      if (!userId || !reviewId) return;

      const { voteScore: currentScore, userVote: currentUserVote } = voteStateRef.current;
      const { nextUserVote, nextScore } = calculateOptimisticVoteState({
        currentScore,
        currentUserVote,
        targetVoteType,
      });

      const optimisticState = {
        voteScore: nextScore,
        userVote: nextUserVote,
        isPendingSync: voteStateRef.current.isPendingSync,
      };
      voteStateRef.current = optimisticState;
      setVoteState(optimisticState);

      saveCachedReviewVoteState({
        userId,
        reviewId,
        voteScore: nextScore,
        userVote: nextUserVote,
      });

      const currentlyOnline = getIsOnlineSync() && (await checkIsOnline());

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
    [reviewId, userId]
  );

  const handleUpvote = useCallback(() => {
    handleVote(VOTE_TYPE.UPVOTE);
  }, [handleVote]);

  const handleDownvote = useCallback(() => {
    handleVote(VOTE_TYPE.DOWNVOTE);
  }, [handleVote]);

  return {
    voteScore: voteState.voteScore,
    userVote: voteState.userVote,
    isUpvoted: voteState.userVote === VOTE_TYPE.UPVOTE,
    isDownvoted: voteState.userVote === VOTE_TYPE.DOWNVOTE,
    isPendingSync: voteState.isPendingSync,
    handleUpvote,
    handleDownvote,
  };
}
