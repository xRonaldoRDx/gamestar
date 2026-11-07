import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from './AppText';
import Avatar from './Avatar';
import Badge from './Badge';
import GameCover from './GameCover';
import RatingLabel from './RatingLabel';
import { useAuth } from '../contexts/AuthContext';
import { GAME_STATUS } from '../services/games';
import { buildCacheBustedAvatarUrl } from '../services/profiles';
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

export default function ActivityCard({ entry, onPressProfile, onPressGame, showGame = true }) {
  const { colors, spacing, radius } = useTheme();
  const { userId: currentUserId, profile: currentUserProfile } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  const isOwnActivity = entry.user_id === currentUserId && Boolean(currentUserProfile);
  const rawAuthorProfile = isOwnActivity
    ? { ...entry.profile, ...currentUserProfile }
    : entry.profile;

  const rawAvatarUri = rawAuthorProfile?.avatarUrl ?? rawAuthorProfile?.avatar_url ?? null;
  const resolvedAvatarUri =
    typeof rawAvatarUri === 'string' && (rawAvatarUri.includes('?t=') || rawAvatarUri.includes('&t='))
      ? rawAvatarUri
      : buildCacheBustedAvatarUrl(rawAvatarUri);

  const authorProfile = {
    ...rawAuthorProfile,
    avatarUrl: resolvedAvatarUri,
    avatar_url: resolvedAvatarUri,
  };

  const status = GAME_STATUS[entry.status] || GAME_STATUS.wishlist;
  const authorName =
    authorProfile?.displayName || authorProfile?.display_name || authorProfile?.username;
  const reviewText = (entry.review || '').trim();
  const hasReview = Boolean(reviewText);

  function handleToggleExpand() {
    setIsExpanded((previousState) => !previousState);
  }

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
        onPress={onPressProfile}
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
            onPress={onPressGame}
            accessibilityRole="button"
            accessibilityLabel={`Ver página de ${entry.game?.title}`}
          >
            <GameCover uri={entry.game?.cover_url} width={64} />
          </Pressable>
        ) : null}
        <View style={[styles.flex, { gap: spacing.xs }]}>
          {showGame && entry.game?.title ? (
            <Pressable
              onPress={onPressGame}
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

      {hasReview ? (
        <View style={{ gap: spacing.xs }}>
          {isExpanded ? (
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
        </View>
      ) : null}
    </View>
  );
}

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
  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
  },
  expandToggleText: {
    fontWeight: '700',
  },
});
