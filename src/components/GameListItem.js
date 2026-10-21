import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow, spacing, statusColors } from '../theme/tokens';

export default function GameListItem({ item, onPress }) {
  const statusTheme = statusColors[item.status] || statusColors.Backlog;

  return (
    <View style={[styles.cardWrapper, shadow(1)]}>
      <Pressable
        onPress={onPress}
        hitSlop={6}
        android_ripple={{ color: 'rgba(255, 255, 255, 0.08)' }}
        accessibilityRole="button"
        accessibilityLabel={`Ver detalhes de ${item.title}, status ${item.status}, nota ${item.rating}`}
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed,
        ]}
      >
        <View style={styles.mainInfo}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusTheme.bg,
                borderColor: statusTheme.border,
              },
            ]}
          >
            <Text style={[styles.statusText, { color: statusTheme.text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.ratingBox}>
          <Text style={styles.ratingLabel}>NOTA</Text>
          <Text style={styles.ratingValue}>
            {item.rating ? `${Number(item.rating).toFixed(1)}/10` : '—'}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    minHeight: 72,
    gap: spacing.md,
  },
  cardPressed: {
    backgroundColor: colors.surfacePressed,
  },
  mainInfo: {
    flex: 1,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ratingBox: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 64,
  },
  ratingLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
    marginTop: 2,
  },
});
