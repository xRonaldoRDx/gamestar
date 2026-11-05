import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import AppText from './AppText';
import Avatar from './Avatar';
import Badge from './Badge';
import GameCover from './GameCover';
import RatingLabel from './RatingLabel';
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

/**
 * "So-and-so completed X" card with rating and review.
 * `showGame={false}` hides the game, used on the game's own page.
 */
export default function ActivityCard({ entry, onPressProfile, onPressGame, showGame = true }) {
  const { colors, spacing, radius } = useTheme();
  const status = GAME_STATUS[entry.status] || GAME_STATUS.wishlist;
  const authorName = entry.profile?.display_name || entry.profile?.username;

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
        <Avatar profile={entry.profile} size={36} />
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
            @{entry.profile?.username} · {formatRelativeTime(entry.updated_at)}
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
          <Badge label={status.label} tone={status.tone} />
          <RatingLabel rating={entry.rating} />
          {entry.playtime ? (
            <AppText variant="caption" tone="muted">
              {entry.playtime} h jogadas
            </AppText>
          ) : null}
        </View>
      </View>

      {entry.review ? (
        <AppText variant="body" tone="muted" numberOfLines={6}>
          “{entry.review}”
        </AppText>
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
});
