import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import AppText from './AppText';
import Badge from './Badge';
import GameCover from './GameCover';
import RatingLabel, { formatRating } from './RatingLabel';
import { GAME_STATUS } from '../services/games';
import { useTheme } from '../theme/ThemeProvider';

/**
 * A library entry: one game plus a user's status and rating for it.
 */
export default function GameListItem({ entry, onPress }) {
  const { colors, spacing, radius, shadow } = useTheme();
  const { game } = entry;
  const status = GAME_STATUS[entry.status] || GAME_STATUS.wishlist;

  return (
    <View
      style={[
        styles.cardWrapper,
        shadow(2),
        {
          borderRadius: radius.md,
          marginBottom: spacing.sm + 2,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        hitSlop={6}
        android_ripple={{ color: 'rgba(102, 192, 244, 0.15)' }}
        accessibilityRole="button"
        accessibilityLabel={`Ver detalhes de ${game.title}, ano ${game.release_year || 'N/A'}, ${formatRating(entry.rating)}, status ${status.label}`}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: pressed ? colors.cardPressed : colors.card },
        ]}
      >
        <GameCover uri={game.cover_url} width={56} />

        <View style={[styles.infoContainer, { gap: spacing.xs }]}>
          <View style={styles.topRow}>
            <AppText
              variant="subtitle"
              numberOfLines={1}
              style={[styles.gameTitle, { color: colors.text }]}
            >
              {game.title}
            </AppText>
            <AppText variant="caption" tone="muted">
              {game.release_year ? String(game.release_year) : '—'}
            </AppText>
          </View>

          <View style={styles.bottomRow}>
            <RatingLabel rating={entry.rating} />
            <Badge label={status.label} tone={status.tone} />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    overflow: 'hidden',
    borderWidth: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    minHeight: 72,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  gameTitle: {
    flex: 1,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
});
