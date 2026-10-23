import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import AppText from './AppText';
import Badge from './Badge';
import { useTheme } from '../theme/ThemeProvider';

const STATUS_TONE = {
  Playing: 'primary',
  Completed: 'success',
  Backlog: 'warning',
  Dropped: 'danger',
};

export default function GameListItem({ item, onPress }) {
  const { colors, spacing, radius, shadow } = useTheme();
  const badgeTone = STATUS_TONE[item.status] || 'warning';

  return (
    <View
      style={[
        styles.cardWrapper,
        shadow(1),
        {
          borderRadius: radius.md,
          marginBottom: spacing.sm,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        hitSlop={6}
        android_ripple={{ color: 'rgba(255, 255, 255, 0.08)' }}
        accessibilityRole="button"
        accessibilityLabel={`Ver detalhes de ${item.title}, status ${item.status}, nota ${item.rating}`}
        style={({ pressed }) => [
          styles.card,
          {
            padding: spacing.md,
            gap: spacing.md,
            backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
          },
        ]}
      >
        <View style={[styles.mainInfo, { gap: spacing.xs }]}>
          <AppText variant="subtitle" numberOfLines={1} style={styles.title}>
            {item.title}
          </AppText>
          <Badge label={item.status} tone={badgeTone} />
        </View>

        <View style={styles.ratingBox}>
          <AppText variant="caption" tone="muted">
            NOTA
          </AppText>
          <AppText variant="subtitle" tone="warning" style={styles.ratingValue}>
            {item.rating > 0 ? `${Number(item.rating).toFixed(1)}/10` : '—'}
          </AppText>
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
    justifyContent: 'space-between',
    minHeight: 74,
  },
  mainInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  title: {
    flexShrink: 1,
  },
  ratingBox: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 64,
  },
  ratingValue: {
    marginTop: 2,
  },
});
