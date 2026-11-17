import React, { memo, useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from './AppText';
import Avatar from './Avatar';
import Badge from './Badge';
import GameCover from './GameCover';
import RatingLabel from './RatingLabel';
import { useAuth } from '../contexts/AuthContext';
import { useReviewVoteViewModel } from '../hooks/useReviewVoteViewModel';
import { GAME_STATUS } from '../services/games';
import { useTheme } from '../theme/ThemeProvider';

const STATUS_VERB = {
  playing: 'está jogando',
  completed: 'zerou',
  dropped: 'abandonou',
  paused: 'pausou',
  wishlist: 'quer jogar',
};

function formatRelativeTime(isoDate) {
  const minutes = Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} d`;
  return new Date(isoDate).toLocaleDateString('pt-BR');
}

function ActivityCard({ entry, onPressProfile, onPressGame, showGame = true }) {
  const { colors, spacing, radius } = useTheme();
  const { userId: currentUserId, profile: currentUserProfile } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    voteScore,
    isUpvoted,
    isDownvoted,
    isPendingSync,
    handleUpvote,
    handleDownvote,
  } = useReviewVoteViewModel({
    reviewId: entry.id,
    userId: currentUserId,
    initialScore: entry.voteScore ?? 0,
    initialUserVote: entry.userVote ?? 0,
  });

  const isOwnActivity = entry.user_id === currentUserId && Boolean(currentUserProfile);
  const authorProfile = isOwnActivity
    ? { ...entry.profile, ...currentUserProfile }
    : entry.profile;

  const status = GAME_STATUS[entry.status] || GAME_STATUS.wishlist;
  const authorName = authorProfile?.display_name || authorProfile?.username;
  const reviewText = (entry.review || '').trim();
  const hasReview = Boolean(reviewText);

  const upvoteColor = isUpvoted ? colors.primary : colors.textMuted;
  const downvoteColor = isDownvoted ? colors.danger : colors.textMuted;
  const scoreTone = isUpvoted ? 'primary' : isDownvoted ? 'danger' : 'muted';

  const handleToggleExpand = useCallback(() => {
    setIsExpanded((previousState) => !previousState);
  }, []);

  const handlePressAuthorProfile = useCallback(() => {
    if (onPressProfile) {
      onPressProfile(entry.user_id);
    }
  }, [entry.user_id, onPressProfile]);

  const handlePressGameDetails = useCallback(() => {
    if (onPressGame) {
      onPressGame(entry.game_id);
    }
  }, [entry.game_id, onPressGame]);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radius.md,
          padding: spacing.md,
          marginBottom: spacing.sm + 2,
          gap: spacing.sm,
        },
      ]}
    >
      <Pressable
        onPress={handlePressAuthorProfile}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel={`Ver perfil de ${authorName}`}
        style={[styles.header, { gap: spacing.sm }]}
      >
        <Avatar profile={authorProfile} size={36} />
        <View style={styles.flex}>
          <AppText variant="body" numberOfLines={2}>
            <AppText variant="body" style={styles.boldText}>
              {authorName}
            </AppText>
            {showGame ? ` ${STATUS_VERB[entry.status]} ` : ''}
            {showGame ? (
              <AppText variant="body" tone="primary" style={styles.boldText}>
                {entry.game?.title}
              </AppText>
            ) : null}
          </AppText>
          <AppText variant="caption" tone="muted">
            @{authorProfile?.username} · {formatRelativeTime(entry.updated_at)}
          </AppText>
        </View>
      </Pressable>

      <View style={[styles.row, { gap: spacing.sm }]}>
        {showGame ? (
          <Pressable
            onPress={handlePressGameDetails}
            accessibilityRole="button"
            accessibilityLabel={`Ver página de ${entry.game?.title}`}
          >
            <GameCover uri={entry.game?.cover_url} width={64} />
          </Pressable>
        ) : null}
        <View style={[styles.flex, { gap: spacing.xs }]}>
          {showGame && entry.game?.title ? (
            <Pressable
              onPress={handlePressGameDetails}
              accessibilityRole="button"
              accessibilityLabel={`Abrir detalhes de ${entry.game.title}`}
            >
              <AppText variant="subtitle" numberOfLines={1}>
                {entry.game.title}
              </AppText>
            </Pressable>
          ) : null}
          <Badge label={status.label} tone={status.tone} />
          <RatingLabel rating={entry.rating} />
          {entry.playtime ? (
            <AppText variant="caption" tone="muted">
              {entry.playtime} h jogadas
            </AppText>
          ) : null}
        </View>
      </View>

      {hasReview && isExpanded ? (
        <View
          style={[
            styles.reviewBox,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.sm,
              padding: spacing.sm,
            },
          ]}
        >
          <AppText variant="body" tone="muted">
            “{reviewText}”
          </AppText>
        </View>
      ) : null}

      <View style={[styles.footerRow, { marginTop: spacing.xs }]}>
        <View
          style={[
            styles.voteContainer,
            {
              backgroundColor: colors.surface,
              borderColor: isUpvoted
                ? colors.primary
                : isDownvoted
                ? colors.danger
                : colors.border,
              borderRadius: radius.pill,
            },
          ]}
        >
          <Pressable
            onPress={handleUpvote}
            disabled={!currentUserId}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityState={{ selected: isUpvoted }}
            accessibilityLabel="Upvote na avaliação"
            style={({ pressed }) => [
              styles.voteButton,
              {
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Ionicons
              name={isUpvoted ? 'arrow-up' : 'arrow-up-outline'}
              size={16}
              color={upvoteColor}
            />
          </Pressable>

          <AppText variant="caption" tone={scoreTone} style={styles.voteScoreText}>
            {voteScore}
          </AppText>

          <Pressable
            onPress={handleDownvote}
            disabled={!currentUserId}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityState={{ selected: isDownvoted }}
            accessibilityLabel="Downvote na avaliação"
            style={({ pressed }) => [
              styles.voteButton,
              {
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Ionicons
              name={isDownvoted ? 'arrow-down' : 'arrow-down-outline'}
              size={16}
              color={downvoteColor}
            />
          </Pressable>

          {isPendingSync ? (
            <View style={{ paddingRight: spacing.sm }}>
              <Ionicons
                name="cloud-offline-outline"
                size={13}
                color={colors.warning}
                accessibilityLabel="Voto salvo offline aguardando sincronização"
              />
            </View>
          ) : null}
        </View>

        {hasReview ? (
          <Pressable
            onPress={handleToggleExpand}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityState={{ expanded: isExpanded }}
            accessibilityLabel={isExpanded ? 'Ocultar avaliação' : 'Ver mais da avaliação'}
            style={({ pressed }) => [
              styles.expandToggle,
              {
                paddingVertical: spacing.xs,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <AppText variant="caption" tone="primary" style={styles.expandToggleText}>
              {isExpanded ? 'Ocultar avaliação' : 'Ver mais (avaliação)'}
            </AppText>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.primary}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function areActivityCardPropsEqual(previousProps, nextProps) {
  if (previousProps.showGame !== nextProps.showGame) return false;
  if (previousProps.onPressProfile !== nextProps.onPressProfile) return false;
  if (previousProps.onPressGame !== nextProps.onPressGame) return false;

  const prevEntry = previousProps.entry;
  const nextEntry = nextProps.entry;
  if (prevEntry === nextEntry) return true;
  if (!prevEntry || !nextEntry) return false;

  return (
    prevEntry.id === nextEntry.id &&
    prevEntry.updated_at === nextEntry.updated_at &&
    prevEntry.status === nextEntry.status &&
    prevEntry.rating === nextEntry.rating &&
    prevEntry.review === nextEntry.review &&
    prevEntry.playtime === nextEntry.playtime &&
    prevEntry.voteScore === nextEntry.voteScore &&
    prevEntry.userVote === nextEntry.userVote &&
    prevEntry.profile?.avatar_url === nextEntry.profile?.avatar_url &&
    prevEntry.profile?.display_name === nextEntry.profile?.display_name
  );
}

export default memo(ActivityCard, areActivityCardPropsEqual);

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flex: {
    flex: 1,
  },
  boldText: {
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewBox: {
    borderWidth: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  voteButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteScoreText: {
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center',
  },
  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expandToggleText: {
    fontWeight: '700',
  },
});
